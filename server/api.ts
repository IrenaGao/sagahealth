import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { generateLMN } from './lmn-generator.js';
import { generateLMNPDFBuffer, generateServiceReceiptPDF } from './utils/pdfGenerator.js';
import { createSignatureRequest, createSignwellWebhook, handleSignwellWebhook } from './utils/signwellService.js';
import { createCheckoutSession } from './utils/stripeService.js';
import stripe from './stripe.js';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.set('trust proxy', true);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin / non-browser clients (no Origin header)
    if (!origin) return callback(null, true);

    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isVercelPreview = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isAllowedProd =
      origin === 'https://sagahealth.vercel.app' ||
      origin === 'https://shop.mysagahealth.com';

    if (isLocalhost || isVercelPreview || isAllowedProd) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Client IP-based location (server-side fetch to avoid browser CORS issues)
app.get('/api/ip-location', async (req, res) => {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]
        : req.ip;

    const ip = rawIp?.trim().replace(/^::ffff:/, '');
    const isLocalIp =
      !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.');

    const url = isLocalIp ? 'https://ipapi.co/json/' : `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(502).json({
        error: 'Failed to fetch IP location',
        status: response.status,
        details: text,
      });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(data);
  } catch (error: any) {
    console.error('Error in /api/ip-location:', error);
    return res.status(500).json({ error: 'Failed to fetch IP location' });
  }
});

// SignWell webhook receiver - handles document events
app.post('/api/signwell/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('Received SignWell webhook event:', JSON.stringify(payload, null, 2));

    const result = await handleSignwellWebhook(payload);

    // Respond 200 so SignWell knows we received the event
    res.status(200).json(result);
  } catch (error) {
    console.error('Error handling SignWell webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
});

// Helper route to create a SignWell webhook (run once)
app.post('/api/signwell/create-webhook', async (req, res) => {
  try {
    // Prefer an explicit webhook URL from env, otherwise build from base URL + path
    const baseUrl = process.env.SIGNWELL_WEBHOOK_BASE_URL || process.env.PUBLIC_API_BASE_URL;
    const callbackUrl = baseUrl
      ? `${baseUrl.replace(/\/+$/, '')}/api/signwell/webhook`
      : `http://localhost:${PORT}/api/signwell/webhook`;

    const result = await createSignwellWebhook(callbackUrl);
    res.json({ success: true, webhook: result, callbackUrl });
  } catch (error: any) {
    console.error('Error creating SignWell webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create SignWell webhook',
    });
  }
});

// Stripe Checkout endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const {
      amount,
      currency = 'usd',
      metadata = {},
      serviceName,
      firstHealthCondition,
      businessName,
      businessAddress,
      customerFirstName,
      customerLastName,
      successUrl,
      cancelUrl
    } = req.body;

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'successUrl and cancelUrl are required'
      });
    }

    const result = await createCheckoutSession({
      amount,
      currency,
      metadata,
      serviceName,
      firstHealthCondition,
      businessName,
      businessAddress,
      customerFirstName,
      customerLastName,
      successUrl,
      cancelUrl,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    console.error('Error details:', error.message, error.type, error.code);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Get checkout session details
app.get('/api/checkout-session', async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }

    console.log('Retrieving checkout session:', session_id);
    console.log('Stripe key mode:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'TEST');
    
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'payment_intent.payment_method', 'customer'],
    });

    // Extract metadata
    const metadata = session.metadata || {};
    let formData: any = null;
    if (metadata.formData) {
      try {
        formData = JSON.parse(metadata.formData as string);
      } catch (e) {
        console.error('Failed to parse formData from metadata:', e);
      }
    }

    res.json({
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email || session.customer_email,
      paymentOption: metadata.paymentOption || 'lmn-only',
      formData: formData,
      metadata: metadata,
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    console.error('Session ID:', req.query.session_id);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    
    // Check if it's a mode mismatch
    if (error.code === 'resource_missing') {
      const sessionId = req.query.session_id as string;
      const isLiveSession = sessionId.startsWith('cs_live_');
      const isTestKey = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
      
      if (isLiveSession && isTestKey) {
        return res.status(400).json({ 
          error: 'Mode mismatch',
          details: 'The checkout session was created in live mode, but the server is configured for test mode. Please use a test mode session or update your Stripe secret key.',
          sessionId: sessionId
        });
      } else if (!isLiveSession && !isTestKey) {
        return res.status(400).json({ 
          error: 'Mode mismatch',
          details: 'The checkout session was created in test mode, but the server is configured for live mode. Please use a live mode session or update your Stripe secret key.',
          sessionId: sessionId
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to retrieve checkout session',
      details: error.message,
      code: error.code || 'unknown'
    });
  }
});

// LMN generation endpoint
app.post('/api/generate-lmn', async (req, res) => {
  try {
    console.log("generating lmn in api.ts")
    console.log("Request body keys:", Object.keys(req.body || {}));
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const {
      firstName,
      lastName,
      age,
      sex,
      hsaProvider,
      state,
      diagnosedConditions,
      familyHistory,
      riskFactors,
      preventiveTargets,
      attestation,
      desiredProduct,
      businessName,
      paymentProcessed,
      sessionId,
    } = req.body;

    // Fetch email from Stripe checkout session
    let email: string | null = null;
    let stripePaymentIntentId: string | null = null;
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        email = session.customer_details?.email || null;
        stripePaymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null;
        console.log('Retrieved email from Stripe session:', email);
      } catch (stripeError) {
        console.error('Error retrieving email from Stripe session:', stripeError);
      }
    }

    // Validate required fields
    const missingFields: string[] = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!email) missingFields.push('email');
    if (!age) missingFields.push('age');
    if (!hsaProvider) missingFields.push('hsaProvider');
    if (!state) missingFields.push('state');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields for LMN generation:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        details: `Missing fields: ${missingFields.join(', ')}. Required: firstName, lastName, email, age, hsaProvider, and state`
      });
    }

    console.log("before attestation");

    if (!attestation) {
      return res.status(400).json({ 
        error: 'Attestation required',
        details: 'You must agree to the attestation to generate an LMN'
      });
    }

    // Check if payment has been processed
    if (!paymentProcessed) {
      return res.status(400).json({ 
        error: 'Payment required',
        details: 'Payment must be processed before generating LMN'
      });
    }
    console.log("desired product", desiredProduct);
    console.log("business name", businessName);

    // Transform form data to match LMN generator schema. Keep name out of this.
    const lmnInput = {
      age: parseInt(age),
      sex: sex,
      hsa_provider: hsaProvider,
      state: state,
      diagnosed_conditions: diagnosedConditions || [],
      family_history: familyHistory || [],
      risk_factors: riskFactors || [],
      preventive_targets: preventiveTargets ? [preventiveTargets] : [],
      desired_product: desiredProduct || '',
      business_name: businessName || ''
    };

    console.log('Generating LMN for:', lmnInput);

    // Generate the LMN
    const lmnResult = await generateLMN(JSON.stringify(lmnInput));
    console.log('Raw LMN result from Claude:', lmnResult);
//     const lmnResult = `Based on my searches, I'll now create a Letter of Medical Necessity for massage therapy:

// \`\`\`json
// {
//   "reported_diagnosis": "Anxiety and Depression with Chronic Pain risk",
//   "treatment": "The patient is recommended to undergo regular massage therapy sessions at Tension Intervention. The treatment plan includes twice-monthly 60-minute therapeutic massage sessions focusing on myofascial release techniques, trigger point therapy, and Swedish massage methods. These sessions will specifically target areas of muscle tension that exacerbate anxiety symptoms and contribute to pain patterns. The therapist at Tension Intervention will document progress after each session, adjusting techniques as needed to address the patient's evolving symptoms as part of the management plan for 12 months.",
//   "clinical_rationale": "The patient presents with diagnosed anxiety (F41.9) and depression (F32.9), with a family history of depression and chronic pain, placing her at elevated risk for developing chronic pain conditions herself. Research has demonstrated that massage therapy is an effective complementary treatment for both anxiety and depression. A systematic review (PMID: 28891221; Field T, 2016) found that massage therapy significantly reduced anxiety and depression symptoms through multiple physiological mechanisms, including reduced cortisol levels and increased serotonin and dopamine. Additionally, regular massage therapy at Tension Intervention can help prevent the development of chronic pain by addressing muscle tension patterns before they become persistent pain conditions. The patient's expressed desire to 'be healthier' aligns with this preventive approach.",
//   "role_the_service_provides": "Tension Intervention's massage therapy services provide a non-pharmacological intervention that reduces physiological markers of stress, decreases muscle tension, and improves mood regulation to complement standard treatments for anxiety and depression.",
//   "conclusion": "Given the patient's diagnosed conditions of anxiety and depression, family history of chronic pain, and the substantial clinical evidence supporting massage therapy's efficacy for these conditions, the requested massage therapy services at Tension Intervention are medically necessary as part of the patient's comprehensive treatment plan."
// }
// \`\`\``;

    // Log the generated LMN result
    console.log('\n========== LMN GENERATION COMPLETE ==========');

    // Find eligible nurse practitioners based on state
    let selectedNurse: { id: any; first_name: string; last_name: string; email: string } | null = null;
    if (state) {
      try {
        console.log(`Looking for nurse practitioners licensed in state: ${state}`);
        const { data: nurses, error: nursesError } = await supabase
          .from('nurse_practitioners')
          .select('id, first_name, last_name, email, states');
        console.log("data", nurses)
        
        if (nursesError) {
          console.error('Error fetching nurse practitioners:', nursesError);
        } else if (nurses && nurses.length > 0) {
          // Filter nurses where the state is in their states array
          const eligibleNurses = nurses
            .filter((nurse: any) => {
              const nurseStates = Array.isArray(nurse.states) ? nurse.states : [];
              return nurseStates.includes(state);
            })
            .map((nurse: any) => ({
              id: nurse.id,
              first_name: nurse.first_name,
              last_name: nurse.last_name,
              email: nurse.email
            }));
          
          console.log(`Found ${eligibleNurses.length} eligible nurse(s) for state ${state}`);
          
          if (eligibleNurses.length > 0) {
            // Randomly select one nurse
            const randomIndex = Math.floor(Math.random() * eligibleNurses.length);
            selectedNurse = eligibleNurses[randomIndex];
            console.log(`Selected nurse: ${selectedNurse.first_name} ${selectedNurse.last_name} (${selectedNurse.email})`);
          } else {
            console.warn(`No eligible nurses found for state ${state}`);
          }
        }
      } catch (nurseError) {
        console.error('Error processing nurse practitioner selection:', nurseError);
      }
    }

    // Generate PDF from LMN (returns base64 string)
    console.log('Generating PDF...');
    const pdfBase64 = await generateLMNPDFBuffer(lmnResult, {
      name: `${firstName} ${lastName}`,
      email: email || '',
      hsaProvider,
      diagnosedConditions: diagnosedConditions || [],
      desiredProduct: desiredProduct || 'Wellness service/product',
      businessName: businessName || '',
      nurseFirstName: selectedNurse?.first_name || null,
      nurseLastName: selectedNurse?.last_name || null,
      state: state || null
    });
    console.log('PDF generated successfully (in memory only, not saved to disk)');

    // Send to SignWell for signature
    console.log('Sending to SignWell for e-signature...');
    const recipientEmail = selectedNurse?.email || 'irenagao2013@gmail.com';
    // const recipientEmail = 'irenagao2013@gmail.com';
    console.log("RECIPIENT EMAIL", recipientEmail);
    // Use patient's name from LMN form for recipientName
    const recipientName = `${firstName} ${lastName}`;
    
    const lmnFileName = `LMN_${firstName}_${lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
    const signwellResult = await createSignatureRequest({
      pdfBase64,
      fileName: lmnFileName,
      recipientEmail: recipientEmail,
      recipientName: recipientName,
      selectedNurse: selectedNurse
    });

    console.log('SignWell signature request created:', signwellResult);

    // Store SignWell document ID and customer email in Stripe payment intent metadata
    // so the webhook handler can look up the email when the document is signed
    if (stripePaymentIntentId && signwellResult.documentGroupId) {
      try {
        await stripe.paymentIntents.update(stripePaymentIntentId, {
          metadata: {
            signwellDocumentGroupId: signwellResult.documentGroupId,
            customerEmail: email || '',
            customerFirstName: firstName || '',
            lmnFileName: lmnFileName,
          }
        });
        console.log('Stored SignWell document ID in Stripe payment intent metadata');
      } catch (metadataError) {
        console.error('Failed to update payment intent metadata:', metadataError);
      }
    }

    // Save to client_referrals table
    if (businessName && firstName && lastName) {
      try {
        // Look up provider by business_name to get provider_id
        let providerId = null;
        if (businessName && businessName !== 'Any Provider' && businessName !== 'any-provider') {
          const { data: providerData, error: providerError } = await supabase
            .from('providers')
            .select('id')
            .ilike('business_name', `%${businessName}%`)
            .limit(1)
            .maybeSingle();
          
          if (!providerError && providerData) {
            providerId = providerData.id;
          }
        }

        // Get date in EST timezone (America/New_York handles EST/EDT automatically)
        const now = new Date();
        const estDateString = now.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
        const [month, day, year] = estDateString.split('/');
        const today = `${year}-${month}-${day}`; // Format as YYYY-MM-DD
        
        const referralRow: Record<string, any> = {
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          date: today,
          service: null,
          is_lmn: true,
          signwell_document_group_id: signwellResult.documentGroupId || null,
        };
        if (providerId !== null) {
          referralRow.provider_id = providerId;
        }
        if (selectedNurse?.id != null) {
          referralRow.nurse_practitioner_id = selectedNurse.id;
        }
        const { error: referralError } = await supabase
          .from('client_referrals')
          .insert(referralRow);
        
        if (referralError) {
          console.error('Error saving client referral:', referralError);
        } else {
          console.log('Client referral saved successfully');
        }
      } catch (err) {
        console.error('Error saving client referral:', err);
        // Don't fail the request if referral save fails
      }
    }

    // Return success response
    res.json({
      success: true,
      message: 'LMN generated and sent for signature',
      signatureRequest: {
        documentGroupId: signwellResult.documentGroupId,
        sentTo: email
      }
    });

  } catch (error) {
    console.error('Error generating LMN:', error);
    res.status(500).json({ 
      error: 'Failed to generate LMN',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Provider interest form submission
app.post('/api/provider-interest', async (req, res) => {
  const { name, email, businessName, businessWebsite, notes } = req.body;

  if (!name || !email || !businessName) {
    return res.status(400).json({ error: 'Name, email, and business name are required.' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set; skipping email.');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: 'Saga Health <support@mysagahealth.com>',
      to: 'partners@mysagahealth.com',
      replyTo: email,
      subject: `New Provider Interest: ${businessName}`,
      text: [
        `New provider inquiry received.`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Business Name: ${businessName}`,
        `Business Website: ${businessWebsite || 'N/A'}`,
        `Additional Notes: ${notes || 'N/A'}`,
      ].join('\n'),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send provider interest email:', err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`LMN API server running on port ${PORT}`);
});


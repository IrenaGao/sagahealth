import express from 'express';
import cors from 'cors';
import { generateLMN } from './lmn-generator.js';
import { generateLMNPDFBuffer } from './utils/pdfGenerator.js';
import { createSignatureRequest, createSignwellWebhook } from './utils/signwellService.js';
import stripe from './stripe.js';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // Local development
    'https://sagahealth.vercel.app', // Production frontend
    /\.vercel\.app$/, // All Vercel preview deployments
  ],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SignWell webhook receiver - handles document events
app.post('/api/signwell/webhook', (req, res) => {
  try {
    const event = req.body;
    console.log('Received SignWell webhook event:', JSON.stringify(event, null, 2));

    if (event?.event === 'document.completed') {
      console.log('SignWell document completed:', event?.data?.id || event?.data?.document_id);
      // TODO: update database or notify user here if needed
    }

    // Respond 200 so SignWell knows we received the event
    res.status(200).json({ received: true });
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

// Stripe payment endpoints
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    
    console.log('Creating payment intent for amount:', amount);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create payment intent (destination charge disabled for test mode)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
      // Note: Uncomment these when using live keys with connected account
      // transfer_data: {
      //   destination: 'acct_1SOnkpIWEFJmAlLf',
      // },
      // application_fee_amount: Math.round(amount * 100 * 0.075), // 7.5% fee
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    console.error('Error details:', error.message, error.type, error.code);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      res.json({ 
        success: true, 
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency
      });
    } else {
      res.json({ 
        success: false, 
        status: paymentIntent.status,
        error: 'Payment not completed'
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// LMN generation endpoint
app.post('/api/generate-lmn', async (req, res) => {
  try {
    console.log("generating lmn in api.ts")
    const {
      firstName,
      lastName,
      email,
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
      paymentProcessed
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !age || !hsaProvider || !state) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'firstName, lastName, email, age, hsaProvider, and state are required'
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
    // const lmnResult = await generateLMN(JSON.stringify(lmnInput));
    const lmnResult = `Based on my searches, I'll now create a Letter of Medical Necessity for massage therapy:

\`\`\`json
{
  "reported_diagnosis": "Anxiety and Depression with Chronic Pain risk",
  "treatment": "The patient is recommended to undergo regular massage therapy sessions at Tension Intervention. The treatment plan includes twice-monthly 60-minute therapeutic massage sessions focusing on myofascial release techniques, trigger point therapy, and Swedish massage methods. These sessions will specifically target areas of muscle tension that exacerbate anxiety symptoms and contribute to pain patterns. The therapist at Tension Intervention will document progress after each session, adjusting techniques as needed to address the patient's evolving symptoms as part of the management plan for 12 months.",
  "clinical_rationale": "The patient presents with diagnosed anxiety (F41.9) and depression (F32.9), with a family history of depression and chronic pain, placing her at elevated risk for developing chronic pain conditions herself. Research has demonstrated that massage therapy is an effective complementary treatment for both anxiety and depression. A systematic review (PMID: 28891221; Field T, 2016) found that massage therapy significantly reduced anxiety and depression symptoms through multiple physiological mechanisms, including reduced cortisol levels and increased serotonin and dopamine. Additionally, regular massage therapy at Tension Intervention can help prevent the development of chronic pain by addressing muscle tension patterns before they become persistent pain conditions. The patient's expressed desire to 'be healthier' aligns with this preventive approach.",
  "role_the_service_provides": "Tension Intervention's massage therapy services provide a non-pharmacological intervention that reduces physiological markers of stress, decreases muscle tension, and improves mood regulation to complement standard treatments for anxiety and depression.",
  "conclusion": "Given the patient's diagnosed conditions of anxiety and depression, family history of chronic pain, and the substantial clinical evidence supporting massage therapy's efficacy for these conditions, the requested massage therapy services at Tension Intervention are medically necessary as part of the patient's comprehensive treatment plan."
}
\`\`\``;

    // Log the generated LMN result
    console.log('\n========== LMN GENERATION COMPLETE ==========');
    console.log('Generated LMN Result:');
    console.log(lmnResult);
    console.log('=============================================\n');

    // Generate PDF from LMN (returns base64 string)
    console.log('Generating PDF...');
    const pdfBase64 = await generateLMNPDFBuffer(lmnResult, {
      name: `${firstName} ${lastName}`,
      email,
      hsaProvider,
      diagnosedConditions: diagnosedConditions || [],
      desiredProduct: desiredProduct || 'Wellness service/product',
      businessName: businessName || ''
    });
    console.log('PDF generated successfully', pdfBase64);
    
    // Save PDF to file
    const pdfFileName = `LMN_hi_${firstName}_${lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfFilePath = join(__dirname, '../generated_lmns', pdfFileName);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    writeFileSync(pdfFilePath, pdfBuffer);
    console.log(`PDF saved to: ${pdfFilePath}`);
    // return;

    // Send to SignWell for signature
    console.log('Sending to SignWell for e-signature...');
    const signwellResult = await createSignatureRequest({
      pdfBase64,
      fileName: `LMN_${firstName}_${lastName}_${new Date().toISOString().split('T')[0]}.pdf`,
      recipientEmail: 'irenagao2013@gmail.com', // Fixed recipient email
      recipientName: `${firstName} ${lastName}`,
      subject: 'Please sign your Letter of Medical Necessity',
      message: `Hi ${firstName}, please review and sign your Letter of Medical Necessity for ${hsaProvider}. This document is required for HSA/FSA reimbursement.`
    });

    console.log('SignWell signature request created:', signwellResult);

    // Return success response
    res.json({
      success: true,
      message: 'LMN generated and sent for signature',
      signatureRequest: {
        documentGroupId: signwellResult.documentGroupId,
        sentTo: 'irenagao2013@gmail.com'
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LMN API server running on port ${PORT}`);
});


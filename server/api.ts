import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { generateLMN } from './lmn-generator.js';
import { generateLMNPDFBuffer, generateServiceReceiptPDF } from './utils/pdfGenerator.js';
import { createSignatureRequest, createSignwellWebhook, handleSignwellWebhook } from './utils/signwellService.js';
import { createPaymentIntent, createCheckoutSession } from './utils/stripeService.js';
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

// Stripe payment endpoints
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {}, stripeAcctId, paymentOption, servicePrice, receiptEmail } = req.body;
    
    const result = await createPaymentIntent({
      amount,
      currency,
      metadata,
      stripeAcctId,
      paymentOption,
      servicePrice,
      receiptEmail,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    console.error('Error details:', error.message, error.type, error.code);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
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
      stripeAcctId, 
      paymentOption, 
      servicePrice, 
      serviceName,
      duration,
      firstHealthCondition,
      businessName,
      businessAddress,
      customerFirstName,
      customerLastName,
      receiptEmail,
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
      stripeAcctId,
      paymentOption,
      servicePrice,
      serviceName,
      duration,
      firstHealthCondition,
      businessName,
      businessAddress,
      customerFirstName,
      customerLastName,
      receiptEmail,
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

    const paymentIntent = session.payment_intent;
    const paymentIntentObj = typeof paymentIntent === 'object' ? paymentIntent as Stripe.PaymentIntent : null;
    const paymentIntentId = paymentIntentObj?.id || paymentIntent;

    const formatCardDescription = (brand?: string | null, last4?: string | null) => {
      if (!last4) return undefined;
      const normalizedBrand = brand ? `${brand.charAt(0).toUpperCase()}${brand.slice(1)}` : 'Card';
      return `${normalizedBrand} **** ${last4}`;
    };

    let paymentMethodDescription: string | undefined;

    if (paymentIntentObj) {
      const paymentMethodValue = paymentIntentObj.payment_method;

      if (paymentMethodValue && typeof paymentMethodValue === 'object' && 'card' in paymentMethodValue) {
        const card = paymentMethodValue.card as Stripe.PaymentMethod.Card | null | undefined;
        paymentMethodDescription = formatCardDescription(card?.brand, card?.last4);
      }

      if (!paymentMethodDescription) {
        const paymentMethodId = typeof paymentMethodValue === 'string'
          ? paymentMethodValue
          : paymentMethodValue?.id;

        if (paymentMethodId) {
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            if (paymentMethod.card) {
              paymentMethodDescription = formatCardDescription(paymentMethod.card.brand, paymentMethod.card.last4);
            }
          } catch (pmError) {
            console.error('Failed to retrieve payment method details for receipt:', pmError);
          }
        }
      }
    }

    // Extract paymentOption from metadata (could be in session metadata or payment intent metadata)
    const paymentIntentMetadata = typeof paymentIntent === 'object' && paymentIntent?.metadata ? paymentIntent.metadata : {};
    const paymentOption = metadata.paymentOption || paymentIntentMetadata.paymentOption || 'lmn-only';

    // Generate service receipt PDF only if a service is paid for (lmn-and-service or service-only)
    // Do NOT generate receipt for lmn-only payments
    let serviceReceiptPDF: string | null = null;
    console.log('Checking receipt generation conditions:');
    console.log('  paymentOption:', paymentOption);
    console.log('  payment_status:', session.payment_status);
    console.log('  formData exists:', !!formData);
    
    const shouldGenerateReceipt = (paymentOption === 'lmn-and-service' || paymentOption === 'service-only') 
      && session.payment_status === 'paid';
    
    if (shouldGenerateReceipt) {
      try {
        console.log('Generating service receipt PDF...');
        // Extract service details from metadata or formData
        const serviceName = (metadata.serviceName as string) || formData?.desiredProduct || 'Service';
        const duration = (metadata.duration as string) || '60 min';
        const firstHealthCondition = (metadata.firstHealthCondition as string) || (formData?.diagnosedConditions?.[0]) || null;
        const businessName = (metadata.businessName as string) || formData?.businessName || 'Provider';
        const businessAddress = (metadata.businessAddress as string) || '';
        
        // Calculate service price: for lmn-and-service, subtract $20 LMN fee; for service-only, use full amount
        let servicePrice = 0;
        if (paymentOption === 'service-only') {
          servicePrice = session.amount_total ? session.amount_total / 100 : 0;
        } else if (paymentOption === 'lmn-and-service') {
          servicePrice = metadata.servicePrice ? parseFloat(metadata.servicePrice as string) : (session.amount_total ? (session.amount_total - 2000) / 100 : 0);
        }
        
        console.log('Receipt data:', {
          serviceName,
          duration,
          firstHealthCondition,
          businessName,
          businessAddress,
          servicePrice,
          paymentOption,
        });
        
        // Format product name
        let productName = serviceName;
        if (duration && serviceName && firstHealthCondition) {
          productName = `${duration} ${serviceName} for ${firstHealthCondition}`;
        } else if (duration && serviceName) {
          productName = `${duration} ${serviceName}`;
        }

        // Get customer name from Stripe Checkout customer_details
        let customerName = 'Customer';
        if (session.customer_details?.name) {
          customerName = session.customer_details.name;
        } else if (formData?.firstName && formData?.lastName) {
          // Fallback to formData if customer_details.name is not available
          customerName = `${formData.firstName} ${formData.lastName}`;
        } else if (session.customer_details?.email) {
          // Extract name from email as last resort
          const emailName = session.customer_details.email.split('@')[0];
          customerName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
        
        // Ensure we have an email from Stripe Checkout
        if (!session.customer_details?.email) {
          console.warn('No customer email found in Stripe Checkout session - cannot send receipt');
        }

        serviceReceiptPDF = await generateServiceReceiptPDF({
          customerName: customerName,
          customerEmail: session.customer_email || undefined,
          productName: productName,
          businessName: businessName,
          businessAddress: businessAddress,
          amount: servicePrice,
          currency: session.currency?.toUpperCase() || 'USD',
          paymentDate: new Date(),
          paymentIntentId: paymentIntentId as string,
          invoiceNumber: paymentIntentId as string,
          receiptNumber: session.id,
          paymentMethod: paymentMethodDescription || 'Card',
        });

        console.log('Service receipt PDF generated successfully, length:', serviceReceiptPDF?.length || 0);

        // Email the receipt to the customer using email from Stripe Checkout
        // Check if receipt has already been sent (idempotency check)
        const receiptSentFlag = metadata.receiptEmailSent === 'true' || paymentIntentMetadata.receiptEmailSent === 'true';
        
        if (receiptSentFlag) {
          console.log('Service receipt already sent for this payment - skipping duplicate email');
        } else {
          // Check multiple possible locations for the email
          let recipientEmail = session.customer_details?.email || 
                             (typeof session.customer === 'object' && session.customer ? (session.customer as Stripe.Customer).email : null);
          
          console.log('Email lookup for receipt:', {
            customer_email: session.customer_email,
            customer_details_email: session.customer_details?.email,
            customer_object_email: typeof session.customer === 'object' && session.customer ? (session.customer as Stripe.Customer)?.email : 'N/A (not expanded)',
            final_recipientEmail: recipientEmail
          });
          
          if (recipientEmail && process.env.RESEND_API_KEY) {
            try {
              // Mark receipt as sent in metadata FIRST to prevent race conditions
              // This acts as a lock to prevent duplicate sends
              try {
                await stripe.checkout.sessions.update(session.id, {
                  metadata: {
                    ...metadata,
                    receiptEmailSent: 'true',
                  },
                });
                console.log('Marked receipt as sent in session metadata (before sending email)');
              } catch (updateError: any) {
                console.error('Failed to update session metadata:', updateError);
                // If we can't update metadata, check again to see if another process already set it
                const updatedSession = await stripe.checkout.sessions.retrieve(session.id);
                if (updatedSession.metadata?.receiptEmailSent === 'true') {
                  console.log('Receipt already marked as sent by another process - skipping email');
                  return; // Exit early to prevent duplicate
                }
              }
              
              // Now send the email
              const resend = new Resend(process.env.RESEND_API_KEY);
              const receiptBuffer = Buffer.from(serviceReceiptPDF, 'base64');
              
              await resend.emails.send({
                from: 'Saga Health <support@mysagahealth.com>',
                to: recipientEmail,
                subject: 'Your Appointment Receipt from Saga Health',
                text: `Dear ${customerName},\n\nThank you for your purchase! Please find your appointment receipt attached to this email.\n\nIf you have any questions, please don't hesitate to reach out.\n\nSincerely,\nThe Saga Health Team`,
                attachments: [
                  {
                    filename: `Service_Receipt_${customerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                    content: receiptBuffer.toString('base64'),
                    contentType: 'application/pdf',
                  },
                ],
              });
              console.log(`Service receipt emailed successfully to ${recipientEmail}`);
            } catch (emailError: any) {
              console.error('Failed to email service receipt:', emailError);
              // If email fails, we could optionally remove the flag, but it's safer to keep it
              // to prevent retry loops
            }
          } else if (!recipientEmail) {
            console.warn('No email address available to send service receipt');
          } else if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set; skipping receipt email');
          }
        }
      } catch (error: any) {
        console.error('Error generating service receipt PDF:', error);
        console.error('Error stack:', error.stack);
        // Continue without receipt PDF if generation fails
      }
    } else {
      console.log('Receipt generation skipped - conditions not met');
    }

    res.json({
      sessionId: session.id,
      paymentIntentId: paymentIntentId,
      amount: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      paymentOption: paymentOption,
      formData: formData,
      serviceReceiptPDF: serviceReceiptPDF, // Include receipt PDF if generated
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve checkout session',
      details: error.message 
    });
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
      paymentProcessed,
      paymentIntentId
    } = req.body;

    // Check if LMN has already been generated for this payment (idempotency)
    if (paymentIntentId) {
      try {
        const fs = await import('fs/promises');
        const generatedLmnsDir = join(__dirname, '../generated_lmns');
        const existingLmns = await fs.readdir(generatedLmnsDir).catch(() => []);
        const hasExistingLmn = existingLmns.some((file: string) => file.includes(paymentIntentId));
        
        if (hasExistingLmn) {
          console.log(`LMN already generated for payment ${paymentIntentId}, skipping duplicate generation`);
          return res.status(200).json({ 
            message: 'LMN already generated for this payment',
            paymentIntentId 
          });
        }
      } catch (fsError) {
        console.error('Error checking for existing LMN:', fsError);
        // Continue with generation if check fails
      }
    }

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
    // console.log(lmnResult);
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
    // console.log('PDF generated successfully', pdfBase64);
    
    // Save PDF to file (include paymentIntentId in filename for idempotency)
    const pdfFileName = paymentIntentId 
      ? `LMN_hi_${firstName}_${lastName}_${new Date().toISOString().split('T')[0]}_${paymentIntentId}.pdf`
      : `LMN_hi_${firstName}_${lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
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
      // Send the LMN to the email the user provided in the form
      recipientEmail: email,
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

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`LMN API server running on port ${PORT}`);
});


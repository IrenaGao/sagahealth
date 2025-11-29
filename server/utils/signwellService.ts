import axios from 'axios';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import stripe from '../stripe.js';

// Get current file directory and load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const SIGNWELL_API_KEY = process.env.SIGNWELL_API_KEY;
const SIGNWELL_API_URL = process.env.SIGNWELL_API_URL || 'https://www.signwell.com/api/v1';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface SignatureRequestParams {
  pdfBase64: string;
  fileName: string;
  recipientEmail: string;
  recipientName: string;
  selectedNurse: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export async function createSignatureRequest(params: SignatureRequestParams): Promise<any> {
  try {
    if (!SIGNWELL_API_KEY) {
      throw new Error('SIGNWELL_API_KEY is not configured');
    }

    const {
      pdfBase64,
      fileName,
      recipientEmail,
      recipientName,
      selectedNurse
    } = params;

    // Step 1: Upload the PDF document
    console.log('Uploading PDF to SignWell...');
    console.log("RECEIPIENT NAME", recipientName);
    console.log("RECEIPIENT EMAIL", recipientEmail);

    // Step 2: Create signature request
    console.log('Creating signature request...');
    console.log('Recipient:', recipientEmail, recipientName);
    
    // Get current date for document name
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const signatureRequestData = {
      test_mode: false, // Set to false for production
      name: `LMN for ${recipientName} - ${currentDate}`,
      draft: false,
      recipients: [
        {
          id: "1",
          name: recipientName,
          email: recipientEmail
        }
      ],
      files: [
        {
          name: fileName,
          file_base64: pdfBase64
        }
      ],
      reminders: true,
      text_tags: true,
      api_application_id: null,
      subject: `Please sign ${recipientName}'s Letter of Medical Necessity`,
      message: selectedNurse 
        ? `Hi ${selectedNurse.first_name}, please review and sign ${recipientName}'s Letter of Medical Necessity. This document is required for HSA/FSA reimbursement.`
        : `Hi Derek, please review and sign ${recipientName}'s Letter of Medical Necessity. This document is required for HSA/FSA reimbursement.`
    };

    // console.log('Signature request payload:', JSON.stringify(signatureRequestData, null, 2));

    const signatureResponse = await axios.post(
      `${SIGNWELL_API_URL}/documents`,
      signatureRequestData,
      {
        headers: {
          'X-Api-Key': SIGNWELL_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Signature request created successfully');
    console.log('SignWell Document Group ID:', signatureResponse.data.id);

    return {
      success: true,
      documentGroupId: signatureResponse.data.id,
      message: 'Signature request sent successfully'
    };

  } catch (error: any) {
    console.error('SignWell API Error:', error.response?.data || error.message);
    throw new Error(
      `Failed to create signature request: ${error.response?.data?.message || error.message}`
    );
  }
}

// Create a webhook in SignWell for document completion events
export async function createSignwellWebhook(callbackUrl: string): Promise<any> {
  try {
    if (!SIGNWELL_API_KEY) {
      throw new Error('SIGNWELL_API_KEY is not configured');
    }

    if (!callbackUrl) {
      throw new Error('Callback URL is required to create a SignWell webhook');
    }

    console.log('Creating SignWell webhook for callback URL:', callbackUrl);

    // Per SignWell API, the field name must be `callback_url`, not `url`
    const payload = {
      callback_url: callbackUrl,
      events: ['document.completed'],
    };

    const response = await axios.post(
      `${SIGNWELL_API_URL}/hooks/`,
      payload,
      {
        headers: {
          'X-Api-Key': SIGNWELL_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('SignWell webhook created:', response.data?.id || response.data);
    return response.data;
  } catch (error: any) {
    console.error('SignWell Webhook Error:', error.response?.data || error.message);
    throw new Error(
      `Failed to create SignWell webhook: ${error.response?.data?.message || error.message}`
    );
  }
}

interface WebhookPayload {
  event?: {
    type?: string;
  };
  data?: {
    object?: {
      id?: string;
      recipients?: Array<{
        email?: string;
        name?: string;
      }>;
    };
  };
}

interface HandleWebhookResult {
  received: boolean;
}

/**
 * Handles SignWell webhook events, particularly document_completed events
 * Fetches the signed PDF and sends notification email
 * @param payload Webhook payload from SignWell
 * @returns Result indicating webhook was received
 */
export async function handleSignwellWebhook(payload: WebhookPayload): Promise<HandleWebhookResult> {
  const eventType = payload?.event?.type;

  if (eventType === 'document_completed') {
    const docId = payload?.data?.object?.id;
    console.log('SignWell document completed:', docId);

    // Get recipient name from SignWell payload
    const recipientName = payload?.data?.object?.recipients?.[0]?.name || 'there';
    
    // Look up customer email from Stripe payment intent metadata
    // The signwellDocumentGroupId is stored in payment intent metadata when the document is created
    // This email will be used for the Resend API notification (not the SignWell recipient)
    let recipientEmail: string | null = null;
    
    if (docId) {
      try {
        // Search for payment intents with matching signwellDocumentGroupId in metadata
        // Use Stripe search API for more efficient lookup
        const searchResults = await stripe.paymentIntents.search({
          query: `metadata['signwellDocumentGroupId']:'${docId}'`,
          limit: 1,
        });
        
        if (searchResults.data.length > 0) {
          const matchingPaymentIntent = searchResults.data[0];
          if (matchingPaymentIntent.metadata?.customerEmail) {
            recipientEmail = matchingPaymentIntent.metadata.customerEmail;
            console.log(`✓ Found customer email from Stripe payment intent metadata: ${recipientEmail}`);
          } else {
            console.warn(`⚠ Payment intent found but no customerEmail in metadata for document ${docId}`);
            // Try to get email from payment intent customer or receipt_email as fallback
            if (matchingPaymentIntent.customer) {
              try {
                const customer = typeof matchingPaymentIntent.customer === 'object'
                  ? matchingPaymentIntent.customer as any
                  : await stripe.customers.retrieve(matchingPaymentIntent.customer as string);
                if (customer && typeof customer === 'object' && customer.email) {
                  recipientEmail = customer.email;
                  console.log(`✓ Found customer email from Stripe customer object: ${recipientEmail}`);
                }
              } catch (customerError) {
                console.error('Error retrieving customer:', customerError);
              }
            }
            if (!recipientEmail && matchingPaymentIntent.receipt_email) {
              recipientEmail = matchingPaymentIntent.receipt_email;
              console.log(`✓ Found customer email from payment intent receipt_email: ${recipientEmail}`);
            }
          }
        } else {
          console.warn(`⚠ No payment intent found with signwellDocumentGroupId ${docId}`);
        }
      } catch (stripeError) {
        console.error('Error looking up customer email from Stripe:', stripeError);
      }
    }
    
    // Use customer email if found, otherwise log warning (but don't send email to support)
    if (!recipientEmail) {
      console.error(`❌ Could not find customer email for SignWell document ${docId}. Email will not be sent.`);
      console.error('This means the Resend API email will not be sent. Please check Stripe metadata.');
      return { received: true }; // Return early to prevent sending email to wrong address
    }

    // Attempt to fetch the signed PDF from SignWell
    let attachments: { filename: string; content: string; contentType: string }[] = [];
    if (docId && SIGNWELL_API_KEY) {
      try {
        const pdfResponse = await axios.get(
          `${SIGNWELL_API_URL}/documents/${docId}/completed_pdf/`,
          {
            responseType: 'arraybuffer',
            headers: {
              'X-Api-Key': SIGNWELL_API_KEY,
            },
          }
        );

        const pdfBuffer = Buffer.from(pdfResponse.data);
        attachments.push({
          filename: `LMN_${docId}.pdf`,
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf',
        });

        console.log('Fetched signed LMN PDF from SignWell for attachment');
      } catch (pdfErr) {
        console.error('Failed to fetch signed LMN PDF from SignWell:', pdfErr);
      }
    }

    // Send notification email via Resend
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set; skipping email notification.');
    } else {
      try {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: 'Saga Health <support@mysagahealth.com>',
          to: recipientEmail,
          subject: 'Your Letter of Medical Necessity for HSA Coverage is Ready!',
          text:
            `Congrats ${recipientName}!` +
            "\n\nA licensed practitioner has reviewed the information submitted in your form and has issued a Letter of Medical Necessity (LMN) recommending the service you purchased." +
            "\n\nIn order to use your pre-tax HSA, you'll need to submit a reimbursement claim to your HSA administrator, usually through their website. Be sure to (1) submit your purchase receipt and (2) keep your Letter of Medical Necessity in a safe place, which is attached to this email. Your HSA provider may ask for it as proof of medical necessity."+
            "\n\nOnce your claim is approved, your HSA administrator will reimburse you directly. Feel free to respond back to this email if you have any questions!" +
            "\n\nSincerely,\nThe Saga Health Team",
          attachments: attachments.length ? attachments : undefined,
        });
        console.log('Notification email with LMN attachment sent to ' + recipientEmail);
      } catch (emailErr) {
        console.error('Failed to send notification email via Resend:', emailErr);
      }
    }
  }

  return { received: true };
}



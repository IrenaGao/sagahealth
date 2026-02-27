import axios from 'axios';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import stripe from '../stripe.js';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

// Get current file directory and load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const SIGNWELL_API_KEY = process.env.SIGNWELL_API_KEY;
const SIGNWELL_API_URL = process.env.SIGNWELL_API_URL || 'https://www.signwell.com/api/v1';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

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
      document_group_id?: string;
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

  console.log("PAYLOAD", payload);
  if (eventType === 'document_completed' || eventType === 'document.completed') {
    const docId = payload?.data?.object?.id;
    // Try to get document_group_id from payload (this is what we store in Stripe metadata)
    const documentGroupId = (payload?.data?.object as any)?.document_group_id || docId;
    console.log('SignWell document completed:', docId);
    console.log('SignWell document group ID:', documentGroupId);

    // Get recipient name from SignWell payload
    const recipientName = payload?.data?.object?.recipients?.[0]?.name || 'there';
    
    // Look up customer email from client_referrals table using signwell_document_group_id
    let recipientEmail: string | null = null;
    let lmnFileName: string | null = null;

    if (documentGroupId) {
      try {
        console.log('Looking up client_referrals for documentGroupId:', documentGroupId);
        const { data: referral, error: referralError } = await supabase
          .from('client_referrals')
          .select('email, first_name, last_name, date')
          .eq('signwell_document_group_id', documentGroupId)
          .maybeSingle();

        if (referralError) {
          console.error('Error querying client_referrals:', referralError);
        } else if (referral) {
          recipientEmail = referral.email || null;
          lmnFileName = `LMN_${referral.first_name}_${referral.last_name}_${referral.date}.pdf`;
          console.log(`✓ Found customer email: ${recipientEmail}`);
          console.log(`✓ Reconstructed LMN filename: ${lmnFileName}`);
        } else {
          console.warn(`⚠ No client_referral found with signwell_document_group_id ${documentGroupId}`);
        }
      } catch (err) {
        console.error('Error looking up customer email from client_referrals:', err);
      }
    }
    
    // Use customer email if found, otherwise log warning (but don't send email to support)
    if (!recipientEmail) {
      console.error(`❌ Could not find customer email for SignWell document ${documentGroupId}. Email will not be sent.`);
      console.error('This means the Resend API email will not be sent. Please check Stripe metadata.');
      return { received: true }; // Return early to prevent sending email to wrong address
    }

    // Attempt to fetch the signed PDF from SignWell
    let attachments: { filename: string; content: string; contentType: string }[] = [];
    if (docId && SIGNWELL_API_KEY) {
      try {
        console.log(`Fetching completed PDF from SignWell for document ID: ${docId}`);
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
        
        // Remove audit report pages from the PDF
        // SignWell appends audit report pages at the end, typically 1-3 pages
        let cleanedPdfBuffer = pdfBuffer;
        try {
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const pageCount = pdfDoc.getPageCount();
          
          // Try to identify audit report pages (usually last 1-3 pages)
          // We'll remove pages that might contain audit report content
          // A conservative approach: check if there are more than 2 pages and remove the last 2
          // This is a heuristic - you may need to adjust based on your document structure
          if (pageCount > 2) {
            // Remove the last 2 pages (typically where audit report is)
            // You can adjust this number if audit reports are longer
            const pagesToRemove = 1;
            const pagesToKeep = pageCount - pagesToRemove;
            
            // Create a new PDF with only the pages we want to keep
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: pagesToKeep }, (_, i) => i));
            pages.forEach((page) => newPdf.addPage(page));
            
            const cleanedPdfBytes = await newPdf.save();
            cleanedPdfBuffer = Buffer.from(cleanedPdfBytes);
            console.log(`Removed ${pagesToRemove} audit report page(s) from PDF (original: ${pageCount} pages, cleaned: ${pagesToKeep} pages)`);
          } else {
            console.log(`PDF has ${pageCount} page(s), assuming no audit report to remove`);
          }
        } catch (pdfProcessError) {
          console.warn('Failed to remove audit report from PDF, using original:', pdfProcessError);
          // Continue with original PDF if processing fails
        }
        
        // Use the original filename from metadata if available, otherwise fallback to docId
        const attachmentFilename = lmnFileName || `LMN_${docId}.pdf`;
        attachments.push({
          filename: attachmentFilename,
          content: cleanedPdfBuffer.toString('base64'),
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



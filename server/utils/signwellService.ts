import axios from 'axios';

const SIGNWELL_API_KEY = process.env.SIGNWELL_API_KEY;
const SIGNWELL_API_URL = 'https://www.signwell.com/api/v1';

interface SignatureRequestParams {
  pdfBase64: string;
  fileName: string;
  recipientEmail: string;
  recipientName: string;
  subject?: string;
  message?: string;
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
      subject = 'Please sign your Letter of Medical Necessity',
      message = 'Please review and sign your Letter of Medical Necessity. This document is required for HSA/FSA reimbursement.'
    } = params;

    // Step 1: Upload the PDF document
    console.log('Uploading PDF to SignWell...');

    // Step 2: Create signature request
    console.log('Creating signature request...');
    console.log('Recipient:', recipientEmail, recipientName);
    
    const signatureRequestData = {
      test_mode: true, // Set to false for production
      name: `LMN for ${recipientName}`,
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
      fields: [
        [
            {
                "x": 0,
                "y": 0,
                "page": 0,
                "recipient_id": "1",
                "type": "signature",
                "required": true,
            }
        ]
      ],
      reminders: true,
      text_tags: false,
      api_application_id: null
    };

    console.log('Signature request payload:', JSON.stringify(signatureRequestData, null, 2));

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


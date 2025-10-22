# SignWell E-Signature Setup

## Overview

The LMN form now integrates with SignWell to send generated Letters of Medical Necessity for e-signature via email. When a user submits the form, the LMN is:
1. Generated using Claude AI
2. Converted to a professional PDF
3. Uploaded to SignWell
4. Sent to `irenagao2013@gmail.com` for signature

## Setup Steps

### 1. Create a SignWell Account

1. Go to [SignWell](https://www.signwell.com)
2. Sign up for an account (they offer a free trial)
3. Verify your email address

### 2. Get Your API Key

1. Log in to your SignWell account
2. Navigate to **Settings** → **API**
3. Click **Generate API Key** or copy your existing key
4. Save this key securely

### 3. Add API Key to Environment Variables

Add the following to your `.env` file:

```bash
# SignWell API Configuration
SIGNWELL_API_KEY=your_signwell_api_key_here
```

### 4. Test Mode vs Production

By default, the integration is set to production mode (`test_mode: false` in `signwellService.ts`).

**To use test mode during development:**
1. Open `server/utils/signwellService.ts`
2. Find line: `test_mode: false`
3. Change to: `test_mode: true`

**Note:** In test mode, emails are not actually sent. You can view test documents in your SignWell dashboard.

## How It Works

### User Flow:
1. User fills out the 4-step LMN form
2. Clicks "Submit LMN Request"
3. Backend generates LMN using Claude AI
4. PDF is created from the LMN content
5. PDF is uploaded to SignWell
6. SignWell sends signature request email to `irenagao2013@gmail.com`
7. User sees success message
8. Recipient receives email with link to sign document

### Email Contents:
- **Recipient:** irenagao2013@gmail.com (hardcoded)
- **Subject:** "Please sign your Letter of Medical Necessity"
- **Message:** Personalized message with patient name and HSA provider
- **Document:** Professional PDF Letter of Medical Necessity

### After Signing:
- Signed PDF is stored in SignWell
- Can download from SignWell dashboard
- Can set up webhooks for notifications when signed

## API Endpoints Used

### 1. Upload Document
```
POST https://www.signwell.com/api/v1/documents
```
Uploads the PDF file to SignWell

### 2. Create Signature Request
```
POST https://www.signwell.com/api/v1/document_groups
```
Creates a signature request and sends email

## Configuration Options

### Change Recipient Email

To change the recipient email, edit `server/api.ts`:

```typescript
const signwellResult = await createSignatureRequest({
  pdfBuffer,
  fileName: `LMN_${firstName}_${lastName}_${new Date().toISOString().split('T')[0]}.pdf`,
  recipientEmail: 'your_email@example.com', // <-- Change this
  recipientName: `${firstName} ${lastName}`,
  subject: 'Please sign your Letter of Medical Necessity',
  message: `Hi ${firstName}, please review and sign your Letter of Medical Necessity...`
});
```

### Customize Email Subject/Message

Edit the `subject` and `message` fields in the same function call above.

### Add Multiple Recipients

Edit `server/utils/signwellService.ts` and modify the `recipients` array:

```typescript
recipients: [
  {
    email: 'recipient1@example.com',
    name: 'Recipient One',
    role: 'Signer',
    order: 1
  },
  {
    email: 'recipient2@example.com',
    name: 'Recipient Two',
    role: 'Signer',
    order: 2
  }
]
```

## Server Logs

When a form is submitted, you'll see these logs in the backend terminal:

```
Generating LMN for: { name: '...', ... }
========== LMN GENERATION COMPLETE ==========
Generated LMN Result: ...
=============================================
Generating PDF...
PDF generated successfully
Sending to SignWell for e-signature...
Uploading PDF to SignWell...
PDF uploaded successfully. Document ID: xxx
Creating signature request...
Signature request created successfully
SignWell Document Group ID: xxx
```

## Troubleshooting

### "SIGNWELL_API_KEY is not configured"
- Check that you've added `SIGNWELL_API_KEY` to your `.env` file
- Restart the backend server after adding the key

### "Failed to create signature request"
- Verify your API key is correct
- Check SignWell dashboard for quota limits
- Ensure you're not exceeding your plan's document limit

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check SignWell dashboard to see if request was created
- Make sure `test_mode` is set to `false` for production

### PDF upload fails
- Check file size (SignWell has limits)
- Verify PDF is valid
- Check backend console logs for detailed error

## SignWell Dashboard

Access your SignWell dashboard at: https://www.signwell.com/dashboard

Here you can:
- View all signature requests
- Download signed documents
- Resend signature request emails
- Cancel pending requests
- Set up webhooks for notifications

## Webhooks (Optional)

To get notified when documents are signed, set up webhooks in SignWell:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/signwell-webhook`
3. Select events to listen for (e.g., `document_completed`)
4. Implement webhook handler in your API

## Files Modified/Created

### Created:
- `server/utils/pdfGenerator.ts` - Server-side PDF generation
- `server/utils/signwellService.ts` - SignWell API integration
- `SIGNWELL_SETUP.md` - This documentation

### Modified:
- `server/api.ts` - Added PDF generation and SignWell integration
- `src/pages/LMNForm.jsx` - Removed client-side PDF download, updated success message
- `package.json` - Added axios, form-data, pdfkit dependencies

## Pricing

SignWell offers:
- **Free Trial:** Limited documents
- **Starter:** $8/month - 5 documents
- **Business:** $24/month - 20 documents
- **Premium:** Custom pricing

Check [SignWell Pricing](https://www.signwell.com/pricing) for current rates.

## Support

- SignWell Docs: https://developers.signwell.com
- SignWell Support: support@signwell.com

---

**Ready to use!** Just add your `SIGNWELL_API_KEY` to `.env` and restart the backend server.


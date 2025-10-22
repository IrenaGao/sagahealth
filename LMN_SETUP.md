# LMN Generation Setup Guide

This guide will help you set up the Letter of Medical Necessity (LMN) generation feature in Saga Health.

## Overview

The LMN generation feature uses AI (Claude by Anthropic) to create professional medical documentation for HSA/FSA reimbursement. When users submit the LMN form, their data is sent to a backend API server that generates a personalized Letter of Medical Necessity.

## Architecture

```
User fills out form → Frontend (React) → API Server (Express) → LMN Generator (Claude AI + Pinecone search) → Generated LMN
```

## Setup Steps

### 1. Install Dependencies

Run the following command to install all required packages:

```bash
npm install
```

This will install:
- `express` - Backend API server
- `cors` - Cross-origin resource sharing
- `@langchain/anthropic` - Claude AI integration
- `@langchain/langgraph` - AI agent framework
- `@langchain/core` - LangChain core utilities
- `@pinecone-database/pinecone` - Vector database for medical search
- `zod` - Schema validation
- TypeScript types and `tsx` for running TypeScript

### 2. Set Up Environment Variables

Add the following to your `.env` file:

```bash
# Anthropic API (for LMN generation)
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-7-sonnet-latest

# Pinecone (for medical documentation search)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=your-pinecone-index-name

# API Server Port (optional, defaults to 3001)
PORT=3001
```

#### Getting API Keys:

**Anthropic API Key:**
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy and paste it into your `.env` file

**Pinecone API Key:**
1. Go to https://www.pinecone.io
2. Sign up or log in
3. Create a new project
4. Create an index (e.g., "medical-docs")
5. Copy your API key and index name to `.env`

### 3. Ingest Medical Documentation (Optional)

If you want to use the medical documentation search feature, you need to ingest ICD-10 codes into Pinecone:

```bash
npx tsx server/scripts/ingest_docs.ts
```

This will:
- Load ICD-10 codes from `server/support_docs/icd10-codes.json`
- Create embeddings using OpenAI or another provider
- Upload them to your Pinecone index

### 4. Run the Application

You need to run TWO servers:

**Terminal 1 - Frontend (React + Vite):**
```bash
npm run dev
```
This starts the frontend at http://localhost:5173

**Terminal 2 - Backend API (Express):**
```bash
npm run server
```
This starts the API server at http://localhost:3001

### 5. Test the LMN Form

1. Navigate to http://localhost:5173
2. Click on any service and select "Book Now" or "Get LMN"
3. Fill out the multi-step form:
   - **Step 1:** Personal information (name, email)
   - **Step 2:** Demographics (age, sex, HSA provider, state)
   - **Step 3:** Health information (conditions, family history, risk factors)
   - **Step 4:** Attestation (required checkbox)
4. Click "Submit LMN Request"
5. The form will call the API, which generates an LMN using Claude AI
6. Check your console for the generated LMN

## API Endpoints

### Health Check
```
GET /api/health
```
Returns: `{ "status": "ok" }`

### Generate LMN
```
POST /api/generate-lmn
```

Request body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "age": "32",
  "sex": "Male",
  "hsaProvider": "HealthEquity",
  "state": "CA",
  "diagnosedConditions": ["Anxiety", "Chronic Pain"],
  "familyHistory": ["Diabetes"],
  "riskFactors": ["Stress"],
  "preventiveTargets": "I want to reduce stress and improve my overall wellness",
  "attestation": true,
  "desiredProduct": "pilates"
}
```

Response:
```json
{
  "success": true,
  "lmn": "{ generated LMN content }",
  "userInfo": {
    "email": "john@example.com",
    "name": "John Doe",
    "sex": "Male",
    "familyHistory": ["Diabetes"]
  }
}
```

## Form Features

### Step 1: Personal Information
- First Name (required)
- Last Name (required)
- Email (required)

### Step 2: Demographics & HSA
- Age (required, 1-120)
- Sex assigned at birth (required, dropdown)
- HSA Provider (required, dropdown with 12 providers)
- State (required, dropdown with all 50 US states + DC)

### Step 3: Health Information
- Diagnosed conditions (checkboxes, 11 options)
- Family history (checkboxes, 11 options)
- Risk factors (checkboxes, 11 options)
- Preventive targets (text area)

### Step 4: Attestation
- HSA/FSA eligibility attestation (required checkbox)
- Professional disclaimer about accuracy

## Data Transformation

The form data is transformed before sending to the LMN generator:

```javascript
// Form data format
{
  firstName: "John",
  lastName: "Doe",
  age: "32",
  state: "CA",
  diagnosedConditions: ["Anxiety"],
  preventiveTargets: "I want to reduce stress"
}

// Transformed to LMN generator format
{
  name: "John Doe",
  age: 32,
  hsa_provider: "HealthEquity",
  state: "CA",
  diagnosed_conditions: ["Anxiety"],
  risk_factors: [],
  preventive_targets: ["I want to reduce stress"],
  desired_product: "pilates"
}
```

## How It Works

1. **User submits form** - The LMNForm.jsx component collects all user data across 4 steps
2. **Frontend validation** - Each step validates required fields before allowing user to proceed
3. **API call** - On final submit, form data is sent to `POST /api/generate-lmn`
4. **Backend transformation** - API transforms form data to match LMN generator schema
5. **AI generation** - LMN generator uses Claude AI agent with:
   - Medical documentation search (via Pinecone)
   - ICD-10 code lookup
   - Professional clinical writing
   - PMID citation lookup
6. **Response** - Generated LMN is returned to frontend
7. **Success** - User sees confirmation message

## Troubleshooting

### API Server won't start
- Check that all environment variables are set in `.env`
- Make sure port 3001 is not already in use
- Run `npm install` to ensure all dependencies are installed

### "Cannot find module 'express'" error
- Run `npm install` to install all dependencies
- The linter errors will disappear after installation

### LMN generation fails
- Check that `ANTHROPIC_API_KEY` is valid
- Ensure you have credits in your Anthropic account
- Check the server console for detailed error messages

### Medical search not working
- Verify `PINECONE_API_KEY` and `PINECONE_INDEX` are correct
- Make sure you've ingested the medical documentation
- Check Pinecone dashboard to verify index exists

### CORS errors
- Ensure the API server is running on port 3001
- Check that CORS is enabled in `server/api.ts`
- Frontend should be on http://localhost:5173

## Next Steps

### Email Integration
Currently, the LMN is only logged to console. To send it via email:

1. Add email service (SendGrid, Mailgun, etc.)
2. Update `server/api.ts` to send email after generation:

```typescript
// After generating LMN
await sendEmail({
  to: email,
  subject: 'Your Letter of Medical Necessity',
  html: formatLMNEmail(lmnResult, userName)
});
```

### PDF Generation
To generate a PDF version of the LMN:

1. Add PDF library (`npm install pdfkit`)
2. Create PDF template in `server/utils/pdf-generator.ts`
3. Attach PDF to email

### Database Storage
To save LMNs for later retrieval:

1. Create a `lmn_requests` table in Supabase
2. Save form data and generated LMN
3. Allow users to view/download past LMNs

## Files Modified/Created

### New Files:
- `server/api.ts` - Express API server for LMN generation
- `LMN_SETUP.md` - This setup guide

### Modified Files:
- `src/pages/LMNForm.jsx` - Added state dropdown, attestation step, API integration
- `package.json` - Added dependencies and `server` script
- `README.md` - Updated with LMN feature documentation

### Existing Server Files (unchanged):
- `server/lmn-generator.ts` - Claude AI agent for LMN generation
- `server/tools/search-tool.ts` - Pinecone medical documentation search
- `server/scripts/ingest_docs.ts` - Script to ingest ICD-10 codes
- `server/support_docs/icd10-codes.json` - ICD-10 medical codes

## Support

For issues or questions:
1. Check the console logs (browser and server)
2. Verify all environment variables are set correctly
3. Ensure both servers are running
4. Review the API response in Network tab

---

**Built with ❤️ using Claude AI, LangChain, and Express**


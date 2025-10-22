import express from 'express';
import cors from 'cors';
import { generateLMN } from './lmn-generator.js';
import { generateLMNPDFBuffer } from './utils/pdfGenerator.js';
import { createSignatureRequest } from './utils/signwellService.js';
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
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
      desiredProduct
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

    // Transform form data to match LMN generator schema
    const lmnInput = {
      name: `${firstName} ${lastName}`,
      age: parseInt(age),
      hsa_provider: hsaProvider,
      state: state,
      diagnosed_conditions: diagnosedConditions || [],
      risk_factors: riskFactors || [],
      preventive_targets: preventiveTargets ? [preventiveTargets] : [],
      desired_product: desiredProduct || ''
    };

    console.log('Generating LMN for:', lmnInput);

    // Generate the LMN
    // const lmnResult = await generateLMN(JSON.stringify(lmnInput));
    const lmnResult = `Now I'll draft a Letter of Medical Necessity for you based on your diagnosed conditions and desired product. Since you mentioned '1' as the desired product, I'll assume this refers to a gym membership or fitness program, which is a common HSA-eligible expense that can help with anxiety and depression.

\`\`\`json
{
  "treatment": "The patient, Irena Gao, a 30-year-old female with diagnosed Anxiety (F41.9) and Depression (F32.9), is being prescribed a structured physical exercise program through a gym membership. The recommended regimen includes 30 minutes of moderate-intensity aerobic exercise at least 3-4 times per week, complemented by 2 sessions of resistance training. This exercise protocol is designed to increase endorphin production, reduce cortisol levels, and improve overall mood regulation. The program should be maintained consistently as part of the management plan for 12 months, with periodic reassessment of symptom improvement.",
  
  "clinical_rationale": "Regular physical exercise has been clinically demonstrated to reduce symptoms of anxiety and depression through multiple physiological and psychological mechanisms. Research indicates that structured exercise programs can be as effective as pharmacotherapy for mild to moderate depression and anxiety disorders (Blumenthal et al., 2007; PMID: 17846259). A meta-analysis of randomized controlled trials found that exercise interventions produced moderate to large effects in reducing anxiety symptoms (Stubbs et al., 2017; PMID: 28319557). The patient's specific presentation of anxiety (F41.9) and depression (F32.9) is likely to respond positively to regular physical activity, which has been shown to increase serotonin and norepinephrine levels while reducing inflammatory markers associated with mood disorders.",
  
  "role_in_health": "The prescribed gym membership will provide the patient with access to necessary equipment and environment to perform the recommended exercise protocol. Regular physical activity will serve as a complementary non-pharmacological intervention to address the patient's anxiety and depression symptoms. Exercise has been shown to improve sleep quality, reduce rumination, enhance self-efficacy, and provide positive social interactions, all of which are beneficial for patients with mood and anxiety disorders. This intervention aligns with current clinical guidelines that recommend physical activity as a first-line treatment component for mild to moderate mental health conditions.",
  
  "conclusion": "Based on the patient's clinical presentation of Anxiety (F41.9) and Depression (F32.9), and the substantial body of evidence supporting exercise as an effective intervention for these conditions, I am recommending a gym membership as medically necessary as part of the patient's comprehensive treatment plan."
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
      desiredProduct: desiredProduct || 'Wellness service/product'
    });
    console.log('PDF generated successfully', pdfBase64);
    
    // Save PDF to file
    const pdfFileName = `LMN_hi_${firstName}_${lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
    const pdfFilePath = join(__dirname, '../generated_lmns', pdfFileName);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    writeFileSync(pdfFilePath, pdfBuffer);
    console.log(`PDF saved to: ${pdfFilePath}`);
    return;

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
app.listen(PORT, () => {
  console.log(`LMN API server running on http://localhost:${PORT}`);
});


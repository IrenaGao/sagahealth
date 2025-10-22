import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface LMNContent {
  treatment?: string;
  clinical_rationale?: string;
  role_in_health?: string;
  role_that_the_service_plays?: string;
  conclusion?: string;
  icd_codes?: string[];
  condition?: string[];
}

interface UserInfo {
  name: string;
  email: string;
  hsaProvider: string;
  desiredProduct?: string;
}

export async function generateLMNPDFBuffer(lmnData: string, userInfo: UserInfo): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
    // Parse the LMN result if it's a string
    let lmnContent: LMNContent;
    if (typeof lmnData === 'string') {
      // Extract JSON from the response
      const jsonMatch = lmnData.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          lmnContent = JSON.parse(jsonMatch[0]);
          
          // Validate that we have at least some content
          if (!lmnContent.treatment && !lmnContent.conclusion) {
            throw new Error('LMN content is empty or invalid');
          }
        } catch (parseError) {
          console.error('Failed to parse JSON from LMN result:', parseError);
          throw new Error('Could not parse LMN data. Please ensure all required form fields are filled out correctly.');
        }
      } else {
        // No JSON found - Claude might be asking for more info
        console.error('No JSON found in LMN result. Raw result:', lmnData.substring(0, 200));
        throw new Error('LMN generation incomplete. Please ensure you have selected at least one diagnosed condition and filled out all required fields.');
      }
    } else {
      lmnContent = lmnData as any;
    }

      // Create PDF document with exact Letter size
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 50,
          bottom: 50,
          left: 72,
          right: 72
        }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const base64String = pdfBuffer.toString('base64');
        resolve(base64String);
      });
      doc.on('error', reject);

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const leftMargin = 72;
      const pageWidth = 612 - 144; // Letter width minus margins

      // ========== PAGE 1: HEADER & INTRODUCTION ==========
      
      // Header
      doc.fontSize(12)
         .font('Times-Bold')
         .fillColor('#000000')
         .text('LETTER OF MEDICAL NECESSITY', leftMargin, 50, { 
           width: pageWidth, 
           align: 'center' 
         });

      doc.moveDown(2);
      doc.fontSize(11).font('Times-Roman');

      // Date (right-aligned)
      doc.text(currentDate, leftMargin, doc.y, { width: pageWidth, align: 'right' });
      doc.moveDown(1.5);

      // To/From Fields
      doc.text('To: HSA/FSA Administrator', leftMargin, doc.y);
      doc.moveDown(0.5);
      doc.text('From: Medical Provider', leftMargin, doc.y);
      doc.moveDown(1);

      // Patient Information Box
      doc.font('Times-Bold').text(`Subject: Letter of Medical Necessity for ${userInfo.name}`, leftMargin, doc.y);
      doc.moveDown(1.5);

      // Reported Diagnosis
      doc.font('Times-Bold').fontSize(11);
      doc.text('Reported Diagnosis:', leftMargin, doc.y);
      doc.moveDown(0.3);
      
      doc.font('Times-Roman');
      // Diagnoses
      if (lmnContent.condition && lmnContent.condition.length > 0) {
        doc.text(lmnContent.condition.join(', '), leftMargin + 20, doc.y);
      }
      
      // ICD-10 codes
      if (lmnContent.icd_codes && lmnContent.icd_codes.length > 0) {
        doc.text(`ICD-10 Code(s): ${lmnContent.icd_codes.join(', ')}`, leftMargin + 20, doc.y);
      }

      doc.moveDown(1.5);

      // ========== SECTION 1: TREATMENT ==========
      doc.font('Times-Bold').fontSize(11);
      doc.text('1. TREATMENT RECOMMENDATION', leftMargin, doc.y);
      doc.moveDown(0.5);

      if (lmnContent.treatment) {
        doc.font('Times-Roman').fontSize(11);
        doc.text(lmnContent.treatment, leftMargin, doc.y, {
          width: pageWidth,
          align: 'left',
          lineGap: 2
        });
      }

      doc.moveDown(1.5);

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // ========== SECTION 2: CLINICAL RATIONALE ==========
      doc.font('Times-Bold').fontSize(11);
      doc.text('2. CLINICAL RATIONALE', leftMargin, doc.y);
      doc.moveDown(0.5);

      if (lmnContent.clinical_rationale) {
        doc.font('Times-Roman').fontSize(11);
        doc.text(lmnContent.clinical_rationale, leftMargin, doc.y, {
          width: pageWidth,
          align: 'left',
          lineGap: 2
        });
      }

      doc.moveDown(1.5);

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // ========== SECTION 3: ROLE IN HEALTH ==========
      const roleContent = lmnContent.role_in_health || lmnContent.role_that_the_service_plays;
      if (roleContent) {
        doc.font('Times-Bold').fontSize(11);
        doc.text('3. ROLE IN PATIENT HEALTH MANAGEMENT', leftMargin, doc.y);
        doc.moveDown(0.5);

        doc.font('Times-Roman').fontSize(11);
        doc.text(roleContent, leftMargin, doc.y, {
          width: pageWidth,
          align: 'left',
          lineGap: 2
        });

        doc.moveDown(1.5);
      }

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // ========== SECTION 4: CONCLUSION ==========
      if (lmnContent.conclusion) {
        doc.font('Times-Bold').fontSize(11);
        doc.text('4. CONCLUSION', leftMargin, doc.y);
        doc.moveDown(0.5);

        doc.font('Times-Roman').fontSize(11);
        doc.text(lmnContent.conclusion, leftMargin, doc.y, {
          width: pageWidth,
          align: 'left',
          lineGap: 2
        });

        doc.moveDown(1.5);
      }

      // Products and/or services recommended
      doc.font('Times-Bold').fontSize(11);
      doc.text('Products and/or services recommended:', leftMargin, doc.y);
      doc.moveDown(0.3);
      
      doc.font('Times-Roman').fontSize(11);
      const recommendedService = userInfo.desiredProduct || 'Wellness service/product';
      doc.text(recommendedService, leftMargin + 20, doc.y);
      
      doc.moveDown(1.5);

      // Check if we need a new page for signature
      if (doc.y > 600) {
        doc.addPage();
      }

      // ========== CLOSING & SIGNATURE ==========
      doc.moveDown(1);
      doc.font('Times-Roman').fontSize(11);
      doc.text('Sincerely,', leftMargin, doc.y);
      doc.moveDown(3);

      // Signature line
      doc.moveTo(leftMargin, doc.y)
         .lineTo(leftMargin + 200, doc.y)
         .stroke();
      doc.moveDown(0.3);

      doc.font('Times-Bold').fontSize(11);
      doc.text('Medical Provider', leftMargin, doc.y);
      
      doc.font('Times-Roman').fontSize(10);
      doc.text('Saga Health', leftMargin, doc.y);
      doc.text(`Date: ${currentDate}`, leftMargin, doc.y);

      // ========== FOOTER ON ALL PAGES ==========
      const range = doc.bufferedPageRange();
      const pageCount = range.count;
      
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(range.start + i);
        
        // Page number
        doc.fontSize(9)
           .font('Times-Roman')
           .fillColor('#000000')
           .text(
             `Page ${i + 1} of ${pageCount}`,
             leftMargin,
             doc.page.height - 40,
             { width: pageWidth, align: 'center' }
           );

        // Footer text
        doc.fontSize(8)
           .font('Times-Italic')
           .fillColor('#666666')
           .text(
             'This letter documents medical necessity for HSA/FSA reimbursement purposes.',
             leftMargin,
             doc.page.height - 30,
             { width: pageWidth, align: 'center' }
           );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


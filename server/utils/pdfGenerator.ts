import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { fillHealthEquityForm } from './healthEquityFormHelper.js';
import { fillOptumForm } from './optumFormHelper.js';

interface LMNContent {
  treatment?: string;
  clinical_rationale?: string;
  role_the_service_provides?: string;
  conclusion?: string;
  reported_diagnosis?: string;
  icd_codes?: string[];
}

interface UserInfo {
  name: string;
  email: string;
  hsaProvider: string;
  diagnosedConditions?: string[];
  desiredProduct?: string;
  businessName?: string;
}

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to get HSA form path based on provider
function getHSAFormPath(hsaProvider: string): string | null {
  const formMap: { [key: string]: string } = {
    'HealthEquity': 'HealthEquity.pdf',
    'HSA Bank': 'HSA_Bank.pdf',
    'Optum Bank': 'Optum_Bank.pdf',
    'WEX': 'WEX.pdf'
  };
  
  const formName = formMap[hsaProvider];
  if (!formName) return null;
  
  return join(__dirname, '../hsa_forms', formName);
}

export async function generateLMNPDFBuffer(lmnData: string, userInfo: UserInfo): Promise<string> {
  return new Promise(async (resolve, reject) => {
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

    // Check if we need to prepend an HSA form
    const hsaFormPath = getHSAFormPath(userInfo.hsaProvider);
    let hsaFormBuffer: Buffer | null = null;
    
    if (hsaFormPath) {
      try {
        hsaFormBuffer = readFileSync(hsaFormPath);
        console.log(`Prepending HSA form for ${userInfo.hsaProvider}: ${hsaFormPath}`);
      } catch (error) {
        console.warn(`Could not load HSA form for ${userInfo.hsaProvider}:`, error);
      }
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
      doc.on('end', async () => {
        const lmnBuffer = Buffer.concat(chunks);
        
        // If we have an HSA form, combine it with the LMN
        if (hsaFormBuffer) {
          try {
            // Create a new PDF document to merge the forms
            const mergedPdf = await PDFLibDocument.create();
            
            // Load the HSA form PDF
            const hsaPdf = await PDFLibDocument.load(hsaFormBuffer);
            
            // If it's HealthEquity, fill the form with patient data
            if (userInfo.hsaProvider === 'HealthEquity') {
              // Use diagnosed conditions from userInfo
              const diagnosedConditions = userInfo.diagnosedConditions || [];
              console.log('Filling HealthEquity form with conditions:', diagnosedConditions);
              const filledHsaPdf = await fillHealthEquityForm(hsaPdf, diagnosedConditions);
              const hsaPages = await mergedPdf.copyPages(filledHsaPdf, filledHsaPdf.getPageIndices());
              hsaPages.forEach((page) => mergedPdf.addPage(page));
              console.log('Successfully filled and added HealthEquity form to merged PDF');
            } else if (userInfo.hsaProvider === 'Optum Bank') {
              // Fill Optum form with text annotations
              console.log('Filling Optum form with text annotations');
              const filledHsaPdf = await fillOptumForm(hsaPdf);
              const hsaPages = await mergedPdf.copyPages(filledHsaPdf, filledHsaPdf.getPageIndices());
              hsaPages.forEach((page) => mergedPdf.addPage(page));
              console.log('Successfully filled and added Optum form to merged PDF');
            } else {
              // For other providers, just copy the pages without filling
              const hsaPages = await mergedPdf.copyPages(hsaPdf, hsaPdf.getPageIndices());
              hsaPages.forEach((page) => mergedPdf.addPage(page));
            }
            
            // Load the LMN PDF
            const lmnPdf = await PDFLibDocument.load(lmnBuffer);
            const lmnPages = await mergedPdf.copyPages(lmnPdf, lmnPdf.getPageIndices());
            lmnPages.forEach((page) => mergedPdf.addPage(page));
            
            // Save the merged PDF
            const mergedPdfBytes = await mergedPdf.save();

            // Enforce a maximum of 3 pages on the final PDF
            try {
              const mergedLoaded = await PDFLibDocument.load(mergedPdfBytes);
              const limitedPdf = await PDFLibDocument.create();
              const pageIndices = mergedLoaded.getPageIndices().slice(0, 3);
              const limitedPages = await limitedPdf.copyPages(mergedLoaded, pageIndices);
              limitedPages.forEach((p) => limitedPdf.addPage(p));
              const limitedBytes = await limitedPdf.save();
              resolve(Buffer.from(limitedBytes).toString('base64'));
            } catch (limitErr) {
              console.warn('Failed to limit merged PDF to 3 pages, returning original merged PDF:', limitErr);
              resolve(Buffer.from(mergedPdfBytes).toString('base64'));
            }
            
            console.log(`Successfully merged HSA form for ${userInfo.hsaProvider} with LMN`);
          } catch (error) {
            console.error('Error combining PDFs:', error);
            // Fall back to LMN only, limited to 3 pages
            try {
              const lmnLoaded = await PDFLibDocument.load(lmnBuffer);
              const limitedPdf = await PDFLibDocument.create();
              const pageIndices = lmnLoaded.getPageIndices().slice(0, 3);
              const limitedPages = await limitedPdf.copyPages(lmnLoaded, pageIndices);
              limitedPages.forEach((p) => limitedPdf.addPage(p));
              const limitedBytes = await limitedPdf.save();
              resolve(Buffer.from(limitedBytes).toString('base64'));
            } catch (limitErr) {
              console.warn('Failed to limit LMN-only PDF to 3 pages after merge error:', limitErr);
              resolve(lmnBuffer.toString('base64'));
            }
          }
        } else {
          // No HSA form: enforce a maximum of 3 pages on LMN PDF
          try {
            const lmnLoaded = await PDFLibDocument.load(lmnBuffer);
            const limitedPdf = await PDFLibDocument.create();
            const pageIndices = lmnLoaded.getPageIndices().slice(0, 3);
            const limitedPages = await limitedPdf.copyPages(lmnLoaded, pageIndices);
            limitedPages.forEach((p) => limitedPdf.addPage(p));
            const limitedBytes = await limitedPdf.save();
            resolve(Buffer.from(limitedBytes).toString('base64'));
          } catch (limitErr) {
            console.warn('Failed to limit LMN PDF to 3 pages, returning original:', limitErr);
            resolve(lmnBuffer.toString('base64'));
          }
        }
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
      doc.text('From: Derek Yan, MD', leftMargin, doc.y);
      doc.moveDown(1);

      // Patient Information Box
      doc.font('Times-Bold').text(`Subject: Letter of Medical Necessity for ${userInfo.name}`, leftMargin, doc.y);
      doc.moveDown(1.5);

      // ========== SECTION 1: REPORTED DIAGNOSIS ==========
      doc.font('Times-Bold').fontSize(11);
      doc.text('1. REPORTED DIAGNOSIS', leftMargin, doc.y);
      doc.moveDown(0.5);
      
      doc.font('Times-Roman').fontSize(11);
      
      // Build diagnosis text - use reported_diagnosis from LLM
      let diagnosisText = '';
      if (lmnContent.reported_diagnosis) {
        diagnosisText = lmnContent.reported_diagnosis;
        if (lmnContent.icd_codes && lmnContent.icd_codes.length > 0) {
          diagnosisText += ` (ICD-10 Code(s): ${lmnContent.icd_codes.join(', ')})`;
        }
      } else if (lmnContent.icd_codes && lmnContent.icd_codes.length > 0) {
        diagnosisText = `ICD-10 Code(s): ${lmnContent.icd_codes.join(', ')}`;
      }
      
      if (diagnosisText) {
        doc.text(diagnosisText, leftMargin, doc.y, {
          width: pageWidth,
          align: 'left',
          lineGap: 2
        });
      }

      doc.moveDown(1.5);

      // ========== SECTION 2: TREATMENT ==========
      doc.font('Times-Bold').fontSize(11);
      doc.text('2. TREATMENT RECOMMENDATION', leftMargin, doc.y);
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

      // ========== SECTION 3: CLINICAL RATIONALE ==========
      doc.font('Times-Bold').fontSize(11);
      doc.text('3. CLINICAL RATIONALE', leftMargin, doc.y);
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

      // ========== SECTION 4: ROLE THE SERVICE PROVIDES ==========
      if (lmnContent.role_the_service_provides) {
        doc.font('Times-Bold').fontSize(11);
        doc.text('4. ROLE THE SERVICE PROVIDES', leftMargin, doc.y);
        doc.moveDown(0.5);

        doc.font('Times-Roman').fontSize(11);
        doc.text(lmnContent.role_the_service_provides, leftMargin, doc.y, {
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

      // ========== SECTION 5: CONCLUSION ==========
      if (lmnContent.conclusion) {
        doc.font('Times-Bold').fontSize(11);
        doc.text('5. CONCLUSION', leftMargin, doc.y);
        doc.moveDown(0.5);

        doc.font('Times-Roman').fontSize(11);
        doc.text(lmnContent.conclusion, leftMargin, doc.y, {
          width: pageWidth,
          align: 'left',
          lineGap: 2
        });

        doc.moveDown(1.5);
      }

      // ========== SECTION 6: PRODUCTS AND/OR SERVICES RECOMMENDED ==========
      doc.font('Times-Bold').fontSize(11);
      doc.text('6. PRODUCTS AND/OR SERVICES RECOMMENDED', leftMargin, doc.y);
      doc.moveDown(0.5);
      
      doc.font('Times-Roman').fontSize(11);
      const recommendedService = userInfo.desiredProduct || 'Wellness service/product';
      const businessNameText = userInfo.businessName ? ` from ${userInfo.businessName}` : '';
      const fullRecommendation = `${recommendedService}${businessNameText}`;
      doc.text(fullRecommendation, leftMargin, doc.y, {
        width: pageWidth,
        align: 'left',
        lineGap: 2
      });
      
      doc.moveDown(1.5);

      // ========== INTERVENTION DATES ==========
      // Calculate start date (today) and end date (one year from today)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      // Format dates as "Month Day, Year"
      const formatDate = (date: Date) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      };
      
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);
      
      // Display dates: start date on left, end date right-aligned on same line
      const dateY = doc.y;
      
      // Start date (left side)
      doc.font('Times-Bold').fontSize(11);
      const startLabelWidth = doc.widthOfString('Intervention Start Date:');
      doc.text('Intervention Start Date:', leftMargin, dateY, { continued: false });
      
      doc.font('Times-Roman').fontSize(11);
      doc.text(` ${startDateStr}`, leftMargin + startLabelWidth, dateY, { continued: false });
      
      // Calculate width for right-aligned end date
      doc.font('Times-Bold').fontSize(11);
      const endDateLabel = 'Intervention End Date:';
      const endLabelWidth = doc.widthOfString(endDateLabel);
      
      doc.font('Times-Roman').fontSize(11);
      const endDateValue = ` ${endDateStr}`;
      const endValueWidth = doc.widthOfString(endDateValue);
      
      const totalEndWidth = endLabelWidth + endValueWidth;
      const endDateX = leftMargin + pageWidth - totalEndWidth;
      
      // End date (right side)
      doc.font('Times-Bold').fontSize(11);
      doc.text(endDateLabel, endDateX, dateY, { continued: false });
      
      doc.font('Times-Roman').fontSize(11);
      doc.text(endDateValue, endDateX + endLabelWidth, dateY, { continued: false });
      
      doc.moveDown(4);

      // ========== PROVIDER INFORMATION ==========
      doc.font('Times-Bold').fontSize(11);
      doc.text('PROVIDER INFORMATION', leftMargin, doc.y);
      doc.moveDown(1);

      doc.font('Times-Roman').fontSize(11);
      
      // Calculate column positions
      const col1X = leftMargin;
      const col2X = leftMargin + pageWidth / 2 + 20;
      const lineOffset = 2; // Space between text and line
      
      // Row 1: Provider Name and Provider Address
      const row1Y = doc.y;
      const providerNameLabel = 'Provider Name:';
      const providerNameLabelWidth = doc.widthOfString(providerNameLabel);
      doc.text(providerNameLabel, col1X, row1Y);
      doc.moveTo(col1X + providerNameLabelWidth + lineOffset, row1Y + 10)
         .lineTo(col2X - 20, row1Y + 10)
         .stroke();
      // Add white placeholder text
      doc.fillColor('#FFFFFF').text('{{text}}', col1X + providerNameLabelWidth + lineOffset + 5, row1Y);
      doc.fillColor('#000000'); // Reset to black
      
      const providerAddressLabel = 'Provider Address:';
      const providerAddressLabelWidth = doc.widthOfString(providerAddressLabel);
      doc.text(providerAddressLabel, col2X, row1Y);
      doc.moveTo(col2X + providerAddressLabelWidth + lineOffset, row1Y + 10)
         .lineTo(leftMargin + pageWidth, row1Y + 10)
         .stroke();
      // Add white placeholder text
      doc.fillColor('#FFFFFF').text('{{text}}', col2X + providerAddressLabelWidth + lineOffset + 5, row1Y);
      doc.fillColor('#000000'); // Reset to black
      doc.moveDown(1.5);
      
      // Row 2: Provider Phone Number and Provider Email
      const row2Y = doc.y;
      const providerPhoneLabel = 'Provider Phone Number:';
      const providerPhoneLabelWidth = doc.widthOfString(providerPhoneLabel);
      doc.text(providerPhoneLabel, col1X, row2Y);
      doc.moveTo(col1X + providerPhoneLabelWidth + lineOffset, row2Y + 10)
         .lineTo(col2X - 20, row2Y + 10)
         .stroke();
      // Add white placeholder text
      doc.fillColor('#FFFFFF').text('{{text}}', col1X + providerPhoneLabelWidth + lineOffset + 5, row2Y);
      doc.fillColor('#000000'); // Reset to black
      
      const providerEmailLabel = 'Provider Email:';
      const providerEmailLabelWidth = doc.widthOfString(providerEmailLabel);
      doc.text(providerEmailLabel, col2X, row2Y);
      doc.moveTo(col2X + providerEmailLabelWidth + lineOffset, row2Y + 10)
         .lineTo(leftMargin + pageWidth, row2Y + 10)
         .stroke();
      // Add white placeholder text
      doc.fillColor('#FFFFFF').text('{{text}}', col2X + providerEmailLabelWidth + lineOffset + 5, row2Y);
      doc.fillColor('#000000'); // Reset to black
      doc.moveDown(1.5);
      
      // Row 3: Provider License and License State
      const row3Y = doc.y;
      const providerLicenseLabel = 'Provider License:';
      const providerLicenseLabelWidth = doc.widthOfString(providerLicenseLabel);
      doc.text(providerLicenseLabel, col1X, row3Y);
      doc.moveTo(col1X + providerLicenseLabelWidth + lineOffset, row3Y + 10)
         .lineTo(col2X - 20, row3Y + 10)
         .stroke();
      // Add white placeholder text
      doc.fillColor('#FFFFFF').text('{{text}}', col1X + providerLicenseLabelWidth + lineOffset + 5, row3Y);
      doc.fillColor('#000000'); // Reset to black
      
      const licenseStateLabel = 'License State:';
      const licenseStateLabelWidth = doc.widthOfString(licenseStateLabel);
      doc.text(licenseStateLabel, col2X, row3Y);
      doc.moveTo(col2X + licenseStateLabelWidth + lineOffset, row3Y + 10)
         .lineTo(leftMargin + pageWidth, row3Y + 10)
         .stroke();
      // Add white placeholder text
      doc.fillColor('#FFFFFF').text('{{text}}', col2X + licenseStateLabelWidth + lineOffset + 5, row3Y);
      doc.fillColor('#000000'); // Reset to black
      doc.moveDown(2);

      // ========== CLOSING & SIGNATURE ==========
      doc.moveDown(1);
      doc.font('Times-Roman').fontSize(11);
      doc.text('Sincerely,', leftMargin, doc.y);
      doc.moveDown(3);

      // Signature line
      const signatureLineY = doc.y;
      doc.moveTo(leftMargin, signatureLineY)
         .lineTo(leftMargin + 200, signatureLineY)
         .stroke();
      // Add white placeholder text for signature
      doc.fillColor('#FFFFFF').fontSize(11).text('{{signature}}', leftMargin + 5, signatureLineY - 8);
      doc.fillColor('#000000'); // Reset to black
      doc.moveDown(0.3);

      doc.font('Times-Roman').fontSize(10);
      doc.text(currentDate, leftMargin, doc.y);

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


import { jsPDF } from 'jspdf';

/**
 * Generate and download a Letter of Medical Necessity PDF
 * @param {Object} lmnData - The LMN data from the API
 * @param {Object} userInfo - User information (name, email, etc.)
 */
export function generateLMNPDF(lmnData, userInfo) {
  try {
    // Parse the LMN result if it's a string
    let lmnContent;
    if (typeof lmnData === 'string') {
      // Extract JSON from the response (it might have explanatory text before the JSON)
      const jsonMatch = lmnData.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lmnContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse LMN data');
      }
    } else {
      lmnContent = lmnData;
    }

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // Page settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25.4; // 1 inch margins
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text with wrapping
    const addText = (text, fontSize = 11, isBold = false, lineHeight = 5.5, align = 'left') => {
      doc.setFontSize(fontSize);
      doc.setFont('times', isBold ? 'bold' : 'normal');
      doc.setTextColor(0, 0, 0);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      
      // Check if we need a new page
      if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        
        // Add header to new page
        addPageHeader(doc, pageWidth, margin);
        yPosition = margin + 15;
      }
      
      if (align === 'center') {
        lines.forEach(line => {
          const textWidth = doc.getTextWidth(line);
          doc.text(line, (pageWidth - textWidth) / 2, yPosition);
          yPosition += lineHeight;
        });
      } else {
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight;
      }
    };

    const addPageHeader = (doc, pageWidth, margin) => {
      // Simple header
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('SAGA HEALTH', pageWidth / 2, margin - 10, { align: 'center' });
    };

    // Date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // LETTERHEAD - Page 1
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('SAGA HEALTH', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('Medical Services Division', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date - right aligned
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text(currentDate, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 12;

    // To line
    addText('To Whom It May Concern:', 11, false, 6);
    yPosition += 6;

    // Re: line
    doc.setFont('times', 'bold');
    doc.text('Re: Letter of Medical Necessity', margin, yPosition);
    yPosition += 6;

    doc.setFont('times', 'normal');
    doc.text(`     Patient: ${userInfo.name}`, margin, yPosition);
    yPosition += 6;

    // ICD codes if available
    if (lmnContent.icd_codes && lmnContent.icd_codes.length > 0) {
      doc.text(`     ICD-10 Code(s): ${lmnContent.icd_codes.join(', ')}`, margin, yPosition);
      yPosition += 6;
    }
    
    if (lmnContent.condition && lmnContent.condition.length > 0) {
      doc.text(`     Diagnosis: ${lmnContent.condition.join(', ')}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 6;

    // Main body - Introduction paragraph
    const introText = `I am writing to document the medical necessity of the requested product/service for the above-named patient. This letter outlines the clinical justification for this recommendation based on the patient's diagnosed medical condition(s) and treatment needs.`;
    addText(introText, 11, false, 5.5);
    yPosition += 3;

    // Treatment Section
    if (lmnContent.treatment) {
      doc.setFont('times', 'bold');
      doc.text('Treatment Plan:', margin, yPosition);
      yPosition += 6;
      
      doc.setFont('times', 'normal');
      const treatmentLines = doc.splitTextToSize(lmnContent.treatment, contentWidth);
      doc.text(treatmentLines, margin, yPosition);
      yPosition += treatmentLines.length * 5.5;
      yPosition += 4;
    }

    // Clinical Rationale Section
    if (lmnContent.clinical_rationale) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        addPageHeader(doc, pageWidth, margin);
        yPosition = margin + 15;
      }
      
      doc.setFont('times', 'bold');
      doc.text('Clinical Rationale:', margin, yPosition);
      yPosition += 6;
      
      doc.setFont('times', 'normal');
      const rationaleLines = doc.splitTextToSize(lmnContent.clinical_rationale, contentWidth);
      doc.text(rationaleLines, margin, yPosition);
      yPosition += rationaleLines.length * 5.5;
      yPosition += 4;
    }

    // Role in Health Section - check for both possible field names
    const roleContent = lmnContent.role_in_health || lmnContent.role_that_the_service_plays;
    if (roleContent) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        addPageHeader(doc, pageWidth, margin);
        yPosition = margin + 15;
      }
      
      doc.setFont('times', 'bold');
      doc.text('Role in Patient Health:', margin, yPosition);
      yPosition += 6;
      
      doc.setFont('times', 'normal');
      const roleLines = doc.splitTextToSize(roleContent, contentWidth);
      doc.text(roleLines, margin, yPosition);
      yPosition += roleLines.length * 5.5;
      yPosition += 4;
    }

    // Conclusion Section
    if (lmnContent.conclusion) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        addPageHeader(doc, pageWidth, margin);
        yPosition = margin + 15;
      }
      
      doc.setFont('times', 'bold');
      doc.text('Conclusion:', margin, yPosition);
      yPosition += 6;
      
      doc.setFont('times', 'normal');
      const conclusionLines = doc.splitTextToSize(lmnContent.conclusion, contentWidth);
      doc.text(conclusionLines, margin, yPosition);
      yPosition += conclusionLines.length * 5.5;
      yPosition += 8;
    }

    // Closing
    if (yPosition + 40 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      addPageHeader(doc, pageWidth, margin);
      yPosition = margin + 15;
    }

    doc.setFont('times', 'normal');
    doc.text('Sincerely,', margin, yPosition);
    yPosition += 20;
    
    doc.setFont('times', 'bold');
    doc.text('___________________________________', margin, yPosition);
    yPosition += 6;
    doc.text('Medical Provider', margin, yPosition);
    yPosition += 5;
    doc.setFont('times', 'normal');
    doc.text('Saga Health Medical Services', margin, yPosition);
    yPosition += 5;
    doc.text(`Date: ${currentDate}`, margin, yPosition);

    // Footer disclaimer on all pages
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.setTextColor(80, 80, 80);
      const footerText = 'This letter is intended for insurance and HSA/FSA reimbursement purposes only.';
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    // Generate filename
    const filename = `LMN_${userInfo.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Download the PDF
    doc.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}


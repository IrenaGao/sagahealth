import { PDFDocument as PDFLibDocument, rgb } from 'pdf-lib';

export async function fillHealthEquityForm(pdfDoc: PDFLibDocument, diagnosedConditions: string[]): Promise<PDFLibDocument> {
  try {
    console.log('fillHealthEquityForm called with conditions:', diagnosedConditions);
    // Get the first page (HealthEquity form)
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      console.warn('No pages found in HealthEquity form');
      return pdfDoc;
    }
    console.log(`HealthEquity form has ${pages.length} pages`);
    
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    console.log(`HealthEquity form dimensions: ${width}x${height}`);
    
    // Try to find form fields in the PDF
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log(`Found ${fields.length} form fields in HealthEquity PDF`);
    
    // Log field information for debugging
    fields.forEach((field, index) => {
      console.log(`Field ${index}: ${field.getName()} - Type: ${field.constructor.name}`);
    });
    
    // Calculate today's date and one year from now
    const today = new Date();
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };
    
    const todayFormatted = formatDate(today);
    const endDateFormatted = formatDate(oneYearFromNow);
    
    // Format diagnosed conditions
    const conditionsText = diagnosedConditions.length > 0 
      ? diagnosedConditions.join(', ')
      : 'Medical condition as specified in attached documentation';
    
    // Try to fill form fields directly if they exist
    if (fields.length > 0) {
      console.log('Attempting to fill form fields directly...');
      try {
        // Look for specific field names and fill them
        const fieldNames = fields.map(field => field.getName().toLowerCase());
        console.log('Available field names:', fieldNames);
        
        // Try to find and fill specific fields
        fields.forEach(field => {
          const fieldName = field.getName().toLowerCase();
          console.log(`Processing field: ${fieldName}`);
          
          if (fieldName.includes('medical') || fieldName.includes('condition')) {
            console.log('Filling medical condition field');
            // field.setText(conditionsText); // Uncomment if field supports setText
          } else if (fieldName.includes('treatment') || fieldName.includes('recommended')) {
            console.log('Filling treatment field');
            // field.setText('See following pages for treatments and products');
          } else if (fieldName.includes('start') || fieldName.includes('begin')) {
            console.log('Filling start date field');
            // field.setText(todayFormatted);
          } else if (fieldName.includes('end') || fieldName.includes('expire')) {
            console.log('Filling end date field');
            // field.setText(endDateFormatted);
          }
        });
      } catch (error) {
        console.log('Could not fill form fields directly, falling back to text drawing:', error);
      }
    }
    
    // Add text to the form fields with precise coordinates based on the HealthEquity form layout
    // Medical Condition field - positioned under the "Medical Condition" label (moved further up)
    firstPage.drawText(conditionsText, {
      x: 45, // Medical Condition field (left-aligned with other fields)
      y: height - 350, // Moved further up from 375 to 360
      size: 10,
      color: rgb(0, 0, 0)
    });
    
    // Describe recommended treatment field - positioned under "Describe recommended treatment" label (moved further down)
    firstPage.drawText('See following pages for treatments and products', {
      x: 45, // Describe recommended treatment field
      y: height - 385, // Moved further down from 340 to 355
      size: 10,
      color: rgb(0, 0, 0)
    });
    
    // Start date field - positioned to the right of "Start date" label (moved way down)
    firstPage.drawText(todayFormatted, {
      x: 85, // Start date field (to the right of "Start date" label)
      y: height - 430, // Moved way down from 225 to 150
      size: 10,
      color: rgb(0, 0, 0)
    });
    
    // End date field - positioned to the right of "End date" label (moved way down)
    firstPage.drawText(endDateFormatted, {
      x: 255, // End date field (to the right of "End date" label)
      y: height - 430, // Moved way down from 225 to 150 (same line as start date)
      size: 10,
      color: rgb(0, 0, 0)
    });
    
    // Add white placeholder text for signature fields (invisible)
    firstPage.drawText('{{text}}', {
      x: 45, // Print Name of Licensed Practitioner
      y: height - 530, // Positioned under "Print Name of Licensed Practitioner" label
      size: 15,
      color: rgb(1, 1, 1) // White color to make it invisible
    });
    
    firstPage.drawText('{{signature}}', {
      x: 45, // Signature of Licensed Practitioner
      y: height - 560, // Positioned under "Signature of Licensed Practitioner" label
      size: 20,
      color: rgb(1, 1, 1) // White color to make it invisible
    });
    
    firstPage.drawText(todayFormatted, {
      x: 45, // Date field for signature
      y: height - 590, // Positioned under "Date" label
      size: 10,
      color: rgb(0, 0, 0)
    });
    
    console.log('Successfully filled HealthEquity form with patient data');
    return pdfDoc;
    
  } catch (error) {
    console.error('Error filling HealthEquity form:', error);
    return pdfDoc;
  }
}

import { PDFDocument as PDFLibDocument, rgb } from 'pdf-lib';

export async function fillHSABankForm(pdfDoc: PDFLibDocument): Promise<PDFLibDocument> {
  try {
    console.log('fillHSABankForm called');
    // Get the first page (HSA Bank form)
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      console.warn('No pages found in HSA Bank form');
      return pdfDoc;
    }
    console.log(`HSA Bank form has ${pages.length} pages`);
    
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    console.log(`HSA Bank form dimensions: ${width}x${height}`);
    
    // Add text tags at specified coordinates
    // Text tag at x=44, y=height-484
    firstPage.drawText('{{text}}', {
      x: 44,
      y: height - 535,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=43, y=height-506
    firstPage.drawText('{{text}}', {
      x: 43,
      y: height - 560,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=347, y=height-484
    firstPage.drawText('{{text}}', {
      x: 360,
      y: height - 535,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=347, y=height-506
    firstPage.drawText('{{text}}', {
      x: 360,
      y: height - 560,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text annotation at x=361, y=height-602
    firstPage.drawText('See following pages for treatments', {
      x: 340,
      y: height - 610,
      size: 8,
      color: rgb(0, 0, 0) // Black color for visible text
    });
    
    // Text annotation at x=330, y=height-623
    firstPage.drawText('See following pages for medical diagnosis', {
      x: 327,
      y: height - 630,
      size: 8,
      color: rgb(0, 0, 0) // Black color for visible text
    });
    
    console.log('Successfully filled HSA Bank form with text tags');
    return pdfDoc;
    
  } catch (error) {
    console.error('Error filling HSA Bank form:', error);
    return pdfDoc;
  }
}


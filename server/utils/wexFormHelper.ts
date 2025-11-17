import { PDFDocument as PDFLibDocument, rgb } from 'pdf-lib';

export async function fillWEXForm(pdfDoc: PDFLibDocument): Promise<PDFLibDocument> {
  try {
    console.log('fillWEXForm called');
    // Get the first page (WEX form)
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      console.warn('No pages found in WEX form');
      return pdfDoc;
    }
    console.log(`WEX form has ${pages.length} pages`);
    
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    console.log(`WEX form dimensions: ${width}x${height}`);
    
    // Add text tags at specified coordinates
    // Text tag at x=43, y=height-443
    firstPage.drawText('{{text}}', {
      x: 43,
      y: height - 430,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=403, y=height-443
    firstPage.drawText('{{text}}', {
      x: 410,
      y: height - 430,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=43, y=height-421
    firstPage.drawText('{{text}}', {
      x: 43,
      y: height - 465,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=43, y=height-400
    firstPage.drawText('{{text}}', {
      x: 43,
      y: height - 495,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=260, y=height-400
    firstPage.drawText('{{text}}', {
      x: 318,
      y: height - 495,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=347, y=height-400
    firstPage.drawText('{{text}}', {
      x: 460,
      y: height - 495,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text tag at x=403, y=height-400
    firstPage.drawText('{{text}}', {
      x: 510,
      y: height - 495,
      size: 12,
      color: rgb(1, 1, 1) // White color for text tags (invisible placeholder)
    });
    
    // Text annotation at x=36, y=height-214.7
    firstPage.drawText('See following pages for treatment.', {
      x: 43,
      y: height - 572,
      size: 10,
      color: rgb(0, 0, 0) // Black color for visible text
    });
    
    // Text annotation at x=36, y=height-248
    firstPage.drawText('See following pages for medical diagnosis.', {
      x: 43,
      y: height - 610,
      size: 10,
      color: rgb(0, 0, 0) // Black color for visible text
    });
    
    console.log('Successfully filled WEX form with text tags');
    return pdfDoc;
    
  } catch (error) {
    console.error('Error filling WEX form:', error);
    return pdfDoc;
  }
}


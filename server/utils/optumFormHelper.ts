import { PDFDocument as PDFLibDocument, rgb } from 'pdf-lib';

export async function fillOptumForm(pdfDoc: PDFLibDocument): Promise<PDFLibDocument> {
  try {
    console.log('fillOptumForm called');
    // Get the first page (Optum form)
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      console.warn('No pages found in Optum form');
      return pdfDoc;
    }
    console.log(`Optum form has ${pages.length} pages`);
    
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    console.log(`Optum form dimensions: ${width}x${height}`);
    
    // Add text to the first page at specified coordinates
    // "See following pages for medical conditions" at x=279, y=382
    firstPage.drawText('See following pages for conditions and treatments.', {
      x: 27,
      y: height - 400, // PDF coordinates are from bottom-left, so subtract from height
      size: 9,
      color: rgb(0, 0, 0)
    });
    
    // "See following pages for required treatments" at x=27, y=344
    firstPage.drawText('See following pages for info.', {
      x: 27,
      y: height - 448, // PDF coordinates are from bottom-left, so subtract from height
      size: 9,
      color: rgb(0, 0, 0)
    });

    firstPage.drawText('{{signature}}', {
      x: 27, // Signature
      y: height - 510,
      size: 20,
      color: rgb(1, 1, 1)
    });

    firstPage.drawText('{{text}}', {
      x: 27, // Name
      y: height - 550,
      size: 20,
      color: rgb(1, 1, 1)
    });

    firstPage.drawText('{{text}}', {
      x: 295, // Date
      y: height - 510,
      size: 20,
      color: rgb(1, 1, 1)
    });

    firstPage.drawText('{{text}}', {
      x: 295, // License #
      y: height - 550,
      size: 20,
      color: rgb(1, 1, 1)
    });

    firstPage.drawText('{{text}}', {
      x: 440, // Telephone #
      y: height - 550, // Positioned under "Print Name of Licensed Practitioner" label
      size: 20,
      color: rgb(1, 1, 1)
    });
    
    console.log('Successfully filled Optum form with text annotations');
    return pdfDoc;
    
  } catch (error) {
    console.error('Error filling Optum form:', error);
    return pdfDoc;
  }
}


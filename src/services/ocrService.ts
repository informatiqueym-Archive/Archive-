import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function performOCR(file: File): Promise<string> {
  const worker = await createWorker('fra+eng'); // Support French and English

  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Only scan the first 3 pages for performance
    const numPages = Math.min(pdf.numPages, 3);
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        const { data: { text } } = await worker.recognize(canvas);
        fullText += `--- Page ${i} ---\n${text}\n\n`;
      }
    }
    
    await worker.terminate();
    return fullText || "Aucun texte extrait des premières pages.";
  } else {
    // For images, scan the whole thing
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
  }
}

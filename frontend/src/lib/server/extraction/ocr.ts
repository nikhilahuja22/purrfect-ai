import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker, type Worker } from 'tesseract.js';

export type OcrLine = {
  text: string;
  // Box in pixels of the rendered page image. Origin is the top left corner.
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  confidence: number;
};

export type OcrPage = {
  pageNumber: number;
  lines: OcrLine[];
};

// PDF pages are 72 points per inch. Tesseract reads best at about 300 DPI.
const RENDER_SCALE = 300 / 72;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/tiff']);

let worker: Promise<Worker> | null = null;

// Created once and reused. Creating a worker loads the English language data, which is slow.
function getWorker(): Promise<Worker> {
  if (worker) return worker;
  const pending = createWorker('eng').catch((err: unknown) => {
    worker = null;
    throw err;
  });
  worker = pending;
  return pending;
}

// Returns one entry per page, with each text line and its box.
export async function ocrDocument(bytes: Uint8Array, contentType: string): Promise<OcrPage[]> {
  const images = await toImages(bytes, contentType);
  const ocr = await getWorker();

  const pages: OcrPage[] = [];
  for (const [index, image] of images.entries()) {
    const { data } = await ocr.recognize(image, {}, { blocks: true });
    const lines = (data.blocks ?? [])
      .flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines))
      .map((line) => ({
        text: line.text.trim(),
        x0: line.bbox.x0,
        y0: line.bbox.y0,
        x1: line.bbox.x1,
        y1: line.bbox.y1,
        confidence: line.confidence
      }))
      .filter((line) => line.text !== '');
    pages.push({ pageNumber: index + 1, lines });
  }
  return pages;
}

async function toImages(bytes: Uint8Array, contentType: string): Promise<Buffer[]> {
  if (contentType === 'application/pdf') return renderPdfPages(bytes);
  if (IMAGE_TYPES.has(contentType)) return [Buffer.from(bytes)];
  throw new Error(`OCR does not support ${contentType}.`);
}

// Tesseract cannot open PDFs, so each page is drawn to a PNG first.
// Untested in Node: check that pdf.js draws onto the @napi-rs/canvas context.
async function renderPdfPages(bytes: Uint8Array): Promise<Buffer[]> {
  const task = getDocument({ data: bytes, useSystemFonts: true });
  try {
    const pdf = await task.promise;
    const images: Buffer[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({
        canvas: null,
        canvasContext: canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
        viewport
      }).promise;
      images.push(canvas.toBuffer('image/png'));
      page.cleanup();
    }
    return images;
  } finally {
    await task.destroy();
  }
}

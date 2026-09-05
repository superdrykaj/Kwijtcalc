"use client";

import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { analysePageText, reconstructPageText } from "./extract-text";
import type { PdfPageText, PdfTextItem } from "./types";

/**
 * De enige plek waar de pdf-bibliotheek wordt aangeroepen.
 *
 * De bibliotheek en haar worker worden lokaal meegeleverd met de applicatie:
 * `new URL(...)` laat de bundelaar het workerbestand meenemen en vanaf onze
 * eigen server serveren. Er wordt niets van een CDN gehaald en het gekozen
 * bestand wordt nergens naartoe gestuurd; het blijft in het geheugen van de
 * browser.
 *
 * Bewust de legacy-build: de gewone build gebruikt zeer recente
 * JavaScript-methoden die op werkplekken met een oudere browser ontbreken,
 * waardoor het renderen van miniaturen daar zou mislukken.
 */

let workerConfigured = false;

function configureWorker(): void {
  if (workerConfigured) return;
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  workerConfigured = true;
}

/** Een geopend document. Sluit het af met `destroy()` zodra het niet meer nodig is. */
export interface LoadedPdf {
  readonly pageCount: number;
  /** Leest de tekstlaag van één pagina uit. */
  readPage(pageNumber: number): Promise<PdfPageText>;
  /** Rendert een kleine miniatuur als data-URL. */
  renderThumbnail(pageNumber: number, maxWidth: number): Promise<string>;
  destroy(): Promise<void>;
}

interface TextContentItem {
  str?: string;
  width?: number;
  height?: number;
  hasEOL?: boolean;
  transform?: number[];
}

function toTextItems(items: readonly unknown[]): PdfTextItem[] {
  const result: PdfTextItem[] = [];
  for (const raw of items) {
    const item = raw as TextContentItem;
    if (typeof item.str !== "string") continue;
    const transform = item.transform ?? [];
    result.push({
      text: item.str,
      x: transform[4] ?? 0,
      y: transform[5] ?? 0,
      width: item.width ?? 0,
      height: item.height ?? Math.abs(transform[3] ?? 10),
      hasEOL: item.hasEOL === true,
    });
  }
  return result;
}

async function renderPageToDataUrl(
  page: PDFPageProxy,
  maxWidth: number,
): Promise<string> {
  const unscaled = page.getViewport({ scale: 1 });
  // Miniaturen bewust op lage resolutie: een document van honderd pagina's mag
  // de browser niet laten vastlopen.
  const scale = Math.min(maxWidth / unscaled.width, 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Kan geen tekenvlak maken voor de miniatuur.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}

/**
 * Opent een pdf vanuit het geheugen. Het bestand wordt als bytes doorgegeven;
 * er is geen url, geen upload en geen netwerkverkeer bij betrokken.
 */
export async function loadPdf(file: File): Promise<LoadedPdf> {
  configureWorker();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({
    data,
    // Geen externe bronnen ophalen; alleen wat in het bestand zelf zit.
    useSystemFonts: true,
    disableAutoFetch: true,
  });
  const document: PDFDocumentProxy = await loadingTask.promise;

  return {
    pageCount: document.numPages,
    async readPage(pageNumber: number) {
      const page = await document.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        const text = reconstructPageText(toTextItems(content.items));
        return analysePageText(pageNumber, text);
      } finally {
        page.cleanup();
      }
    },
    async renderThumbnail(pageNumber: number, maxWidth: number) {
      const page = await document.getPage(pageNumber);
      try {
        return await renderPageToDataUrl(page, maxWidth);
      } finally {
        page.cleanup();
      }
    },
    async destroy() {
      await loadingTask.destroy();
    },
  };
}

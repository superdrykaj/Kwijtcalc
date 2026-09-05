import type { PdfPageText } from "./types";

/**
 * Zet de geselecteerde pagina's om naar één tekst met paginamarkeringen.
 *
 * De markering blijft zichtbaar in de tekst ("[Pagina 3]"). Dat is bewust: de
 * medewerker mag de tekst nog bewerken, en een markering die in de tekst zelf
 * staat blijft dan bruikbaar om een passage naar de bronpagina te herleiden.
 * Losse posities zouden na de eerste bewerking niet meer kloppen.
 */

const MARKER_PATTERN = /^\[Pagina (\d+)\]$/;

export function pageMarker(pageNumber: number): string {
  return `[Pagina ${pageNumber}]`;
}

/** Het tekstbereik dat bij één bronpagina hoort. */
export interface PageRange {
  readonly pageNumber: number;
  /** Positie van het eerste teken van de paginatekst. */
  readonly start: number;
  /** Positie direct na het laatste teken van de paginatekst. */
  readonly end: number;
}

export interface ComposedText {
  readonly text: string;
  readonly pageRanges: readonly PageRange[];
  /** Geselecteerde pagina's zonder bruikbare tekstlaag. */
  readonly pagesWithoutText: readonly number[];
}

/**
 * Voegt de tekst van de geselecteerde pagina's samen, in paginavolgorde.
 * Pagina's zonder tekstlaag worden overgeslagen en apart teruggegeven, zodat de
 * interface daarvoor een melding over tekstherkenning kan tonen.
 */
export function composeSelectedText(
  pages: readonly PdfPageText[],
  selectedPageNumbers: readonly number[],
): ComposedText {
  const selected = new Set(selectedPageNumbers);
  const ordered = pages
    .filter((page) => selected.has(page.pageNumber))
    .sort((a, b) => a.pageNumber - b.pageNumber);

  const pagesWithoutText = ordered
    .filter((page) => !page.hasTextLayer)
    .map((page) => page.pageNumber);

  const usable = ordered.filter((page) => page.hasTextLayer);

  let text = "";
  const pageRanges: PageRange[] = [];

  usable.forEach((page, index) => {
    if (index > 0) text += "\n\n";
    text += `${pageMarker(page.pageNumber)}\n`;
    const start = text.length;
    text += page.text;
    pageRanges.push({ pageNumber: page.pageNumber, start, end: text.length });
  });

  return { text, pageRanges, pagesWithoutText };
}

/**
 * Leest de paginamarkeringen terug uit een (mogelijk bewerkte) tekst, zodat
 * een passage altijd naar de bronpagina te herleiden blijft.
 */
export function parsePageMarkers(text: string): readonly PageRange[] {
  const ranges: PageRange[] = [];
  const lines = text.split("\n");
  let offset = 0;
  let current: { pageNumber: number; start: number } | null = null;

  for (const line of lines) {
    const match = MARKER_PATTERN.exec(line.trim());
    if (match) {
      if (current) {
        ranges.push({
          pageNumber: current.pageNumber,
          start: current.start,
          end: Math.max(current.start, offset - 1),
        });
      }
      current = {
        pageNumber: Number(match[1]),
        start: offset + line.length + 1,
      };
    }
    offset += line.length + 1;
  }

  if (current) {
    ranges.push({
      pageNumber: current.pageNumber,
      start: current.start,
      end: text.length,
    });
  }

  return ranges;
}

/** Bij welke bronpagina hoort de tekst op deze positie? */
export function pageForOffset(
  ranges: readonly PageRange[],
  offset: number,
): number | null {
  const range = ranges.find((item) => offset >= item.start && offset <= item.end);
  return range?.pageNumber ?? null;
}

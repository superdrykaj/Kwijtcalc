import type { PdfPageText, PdfTextItem } from "./types";

/**
 * Zet losse tekstfragmenten uit een pdf om naar leesbare regels.
 *
 * Een pdf kent geen regels of woorden: het zijn losse stukjes tekst met een
 * positie. Fragmenten op ongeveer dezelfde hoogte horen bij dezelfde regel;
 * een duidelijke horizontale afstand tussen twee fragmenten betekent een
 * spatie. Zonder deze bewerking plakken woorden aan elkaar.
 */

/** Fragmenten binnen deze fractie van de regelhoogte horen bij dezelfde regel. */
const LINE_TOLERANCE_FACTOR = 0.6;

/** Een gat groter dan deze fractie van de regelhoogte geldt als spatie. */
const SPACE_GAP_FACTOR = 0.25;

/**
 * Minimale hoeveelheid tekst voordat we een pagina als "tekstlaag aanwezig"
 * beschouwen. Een gescande pagina levert vaak nog een enkel kopje of
 * paginanummer op; dat is te weinig om mee te werken.
 */
export const MIN_LETTERS_FOR_TEXT_LAYER = 40;
export const MIN_WORDS_FOR_TEXT_LAYER = 8;

interface Line {
  y: number;
  height: number;
  items: PdfTextItem[];
}

function buildLines(items: readonly PdfTextItem[]): Line[] {
  const lines: Line[] = [];

  for (const item of items) {
    if (item.text === "") continue;
    const height = item.height > 0 ? item.height : 10;
    const tolerance = height * LINE_TOLERANCE_FACTOR;
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);
    if (line) {
      line.items.push(item);
      line.height = Math.max(line.height, height);
    } else {
      lines.push({ y: item.y, height, items: [item] });
    }
  }

  // In een pdf loopt y naar boven op; de bovenste regel komt dus eerst.
  lines.sort((a, b) => b.y - a.y);
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
  }
  return lines;
}

function joinLine(line: Line): string {
  let text = "";
  let previousEnd: number | null = null;

  for (const item of line.items) {
    if (previousEnd !== null) {
      const gap = item.x - previousEnd;
      const endsWithSpace = /\s$/.test(text);
      const startsWithSpace = /^\s/.test(item.text);
      if (!endsWithSpace && !startsWithSpace && gap > line.height * SPACE_GAP_FACTOR) {
        text += " ";
      }
    }
    text += item.text;
    previousEnd = item.x + item.width;
  }

  return text.replace(/[ \t]+/g, " ").trim();
}

/** Bouwt de leesbare tekst van één pagina op uit de losse fragmenten. */
export function reconstructPageText(items: readonly PdfTextItem[]): string {
  return buildLines(items)
    .map(joinLine)
    .filter((line) => line !== "")
    .join("\n");
}

export function countLetters(text: string): number {
  return (text.match(/\p{L}/gu) ?? []).length;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /\p{L}/u.test(word)).length;
}

/**
 * Bepaalt of een pagina genoeg tekst heeft om mee te werken. Zo niet, dan is
 * het vermoedelijk een scan en is lokale tekstherkenning nodig.
 */
export function hasUsableTextLayer(text: string): boolean {
  return (
    countLetters(text) >= MIN_LETTERS_FOR_TEXT_LAYER &&
    countWords(text) >= MIN_WORDS_FOR_TEXT_LAYER
  );
}

/** Vat de uitgelezen tekst van één pagina samen. */
export function analysePageText(pageNumber: number, text: string): PdfPageText {
  const trimmed = text.trim();
  return {
    pageNumber,
    text: trimmed,
    letterCount: countLetters(trimmed),
    wordCount: countWords(trimmed),
    hasTextLayer: hasUsableTextLayer(trimmed),
  };
}

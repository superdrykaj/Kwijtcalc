/**
 * Typen voor het lokaal uitlezen van een pdf.
 *
 * Alles in deze map werkt op gewone gegevens: tekstfragmenten met coördinaten,
 * en daaruit afgeleide paginateksten. Er zit geen pdf-bibliotheek en geen
 * browsercode in, zodat de logica volledig te unittesten is.
 */

/** Eén tekstfragment zoals een pdf dat aanlevert, met positie op de pagina. */
export interface PdfTextItem {
  readonly text: string;
  /** Positie van links, in pdf-punten. */
  readonly x: number;
  /** Positie van onder, in pdf-punten. In een pdf loopt y naar boven op. */
  readonly y: number;
  /** Breedte van het fragment in pdf-punten. */
  readonly width: number;
  /** Hoogte van de regel in pdf-punten. */
  readonly height: number;
  /** Geeft de pdf zelf al een regeleinde na dit fragment aan? */
  readonly hasEOL: boolean;
}

/** De uitgelezen tekst van één pagina. */
export interface PdfPageText {
  readonly pageNumber: number;
  readonly text: string;
  /** Aantal letters, dus zonder cijfers, spaties en leestekens. */
  readonly letterCount: number;
  readonly wordCount: number;
  /**
   * Heeft deze pagina een bruikbare tekstlaag? Zo niet, dan is het
   * vermoedelijk een scan en is lokale tekstherkenning nodig.
   */
  readonly hasTextLayer: boolean;
}

/** Een volledig ingelezen document. */
export interface PdfDocumentText {
  readonly fileName: string;
  readonly pageCount: number;
  readonly pages: readonly PdfPageText[];
}

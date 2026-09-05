/**
 * Foutmeldingen bij het inlezen van een pdf, in begrijpelijk Nederlands.
 *
 * De meldingen gaan over wat de medewerker kan doen, niet over de techniek.
 * Elke fout is een gewone melding in het scherm: de rest van de assistent,
 * waaronder het handmatig plakken van tekst, blijft gewoon werken.
 */

export type PdfErrorCode =
  | "geen_bestand"
  | "geen_pdf"
  | "te_groot"
  | "te_veel_paginas"
  | "beveiligd"
  | "beschadigd"
  | "geen_tekst"
  | "geen_selectie"
  | "onbekend";

export interface PdfError {
  readonly code: PdfErrorCode;
  readonly message: string;
}

/** Boven deze grootte weigeren we het bestand; dat wijst op iets anders dan een brief. */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

/** De scanner is bedoeld voor documenten van ongeveer 5 tot 100 pagina's. */
export const MAX_PAGE_COUNT = 150;

const MESSAGES: Record<PdfErrorCode, string> = {
  geen_bestand: "Kies eerst een pdf-bestand.",
  geen_pdf: "Dit lijkt geen pdf-bestand. Kies een bestand dat eindigt op .pdf.",
  te_groot:
    "Dit bestand is groter dan 30 MB. Splits het document of kies alleen het beroepschrift.",
  te_veel_paginas: `Dit document heeft meer dan ${MAX_PAGE_COUNT} pagina's. Splits het document en lees het beroepschrift apart in.`,
  beveiligd:
    "Deze pdf is beveiligd met een wachtwoord. Sla het document zonder beveiliging op en probeer het opnieuw.",
  beschadigd:
    "Deze pdf kan niet worden gelezen en is mogelijk beschadigd. Probeer een nieuwe kopie van het document.",
  geen_tekst:
    "In dit document is geen tekstlaag gevonden. Het gaat waarschijnlijk om een scan; daarvoor is lokale tekstherkenning nodig.",
  geen_selectie: "Selecteer minstens één pagina om de tekst over te nemen.",
  onbekend:
    "Het inlezen van de pdf is niet gelukt. Probeer het opnieuw of plak de tekst handmatig.",
};

export function pdfError(code: PdfErrorCode): PdfError {
  return { code, message: MESSAGES[code] };
}

/** Controleert het gekozen bestand voordat de pdf wordt geopend. */
export function validatePdfFile(
  file: { name: string; size: number; type: string } | null | undefined,
): PdfError | null {
  if (!file) return pdfError("geen_bestand");

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) return pdfError("geen_pdf");

  if (file.size > MAX_FILE_BYTES) return pdfError("te_groot");

  return null;
}

/**
 * Vertaalt een fout van de pdf-bibliotheek naar een melding. De bibliotheek
 * geeft de soort fout door in de naam van de fout.
 */
export function describePdfError(error: unknown): PdfError {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";

  if (name === "PasswordException") return pdfError("beveiligd");
  if (name === "InvalidPDFException") return pdfError("beschadigd");
  if (name === "MissingPDFException") return pdfError("beschadigd");
  return pdfError("onbekend");
}

import { describe, expect, it } from "vitest";
import {
  composeSelectedText,
  pageForOffset,
  pageMarker,
  parsePageMarkers,
} from "../compose-text";
import { analysePageText } from "../extract-text";
import { pdfError, validatePdfFile, describePdfError } from "../errors";
import type { PdfPageText } from "../types";

const BRIEF =
  "Hierbij stel ik beroep in tegen het besluit waarin de kwijtschelding is afgewezen.";
const VERVOLG =
  "Bij de betalingscapaciteit is geen rekening gehouden met mijn woonlasten.";

function page(pageNumber: number, text: string): PdfPageText {
  return analysePageText(pageNumber, text);
}

describe("composeSelectedText", () => {
  const pages = [page(1, "Voorblad zonder inhoud."), page(2, BRIEF), page(3, VERVOLG)];

  it("neemt alleen de geselecteerde pagina's over", () => {
    const composed = composeSelectedText(pages, [2]);
    expect(composed.text).toContain(BRIEF);
    expect(composed.text).not.toContain(VERVOLG);
  });

  it("zet de pagina's in paginavolgorde, ook bij omgekeerde selectie", () => {
    const composed = composeSelectedText(pages, [3, 2]);
    expect(composed.text.indexOf(BRIEF)).toBeLessThan(composed.text.indexOf(VERVOLG));
  });

  it("zet boven elke pagina een markering met het paginanummer", () => {
    const composed = composeSelectedText(pages, [2, 3]);
    expect(composed.text).toContain(pageMarker(2));
    expect(composed.text).toContain(pageMarker(3));
  });

  it("bewaart per pagina het tekstbereik", () => {
    const composed = composeSelectedText(pages, [2, 3]);
    expect(composed.pageRanges.map((range) => range.pageNumber)).toEqual([2, 3]);
    const eerste = composed.pageRanges[0]!;
    expect(composed.text.slice(eerste.start, eerste.end)).toBe(BRIEF);
  });

  it("meldt geselecteerde pagina's zonder tekstlaag apart", () => {
    const metScan = [...pages, page(4, "")];
    const composed = composeSelectedText(metScan, [2, 4]);
    expect(composed.pagesWithoutText).toEqual([4]);
    expect(composed.text).toContain(BRIEF);
  });

  it("geeft een lege tekst bij een selectie zonder bruikbare pagina's", () => {
    const composed = composeSelectedText([page(1, "")], [1]);
    expect(composed.text).toBe("");
    expect(composed.pageRanges).toEqual([]);
    expect(composed.pagesWithoutText).toEqual([1]);
  });

  it("geeft een lege tekst zonder selectie", () => {
    expect(composeSelectedText(pages, []).text).toBe("");
  });
});

describe("paginanummers behouden na bewerken", () => {
  const pages = [page(2, BRIEF), page(3, VERVOLG)];

  it("leest de markeringen terug uit de samengestelde tekst", () => {
    const composed = composeSelectedText(pages, [2, 3]);
    const ranges = parsePageMarkers(composed.text);
    expect(ranges.map((range) => range.pageNumber)).toEqual([2, 3]);
  });

  it("herleidt een passage naar de bronpagina", () => {
    const composed = composeSelectedText(pages, [2, 3]);
    const offset = composed.text.indexOf("woonlasten");
    expect(pageForOffset(parsePageMarkers(composed.text), offset)).toBe(3);
  });

  it("blijft kloppen nadat de medewerker de tekst heeft bewerkt", () => {
    const composed = composeSelectedText(pages, [2, 3]);
    const bewerkt = composed.text.replace(
      BRIEF,
      "Hierbij stel ik beroep in tegen het besluit. Zie ook mijn eerdere brief.",
    );
    const ranges = parsePageMarkers(bewerkt);
    expect(ranges.map((range) => range.pageNumber)).toEqual([2, 3]);
    expect(pageForOffset(ranges, bewerkt.indexOf("eerdere brief"))).toBe(2);
    expect(pageForOffset(ranges, bewerkt.indexOf("woonlasten"))).toBe(3);
  });

  it("geeft null voor een positie buiten elk paginabereik", () => {
    expect(pageForOffset([], 0)).toBeNull();
  });

  it("vindt geen markeringen in tekst die de medewerker zelf heeft geplakt", () => {
    expect(parsePageMarkers("Zelf getypte tekst zonder markering.")).toEqual([]);
  });
});

describe("foutmeldingen", () => {
  it("weigert een ontbrekend bestand", () => {
    expect(validatePdfFile(null)?.code).toBe("geen_bestand");
  });

  it("weigert een bestand dat geen pdf is", () => {
    expect(
      validatePdfFile({ name: "brief.docx", size: 1000, type: "application/msword" })
        ?.code,
    ).toBe("geen_pdf");
  });

  it("herkent een pdf aan de bestandsnaam als het type ontbreekt", () => {
    expect(validatePdfFile({ name: "beroep.pdf", size: 1000, type: "" })).toBeNull();
  });

  it("weigert een onverwacht groot bestand", () => {
    expect(
      validatePdfFile({
        name: "scan.pdf",
        size: 40 * 1024 * 1024,
        type: "application/pdf",
      })?.code,
    ).toBe("te_groot");
  });

  it("vertaalt een beveiligde pdf naar een begrijpelijke melding", () => {
    const error = describePdfError({ name: "PasswordException" });
    expect(error.code).toBe("beveiligd");
    expect(error.message).toContain("wachtwoord");
  });

  it("vertaalt een beschadigde pdf naar een begrijpelijke melding", () => {
    expect(describePdfError({ name: "InvalidPDFException" }).code).toBe("beschadigd");
  });

  it("valt terug op een algemene melding bij een onbekende fout", () => {
    expect(describePdfError(new Error("iets anders")).code).toBe("onbekend");
  });

  it("meldt een lege selectie", () => {
    expect(pdfError("geen_selectie").message).toContain("Selecteer");
  });
});

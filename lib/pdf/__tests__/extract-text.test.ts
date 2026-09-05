import { describe, expect, it } from "vitest";
import {
  analysePageText,
  countLetters,
  countWords,
  hasUsableTextLayer,
  reconstructPageText,
} from "../extract-text";
import type { PdfTextItem } from "../types";

function item(
  text: string,
  x: number,
  y: number,
  width = text.length * 5,
  height = 10,
): PdfTextItem {
  return { text, x, y, width, height, hasEOL: false };
}

describe("reconstructPageText", () => {
  it("zet fragmenten op dezelfde hoogte op één regel", () => {
    const text = reconstructPageText([
      item("Geachte", 72, 700),
      item("heer", 118, 700),
      item("of mevrouw,", 148, 700),
    ]);
    expect(text).toBe("Geachte heer of mevrouw,");
  });

  it("houdt regels in leesvolgorde, van boven naar beneden", () => {
    const text = reconstructPageText([
      item("Tweede regel", 72, 680),
      item("Eerste regel", 72, 700),
      item("Derde regel", 72, 660),
    ]);
    expect(text).toBe("Eerste regel\nTweede regel\nDerde regel");
  });

  it("plakt fragmenten zonder tussenruimte aan elkaar", () => {
    // Een pdf splitst woorden soms midden in een lettergreep op.
    const text = reconstructPageText([
      item("kwijt", 72, 700, 25),
      item("schelding", 97, 700, 45),
    ]);
    expect(text).toBe("kwijtschelding");
  });

  it("voegt een spatie toe bij een duidelijke tussenruimte", () => {
    const text = reconstructPageText([
      item("beroep", 72, 700, 30),
      item("tegen", 110, 700, 25),
    ]);
    expect(text).toBe("beroep tegen");
  });

  it("verdraagt een kleine hoogteafwijking binnen een regel", () => {
    const text = reconstructPageText([
      item("Kenmerk", 72, 700.4),
      item("2026-118", 120, 700),
    ]);
    expect(text).toBe("Kenmerk 2026-118");
  });

  it("negeert lege fragmenten", () => {
    expect(reconstructPageText([item("", 72, 700), item("Tekst", 80, 700)])).toBe(
      "Tekst",
    );
  });

  it("geeft een lege tekst terug zonder fragmenten", () => {
    expect(reconstructPageText([])).toBe("");
  });
});

describe("tekstlaag herkennen", () => {
  it("herkent een pagina met een gewone brieftekst", () => {
    const brief =
      "Geachte heer of mevrouw, hierbij stel ik beroep in tegen uw besluit " +
      "van 3 maart 2026 waarin de kwijtschelding is afgewezen.";
    expect(hasUsableTextLayer(brief)).toBe(true);
  });

  it("beschouwt een pagina zonder tekst als scan", () => {
    expect(hasUsableTextLayer("")).toBe(false);
  });

  it("beschouwt een enkel kopje of paginanummer als te weinig", () => {
    expect(hasUsableTextLayer("Bijlage 2")).toBe(false);
    expect(hasUsableTextLayer("- 4 -")).toBe(false);
  });

  it("telt letters en woorden zonder cijfers en leestekens", () => {
    expect(countLetters("Aanslag 2026, € 412,10")).toBe(7);
    expect(countWords("Aanslag 2026, € 412,10")).toBe(1);
  });
});

describe("analysePageText", () => {
  it("vat een pagina samen en bewaart het paginanummer", () => {
    const page = analysePageText(
      7,
      "  Hierbij stel ik beroep in tegen het besluit over de kwijtschelding.  ",
    );
    expect(page.pageNumber).toBe(7);
    expect(page.text.startsWith("Hierbij")).toBe(true);
    expect(page.text.endsWith(".")).toBe(true);
    expect(page.hasTextLayer).toBe(true);
    expect(page.wordCount).toBe(11);
  });

  it("markeert een lege pagina als pagina zonder tekstlaag", () => {
    const page = analysePageText(2, "   ");
    expect(page.text).toBe("");
    expect(page.letterCount).toBe(0);
    expect(page.hasTextLayer).toBe(false);
  });
});

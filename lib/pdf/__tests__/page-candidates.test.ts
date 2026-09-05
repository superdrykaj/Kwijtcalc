import { describe, expect, it } from "vitest";
import { analysePageText } from "../extract-text";
import { analyseCandidates, describeCandidate, scorePage } from "../page-candidates";
import type { PdfPageText } from "../types";

const BEROEPSBRIEF = [
  "Geachte heer of mevrouw,",
  "Hierbij stel ik beroep in tegen uw besluit van 3 maart 2026, kenmerk 2026-00418,",
  "waarin het verzoek om kwijtschelding van de gemeentelijke belastingen is afgewezen.",
  "Naar mijn mening is het besluit onvoldoende gemotiveerd en is mijn inkomen",
  "ten onrechte te hoog vastgesteld, omdat de reiskostenvergoeding is meegeteld.",
  "Ik verzoek u het besluit te herzien en de kwijtschelding alsnog te verlenen.",
].join("\n");

const VERVOLGPAGINA = [
  "Daarnaast is bij de beoordeling van de betalingscapaciteit geen rekening gehouden",
  "met de woonlasten die ik maandelijks betaal, zoals blijkt uit de bijgevoegde",
  "afschriften. Ook de aanslag over het voorgaande jaar is hierin niet verwerkt.",
  "Ik verzoek u daarom de berekening opnieuw uit te voeren en mij daarover te berichten.",
].join("\n");

const BIJLAGE = [
  "Overzicht bankafschriften",
  "01-02-2026 12,50",
  "03-02-2026 41,20",
  "07-02-2026 9,99",
].join("\n");

function page(pageNumber: number, text: string): PdfPageText {
  return analysePageText(pageNumber, text);
}

describe("scorePage", () => {
  it("geeft een beroepsbrief een duidelijke score met redenen", () => {
    const score = scorePage(page(1, BEROEPSBRIEF), true);
    expect(score.score).toBeGreaterThan(10);
    expect(score.reasons).toContain("Doorlopende brieftekst");
    expect(score.reasons).toContain("Noemt beroep");
    expect(score.reasons).toContain("Eerste pagina");
  });

  it("geeft een pagina zonder tekstlaag geen score", () => {
    const score = scorePage(page(4, ""), false);
    expect(score.score).toBe(0);
    expect(score.reasons).toEqual([]);
  });

  it("geeft een bijlage met losse regels een lage score", () => {
    const bijlage = scorePage(page(3, BIJLAGE), false);
    const brief = scorePage(page(1, BEROEPSBRIEF), false);
    expect(bijlage.score).toBeLessThan(brief.score);
  });

  it("laat de eerste pagina meewegen zonder doorslaggevend te zijn", () => {
    const eerstePaginaBijlage = scorePage(page(1, BIJLAGE), true);
    const laterePaginaBrief = scorePage(page(5, BEROEPSBRIEF), false);
    expect(laterePaginaBrief.score).toBeGreaterThan(eerstePaginaBijlage.score);
  });
});

describe("analyseCandidates", () => {
  it("kiest de beroepspagina uit een document met bijlagen", () => {
    const { selected } = analyseCandidates([
      page(1, "Begeleidend formulier gemeente. Zie bijlage."),
      page(2, BEROEPSBRIEF),
      page(3, BIJLAGE),
    ]);
    expect(selected).toEqual([2]);
  });

  it("neemt een doorlopende vervolgpagina mee", () => {
    const { selected } = analyseCandidates([
      page(1, BEROEPSBRIEF),
      page(2, VERVOLGPAGINA),
      page(3, BIJLAGE),
    ]);
    expect(selected).toEqual([1, 2]);
  });

  it("stopt bij een pagina die een nieuwe brief begint", () => {
    const { selected } = analyseCandidates([
      page(1, BEROEPSBRIEF),
      page(2, `Geachte mevrouw,\n${VERVOLGPAGINA}`),
    ]);
    expect(selected).toEqual([1]);
  });

  it("stelt nooit meer dan drie pagina's voor", () => {
    const { selected } = analyseCandidates([
      page(1, BEROEPSBRIEF),
      page(2, VERVOLGPAGINA),
      page(3, VERVOLGPAGINA),
      page(4, VERVOLGPAGINA),
      page(5, VERVOLGPAGINA),
    ]);
    expect(selected).toHaveLength(3);
    expect(selected).toEqual([1, 2, 3]);
  });

  it("stelt niets voor als geen enkele pagina tekst heeft", () => {
    const analysis = analyseCandidates([page(1, ""), page(2, "  ")]);
    expect(analysis.selected).toEqual([]);
    expect(analysis.scores).toHaveLength(2);
  });

  it("slaat een gescande pagina over bij het doorlopen", () => {
    const { selected } = analyseCandidates([
      page(1, BEROEPSBRIEF),
      page(2, ""),
      page(3, VERVOLGPAGINA),
    ]);
    expect(selected).toEqual([1]);
  });

  it("geeft voor elke pagina een score terug, ook zonder tekst", () => {
    const analysis = analyseCandidates([page(1, BEROEPSBRIEF), page(2, "")]);
    expect(analysis.scores.map((score) => score.pageNumber)).toEqual([1, 2]);
  });
});

describe("describeCandidate", () => {
  it("legt uit waarom de eerste pagina is voorgesteld", () => {
    const analysis = analyseCandidates([page(1, BEROEPSBRIEF), page(2, VERVOLGPAGINA)]);
    const eerste = analysis.scores[0]!;
    expect(describeCandidate(eerste, analysis.selected)).toContain(
      "Doorlopende brieftekst",
    );
  });

  it("benoemt een vervolgpagina als aansluitend", () => {
    const analysis = analyseCandidates([page(1, BEROEPSBRIEF), page(2, VERVOLGPAGINA)]);
    const tweede = analysis.scores[1]!;
    expect(describeCandidate(tweede, analysis.selected)).toContain(
      "Sluit aan op pagina 1",
    );
  });
});

describe("describeCandidate bij niet-voorgestelde pagina's", () => {
  it("noemt een pagina buiten de selectie geen vervolgpagina", () => {
    const analysis = analyseCandidates([
      page(1, "Aanbiedingsformulier gemeente Middelveen. Zie bijlage."),
      page(2, BEROEPSBRIEF),
      page(3, VERVOLGPAGINA),
      page(4, BIJLAGE),
    ]);
    expect(analysis.selected).toEqual([2, 3]);

    const eerste = analysis.scores[0]!;
    const bijlage = analysis.scores[3]!;
    expect(describeCandidate(eerste, analysis.selected)).not.toContain("Sluit aan op");
    expect(describeCandidate(bijlage, analysis.selected)).not.toContain("Sluit aan op");

    const vervolg = analysis.scores[2]!;
    expect(describeCandidate(vervolg, analysis.selected)).toContain("Sluit aan op pagina 2");
  });

  it("geeft een lege omschrijving voor een pagina zonder tekstlaag", () => {
    const analysis = analyseCandidates([page(1, BEROEPSBRIEF), page(2, "")]);
    expect(describeCandidate(analysis.scores[1]!, analysis.selected)).toBe("");
  });
});

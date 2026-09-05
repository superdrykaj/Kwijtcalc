import { describe, expect, it } from "vitest";
import { composeSelectedText } from "@/lib/pdf";
import { analysePageText } from "@/lib/pdf/extract-text";
import { GROUND_DEFINITIONS, getGroundDefinition } from "../grounds";
import { splitSentences, suggestGrounds } from "../suggest";

const BRIEF =
  "Hierbij stel ik beroep in tegen uw besluit van 3 maart 2026. " +
  "Mijn inkomen is te hoog vastgesteld, omdat de reiskostenvergoeding is meegeteld. " +
  "Het besluit is bovendien onvoldoende gemotiveerd.";

const VERVOLG =
  "Bij de betalingscapaciteit is geen rekening gehouden met mijn woonlasten. " +
  "De huur van 620 euro per maand is niet meegenomen.";

describe("splitSentences", () => {
  it("splitst tekst in zinnen met hun positie", () => {
    const sentences = splitSentences("Eerste zin. Tweede zin.");
    expect(sentences.map((sentence) => sentence.text)).toEqual([
      "Eerste zin.",
      "Tweede zin.",
    ]);
    expect(sentences[1]!.start).toBe(12);
  });

  it("slaat paginamarkeringen over", () => {
    const sentences = splitSentences("[Pagina 2]\nHierbij stel ik beroep in.");
    expect(sentences).toHaveLength(1);
    expect(sentences[0]!.text).toBe("Hierbij stel ik beroep in.");
  });
});

describe("suggestGrounds", () => {
  it("geeft niets terug bij lege tekst", () => {
    expect(suggestGrounds("")).toEqual([]);
    expect(suggestGrounds("   ")).toEqual([]);
  });

  it("geeft niets terug bij tekst zonder signaalwoorden", () => {
    expect(suggestGrounds("Bijgaand treft u een kopie van de envelop aan.")).toEqual([]);
  });

  it("herkent het inkomen als mogelijke grond", () => {
    const ids = suggestGrounds(BRIEF).map((ground) => ground.id);
    expect(ids).toContain("inkomen");
  });

  it("herkent meerdere gronden in één brief", () => {
    const ids = suggestGrounds(`${BRIEF}\n${VERVOLG}`).map((ground) => ground.id);
    expect(ids).toContain("inkomen");
    expect(ids).toContain("motivering");
    expect(ids).toContain("woonlasten");
    expect(ids).toContain("betalingscapaciteit");
  });

  it("toont de passage waarop een voorstel berust", () => {
    const inkomen = suggestGrounds(BRIEF).find((ground) => ground.id === "inkomen");
    expect(inkomen?.passages[0]?.text).toContain("reiskostenvergoeding");
    expect(inkomen?.matchedCues).toContain("reiskostenvergoeding");
  });

  it("noemt een signaal sterk bij twee of meer gevonden woorden", () => {
    const inkomen = suggestGrounds(BRIEF).find((ground) => ground.id === "inkomen");
    expect(inkomen?.confidence).toBe("sterk");

    const enkel = suggestGrounds("De hoorzitting is niet gehouden.").find(
      (ground) => ground.id === "horen",
    );
    expect(enkel?.confidence).toBe("mogelijk");
  });

  it("zet sterke signalen bovenaan", () => {
    const grounds = suggestGrounds(`${BRIEF}\n${VERVOLG}`);
    const confidences = grounds.map((ground) => ground.confidence);
    expect(confidences.indexOf("mogelijk")).toBeGreaterThan(-1);
    expect(confidences.lastIndexOf("sterk")).toBeLessThan(
      confidences.indexOf("mogelijk"),
    );
  });

  it("verwijst een passage naar de bronpagina uit de pdf", () => {
    const composed = composeSelectedText(
      [analysePageText(3, BRIEF), analysePageText(4, VERVOLG)],
      [3, 4],
    );
    const grounds = suggestGrounds(composed.text);
    const inkomen = grounds.find((ground) => ground.id === "inkomen");
    const woonlasten = grounds.find((ground) => ground.id === "woonlasten");
    expect(inkomen?.passages[0]?.pageNumber).toBe(3);
    expect(woonlasten?.passages[0]?.pageNumber).toBe(4);
  });

  it("laat de bronpagina leeg bij zelf geplakte tekst", () => {
    const grounds = suggestGrounds("Mijn inkomen is te hoog vastgesteld.");
    expect(grounds[0]?.passages[0]?.pageNumber).toBeNull();
  });

  it("blijft de bronpagina noemen nadat de tekst is bewerkt", () => {
    const composed = composeSelectedText([analysePageText(5, BRIEF)], [5]);
    const bewerkt = composed.text.replace(
      "onvoldoende gemotiveerd",
      "volgens mij onvoldoende gemotiveerd",
    );
    const motivering = suggestGrounds(bewerkt).find(
      (ground) => ground.id === "motivering",
    );
    expect(motivering?.passages[0]?.pageNumber).toBe(5);
  });
});

describe("register van gronden", () => {
  it("heeft unieke sleutels", () => {
    const ids = GROUND_DEFINITIONS.map((ground) => ground.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("geeft elke grond een titel en een uitleg", () => {
    for (const ground of GROUND_DEFINITIONS) {
      expect(ground.title.length).toBeGreaterThan(0);
      expect(ground.explanation.length).toBeGreaterThan(0);
      expect(ground.cues.length).toBeGreaterThan(0);
    }
  });

  it("zoekt een grond op sleutel op", () => {
    expect(getGroundDefinition("woonlasten")?.title).toContain("Woonlasten");
    expect(getGroundDefinition("bestaat-niet")).toBeUndefined();
  });
});

describe("afgebroken regels uit een pdf", () => {
  const AFGEBROKEN = [
    "In de berekening is mijn inkomen naar mijn mening te hoog vastgesteld.",
    "Op mijn loonstrook staat een reiskostenvergoeding van 160,00 euro per",
    "maand. Die vergoeding is geen inkomen, maar een vergoeding voor kosten",
    "die ik daadwerkelijk maak.",
  ].join("\n");

  it("voegt regels die door de kantlijn zijn afgebroken weer samen", () => {
    const sentences = splitSentences(AFGEBROKEN);
    expect(sentences[1]!.text).toBe(
      "Op mijn loonstrook staat een reiskostenvergoeding van 160,00 euro per maand.",
    );
  });

  it("toont een hele zin als passage in plaats van een halve regel", () => {
    const inkomen = suggestGrounds(AFGEBROKEN).find((ground) => ground.id === "inkomen");
    expect(inkomen?.passages.some((passage) => passage.text.endsWith("maand."))).toBe(
      true,
    );
    expect(inkomen?.passages.some((passage) => passage.text.endsWith("per"))).toBe(
      false,
    );
  });

  it("houdt korte regels zoals adresregels los van elkaar", () => {
    const sentences = splitSentences("Kastanjelaan 12\n1234 AB Middelveen\nGeachte heer");
    expect(sentences.map((sentence) => sentence.text)).toEqual([
      "Kastanjelaan 12",
      "1234 AB Middelveen",
      "Geachte heer",
    ]);
  });

  it("houdt de bronpagina kloppend na het samenvoegen van regels", () => {
    const composed = composeSelectedText(
      [analysePageText(2, "Kop van de brief."), analysePageText(3, AFGEBROKEN)],
      [2, 3],
    );
    const inkomen = suggestGrounds(composed.text).find(
      (ground) => ground.id === "inkomen",
    );
    expect(inkomen?.passages.every((passage) => passage.pageNumber === 3)).toBe(true);
  });

  it("laat een paginamarkering niet in een passage terechtkomen", () => {
    const composed = composeSelectedText([analysePageText(4, AFGEBROKEN)], [4]);
    const inkomen = suggestGrounds(composed.text).find(
      (ground) => ground.id === "inkomen",
    );
    expect(inkomen?.passages.some((passage) => passage.text.includes("[Pagina"))).toBe(
      false,
    );
  });
});

import type { PdfPageText } from "./types";

/**
 * Voorselectie van de vermoedelijke beroepspagina's.
 *
 * Een aangeleverde pdf bevat vaak meer dan alleen het beroepschrift: een
 * begeleidende brief, bijlagen, een kopie van het besluit. Deze module wijst
 * één tot drie pagina's aan die er het meest uitzien als de brief zelf. Het is
 * uitdrukkelijk een voorstel: de medewerker kan elke pagina zelf aan- en
 * uitzetten.
 *
 * De score is opgebouwd uit begrijpelijke onderdelen, zodat in de interface te
 * tonen is waarom een pagina is voorgesteld.
 */

/** Woorden die op een beroepschrift wijzen, per gewicht gegroepeerd. */
const TERM_GROUPS: ReadonlyArray<{
  readonly weight: number;
  readonly reason: string;
  readonly terms: readonly string[];
}> = [
  {
    weight: 3,
    reason: "Noemt beroep",
    terms: ["beroepschrift", "beroep", "beroepsgronden", "gronden van het beroep"],
  },
  {
    weight: 2,
    reason: "Gaat over een besluit",
    terms: ["besluit", "beschikking", "afwijzing", "afgewezen", "uitspraak", "bezwaar"],
  },
  {
    weight: 2,
    reason: "Gaat over kwijtschelding",
    terms: [
      "kwijtschelding",
      "kwijtschelden",
      "invordering",
      "aanslag",
      "betalingscapaciteit",
      "gemeentelijke belastingen",
    ],
  },
  {
    weight: 2,
    reason: "Bevat een motivering",
    terms: ["motivering", "motivatie", "gemotiveerd", "ten onrechte", "onjuist"],
  },
  {
    weight: 1,
    reason: "Heeft de vorm van een brief",
    terms: ["geachte", "hoogachtend", "met vriendelijke groet", "kenmerk", "betreft"],
  },
];

/** Een regel met minstens zoveel woorden telt als doorlopende brieftekst. */
const WORDS_PER_PROSE_LINE = 7;

/** Vanaf zoveel doorlopende regels beschouwen we een pagina als brieftekst. */
const MIN_PROSE_LINES = 3;

/** Hoogste bijdrage van doorlopende tekst aan de score. */
const MAX_PROSE_SCORE = 6;

/** De eerste pagina is een aanwijzing, geen doorslaggevende regel. */
const FIRST_PAGE_BONUS = 1.5;

export const MAX_CANDIDATE_PAGES = 3;

export interface PageCandidateScore {
  readonly pageNumber: number;
  readonly score: number;
  /** Korte, toonbare redenen waarom deze pagina opvalt. */
  readonly reasons: readonly string[];
  /** Aantal regels dat op doorlopende brieftekst lijkt. */
  readonly proseLines: number;
}

export interface CandidateAnalysis {
  readonly scores: readonly PageCandidateScore[];
  /** Voorgestelde paginanummers, oplopend. Leeg als geen pagina tekst heeft. */
  readonly selected: readonly number[];
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function countProseLines(text: string): number {
  return text
    .split("\n")
    .filter(
      (line) => line.split(/\s+/).filter((word) => /\p{L}/u.test(word)).length >= WORDS_PER_PROSE_LINE,
    ).length;
}

/** Begint hier een nieuwe brief? Dan is het geen vervolg van de vorige pagina. */
function startsNewLetter(text: string): boolean {
  const opening = normalise(text).slice(0, 200);
  return /(^|\s)(geachte|betreft:|aan de|t\.a\.v\.)/.test(opening);
}

export function scorePage(page: PdfPageText, isFirstPage: boolean): PageCandidateScore {
  if (!page.hasTextLayer) {
    return { pageNumber: page.pageNumber, score: 0, reasons: [], proseLines: 0 };
  }

  const haystack = normalise(page.text);
  const reasons: string[] = [];
  let score = 0;

  for (const group of TERM_GROUPS) {
    const matches = group.terms.filter((term) => haystack.includes(term));
    if (matches.length === 0) continue;
    // Per groep telt hooguit twee treffers mee, zodat één woord dat vaak
    // voorkomt de score niet kan overheersen.
    score += group.weight * Math.min(matches.length, 2);
    reasons.push(group.reason);
  }

  const proseLines = countProseLines(page.text);
  if (proseLines >= MIN_PROSE_LINES) {
    score += Math.min(proseLines * 0.5, MAX_PROSE_SCORE);
    reasons.unshift("Doorlopende brieftekst");
  }

  if (isFirstPage && score > 0) {
    score += FIRST_PAGE_BONUS;
    reasons.push("Eerste pagina");
  }

  return { pageNumber: page.pageNumber, score, reasons, proseLines };
}

/**
 * Wijst de vermoedelijke beroepspagina's aan: de sterkste pagina, aangevuld
 * met de direct daaropvolgende pagina's zolang de brief doorloopt.
 */
export function analyseCandidates(
  pages: readonly PdfPageText[],
  maxPages: number = MAX_CANDIDATE_PAGES,
): CandidateAnalysis {
  const scores = pages.map((page, index) => scorePage(page, index === 0));
  const scoreByPage = new Map(scores.map((score) => [score.pageNumber, score]));

  const best = scores
    .filter((score) => score.score > 0)
    .sort((a, b) => b.score - a.score || a.pageNumber - b.pageNumber)[0];

  if (!best) return { scores, selected: [] };

  const selected = [best.pageNumber];
  const pageByNumber = new Map(pages.map((page) => [page.pageNumber, page]));

  for (let next = best.pageNumber + 1; selected.length < maxPages; next += 1) {
    const page = pageByNumber.get(next);
    const score = scoreByPage.get(next);
    if (!page || !score) break;
    if (!page.hasTextLayer) break;
    if (score.proseLines < MIN_PROSE_LINES) break;
    if (startsNewLetter(page.text)) break;
    selected.push(next);
  }

  return { scores, selected };
}

/** Korte uitleg bij een voorgestelde pagina, voor in de interface. */
export function describeCandidate(
  score: PageCandidateScore,
  selected: readonly number[],
): string {
  const isContinuation =
    selected.includes(score.pageNumber) &&
    selected.length > 1 &&
    score.pageNumber !== selected[0];
  const reasons = isContinuation
    ? [`Sluit aan op pagina ${selected[0]}`, ...score.reasons]
    : [...score.reasons];
  return reasons.slice(0, 3).join(" · ");
}

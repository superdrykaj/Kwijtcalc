import { pageForOffset, parsePageMarkers } from "@/lib/pdf";
import { GROUND_DEFINITIONS, type GroundDefinition } from "./grounds";

/**
 * Herkenning van mogelijke beroepsgronden in een tekst.
 *
 * De assistent zoekt signaalwoorden per zin en houdt bij in welke zin en op
 * welke bronpagina een signaal staat. Er wordt niets beoordeeld: het resultaat
 * is een voorstel dat de medewerker aan- of uitzet.
 *
 * Bewust eenvoudig en uitlegbaar gehouden: elke suggestie is terug te voeren op
 * de woorden die zijn gevonden en op de passage waarin ze staan.
 */

/** Vanaf twee verschillende signaalwoorden noemen we een signaal sterk. */
const STRONG_SIGNAL_CUE_COUNT = 2;

/** Lengte waarop een getoonde passage wordt afgekapt. */
const MAX_PASSAGE_LENGTH = 240;

export type GroundConfidence = "sterk" | "mogelijk";

export interface GroundPassage {
  /** De zin waarin het signaal staat, eventueel afgekapt. */
  readonly text: string;
  /** Bronpagina uit de pdf, of null bij zelf geplakte tekst. */
  readonly pageNumber: number | null;
}

export interface SuggestedGround {
  readonly id: string;
  readonly title: string;
  readonly explanation: string;
  /** De gevonden signaalwoorden, in de volgorde waarin ze voorkomen. */
  readonly matchedCues: readonly string[];
  readonly passages: readonly GroundPassage[];
  readonly confidence: GroundConfidence;
}

interface Sentence {
  readonly text: string;
  readonly start: number;
}

const PAGE_MARKER_LINE = /^\[Pagina \d+\]$/;

/**
 * Vanaf deze lengte gaan we ervan uit dat een regel is afgebroken omdat de
 * kantlijn was bereikt, en niet omdat de zin daar eindigde.
 */
const WRAPPED_LINE_MIN_LENGTH = 45;

/**
 * Maakt van afgebroken regels weer doorlopende zinnen.
 *
 * In een pdf staat een zin vaak over meerdere regels. Zonder deze stap zou een
 * getoonde passage midden in een zin ophouden. Elke vervanging is even lang als
 * wat er stond, zodat posities in de tekst blijven kloppen en een passage naar
 * de juiste bronpagina blijft verwijzen.
 */
function joinWrappedLines(text: string): string {
  const lines = text.split("\n");
  let result = "";

  lines.forEach((line, index) => {
    const isMarker = PAGE_MARKER_LINE.test(line.trim());
    result += isMarker ? " ".repeat(line.length) : line;
    if (index === lines.length - 1) return;

    const current = line.trim();
    const next = lines[index + 1]!.trim();
    const isWrappedLine =
      !isMarker &&
      current.length >= WRAPPED_LINE_MIN_LENGTH &&
      !/[.!?:;]$/.test(current) &&
      next !== "" &&
      !PAGE_MARKER_LINE.test(next);

    result += isWrappedLine ? " " : "\n";
  });

  return result;
}

/**
 * Splitst de tekst in zinnen en onthoudt waar elke zin begint. De posities
 * verwijzen naar de oorspronkelijke tekst, zodat de bronpagina bepaald kan
 * blijven worden.
 */
export function splitSentences(text: string): Sentence[] {
  const flattened = joinWrappedLines(text);
  const sentences: Sentence[] = [];
  const pattern = /[^.!?\n]+[.!?]*/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(flattened)) !== null) {
    const raw = match[0];
    const leading = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();
    if (trimmed === "") continue;
    sentences.push({ text: trimmed, start: match.index + leading });
  }

  return sentences;
}

function shorten(text: string): string {
  if (text.length <= MAX_PASSAGE_LENGTH) return text;
  return `${text.slice(0, MAX_PASSAGE_LENGTH).trimEnd()}…`;
}

function findCues(sentence: string, ground: GroundDefinition): string[] {
  const haystack = sentence.toLowerCase();
  return ground.cues.filter((cue) => haystack.includes(cue));
}

/**
 * Stelt beroepsgronden voor op basis van de bevestigde tekst.
 *
 * Paginamarkeringen in de tekst worden gebruikt om elke passage naar de
 * bronpagina te herleiden; die blijven werken nadat de medewerker de tekst
 * heeft bewerkt.
 */
export function suggestGrounds(text: string): SuggestedGround[] {
  const trimmed = text.trim();
  if (trimmed === "") return [];

  const pageRanges = parsePageMarkers(text);
  const sentences = splitSentences(text);
  const suggestions: SuggestedGround[] = [];

  for (const ground of GROUND_DEFINITIONS) {
    const matchedCues: string[] = [];
    const passages: GroundPassage[] = [];

    for (const sentence of sentences) {
      const cues = findCues(sentence.text, ground);
      if (cues.length === 0) continue;
      for (const cue of cues) {
        if (!matchedCues.includes(cue)) matchedCues.push(cue);
      }
      passages.push({
        text: shorten(sentence.text),
        pageNumber: pageForOffset(pageRanges, sentence.start),
      });
    }

    if (passages.length === 0) continue;

    suggestions.push({
      id: ground.id,
      title: ground.title,
      explanation: ground.explanation,
      matchedCues,
      passages,
      confidence:
        matchedCues.length >= STRONG_SIGNAL_CUE_COUNT ? "sterk" : "mogelijk",
    });
  }

  // Sterke signalen eerst, daarna op aantal gevonden woorden.
  return suggestions.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === "sterk" ? -1 : 1;
    return b.matchedCues.length - a.matchedCues.length;
  });
}

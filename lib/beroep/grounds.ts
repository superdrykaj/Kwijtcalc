/**
 * Register van mogelijke beroepsgronden.
 *
 * De assistent doet uitsluitend een voorstel op basis van herkende woorden in
 * de tekst. Hij beoordeelt niets en trekt geen juridische conclusie: de
 * behandelend medewerker bepaalt welke gronden van toepassing zijn.
 *
 * Een grond toevoegen is één regel in GROUND_DEFINITIONS. De signaalwoorden
 * staan in kleine letters; er wordt hoofdletterongevoelig gezocht.
 */

export interface GroundDefinition {
  /** Stabiele technische sleutel. Nooit wijzigen. */
  readonly id: string;
  /** Naam van de grond zoals de medewerker die ziet. */
  readonly title: string;
  /** Eén zin die uitlegt waar deze grond over gaat. */
  readonly explanation: string;
  /**
   * Signaalwoorden. Eén treffer levert een voorstel op; twee of meer
   * verschillende treffers gelden als een sterker signaal.
   */
  readonly cues: readonly string[];
}

export const GROUND_DEFINITIONS: readonly GroundDefinition[] = [
  {
    id: "inkomen",
    title: "Inkomen onjuist vastgesteld",
    explanation:
      "De brief stelt dat bij het inkomen van een verkeerd bedrag is uitgegaan, bijvoorbeeld doordat een vergoeding is meegeteld.",
    cues: [
      "inkomen",
      "netto loon",
      "nettoloon",
      "salaris",
      "loonstrook",
      "reiskostenvergoeding",
      "onkostenvergoeding",
      "vakantiegeld",
      "uitkering",
    ],
  },
  {
    id: "vermogen",
    title: "Vermogen onjuist beoordeeld",
    explanation:
      "De brief gaat in op het vermogen, bijvoorbeeld een auto, spaargeld of een verzekering die anders zou moeten worden gewaardeerd.",
    cues: [
      "vermogen",
      "spaargeld",
      "spaarrekening",
      "banksaldo",
      "auto",
      "levensverzekering",
      "waarde van",
    ],
  },
  {
    id: "woonlasten",
    title: "Woonlasten niet of onjuist meegenomen",
    explanation:
      "De brief noemt woonlasten die volgens de indiener ontbreken of verkeerd zijn verwerkt.",
    cues: ["woonlast", "huur", "hypotheek", "huurtoeslag", "servicekosten"],
  },
  {
    id: "betalingscapaciteit",
    title: "Betalingscapaciteit onjuist berekend",
    explanation:
      "De brief betwist de berekening van wat iemand kan betalen, of de gehanteerde normbedragen.",
    cues: [
      "betalingscapaciteit",
      "normbedrag",
      "bijstandsnorm",
      "kosten van bestaan",
      "aflossingscapaciteit",
      "kan ik niet betalen",
    ],
  },
  {
    id: "motivering",
    title: "Besluit onvoldoende gemotiveerd",
    explanation:
      "De brief stelt dat uit het besluit niet blijkt waarop de afwijzing is gebaseerd.",
    cues: [
      "niet gemotiveerd",
      "onvoldoende gemotiveerd",
      "motivering",
      "niet onderbouwd",
      "geen uitleg",
      "niet duidelijk waarom",
    ],
  },
  {
    id: "horen",
    title: "Niet gehoord voor het besluit",
    explanation:
      "De brief stelt dat de indiener zijn kant van de zaak niet heeft kunnen toelichten.",
    cues: ["niet gehoord", "hoorzitting", "hoorplicht", "horen", "toelichten"],
  },
  {
    id: "feiten",
    title: "Feiten onjuist of onvolledig",
    explanation:
      "De brief wijst op gegevens die ontbreken of niet kloppen in het dossier.",
    cues: [
      "onjuiste gegevens",
      "verkeerde gegevens",
      "niet meegenomen",
      "over het hoofd gezien",
      "onvolledig",
      "ten onrechte",
    ],
  },
  {
    id: "termijn",
    title: "Termijn of ontvankelijkheid",
    explanation:
      "De brief gaat in op de termijn waarbinnen bezwaar of beroep is ingediend.",
    cues: [
      "termijn",
      "te laat ingediend",
      "verschoonbaar",
      "ontvankelijk",
      "zes weken",
    ],
  },
] as const;

export function getGroundDefinition(id: string): GroundDefinition | undefined {
  return GROUND_DEFINITIONS.find((ground) => ground.id === id);
}

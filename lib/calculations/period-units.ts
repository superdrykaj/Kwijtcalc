/**
 * Periode-eenheden en de omrekenfactoren daartussen.
 *
 * De omrekening gebeurt met exacte breuken (teller/noemer op gehele getallen),
 * zodat er nergens tussentijds wordt afgerond. Zie ook lib/money.ts.
 *
 * Uitgangspunten:
 *  - een jaar telt 52 weken en 12 maanden;
 *  - een maandinkomen = weekinkomen x 52 / 12;
 *  - een 4-wekeninkomen = weekinkomen x 4.
 */

export type PeriodUnit = "week" | "four_weeks" | "month";

export interface PeriodUnitDefinition {
  readonly id: PeriodUnit;
  /** Enkelvoud, bijvoorbeeld "week". */
  readonly singular: string;
  /** Meervoud, bijvoorbeeld "weken". */
  readonly plural: string;
  /** Voorvoegsel voor een automatisch periodelabel, bijvoorbeeld "Week". */
  readonly labelPrefix: string;
  /**
   * Hoeveel van deze perioden gaan er in een jaar? Als exacte breuk, omdat
   * 4-wekenperioden (13 per jaar) en maanden (12 per jaar) anders niet
   * zonder afronding samengaan.
   */
  readonly perYear: { numerator: number; denominator: number };
}

export const PERIOD_UNITS: readonly PeriodUnitDefinition[] = [
  {
    id: "week",
    singular: "week",
    plural: "weken",
    labelPrefix: "Week",
    perYear: { numerator: 52, denominator: 1 },
  },
  {
    id: "four_weeks",
    singular: "4-wekenperiode",
    plural: "4-wekenperioden",
    labelPrefix: "Periode",
    perYear: { numerator: 13, denominator: 1 },
  },
  {
    id: "month",
    singular: "maand",
    plural: "maanden",
    labelPrefix: "Maand",
    perYear: { numerator: 12, denominator: 1 },
  },
] as const;

export function getPeriodUnit(id: PeriodUnit): PeriodUnitDefinition {
  const found = PERIOD_UNITS.find((unit) => unit.id === id);
  if (!found) throw new Error(`Onbekende periode-eenheid: ${id}`);
  return found;
}

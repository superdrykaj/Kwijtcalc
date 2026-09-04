import type { Cents } from "@/lib/money";
import type { PeriodUnit } from "./period-units";

/** Eén ingevoerde inkomstenperiode, na validatie. */
export interface IncomeEntry {
  /** Stabiele sleutel binnen de berekening (alleen voor React en volgorde). */
  readonly id: string;
  /** Vrij label van de periode, bijvoorbeeld "Week 35". */
  readonly label: string;
  /** Netto ontvangen bedrag over deze periode. */
  readonly receivedCents: Cents;
  /** Bedrag dat buiten beschouwing blijft. Nooit hoger dan het ontvangen bedrag. */
  readonly correctionCents: Cents;
  /** Id uit CORRECTION_CATEGORIES, of null als er geen correctie is. */
  readonly correctionCategoryId: string | null;
  /** Vrije toelichting van de medewerker. */
  readonly note: string;
}

/** Invoer voor de rekenengine. */
export interface AverageIncomeInput {
  readonly periodUnit: PeriodUnit;
  readonly entries: readonly IncomeEntry[];
}

/** Eén regel met het doorgerekende resultaat. */
export interface CalculatedEntry extends IncomeEntry {
  /** ontvangen inkomen - correctie */
  readonly countingCents: Cents;
}

/** Een tussenstap, zichtbaar via "Bekijk berekening". */
export interface FormulaStep {
  readonly key: string;
  /** Wat er berekend wordt, bijvoorbeeld "Gemiddeld maandinkomen". */
  readonly label: string;
  /** De formule in woorden, bijvoorbeeld "gemiddeld weekinkomen x 52 / 12". */
  readonly formula: string;
  /** Dezelfde formule met de bedragen van deze berekening ingevuld. */
  readonly substitution: string;
  /** Uitkomst in centen. */
  readonly resultCents: Cents;
}

export interface AverageIncomeResult {
  readonly periodUnit: PeriodUnit;
  readonly entries: readonly CalculatedEntry[];
  /** Aantal meetellende perioden. */
  readonly periodCount: number;
  readonly totalReceivedCents: Cents;
  readonly totalCorrectionCents: Cents;
  readonly totalCountingCents: Cents;
  /** Gemiddelde per ingevoerde periode. */
  readonly averagePerPeriodCents: Cents;
  readonly weekAverageCents: Cents;
  readonly fourWeekAverageCents: Cents;
  readonly monthAverageCents: Cents;
  /** Bijvoorbeeld "Week 35 t/m week 48". Null als er geen labels zijn. */
  readonly rangeLabel: string | null;
  readonly formulaSteps: readonly FormulaStep[];
}

export type AverageIncomeOutcome =
  | { readonly status: "empty" }
  | { readonly status: "ok"; readonly result: AverageIncomeResult };

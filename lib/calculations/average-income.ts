import { formatCents, roundedDivide, type Cents } from "@/lib/money";
import { getPeriodUnit, type PeriodUnit } from "./period-units";
import type {
  AverageIncomeInput,
  AverageIncomeOutcome,
  CalculatedEntry,
  FormulaStep,
  IncomeEntry,
} from "./types";

/**
 * Rekenengine voor gemiddeld inkomen.
 *
 * Pure functies zonder kennis van React, formulieren of opmaak. Alles rekent in
 * hele centen. Afgeleide bedragen worden berekend uit het exacte gemiddelde
 * (totaal / aantal perioden als breuk) en pas aan het eind afgerond op hele
 * centen, zodat er niet twee keer wordt afgerond.
 */

/** Meetellend inkomen van één periode: ontvangen inkomen min correctie. */
export function countingIncome(entry: IncomeEntry): Cents {
  return entry.receivedCents - entry.correctionCents;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Rekent een totaal om naar het gemiddelde per doelperiode.
 *
 * jaarinkomen        = (totaal / aantal perioden) x perioden-per-jaar(invoer)
 * gemiddelde doel    = jaarinkomen / perioden-per-jaar(doel)
 *
 * Beide stappen worden als één breuk uitgerekend, dus zonder tussenafronding.
 */
function averageForUnit(
  totalCountingCents: Cents,
  periodCount: number,
  inputUnit: PeriodUnit,
  targetUnit: PeriodUnit,
): Cents {
  const input = getPeriodUnit(inputUnit).perYear;
  const target = getPeriodUnit(targetUnit).perYear;
  const numerator = totalCountingCents * input.numerator * target.denominator;
  const denominator = periodCount * input.denominator * target.numerator;
  return roundedDivide(numerator, denominator);
}

/** "Week 35 t/m week 48", of het enkele label bij één periode. */
function buildRangeLabel(entries: readonly IncomeEntry[]): string | null {
  const labels = entries.map((entry) => entry.label.trim()).filter(Boolean);
  if (labels.length === 0) return null;
  const first = labels[0]!;
  const last = labels[labels.length - 1]!;
  if (labels.length === 1 || first === last) return first;
  return `${first} t/m ${last.charAt(0).toLowerCase()}${last.slice(1)}`;
}

/** Formules per invoer-eenheid, in de woorden die de medewerker herkent. */
const CONVERSION_FORMULAS: Record<
  PeriodUnit,
  Record<PeriodUnit, { formula: string; substitute: (average: string) => string }>
> = {
  week: {
    week: {
      formula: "gelijk aan het gemiddelde per periode",
      substitute: (average) => average,
    },
    four_weeks: {
      formula: "gemiddeld weekinkomen × 4",
      substitute: (average) => `${average} × 4`,
    },
    month: {
      formula: "gemiddeld weekinkomen × 52 / 12",
      substitute: (average) => `${average} × 52 / 12`,
    },
  },
  four_weeks: {
    week: {
      formula: "gemiddeld 4-wekeninkomen / 4",
      substitute: (average) => `${average} / 4`,
    },
    four_weeks: {
      formula: "gelijk aan het gemiddelde per periode",
      substitute: (average) => average,
    },
    month: {
      formula: "gemiddeld 4-wekeninkomen × 13 / 12",
      substitute: (average) => `${average} × 13 / 12`,
    },
  },
  month: {
    week: {
      formula: "gemiddeld maandinkomen × 12 / 52",
      substitute: (average) => `${average} × 12 / 52`,
    },
    four_weeks: {
      formula: "gemiddeld maandinkomen × 12 / 13",
      substitute: (average) => `${average} × 12 / 13`,
    },
    month: {
      formula: "gelijk aan het gemiddelde per periode",
      substitute: (average) => average,
    },
  },
};

/**
 * Berekent totalen en gemiddelden over de ingevoerde perioden.
 *
 * Verwacht al gevalideerde regels: lege regels zijn eruit gefilterd en een
 * correctie is nooit hoger dan het ontvangen bedrag (zie lib/calculations/schema.ts).
 */
export function calculateAverageIncome(
  input: AverageIncomeInput,
): AverageIncomeOutcome {
  const entries = input.entries;
  if (entries.length === 0) return { status: "empty" };

  const calculated: CalculatedEntry[] = entries.map((entry) => ({
    ...entry,
    countingCents: countingIncome(entry),
  }));

  const periodCount = calculated.length;
  const totalReceivedCents = sum(calculated.map((entry) => entry.receivedCents));
  const totalCorrectionCents = sum(
    calculated.map((entry) => entry.correctionCents),
  );
  const totalCountingCents = sum(calculated.map((entry) => entry.countingCents));

  const averagePerPeriodCents = roundedDivide(totalCountingCents, periodCount);
  const weekAverageCents = averageForUnit(
    totalCountingCents,
    periodCount,
    input.periodUnit,
    "week",
  );
  const fourWeekAverageCents = averageForUnit(
    totalCountingCents,
    periodCount,
    input.periodUnit,
    "four_weeks",
  );
  const monthAverageCents = averageForUnit(
    totalCountingCents,
    periodCount,
    input.periodUnit,
    "month",
  );

  const unit = getPeriodUnit(input.periodUnit);
  const averageText = formatCents(averagePerPeriodCents);
  const conversions = CONVERSION_FORMULAS[input.periodUnit];

  const formulaSteps: FormulaStep[] = [
    {
      key: "total_received",
      label: "Totaal ontvangen inkomen",
      formula: "som van alle ontvangen bedragen",
      substitution: calculated
        .map((entry) => formatCents(entry.receivedCents))
        .join(" + "),
      resultCents: totalReceivedCents,
    },
    {
      key: "total_correction",
      label: "Totaal buiten beschouwing gelaten",
      formula: "som van alle correcties",
      substitution:
        totalCorrectionCents === 0
          ? "geen correcties"
          : calculated
              .filter((entry) => entry.correctionCents > 0)
              .map((entry) => formatCents(entry.correctionCents))
              .join(" + "),
      resultCents: totalCorrectionCents,
    },
    {
      key: "total_counting",
      label: "Totaal meetellend inkomen",
      formula: "totaal ontvangen inkomen − totaal buiten beschouwing gelaten",
      substitution: `${formatCents(totalReceivedCents)} − ${formatCents(totalCorrectionCents)}`,
      resultCents: totalCountingCents,
    },
    {
      key: "average_per_period",
      label: `Gemiddeld inkomen per ${unit.singular}`,
      formula: `totaal meetellend inkomen / aantal ${unit.plural}`,
      substitution: `${formatCents(totalCountingCents)} / ${periodCount}`,
      resultCents: averagePerPeriodCents,
    },
    {
      key: "week_average",
      label: "Gemiddeld weekinkomen",
      formula: conversions.week.formula,
      substitution: conversions.week.substitute(averageText),
      resultCents: weekAverageCents,
    },
    {
      key: "four_week_average",
      label: "Gemiddeld 4-wekeninkomen",
      formula: conversions.four_weeks.formula,
      substitution: conversions.four_weeks.substitute(averageText),
      resultCents: fourWeekAverageCents,
    },
    {
      key: "month_average",
      label: "Gemiddeld maandinkomen",
      formula: conversions.month.formula,
      substitution: conversions.month.substitute(averageText),
      resultCents: monthAverageCents,
    },
  ];

  return {
    status: "ok",
    result: {
      periodUnit: input.periodUnit,
      entries: calculated,
      periodCount,
      totalReceivedCents,
      totalCorrectionCents,
      totalCountingCents,
      averagePerPeriodCents,
      weekAverageCents,
      fourWeekAverageCents,
      monthAverageCents,
      rangeLabel: buildRangeLabel(calculated),
      formulaSteps,
    },
  };
}

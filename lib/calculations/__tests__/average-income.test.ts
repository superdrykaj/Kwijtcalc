import { describe, expect, it } from "vitest";
import { formatCents } from "@/lib/money";

/**
 * Intl zet een non-breaking space tussen euroteken en bedrag. In de tests
 * vergelijken we met een gewone spatie zodat de verwachting leesbaar blijft.
 */
function euro(cents: number): string {
  return formatCents(cents).replace(/\u00a0/g, " ");
}

function plainSpaces(text: string): string {
  return text.replace(/\u00a0/g, " ");
}
import { calculateAverageIncome, countingIncome } from "../average-income";
import type { AverageIncomeResult, IncomeEntry } from "../types";
import type { PeriodUnit } from "../period-units";

interface EntrySpec {
  label?: string;
  received: number;
  correction?: number;
  category?: string;
}

/** Bouwt regels op uit hele euro's/centen zodat de tests leesbaar blijven. */
function entry(spec: EntrySpec, index: number): IncomeEntry {
  return {
    id: `entry-${index}`,
    label: spec.label ?? `Week ${index + 1}`,
    receivedCents: Math.round(spec.received * 100),
    correctionCents: Math.round((spec.correction ?? 0) * 100),
    correctionCategoryId: spec.correction ? (spec.category ?? "reiskostenvergoeding") : null,
    note: "",
  };
}

function calculate(
  specs: EntrySpec[],
  periodUnit: PeriodUnit = "week",
): AverageIncomeResult {
  const outcome = calculateAverageIncome({
    periodUnit,
    entries: specs.map(entry),
  });
  if (outcome.status !== "ok") throw new Error("Verwachtte een resultaat.");
  return outcome.result;
}

describe("countingIncome", () => {
  it("trekt de correctie af van het ontvangen inkomen", () => {
    expect(
      countingIncome(entry({ received: 642.13, correction: 160 }, 0)),
    ).toBe(48213);
  });
});

describe("testgeval 1: vier weken met één correctie", () => {
  const result = calculate([
    { received: 500 },
    { received: 600, correction: 100 },
    { received: 550 },
    { received: 650 },
  ]);

  it("telt het ontvangen inkomen op", () => {
    expect(result.totalReceivedCents).toBe(230000);
  });

  it("telt de correcties op", () => {
    expect(result.totalCorrectionCents).toBe(10000);
  });

  it("houdt € 2.200,00 meetellend inkomen over", () => {
    expect(result.totalCountingCents).toBe(220000);
    expect(euro(result.totalCountingCents)).toBe("€ 2.200,00");
  });

  it("berekent een gemiddeld weekinkomen van € 550,00", () => {
    expect(result.averagePerPeriodCents).toBe(55000);
    expect(result.weekAverageCents).toBe(55000);
  });

  it("berekent een 4-wekeninkomen van € 2.200,00", () => {
    expect(result.fourWeekAverageCents).toBe(220000);
  });

  it("berekent een maandinkomen van € 2.383,33", () => {
    expect(result.monthAverageCents).toBe(238333);
    expect(euro(result.monthAverageCents)).toBe("€ 2.383,33");
  });

  it("toont de gebruikte formules", () => {
    const month = result.formulaSteps.find((step) => step.key === "month_average");
    expect(month?.formula).toBe("gemiddeld weekinkomen × 52 / 12");
    expect(plainSpaces(month?.substitution ?? "")).toBe("€ 550,00 × 52 / 12");
  });
});

describe("testgeval 2: geen enkele correctie", () => {
  const result = calculate([
    { received: 500 },
    { received: 600 },
    { received: 550 },
    { received: 650 },
  ]);

  it("rekent met het volledige ontvangen inkomen", () => {
    expect(result.totalCorrectionCents).toBe(0);
    expect(result.totalCountingCents).toBe(result.totalReceivedCents);
    expect(result.averagePerPeriodCents).toBe(57500);
    expect(result.monthAverageCents).toBe(249167);
  });

  it("meldt in de formule dat er geen correcties zijn", () => {
    const step = result.formulaSteps.find((s) => s.key === "total_correction");
    expect(step?.substitution).toBe("geen correcties");
  });
});

describe("testgeval 3: één inkomstenperiode", () => {
  const result = calculate([{ label: "Week 35", received: 642.13, correction: 160 }]);

  it("gebruikt die ene periode als gemiddelde", () => {
    expect(result.periodCount).toBe(1);
    expect(result.averagePerPeriodCents).toBe(48213);
    expect(result.weekAverageCents).toBe(48213);
    expect(result.fourWeekAverageCents).toBe(192852);
    expect(result.monthAverageCents).toBe(208923);
  });

  it("toont één periodelabel zonder bereik", () => {
    expect(result.rangeLabel).toBe("Week 35");
  });
});

describe("testgeval 4: bedragen met decimalen", () => {
  const result = calculate([
    { label: "Week 35", received: 554.48 },
    { label: "Week 36", received: 466.6 },
    { label: "Week 37", received: 565.88 },
  ]);

  it("telt centen exact op", () => {
    expect(result.totalCountingCents).toBe(158696);
  });

  it("rondt het gemiddelde af op hele centen", () => {
    expect(result.averagePerPeriodCents).toBe(52899);
    expect(euro(result.averagePerPeriodCents)).toBe("€ 528,99");
  });

  it("berekent afgeleide bedragen uit het exacte gemiddelde", () => {
    expect(result.fourWeekAverageCents).toBe(211595);
    expect(result.monthAverageCents).toBe(229228);
  });

  it("toont het periodebereik", () => {
    expect(result.rangeLabel).toBe("Week 35 t/m week 37");
  });
});

describe("testgeval 5: correctie gelijk aan het ontvangen bedrag", () => {
  const result = calculate([
    { received: 500 },
    { received: 300, correction: 300 },
  ]);

  it("laat het meetellend inkomen van die periode op nul uitkomen", () => {
    expect(result.entries[1]?.countingCents).toBe(0);
  });

  it("telt de periode wel mee in het gemiddelde", () => {
    expect(result.periodCount).toBe(2);
    expect(result.averagePerPeriodCents).toBe(25000);
  });
});

describe("omrekening tussen periode-eenheden", () => {
  it("rekent 4-wekenperioden om naar week en maand", () => {
    const result = calculate([{ received: 2200 }, { received: 2200 }], "four_weeks");
    expect(result.averagePerPeriodCents).toBe(220000);
    expect(result.weekAverageCents).toBe(55000);
    expect(result.monthAverageCents).toBe(238333);
  });

  it("rekent maanden om naar week en 4-wekenperiode", () => {
    const result = calculate([{ received: 2383.33 }], "month");
    expect(result.monthAverageCents).toBe(238333);
    expect(result.weekAverageCents).toBe(55000);
    expect(result.fourWeekAverageCents).toBe(220000);
  });

  it("noemt het gemiddelde per periode bij weekinvoer het weekinkomen", () => {
    const result = calculate([{ received: 100 }]);
    const step = result.formulaSteps.find((s) => s.key === "average_per_period");
    expect(step?.label).toBe("Gemiddeld weekinkomen");
    expect(step?.formula).toBe("totaal meetellend inkomen / aantal weken");
  });

  it("herhaalt de eigen eenheid niet als aparte omrekenstap", () => {
    const weekly = calculate([{ received: 100 }]);
    expect(weekly.formulaSteps.map((s) => s.key)).not.toContain("week_average");
    expect(weekly.formulaSteps.map((s) => s.key)).toContain("month_average");

    const monthly = calculate([{ received: 100 }], "month");
    expect(monthly.formulaSteps.map((s) => s.key)).not.toContain("month_average");
    expect(monthly.formulaSteps.find((s) => s.key === "average_per_period")?.label).toBe(
      "Gemiddeld maandinkomen",
    );
  });
});

describe("afronding", () => {
  it("rondt een halve cent naar boven af", () => {
    const result = calculate([{ received: 0.1 }, { received: 0.2 }, { received: 0 }]);
    expect(result.totalCountingCents).toBe(30);
    expect(result.averagePerPeriodCents).toBe(10);
  });

  it("rondt het gemiddelde van 0,01 en 0,02 af op 0,02", () => {
    const result = calculate([{ received: 0.01 }, { received: 0.02 }]);
    expect(result.averagePerPeriodCents).toBe(2);
  });

  it("gebruikt het exacte gemiddelde voor afgeleide bedragen", () => {
    // Gemiddelde is exact 100,005; afgerond € 100,01 op het scherm.
    const result = calculate([{ received: 100 }, { received: 100.01 }]);
    expect(result.averagePerPeriodCents).toBe(10001);
    // 20001 x 4 / 2 = 40002, niet 4 x 10001 = 40004.
    expect(result.fourWeekAverageCents).toBe(40002);
  });
});

describe("lege invoer", () => {
  it("geeft de status 'empty' zonder regels", () => {
    expect(calculateAverageIncome({ periodUnit: "week", entries: [] })).toEqual({
      status: "empty",
    });
  });
});

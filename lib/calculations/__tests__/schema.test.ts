import { describe, expect, it } from "vitest";
import { calculateAverageIncome } from "../average-income";
import {
  calculationDraftSchema,
  createEmptyEntry,
  findIssue,
  isDraftEntryEmpty,
  validateDraft,
  type CalculationDraft,
  type DraftEntry,
} from "../schema";

function row(partial: Partial<DraftEntry> & { id: string }): DraftEntry {
  return { ...createEmptyEntry(partial.id), ...partial };
}

function draft(entries: DraftEntry[], overrides: Partial<CalculationDraft> = {}): CalculationDraft {
  return { reference: "", periodUnit: "week", entries, ...overrides };
}

describe("structuurvalidatie met Zod", () => {
  it("accepteert een geldig formulier", () => {
    const parsed = calculationDraftSchema.safeParse(
      draft([row({ id: "a", received: "500" })]),
    );
    expect(parsed.success).toBe(true);
  });

  it("weigert een onbekende periode-eenheid", () => {
    const parsed = calculationDraftSchema.safeParse({
      reference: "",
      periodUnit: "kwartaal",
      entries: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("weigert een onbekende correctiecategorie", () => {
    const parsed = calculationDraftSchema.safeParse(
      draft([row({ id: "a", received: "500", correctionCategoryId: "bonus" })]),
    );
    expect(parsed.success).toBe(false);
  });

  it("weigert een te lang dossierkenmerk", () => {
    const parsed = calculationDraftSchema.safeParse(
      draft([], { reference: "x".repeat(61) }),
    );
    expect(parsed.success).toBe(false);
  });
});

describe("testgeval 6: correctie hoger dan het ontvangen bedrag", () => {
  const result = validateDraft(
    draft([
      row({
        id: "a",
        received: "500",
        correction: "600",
        correctionCategoryId: "reiskostenvergoeding",
      }),
    ]),
  );

  it("wordt tegengehouden", () => {
    expect(result.ok).toBe(false);
  });

  it("legt uit wat er mis is bij het correctieveld", () => {
    expect(findIssue(result.issues, "a", "correction")).toBe(
      "Hoger dan het ontvangen inkomen.",
    );
  });

  it("staat een correctie gelijk aan het ontvangen bedrag wel toe", () => {
    const equal = validateDraft(
      draft([
        row({
          id: "a",
          received: "500",
          correction: "500",
          correctionCategoryId: "reiskostenvergoeding",
        }),
      ]),
    );
    expect(equal.ok).toBe(true);
  });
});

describe("testgeval 7: lege regels", () => {
  const validation = validateDraft(
    draft([
      row({ id: "a", label: "Week 1", received: "500" }),
      row({ id: "b" }),
      row({ id: "c", label: "Week 3", received: "600" }),
      row({ id: "d", label: "Week 4 (nog niet ingevuld)" }),
    ]),
  );

  it("herkent een regel zonder bedragen als leeg", () => {
    expect(isDraftEntryEmpty(row({ id: "b" }))).toBe(true);
    expect(isDraftEntryEmpty(row({ id: "b", label: "Week 9" }))).toBe(true);
    expect(isDraftEntryEmpty(row({ id: "b", received: "0" }))).toBe(false);
  });

  it("slaat lege regels over zonder foutmelding", () => {
    expect(validation.ok).toBe(true);
    expect(validation.skippedEntryIds).toEqual(["b", "d"]);
  });

  it("laat het gemiddelde ongemoeid", () => {
    if (!validation.ok) throw new Error("Verwachtte een geldig formulier.");
    const outcome = calculateAverageIncome(validation.input);
    if (outcome.status !== "ok") throw new Error("Verwachtte een resultaat.");
    expect(outcome.result.periodCount).toBe(2);
    expect(outcome.result.averagePerPeriodCents).toBe(55000);
  });

  it("telt een uitdrukkelijk ingevulde nul wel mee", () => {
    const withZero = validateDraft(
      draft([
        row({ id: "a", received: "500" }),
        row({ id: "b", received: "0" }),
      ]),
    );
    if (!withZero.ok) throw new Error("Verwachtte een geldig formulier.");
    expect(withZero.input.entries).toHaveLength(2);
    const outcome = calculateAverageIncome(withZero.input);
    if (outcome.status !== "ok") throw new Error("Verwachtte een resultaat.");
    expect(outcome.result.averagePerPeriodCents).toBe(25000);
  });
});

describe("testgeval 8: negatieve inkomsten", () => {
  it("weigert een negatief ontvangen bedrag", () => {
    const result = validateDraft(draft([row({ id: "a", received: "-100" })]));
    expect(result.ok).toBe(false);
    expect(findIssue(result.issues, "a", "received")).toBe(
      "Een negatief bedrag is hier niet toegestaan.",
    );
  });

  it("weigert een negatieve correctie", () => {
    const result = validateDraft(
      draft([row({ id: "a", received: "500", correction: "-50" })]),
    );
    expect(result.ok).toBe(false);
    expect(findIssue(result.issues, "a", "correction")).toBeDefined();
  });
});

describe("overige invoerregels", () => {
  it("vraagt om een reden bij een correctie", () => {
    const result = validateDraft(
      draft([row({ id: "a", received: "500", correction: "50" })]),
    );
    expect(result.ok).toBe(false);
    expect(findIssue(result.issues, "a", "correctionCategoryId")).toBe(
      "Kies een reden voor de correctie.",
    );
  });

  it("meldt een onleesbaar bedrag", () => {
    const result = validateDraft(draft([row({ id: "a", received: "vijfhonderd" })]));
    expect(result.ok).toBe(false);
    expect(findIssue(result.issues, "a", "received")).toContain("554,48");
  });

  it("vult een ontbrekend periodelabel automatisch aan", () => {
    const result = validateDraft(
      draft([row({ id: "a", received: "500" }), row({ id: "b", received: "600" })]),
    );
    if (!result.ok) throw new Error("Verwachtte een geldig formulier.");
    expect(result.input.entries.map((e) => e.label)).toEqual(["Week 1", "Week 2"]);
  });

  it("gebruikt het juiste voorvoegsel per periode-eenheid", () => {
    const result = validateDraft(
      draft([row({ id: "a", received: "2000" })], { periodUnit: "month" }),
    );
    if (!result.ok) throw new Error("Verwachtte een geldig formulier.");
    expect(result.input.entries[0]?.label).toBe("Maand 1");
  });

  it("zet de categorie op null wanneer de correctie nul is", () => {
    const result = validateDraft(
      draft([
        row({
          id: "a",
          received: "500",
          correction: "0",
          correctionCategoryId: "reiskostenvergoeding",
        }),
      ]),
    );
    if (!result.ok) throw new Error("Verwachtte een geldig formulier.");
    expect(result.input.entries[0]?.correctionCategoryId).toBeNull();
  });

  it("verzamelt meldingen van meerdere regels tegelijk", () => {
    const result = validateDraft(
      draft([
        row({ id: "a", received: "abc" }),
        row({ id: "b", received: "100", correction: "200", correctionCategoryId: "reiskostenvergoeding" }),
      ]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(2);
  });

  it("leest Nederlandse notatie uit het formulier", () => {
    const result = validateDraft(
      draft([row({ id: "a", received: "€ 1.234,56", correction: "160,00", correctionCategoryId: "reiskostenvergoeding" })]),
    );
    if (!result.ok) throw new Error("Verwachtte een geldig formulier.");
    expect(result.input.entries[0]?.receivedCents).toBe(123456);
    expect(result.input.entries[0]?.correctionCents).toBe(16000);
  });
});

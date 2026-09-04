import { z } from "zod";
import { parseAmountToCents, type Cents } from "@/lib/money";
import { CORRECTION_CATEGORIES } from "./correction-categories";
import { PERIOD_UNITS, getPeriodUnit, type PeriodUnit } from "./period-units";
import type { AverageIncomeInput, IncomeEntry } from "./types";

/**
 * Validatie van het invoerformulier.
 *
 * De gebruiker typt tekst; hier wordt die tekst gecontroleerd en omgezet naar
 * exacte centen voor de rekenengine. De structuur (typen, lengtes, toegestane
 * categorieën en periode-eenheden) wordt door Zod bewaakt. De inhoudelijke
 * geldregels staan daaronder als pure functies, zodat ze los te testen zijn.
 *
 * Vastgelegde keuzes:
 *  - Een regel telt als leeg zolang zowel "ontvangen" als "correctie" leeg is.
 *    Lege regels worden overgeslagen en beïnvloeden het gemiddelde niet.
 *    Een regel met een uitdrukkelijk ingevulde 0 telt wél mee: een week zonder
 *    inkomen is inhoudelijk iets anders dan een niet-ingevulde week.
 *  - Negatieve bedragen worden geweigerd. Een negatief nettoloon is geen
 *    inkomen maar een terugvordering of verrekening; die hoort met een
 *    correctie of een aparte regel te worden verwerkt, niet als min-inkomen.
 *  - Een correctie mag nooit hoger zijn dan het ontvangen bedrag, omdat het
 *    meetellend inkomen daarmee negatief zou worden.
 *  - Bij een correctie groter dan nul is een reden verplicht; zonder reden is
 *    de berekening niet uit te leggen in een dossier.
 */

const categoryIds = CORRECTION_CATEGORIES.map((category) => category.id);
const periodUnitIds = PERIOD_UNITS.map((unit) => unit.id) as [
  PeriodUnit,
  ...PeriodUnit[],
];

export const draftEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().max(80, "Gebruik maximaal 80 tekens."),
  received: z.string().max(20, "Dit lijkt geen bedrag."),
  correction: z.string().max(20, "Dit lijkt geen bedrag."),
  correctionCategoryId: z
    .string()
    .refine((value) => categoryIds.includes(value), "Onbekende categorie.")
    .nullable(),
  note: z.string().max(200, "Gebruik maximaal 200 tekens."),
});

export const calculationDraftSchema = z.object({
  /** Optioneel dossierkenmerk. Geen persoonsgegevens: zie README. */
  reference: z.string().max(60, "Gebruik maximaal 60 tekens."),
  periodUnit: z.enum(periodUnitIds),
  entries: z.array(draftEntrySchema),
});

export type DraftEntry = z.infer<typeof draftEntrySchema>;
export type CalculationDraft = z.infer<typeof calculationDraftSchema>;

export type EntryField =
  | "label"
  | "received"
  | "correction"
  | "correctionCategoryId"
  | "note";

export interface EntryIssue {
  readonly entryId: string;
  readonly field: EntryField;
  readonly message: string;
}

export type DraftValidation =
  | {
      readonly ok: true;
      readonly input: AverageIncomeInput;
      /** Ids van regels die als leeg zijn overgeslagen. */
      readonly skippedEntryIds: readonly string[];
      readonly issues: readonly [];
    }
  | {
      readonly ok: false;
      readonly issues: readonly EntryIssue[];
      readonly skippedEntryIds: readonly string[];
    };

export function createEmptyEntry(id: string): DraftEntry {
  return {
    id,
    label: "",
    received: "",
    correction: "",
    correctionCategoryId: null,
    note: "",
  };
}

/** Een regel is leeg zolang er geen bedragen zijn ingevuld. */
export function isDraftEntryEmpty(entry: DraftEntry): boolean {
  return entry.received.trim() === "" && entry.correction.trim() === "";
}

/** Automatisch periodelabel, bijvoorbeeld "Week 3", als de gebruiker niets invult. */
export function defaultEntryLabel(
  periodUnit: PeriodUnit,
  index: number,
): string {
  return `${getPeriodUnit(periodUnit).labelPrefix} ${index + 1}`;
}

/**
 * Controleert het volledige formulier en zet het om naar invoer voor de
 * rekenengine. Geeft per regel en per veld een begrijpelijke foutmelding.
 */
export function validateDraft(draft: CalculationDraft): DraftValidation {
  const issues: EntryIssue[] = [];
  const skippedEntryIds: string[] = [];
  const entries: IncomeEntry[] = [];

  draft.entries.forEach((entry, index) => {
    if (isDraftEntryEmpty(entry)) {
      skippedEntryIds.push(entry.id);
      return;
    }

    const received = parseAmountToCents(entry.received);
    if (!received.ok) {
      issues.push({
        entryId: entry.id,
        field: "received",
        message: received.message,
      });
    }

    let correctionCents: Cents = 0;
    if (entry.correction.trim() !== "") {
      const correction = parseAmountToCents(entry.correction);
      if (!correction.ok) {
        issues.push({
          entryId: entry.id,
          field: "correction",
          message: correction.message,
        });
      } else {
        correctionCents = correction.cents;
      }
    }

    if (received.ok && correctionCents > received.cents) {
      issues.push({
        entryId: entry.id,
        field: "correction",
        message: "Hoger dan het ontvangen inkomen.",
      });
    }

    if (correctionCents > 0 && !entry.correctionCategoryId) {
      issues.push({
        entryId: entry.id,
        field: "correctionCategoryId",
        message: "Kies een reden voor de correctie.",
      });
    }

    if (received.ok) {
      entries.push({
        id: entry.id,
        label: entry.label.trim() || defaultEntryLabel(draft.periodUnit, index),
        receivedCents: received.cents,
        correctionCents,
        correctionCategoryId:
          correctionCents > 0 ? entry.correctionCategoryId : null,
        note: entry.note.trim(),
      });
    }
  });

  if (issues.length > 0) {
    return { ok: false, issues, skippedEntryIds };
  }

  return {
    ok: true,
    input: { periodUnit: draft.periodUnit, entries },
    skippedEntryIds,
    issues: [],
  };
}

/** Zoekt de melding voor één veld op, voor gebruik in de interface. */
export function findIssue(
  issues: readonly EntryIssue[],
  entryId: string,
  field: EntryField,
): string | undefined {
  return issues.find(
    (issue) => issue.entryId === entryId && issue.field === field,
  )?.message;
}

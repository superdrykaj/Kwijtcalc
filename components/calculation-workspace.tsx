"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PERIOD_UNITS,
  calculateAverageIncome,
  calculationDraftSchema,
  createEmptyEntry,
  defaultEntryLabel,
  findIssue,
  getPeriodUnit,
  isDraftEntryEmpty,
  validateDraft,
  type DraftEntry,
  type EntryField,
  type PeriodUnit,
} from "@/lib/calculations";
import { formatCents, formatCentsPlain, parseAmountToCents } from "@/lib/money";
import { EntryRow } from "./entry-row";
import { PrintReport } from "./print-report";
import { ResultSummary } from "./result-summary";
import {
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

const INITIAL_ROW_COUNT = 4;

/**
 * Vaste, voorspelbare regel-ids. Geen willekeurige waarden, zodat de
 * server-rendering en de browser exact hetzelfde opleveren.
 */
function initialEntries(): DraftEntry[] {
  return Array.from({ length: INITIAL_ROW_COUNT }, (_, index) =>
    createEmptyEntry(`regel-${index + 1}`),
  );
}

/** Meetellend inkomen van één regel, live tijdens het typen. */
function liveCountingText(entry: DraftEntry): string | null {
  if (isDraftEntryEmpty(entry)) return null;
  const received = parseAmountToCents(entry.received);
  if (!received.ok) return null;
  let correctionCents = 0;
  if (entry.correction.trim() !== "") {
    const correction = parseAmountToCents(entry.correction);
    if (!correction.ok) return null;
    correctionCents = correction.cents;
  }
  if (correctionCents > received.cents) return null;
  return formatCents(received.cents - correctionCents);
}

export function CalculationWorkspace() {
  const [reference, setReference] = useState("");
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("week");
  const [entries, setEntries] = useState<DraftEntry[]>(initialEntries);
  const [touched, setTouched] = useState<Record<string, true>>({});
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [entryToFocus, setEntryToFocus] = useState<string | null>(null);
  const nextId = useRef(INITIAL_ROW_COUNT + 1);
  const resultRef = useRef<HTMLDivElement>(null);

  // Na het toevoegen van een regel meteen doortypen in het bedragveld.
  useEffect(() => {
    if (!entryToFocus) return;
    document.getElementById(`${entryToFocus}-received`)?.focus();
  }, [entryToFocus]);

  const validation = useMemo(() => {
    const parsed = calculationDraftSchema.safeParse({
      reference,
      periodUnit,
      entries,
    });
    if (!parsed.success) return null;
    return validateDraft(parsed.data);
  }, [reference, periodUnit, entries]);

  const outcome = useMemo(() => {
    if (!validation || !validation.ok) return null;
    return calculateAverageIncome(validation.input);
  }, [validation]);

  const issues = validation && !validation.ok ? validation.issues : [];
  const filledEntryCount = entries.filter(
    (entry) => !isDraftEntryEmpty(entry),
  ).length;

  function updateEntry(
    id: string,
    field: keyof DraftEntry,
    value: string | null,
  ) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function addEntry(focusNewRow = false) {
    const id = `regel-${nextId.current}`;
    nextId.current += 1;
    setEntries((current) => [...current, createEmptyEntry(id)]);
    if (focusNewRow) setEntryToFocus(id);
  }

  /** Enter in een invoerveld voegt de volgende periode toe. */
  function handleTableKeyDown(event: React.KeyboardEvent<HTMLTableElement>) {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.tagName !== "INPUT") return;
    event.preventDefault();
    addEntry(true);
  }

  function removeEntry(id: string) {
    setEntries((current) =>
      current.length <= 1 ? current : current.filter((entry) => entry.id !== id),
    );
  }

  function markTouched(id: string, field: EntryField) {
    setTouched((current) => ({ ...current, [`${id}:${field}`]: true }));
    if (field === "received" || field === "correction") normalizeAmount(id, field);
  }

  /**
   * Zet een geldig bedrag na het verlaten van het veld om naar vaste notatie,
   * zodat de kolom met bedragen leesbaar blijft ("500" wordt "500,00").
   */
  function normalizeAmount(id: string, field: "received" | "correction") {
    setEntries((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        const raw = entry[field];
        if (raw.trim() === "") return entry;
        const parsed = parseAmountToCents(raw);
        if (!parsed.ok) return entry;
        const formatted = formatCentsPlain(parsed.cents);
        return formatted === raw ? entry : { ...entry, [field]: formatted };
      }),
    );
  }

  function resetAll() {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(
        "Alle ingevoerde gegevens wissen en opnieuw beginnen?",
      );
    if (!confirmed) return;
    setEntries(initialEntries());
    nextId.current = INITIAL_ROW_COUNT + 1;
    setReference("");
    setTouched({});
    setShowAllIssues(false);
  }

  function showResult() {
    setShowAllIssues(true);
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const unit = getPeriodUnit(periodUnit);
  const headerCell =
    "px-2 pb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted";

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <div className="print:hidden">
        <header className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Nieuwe inkomensberekening
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Voer de aangeleverde inkomstenperioden in. Het meetellend inkomen en
            het gemiddelde worden meteen bijgewerkt. Vul geen persoonsgegevens
            in.
          </p>
        </header>

        <section className={`${cardClass} mt-8 p-6`} aria-labelledby="uitgangspunten">
          <h2 id="uitgangspunten" className="text-sm font-semibold text-ink">
            Uitgangspunten
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="reference" className={labelClass}>
                Dossierkenmerk (optioneel)
              </label>
              <input
                id="reference"
                className={`${inputClass} mt-1`}
                value={reference}
                maxLength={60}
                placeholder="Bijvoorbeeld een zaaknummer"
                onChange={(event) => setReference(event.target.value)}
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Gebruik geen naam, adres of burgerservicenummer.
              </p>
            </div>

            <fieldset>
              <legend className={labelClass}>Soort periode</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {PERIOD_UNITS.map((option) => {
                  const active = option.id === periodUnit;
                  return (
                    <label
                      key={option.id}
                      className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                        active
                          ? "border-brand bg-brand-tint font-medium text-brand"
                          : "border-line-strong bg-surface text-ink hover:bg-canvas"
                      }`}
                    >
                      <input
                        type="radio"
                        name="periodUnit"
                        value={option.id}
                        checked={active}
                        onChange={() => setPeriodUnit(option.id)}
                        className="sr-only"
                      />
                      {option.singular.charAt(0).toUpperCase()}
                      {option.singular.slice(1)}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Bepaalt hoe het gemiddelde wordt omgerekend naar week, 4 weken en
                maand.
              </p>
            </fieldset>
          </div>
        </section>

        <section className={`${cardClass} mt-6 p-6`} aria-labelledby="perioden">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="perioden" className="text-sm font-semibold text-ink">
              Inkomstenperioden
            </h2>
            <p className="text-xs text-ink-muted">
              Lege regels tellen niet mee. Met Enter voegt u een periode toe.
            </p>
          </div>

          <div className="mt-4 md:overflow-x-auto">
            <table
              className="w-full border-collapse md:min-w-[60rem]"
              onKeyDown={handleTableKeyDown}
            >
              <caption className="sr-only">
                Ingevoerde inkomstenperioden met correcties en het meetellend
                inkomen per periode.
              </caption>
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-line">
                  <th scope="col" className={`${headerCell} w-[14%]`}>
                    Periode
                  </th>
                  <th scope="col" className={`${headerCell} w-[15%]`}>
                    Ontvangen inkomen
                  </th>
                  <th scope="col" className={`${headerCell} w-[15%]`}>
                    Correctie
                  </th>
                  <th scope="col" className={`${headerCell} w-[22%]`}>
                    Reden correctie
                  </th>
                  <th scope="col" className={`${headerCell} w-[14%]`}>
                    Notitie
                  </th>
                  <th scope="col" className={`${headerCell} text-right`}>
                    Meetellend inkomen
                  </th>
                  <th scope="col" className="w-10">
                    <span className="sr-only">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {entries.map((entry, index) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    index={index}
                    placeholderLabel={defaultEntryLabel(periodUnit, index)}
                    countingText={liveCountingText(entry)}
                    errorFor={(field) =>
                      showAllIssues || touched[`${entry.id}:${field}`]
                        ? findIssue(issues, entry.id, field)
                        : undefined
                    }
                    onChange={(field, value) => updateEntry(entry.id, field, value)}
                    onBlurField={(field) => markTouched(entry.id, field)}
                    onRemove={() => removeEntry(entry.id)}
                    canRemove={entries.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => addEntry()}
              className={secondaryButtonClass}
            >
              Periode toevoegen
            </button>
            <button type="button" onClick={showResult} className={primaryButtonClass}>
              Bekijk resultaat
            </button>
            <p className="text-xs text-ink-muted">
              {filledEntryCount === 0
                ? "Nog geen perioden ingevuld."
                : `${filledEntryCount} ${
                    filledEntryCount === 1 ? unit.singular : unit.plural
                  } ingevuld.`}
            </p>
          </div>

          {showAllIssues && issues.length > 0 ? (
            <div
              role="alert"
              className="mt-5 rounded-md border border-danger bg-danger-tint p-4 text-sm text-danger"
            >
              <p className="font-semibold">
                Er {issues.length === 1 ? "is 1 regel" : `zijn ${issues.length} regels`}{" "}
                die aandacht {issues.length === 1 ? "vraagt" : "vragen"}.
              </p>
              <p className="mt-1">
                Controleer de rood gemarkeerde velden hierboven. Zolang die niet
                kloppen, wordt er geen resultaat getoond.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <div ref={resultRef} className="mt-6 scroll-mt-6">
        {outcome && outcome.status === "ok" ? (
          <>
            <div className="print:hidden">
              <ResultSummary
                result={outcome.result}
                reference={reference}
                onPrint={() => window.print()}
                onReset={resetAll}
              />
            </div>
            <PrintReport result={outcome.result} reference={reference} />
          </>
        ) : (
          <section
            className={`${cardClass} border-dashed p-6 text-sm text-ink-muted print:hidden`}
            aria-live="polite"
          >
            <h2 className="text-sm font-semibold text-ink">Berekeningsresultaat</h2>
            <p className="mt-2">
              {issues.length > 0
                ? "Het resultaat verschijnt zodra alle ingevulde regels kloppen."
                : "Vul minimaal één periode in om het gemiddelde te zien."}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

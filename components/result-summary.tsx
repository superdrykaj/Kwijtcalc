"use client";

import { useState } from "react";
import {
  correctionCategoryLabel,
  getPeriodUnit,
  type AverageIncomeResult,
} from "@/lib/calculations";
import { formatCents } from "@/lib/money";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "./ui";

interface ResultSummaryProps {
  result: AverageIncomeResult;
  reference: string;
  onPrint: () => void;
  onReset: () => void;
}

function SummaryLine({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd
        className={`tabular text-right ${
          emphasis
            ? "text-lg font-semibold text-ink"
            : "text-sm font-medium text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function ResultSummary({
  result,
  reference,
  onPrint,
  onReset,
}: ResultSummaryProps) {
  const [showFormulas, setShowFormulas] = useState(false);
  const unit = getPeriodUnit(result.periodUnit);
  const corrections = result.entries.filter((entry) => entry.correctionCents > 0);

  return (
    <section
      id="resultaat"
      aria-labelledby="resultaat-titel"
      className={`${cardClass} p-6 sm:p-8`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="resultaat-titel" className="text-lg font-semibold text-ink">
            Berekeningsresultaat
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {result.rangeLabel
              ? `${result.rangeLabel} · ${result.periodCount} ${
                  result.periodCount === 1 ? unit.singular : unit.plural
                }`
              : `${result.periodCount} ${
                  result.periodCount === 1 ? unit.singular : unit.plural
                }`}
            {reference.trim() ? ` · dossier ${reference.trim()}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button type="button" onClick={onPrint} className={primaryButtonClass}>
            Afdrukken
          </button>
          <button type="button" onClick={onReset} className={secondaryButtonClass}>
            Opnieuw beginnen
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-x-10 gap-y-2 sm:grid-cols-2">
        <dl>
          <SummaryLine
            label="Aantal inkomstenperioden"
            value={String(result.periodCount)}
          />
          <SummaryLine
            label="Totaal ontvangen inkomen"
            value={formatCents(result.totalReceivedCents)}
          />
          <SummaryLine
            label="Totaal buiten beschouwing gelaten"
            value={formatCents(result.totalCorrectionCents)}
          />
          <SummaryLine
            label="Totaal meetellend inkomen"
            value={formatCents(result.totalCountingCents)}
          />
        </dl>
        <dl>
          <SummaryLine
            label="Gemiddeld weekinkomen"
            value={formatCents(result.weekAverageCents)}
            emphasis
          />
          <SummaryLine
            label="Gemiddeld 4-wekeninkomen"
            value={formatCents(result.fourWeekAverageCents)}
            emphasis
          />
          <SummaryLine
            label="Gemiddeld maandinkomen"
            value={formatCents(result.monthAverageCents)}
            emphasis
          />
        </dl>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        Rechtstreeks gemiddeld uit de ingevoerde perioden:{" "}
        <span className="font-medium text-ink">
          {formatCents(result.averagePerPeriodCents)}
        </span>{" "}
        per {unit.singular}. De andere bedragen zijn hieruit omgerekend.
      </p>

      {corrections.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ink">Toegepaste correcties</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {corrections.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
              >
                <span className="text-sm font-medium text-ink">{entry.label}</span>
                <span className="order-3 w-full text-xs text-ink-muted sm:order-2 sm:w-auto sm:flex-1 sm:px-4">
                  {correctionCategoryLabel(entry.correctionCategoryId)}
                  {entry.note ? ` — ${entry.note}` : ""}
                </span>
                <span className="order-2 tabular text-sm font-medium text-ink sm:order-3">
                  {formatCents(entry.correctionCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-8 text-sm text-ink-muted">
          Er zijn geen correcties toegepast.
        </p>
      )}

      <div className="mt-8 print:hidden">
        <button
          type="button"
          onClick={() => setShowFormulas((visible) => !visible)}
          aria-expanded={showFormulas}
          aria-controls="berekening-details"
          className={secondaryButtonClass}
        >
          {showFormulas ? "Verberg berekening" : "Bekijk berekening"}
        </button>

        {showFormulas ? (
          <div
            id="berekening-details"
            className="mt-4 rounded-lg border border-line bg-brand-tint p-5"
          >
            <h3 className="text-sm font-semibold text-ink">Gebruikte formules</h3>
            <ol className="mt-3 space-y-3">
              {result.formulaSteps.map((step) => {
                const value = formatCents(step.resultCents);
                return (
                  <li key={step.key} className="text-sm">
                    <p className="font-medium text-ink">{step.label}</p>
                    <p className="text-ink-muted">{step.formula}</p>
                    <p className="tabular text-ink">
                      {step.substitution === value
                        ? value
                        : `${step.substitution} = ${value}`}
                    </p>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              Bedragen worden in hele centen berekend. Omgerekende bedragen
              worden bepaald uit het exacte gemiddelde en pas aan het eind
              afgerond op twee decimalen, zodat er niet twee keer wordt
              afgerond.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

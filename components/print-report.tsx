import {
  correctionCategoryLabel,
  getPeriodUnit,
  type AverageIncomeResult,
} from "@/lib/calculations";
import { formatCents } from "@/lib/money";

interface PrintReportProps {
  result: AverageIncomeResult;
  reference: string;
}

/** Datum van vandaag, in Nederlandse notatie. */
function today(): string {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(
    new Date(),
  );
}

/**
 * Afdrukweergave: een zelfstandig leesbare onderbouwing die bij een dossier
 * gevoegd kan worden. Op het scherm verborgen, alleen zichtbaar bij afdrukken.
 */
export function PrintReport({ result, reference }: PrintReportProps) {
  const unit = getPeriodUnit(result.periodUnit);
  const corrections = result.entries.filter((entry) => entry.correctionCents > 0);

  return (
    <div className="hidden print:block">
      <header className="border-b border-black/30 pb-3">
        <h1 className="text-xl font-semibold">
          Berekening gemiddeld inkomen
        </h1>
        <p className="mt-1 text-xs">
          KwijtCalc · rekenhulp voor gemeentelijke belastingen
        </p>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="font-semibold">Dossierkenmerk:</dt>
          <dd>{reference.trim() || "niet ingevuld"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">Datum berekening:</dt>
          {/* De datum verschilt tussen de vooraf gegenereerde pagina en de
              browser; die afwijking is hier bedoeld. */}
          <dd suppressHydrationWarning>{today()}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">Periode:</dt>
          <dd>{result.rangeLabel ?? "niet benoemd"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">Aantal perioden:</dt>
          <dd>
            {result.periodCount}{" "}
            {result.periodCount === 1 ? unit.singular : unit.plural}
          </dd>
        </div>
      </dl>

      <h2 className="mt-6 text-sm font-semibold">Ingevoerde perioden</h2>
      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-black/30 text-left">
            <th scope="col" className="py-1 pr-2 font-semibold">
              Periode
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-semibold">
              Ontvangen
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-semibold">
              Correctie
            </th>
            <th scope="col" className="py-1 pl-4 pr-2 font-semibold">
              Reden correctie
            </th>
            <th scope="col" className="py-1 text-right font-semibold">
              Meetellend
            </th>
          </tr>
        </thead>
        <tbody>
          {result.entries.map((entry) => (
            <tr key={entry.id} className="border-b border-black/10">
              <td className="py-1 pr-2">{entry.label}</td>
              <td className="py-1 pr-2 text-right tabular">
                {formatCents(entry.receivedCents)}
              </td>
              <td className="py-1 pr-2 text-right tabular">
                {entry.correctionCents > 0
                  ? formatCents(entry.correctionCents)
                  : "—"}
              </td>
              <td className="py-1 pl-4 pr-2">
                {entry.correctionCents > 0
                  ? `${correctionCategoryLabel(entry.correctionCategoryId)}${
                      entry.note ? ` (${entry.note})` : ""
                    }`
                  : "—"}
              </td>
              <td className="py-1 text-right tabular">
                {formatCents(entry.countingCents)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-b border-black/30 font-semibold">
            <td className="py-1 pr-2">Totaal</td>
            <td className="py-1 pr-2 text-right tabular">
              {formatCents(result.totalReceivedCents)}
            </td>
            <td className="py-1 pr-2 text-right tabular">
              {formatCents(result.totalCorrectionCents)}
            </td>
            <td className="py-1 pr-2" />
            <td className="py-1 text-right tabular">
              {formatCents(result.totalCountingCents)}
            </td>
          </tr>
        </tfoot>
      </table>

      <h2 className="mt-6 text-sm font-semibold">Uitkomsten</h2>
      <table className="mt-2 w-full border-collapse text-xs">
        <tbody>
          {[
            {
              label: "Gemiddeld weekinkomen",
              value: result.weekAverageCents,
            },
            {
              label: "Gemiddeld 4-wekeninkomen",
              value: result.fourWeekAverageCents,
            },
            {
              label: "Gemiddeld maandinkomen",
              value: result.monthAverageCents,
            },
          ].map((line) => (
            <tr key={line.label} className="border-b border-black/10">
              <td className="py-1">{line.label}</td>
              <td className="py-1 text-right font-semibold tabular">
                {formatCents(line.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 text-sm font-semibold">Gebruikte formules</h2>
      <ol className="mt-2 space-y-1 text-xs">
        {result.formulaSteps.map((step) => {
          const value = formatCents(step.resultCents);
          return (
            <li key={step.key}>
              <span className="font-semibold">{step.label}:</span> {step.formula}
              {" = "}
              <span className="tabular">
                {step.substitution === value ? value : `${step.substitution} = ${value}`}
              </span>
            </li>
          );
        })}
      </ol>

      {corrections.length > 0 ? (
        <>
          <h2 className="mt-6 text-sm font-semibold">Toegepaste correcties</h2>
          <ul className="mt-2 space-y-1 text-xs">
            {corrections.map((entry) => (
              <li key={entry.id}>
                {entry.label}: {correctionCategoryLabel(entry.correctionCategoryId)}{" "}
                <span className="tabular">
                  {formatCents(entry.correctionCents)}
                </span>
                {entry.note ? ` — ${entry.note}` : ""}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-8 border-t border-black/30 pt-3 text-[10px] leading-relaxed">
        KwijtCalc ondersteunt bij het uitvoeren van berekeningen. De behandelend
        medewerker blijft verantwoordelijk voor de beoordeling en toepassing van
        de geldende wet- en regelgeving. Bedragen zijn berekend in hele centen;
        omgerekende bedragen zijn bepaald uit het exacte gemiddelde en afgerond
        op twee decimalen.
      </p>
    </div>
  );
}

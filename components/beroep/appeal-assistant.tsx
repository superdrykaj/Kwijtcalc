"use client";

import { useMemo, useState } from "react";
import { suggestGrounds } from "@/lib/beroep";
import { cardClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { PdfScanner, type ConfirmedPdfText } from "./pdf-scanner";

/**
 * De Beroepsassistent: van ingelezen of geplakte tekst naar voorgestelde
 * beroepsgronden.
 *
 * De assistent beoordeelt niets. Hij wijst passages aan waarin woorden staan
 * die op een bekende grond wijzen, en laat zien op welke bronpagina die
 * passage stond. De medewerker bepaalt wat er met het voorstel gebeurt.
 */

interface SourceInfo {
  readonly fileName: string;
  readonly pageNumbers: readonly number[];
}

export function AppealAssistant() {
  const [text, setText] = useState("");
  const [source, setSource] = useState<SourceInfo | null>(null);
  const [deselected, setDeselected] = useState<readonly string[]>([]);
  const [copied, setCopied] = useState(false);

  const grounds = useMemo(() => suggestGrounds(text), [text]);
  const chosen = grounds.filter((ground) => !deselected.includes(ground.id));

  function handleConfirmed(result: ConfirmedPdfText) {
    setText(result.text);
    setSource({ fileName: result.fileName, pageNumbers: result.pageNumbers });
    setDeselected([]);
    setCopied(false);
  }

  function toggleGround(id: string) {
    setDeselected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function copyOverview() {
    const lines = chosen.map((ground) => {
      const pages = [
        ...new Set(
          ground.passages
            .map((passage) => passage.pageNumber)
            .filter((page): page is number => page !== null),
        ),
      ];
      const bron = pages.length > 0 ? ` (pagina ${pages.join(", ")})` : "";
      return `- ${ground.title}${bron}`;
    });
    try {
      await navigator.clipboard.writeText(
        `Voorgestelde beroepsgronden\n${lines.join("\n")}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <PdfScanner onTextConfirmed={handleConfirmed} />

      <section className={`${cardClass} p-6`} aria-labelledby="tekst">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tekst" className="text-sm font-semibold text-ink">
            Tekst van het beroepschrift
          </h2>
          <p className="text-xs text-ink-muted">
            {source
              ? `Uit ${source.fileName}, pagina ${source.pageNumbers.join(", ")}`
              : "Nog geen pdf ingelezen"}
          </p>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Controleer en verbeter de tekst voordat de gronden worden voorgesteld.
          De regels met [Pagina n] geven aan waar een passage vandaan komt; laat
          ze staan om die verwijzing te behouden.
        </p>
        <label htmlFor="beroepstekst" className="sr-only">
          Tekst van het beroepschrift
        </label>
        <textarea
          id="beroepstekst"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setCopied(false);
          }}
          rows={14}
          placeholder="Neem de tekst over uit een pdf, of plak de tekst hier."
          className={`${inputClass} mt-3 font-mono text-xs leading-relaxed`}
        />
        <p className="mt-1 text-xs text-ink-muted">
          {text.trim() === ""
            ? "Nog geen tekst."
            : `${text.trim().length} tekens.`}
        </p>
      </section>

      <section className={`${cardClass} p-6`} aria-labelledby="gronden">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="gronden" className="text-sm font-semibold text-ink">
            Voorgestelde beroepsgronden
          </h2>
          {grounds.length > 0 ? (
            <p className="text-xs text-ink-muted">
              {chosen.length} van {grounds.length} geselecteerd
            </p>
          ) : null}
        </div>

        {grounds.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            {text.trim() === ""
              ? "Lees een pdf in of plak tekst om gronden te laten voorstellen."
              : "In deze tekst zijn geen bekende signaalwoorden gevonden. Beoordeel de brief zelf."}
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {grounds.map((ground) => {
                const isChosen = !deselected.includes(ground.id);
                return (
                  <li key={ground.id}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                        isChosen
                          ? "border-brand bg-brand-tint"
                          : "border-line bg-surface hover:bg-canvas"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChosen}
                        onChange={() => toggleGround(ground.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#0f3d63]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {ground.title}
                          <span className="ml-2 rounded border border-line-strong px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-ink-muted">
                            {ground.confidence === "sterk"
                              ? "sterk signaal"
                              : "mogelijk signaal"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {ground.explanation}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {ground.passages.slice(0, 3).map((passage, index) => (
                            <li
                              key={`${ground.id}-${index}`}
                              className="border-l-2 border-line-strong pl-3 text-xs text-ink"
                            >
                              <span className="italic">{passage.text}</span>
                              {passage.pageNumber !== null ? (
                                <span className="ml-1 text-ink-muted">
                                  (pagina {passage.pageNumber})
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void copyOverview()}
                disabled={chosen.length === 0}
                className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Overzicht kopiëren
              </button>
              {copied ? (
                <span role="status" className="text-xs text-ink-muted">
                  Overzicht gekopieerd naar het klembord.
                </span>
              ) : null}
            </div>
          </>
        )}

        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">
          De assistent stelt gronden voor op basis van woorden die in de tekst
          voorkomen. Hij beoordeelt de zaak niet en neemt geen besluit. De
          behandelend medewerker bepaalt welke gronden van toepassing zijn.
        </p>
      </section>
    </div>
  );
}

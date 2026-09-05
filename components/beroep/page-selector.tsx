"use client";

import { describeCandidate, type CandidateAnalysis, type PdfPageText } from "@/lib/pdf";
import { PageThumbnail } from "./page-thumbnail";

/**
 * Lijst met alle pagina's van het document. De voorgestelde pagina's staan
 * aangevinkt; de medewerker kan elke pagina zelf aan- en uitzetten.
 */

interface PageSelectorProps {
  pages: readonly PdfPageText[];
  analysis: CandidateAnalysis;
  selected: readonly number[];
  onToggle: (pageNumber: number) => void;
  renderThumbnail: (pageNumber: number) => Promise<string>;
}

export function PageSelector({
  pages,
  analysis,
  selected,
  onToggle,
  renderThumbnail,
}: PageSelectorProps) {
  const scoreByPage = new Map(
    analysis.scores.map((score) => [score.pageNumber, score]),
  );

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {pages.map((page) => {
        const isSelected = selected.includes(page.pageNumber);
        const isSuggested = analysis.selected.includes(page.pageNumber);
        const score = scoreByPage.get(page.pageNumber);
        const reason = score ? describeCandidate(score, analysis.selected) : "";

        return (
          <li key={page.pageNumber}>
            <label
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                isSelected
                  ? "border-brand bg-brand-tint"
                  : "border-line bg-surface hover:bg-canvas"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(page.pageNumber)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#0f3d63]"
              />
              <PageThumbnail pageNumber={page.pageNumber} render={renderThumbnail} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  Pagina {page.pageNumber}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    page.hasTextLayer ? "text-ink-muted" : "text-danger"
                  }`}
                >
                  {page.hasTextLayer ? "Tekst gevonden" : "Scan — OCR nodig"}
                </p>
                {isSuggested ? (
                  <p className="mt-1 text-xs font-medium text-brand">Voorgesteld</p>
                ) : null}
                {reason ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{reason}</p>
                ) : null}
              </div>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

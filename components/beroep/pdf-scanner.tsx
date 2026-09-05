"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_PAGE_COUNT,
  analyseCandidates,
  composeSelectedText,
  describePdfError,
  pdfError,
  validatePdfFile,
  type CandidateAnalysis,
  type PdfError,
  type PdfPageText,
} from "@/lib/pdf";
import { loadPdf, type LoadedPdf } from "@/lib/pdf/pdfjs-client";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { PageSelector } from "./page-selector";

/**
 * Inlezen van een beroeps-pdf, volledig in de browser.
 *
 * Het gekozen bestand wordt nergens naartoe gestuurd: het wordt als bytes aan
 * de meegeleverde pdf-bibliotheek gegeven en blijft in het geheugen van dit
 * tabblad. Er is geen upload, geen server en geen opslag.
 */

const THUMBNAIL_WIDTH = 110;

export interface ConfirmedPdfText {
  readonly text: string;
  readonly pageNumbers: readonly number[];
  readonly fileName: string;
}

interface PdfScannerProps {
  onTextConfirmed: (result: ConfirmedPdfText) => void;
}

type ScannerStatus = "idle" | "loading" | "ready";

export function PdfScanner({ onTextConfirmed }: PdfScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<readonly PdfPageText[]>([]);
  const [analysis, setAnalysis] = useState<CandidateAnalysis | null>(null);
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<PdfError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const pdfRef = useRef<LoadedPdf | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      void pdfRef.current?.destroy();
      pdfRef.current = null;
    };
  }, []);

  const renderThumbnail = useCallback(async (pageNumber: number) => {
    const pdf = pdfRef.current;
    if (!pdf) throw new Error("Geen document geopend.");
    return pdf.renderThumbnail(pageNumber, THUMBNAIL_WIDTH);
  }, []);

  function resetState() {
    setPages([]);
    setAnalysis(null);
    setSelected([]);
    setError(null);
    setNotice(null);
    setProgress({ current: 0, total: 0 });
  }

  async function openFile(file: File | null) {
    resetState();
    setFileName(file?.name ?? "");

    const invalid = validatePdfFile(file);
    if (invalid || !file) {
      setStatus("idle");
      setError(invalid ?? pdfError("geen_bestand"));
      return;
    }

    void pdfRef.current?.destroy();
    pdfRef.current = null;
    setStatus("loading");

    let pdf: LoadedPdf;
    try {
      pdf = await loadPdf(file);
    } catch (cause) {
      setStatus("idle");
      setError(describePdfError(cause));
      return;
    }

    if (pdf.pageCount > MAX_PAGE_COUNT) {
      await pdf.destroy();
      setStatus("idle");
      setError(pdfError("te_veel_paginas"));
      return;
    }

    pdfRef.current = pdf;
    setProgress({ current: 0, total: pdf.pageCount });

    const read: PdfPageText[] = [];
    try {
      for (let pageNumber = 1; pageNumber <= pdf.pageCount; pageNumber += 1) {
        read.push(await pdf.readPage(pageNumber));
        setProgress({ current: pageNumber, total: pdf.pageCount });
      }
    } catch (cause) {
      setStatus("idle");
      setError(describePdfError(cause));
      return;
    }

    const candidates = analyseCandidates(read);
    setPages(read);
    setAnalysis(candidates);
    setSelected(candidates.selected);
    setStatus("ready");

    if (read.every((page) => !page.hasTextLayer)) {
      setError(pdfError("geen_tekst"));
    }
  }

  function toggle(pageNumber: number) {
    setError(null);
    setSelected((current) =>
      current.includes(pageNumber)
        ? current.filter((number) => number !== pageNumber)
        : [...current, pageNumber].sort((a, b) => a - b),
    );
  }

  function confirmSelection() {
    setNotice(null);
    if (selected.length === 0) {
      setError(pdfError("geen_selectie"));
      return;
    }

    const composed = composeSelectedText(pages, selected);
    if (composed.text === "") {
      setError({
        code: "geen_tekst",
        message:
          "Voor deze pagina's is lokale tekstherkenning nodig. Kies een andere pagina of plak de tekst hieronder handmatig.",
      });
      return;
    }

    setError(null);
    if (composed.pagesWithoutText.length > 0) {
      const lijst = composed.pagesWithoutText.join(", ");
      setNotice(
        `Voor pagina ${lijst} is lokale tekstherkenning nodig. Die pagina is niet overgenomen.`,
      );
    }

    onTextConfirmed({
      text: composed.text,
      pageNumbers: composed.pageRanges.map((range) => range.pageNumber),
      fileName,
    });
  }

  const withText = pages.filter((page) => page.hasTextLayer).length;

  return (
    <section className={`${cardClass} p-6`} aria-labelledby="pdf-inlezen">
      <h2 id="pdf-inlezen" className="text-sm font-semibold text-ink">
        Beroepschrift inlezen
      </h2>
      <p className="mt-1 text-xs text-ink-muted">
        De pdf blijft op dit apparaat. Er wordt niets geüpload.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void openFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={`mt-4 rounded-lg border border-dashed p-6 text-center transition-colors ${
          dragging ? "border-brand bg-brand-tint" : "border-line-strong bg-canvas"
        }`}
      >
        <input
          ref={inputRef}
          id="pdf-bestand"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => void openFile(event.target.files?.[0] ?? null)}
        />
        <label htmlFor="pdf-bestand" className={`${primaryButtonClass} cursor-pointer`}>
          Pdf kiezen
        </label>
        <p className="mt-2 text-xs text-ink-muted">
          of sleep het bestand hierheen. Documenten van ongeveer 5 tot 100
          pagina&apos;s.
        </p>
      </div>

      {status === "loading" ? (
        <p className="mt-4 text-sm text-ink-muted" aria-live="polite">
          {progress.total === 0
            ? "Bezig met openen…"
            : `Tekst uitlezen: pagina ${progress.current} van ${progress.total}…`}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-danger bg-danger-tint p-3 text-sm text-danger"
        >
          {error.message}
        </p>
      ) : null}

      {notice ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-line-strong bg-canvas p-3 text-sm text-ink"
        >
          {notice}
        </p>
      ) : null}

      {status === "ready" && analysis ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-ink">{fileName}</p>
            <p className="text-xs text-ink-muted">
              {pages.length} pagina&apos;s · {withText} met tekstlaag ·{" "}
              {selected.length} geselecteerd
            </p>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            De aangevinkte pagina&apos;s zijn een voorstel. Controleer ze en pas de
            selectie zo nodig aan.
          </p>

          <div className="mt-4 max-h-[28rem] overflow-y-auto pr-1">
            <PageSelector
              pages={pages}
              analysis={analysis}
              selected={selected}
              onToggle={toggle}
              renderThumbnail={renderThumbnail}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmSelection}
              className={primaryButtonClass}
            >
              Tekst overnemen
            </button>
            <button
              type="button"
              onClick={() => {
                void pdfRef.current?.destroy();
                pdfRef.current = null;
                resetState();
                setFileName("");
                setStatus("idle");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className={secondaryButtonClass}
            >
              Ander bestand kiezen
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

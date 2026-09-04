"use client";

import { CORRECTION_CATEGORIES } from "@/lib/calculations";
import type { DraftEntry, EntryField } from "@/lib/calculations";
import {
  amountInputClass,
  inputClass,
  invalidInputClass,
  labelClass,
} from "./ui";

export interface EntryRowProps {
  entry: DraftEntry;
  index: number;
  /** Label dat wordt gebruikt zolang de gebruiker zelf niets invult. */
  placeholderLabel: string;
  /** Meetellend inkomen als tekst, of null zolang dat niet te bepalen is. */
  countingText: string | null;
  errorFor: (field: EntryField) => string | undefined;
  onChange: (field: keyof DraftEntry, value: string | null) => void;
  onBlurField: (field: EntryField) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function EntryRow({
  entry,
  index,
  placeholderLabel,
  countingText,
  errorFor,
  onChange,
  onBlurField,
  onRemove,
  canRemove,
}: EntryRowProps) {
  const rowName = entry.label.trim() || placeholderLabel;
  const fieldId = (field: string) => `${entry.id}-${field}`;
  const receivedError = errorFor("received");
  const correctionError = errorFor("correction");
  const categoryError = errorFor("correctionCategoryId");

  const cell = "block px-0 py-2 align-top md:table-cell md:px-2 md:py-2";

  return (
    <tr className="mb-3 block rounded-lg border border-line p-4 last:mb-0 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-b md:border-line md:p-0">
      <td className={cell}>
        <label htmlFor={fieldId("label")} className={`${labelClass} md:sr-only`}>
          Periode
        </label>
        <input
          id={fieldId("label")}
          className={`${inputClass} mt-1 md:mt-0`}
          value={entry.label}
          placeholder={placeholderLabel}
          onChange={(event) => onChange("label", event.target.value)}
          autoComplete="off"
        />
      </td>

      <td className={cell}>
        <label
          htmlFor={fieldId("received")}
          className={`${labelClass} md:sr-only`}
        >
          Ontvangen inkomen
        </label>
        <div className="relative mt-1 md:mt-0">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted"
          >
            €
          </span>
          <input
            id={fieldId("received")}
            className={`${amountInputClass} ${receivedError ? invalidInputClass : ""}`}
            value={entry.received}
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={receivedError ? true : undefined}
            aria-describedby={receivedError ? fieldId("received-error") : undefined}
            onChange={(event) => onChange("received", event.target.value)}
            onBlur={() => onBlurField("received")}
            autoComplete="off"
          />
        </div>
        {receivedError ? (
          <p id={fieldId("received-error")} className="mt-1 text-xs text-danger">
            {receivedError}
          </p>
        ) : null}
      </td>

      <td className={cell}>
        <label
          htmlFor={fieldId("correction")}
          className={`${labelClass} md:sr-only`}
        >
          Correctie
        </label>
        <div className="relative mt-1 md:mt-0">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted"
          >
            €
          </span>
          <input
            id={fieldId("correction")}
            className={`${amountInputClass} ${correctionError ? invalidInputClass : ""}`}
            value={entry.correction}
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={correctionError ? true : undefined}
            aria-describedby={
              correctionError ? fieldId("correction-error") : undefined
            }
            onChange={(event) => onChange("correction", event.target.value)}
            onBlur={() => onBlurField("correction")}
            autoComplete="off"
          />
        </div>
        {correctionError ? (
          <p
            id={fieldId("correction-error")}
            className="mt-1 text-xs text-danger"
          >
            {correctionError}
          </p>
        ) : null}
      </td>

      <td className={cell}>
        <label
          htmlFor={fieldId("category")}
          className={`${labelClass} md:sr-only`}
        >
          Reden correctie
        </label>
        <select
          id={fieldId("category")}
          className={`${inputClass} mt-1 md:mt-0 ${categoryError ? invalidInputClass : ""}`}
          value={entry.correctionCategoryId ?? ""}
          aria-invalid={categoryError ? true : undefined}
          aria-describedby={categoryError ? fieldId("category-error") : undefined}
          onChange={(event) =>
            onChange("correctionCategoryId", event.target.value || null)
          }
          onBlur={() => onBlurField("correctionCategoryId")}
        >
          <option value="">Geen correctie</option>
          {CORRECTION_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        {categoryError ? (
          <p id={fieldId("category-error")} className="mt-1 text-xs text-danger">
            {categoryError}
          </p>
        ) : null}
      </td>

      <td className={cell}>
        <label htmlFor={fieldId("note")} className={`${labelClass} md:sr-only`}>
          Notitie
        </label>
        <input
          id={fieldId("note")}
          className={`${inputClass} mt-1 md:mt-0`}
          value={entry.note}
          placeholder="Optioneel"
          onChange={(event) => onChange("note", event.target.value)}
          autoComplete="off"
        />
      </td>

      <td className={`${cell} md:text-right`}>
        <span className={`${labelClass} md:sr-only`}>Meetellend inkomen</span>
        <span
          className={`mt-1 block text-sm font-semibold tabular md:mt-0 ${
            countingText ? "text-ink" : "text-ink-muted"
          }`}
          data-testid={`counting-${index}`}
        >
          {countingText ?? "—"}
        </span>
      </td>

      <td className={`${cell} md:w-10 md:text-right`}>
        <button
          type="button"
          onClick={onRemove}
          title={`${rowName} verwijderen`}
          disabled={!canRemove}
          className="mt-3 w-full rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 md:mt-0 md:w-auto md:border-0 md:px-2 md:py-1"
        >
          <span aria-hidden="true" className="md:text-base">
            <span className="md:hidden">Regel verwijderen</span>
            <span className="hidden md:inline">×</span>
          </span>
          <span className="sr-only">{rowName} verwijderen</span>
        </button>
      </td>
    </tr>
  );
}

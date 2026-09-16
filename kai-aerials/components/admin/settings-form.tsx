"use client";

import { useActionState } from "react";

import {
  saveSettingsAction,
} from "@/app/actions/admin";
import { emptyActionState, type ActionState } from "@/lib/form-state";
import type { BookingSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: BookingSettings }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveSettingsAction,
    emptyActionState,
  );

  return (
    <form action={action} className="space-y-5">
      {state.status !== "idle" && (
        <p
          className={`notice ${state.status === "error" ? "notice-error" : "notice-success"}`}
          role="status"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="slotInterval"
          name="slotIntervalMinutes"
          label="Tijdsloten om de hoeveel minuten"
          defaultValue={settings.slotIntervalMinutes}
          hint="Bijvoorbeeld 30: afspraken beginnen dan om 09:00, 09:30, 10:00…"
          error={state.errors?.slotIntervalMinutes}
        />
        <Field
          id="buffer"
          name="defaultBufferMinutes"
          label="Standaard buffertijd tussen afspraken"
          defaultValue={settings.defaultBufferMinutes}
          hint="Reistijd en opruimen. Geldt als een dienst zelf geen buffer heeft."
          error={state.errors?.defaultBufferMinutes}
        />
        <Field
          id="lead"
          name="minLeadHours"
          label="Minimaal aantal uren vooraf boeken"
          defaultValue={settings.minLeadHours}
          hint="Tijdsloten die eerder liggen, zijn niet te kiezen."
          error={state.errors?.minLeadHours}
        />
        <Field
          id="advance"
          name="maxAdvanceDays"
          label="Maximaal aantal dagen vooruit boeken"
          defaultValue={settings.maxAdvanceDays}
          error={state.errors?.maxAdvanceDays}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Bezig met opslaan…" : "Boekingsregels opslaan"}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
  hint,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        min={0}
        defaultValue={defaultValue}
        className="field-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

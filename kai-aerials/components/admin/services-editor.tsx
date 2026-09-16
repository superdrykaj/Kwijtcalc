"use client";

import { useActionState, useState } from "react";

import {
  deleteServiceAction,
  saveServiceAction,
} from "@/app/actions/admin";
import { emptyActionState, type ActionState } from "@/lib/form-state";
import { Panel } from "@/components/admin/ui";
import type { BookingSettings, Service } from "@/lib/types";

export function ServicesEditor({
  services,
  settings,
}: {
  services: Service[];
  settings: BookingSettings;
}) {
  const [editing, setEditing] = useState<number | "new" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setEditing(editing === "new" ? null : "new")}
        >
          {editing === "new" ? "Annuleren" : "Nieuwe dienst"}
        </button>
      </div>

      {editing === "new" && (
        <Panel title="Nieuwe dienst">
          <ServiceForm settings={settings} onDone={() => setEditing(null)} />
        </Panel>
      )}

      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-600 px-6 py-14 text-center">
          <p className="font-semibold">Nog geen diensten</p>
          <p className="mt-2 text-sm text-mist-500">
            Voeg een dienst toe zodat bezoekers iets kunnen kiezen.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
                      {service.name}
                    </h2>
                    {!service.active && <span className="chip">Verborgen</span>}
                    {service.active && !service.bookable && (
                      <span className="chip">Niet online boekbaar</span>
                    )}
                    {service.introOnly && <span className="chip">Via kennismaking</span>}
                  </div>
                  <p className="mt-1 text-sm text-mist-500">
                    {service.durationMinutes} min
                    {service.bufferMinutes > 0 &&
                      ` · ${service.bufferMinutes} min buffer`}
                    {service.priceLabel && ` · ${service.priceLabel}`}
                  </p>
                  {service.description && (
                    <p className="mt-2 max-w-2xl text-sm text-mist-500">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() =>
                      setEditing(editing === service.id ? null : service.id)
                    }
                  >
                    {editing === service.id ? "Sluiten" : "Bewerken"}
                  </button>
                  <form action={deleteServiceAction}>
                    <input type="hidden" name="id" value={service.id} />
                    <button type="submit" className="btn btn-quiet text-rose-300">
                      Verwijderen
                    </button>
                  </form>
                </div>
              </div>

              {editing === service.id && (
                <div className="mt-6 border-t border-ink-700 pt-6">
                  <ServiceForm
                    service={service}
                    settings={settings}
                    onDone={() => setEditing(null)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-mist-600">
        Een dienst met bestaande boekingen wordt bij verwijderen alleen verborgen,
        zodat oude afspraken hun dienstnaam houden.
      </p>
    </div>
  );
}

function ServiceForm({
  service,
  settings,
  onDone,
}: {
  service?: Service;
  settings: BookingSettings;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveServiceAction,
    emptyActionState,
  );
  const prefix = service ? `service-${service.id}` : "service-new";

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
      {service && <input type="hidden" name="id" value={service.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${prefix}-name`}
          name="name"
          label="Naam"
          defaultValue={service?.name ?? ""}
          error={state.errors?.name}
          required
        />
        <Field
          id={`${prefix}-price`}
          name="priceLabel"
          label="Prijsindicatie"
          defaultValue={service?.priceLabel ?? ""}
          hint="Bijvoorbeeld: indicatie vanaf € 149, of: gratis"
        />
        <Field
          id={`${prefix}-duration`}
          name="durationMinutes"
          label="Duur in minuten"
          type="number"
          defaultValue={String(service?.durationMinutes ?? 60)}
          error={state.errors?.durationMinutes}
          required
        />
        <Field
          id={`${prefix}-buffer`}
          name="bufferMinutes"
          label="Buffertijd in minuten"
          type="number"
          defaultValue={String(service?.bufferMinutes ?? 0)}
          hint={`0 = gebruik de standaard van ${settings.defaultBufferMinutes} minuten.`}
        />
        <Field
          id={`${prefix}-sort`}
          name="sortOrder"
          label="Volgorde"
          type="number"
          defaultValue={String(service?.sortOrder ?? 0)}
          hint="Lager getal staat bovenaan."
        />
      </div>

      <div>
        <label htmlFor={`${prefix}-description`} className="field-label">
          Omschrijving
        </label>
        <textarea
          id={`${prefix}-description`}
          name="description"
          rows={3}
          defaultValue={service?.description ?? ""}
          className="field-input"
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <Check id={`${prefix}-active`} name="active" label="Zichtbaar op de site" defaultChecked={service?.active ?? true} />
        <Check
          id={`${prefix}-bookable`}
          name="bookable"
          label="Online boekbaar"
          defaultChecked={service?.bookable ?? true}
        />
        <Check
          id={`${prefix}-intro`}
          name="introOnly"
          label="Eerst een kennismaking"
          defaultChecked={service?.introOnly ?? false}
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Bezig met opslaan…" : "Opslaan"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onDone}>
          Sluiten
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
  type = "text",
  hint,
  error,
  required,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
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

function Check({
  id,
  name,
  label,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-ink-600 bg-ink-900"
      />
      {label}
    </label>
  );
}

"use client";

import { useActionState } from "react";

import { sendContactAction } from "@/app/actions/public";
import { emptyFormState, type FormState } from "@/lib/form-state";

export function ContactForm({ mailReady }: { mailReady: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    sendContactAction,
    emptyFormState,
  );

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-xl border border-ink-700 bg-ink-900 p-7 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-azure-600/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12.5 10 17.5 19 7"
              stroke="var(--color-azure-300)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="display-3 mt-4 text-base">Bedankt voor je bericht</p>
        <p className="mt-3 text-sm leading-relaxed text-mist-500">
          Je bericht is opgeslagen en staat klaar in mijn beheeromgeving. Ik
          reageer meestal binnen één werkdag.
        </p>
        <p className="mt-4 text-xs text-mist-600">
          {state.result?.mailSent
            ? "Je ontvangt ook een bevestiging per e-mail."
            : "Let op: e-mail is op deze site nog niet ingesteld, dus je krijgt nu geen bevestigingsmail."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {!mailReady && (
        <p className="notice notice-warning">
          E-mail is nog niet ingesteld. Berichten worden wél opgeslagen en zijn
          zichtbaar in de beheeromgeving, maar er gaat nog geen e-mail uit.
        </p>
      )}

      {state.status === "error" && (
        <p className="notice notice-error" role="alert">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" name="name" label="Naam" required error={state.errors.name} autoComplete="name" />
        <Field
          id="contact-email"
          name="email"
          type="email"
          label="E-mailadres"
          required
          error={state.errors.email}
          autoComplete="email"
        />
      </div>

      <Field id="contact-subject" name="subject" label="Onderwerp" required error={state.errors.subject} />

      <div>
        <label htmlFor="contact-message" className="field-label">
          Bericht <Required />
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          className="field-input"
          aria-invalid={state.errors.message ? "true" : undefined}
          aria-describedby={
            state.errors.message ? "contact-message-error" : "contact-message-hint"
          }
        />
        {state.errors.message ? (
          <p id="contact-message-error" className="field-error">
            {state.errors.message}
          </p>
        ) : (
          <p id="contact-message-hint" className="field-hint">
            Vertel kort waar het om gaat en waar de locatie ligt.
          </p>
        )}
      </div>

      {/* Spamval: onzichtbaar voor mensen, ingevuld door bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Bezig met versturen…" : "Bericht versturen"}
      </button>

      <p className="text-xs leading-relaxed text-mist-600">
        Je gegevens worden alleen gebruikt om op je bericht te reageren en zijn
        niet zichtbaar voor andere bezoekers.
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  error,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <Required />}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="field-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function Required() {
  return (
    <span className="text-azure-300">
      <span aria-hidden="true">*</span>
      <span className="sr-only">(verplicht)</span>
    </span>
  );
}

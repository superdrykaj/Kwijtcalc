"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  requestBookingAction,
} from "@/app/actions/public";
import { emptyFormState, type FormState } from "@/lib/form-state";
import { site } from "@/content/site";
import {
  addDays,
  formatDateLong,
  formatDateShort,
  formatMinutes,
  formatTimestamp,
  monthLabel,
  todayKey,
} from "@/lib/time";

type PublicService = {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  priceLabel: string;
  bookable: boolean;
  introOnly: boolean;
};

type DaySlots = { dateKey: string; slots: { startUtc: number; minutes: number }[] };

const DAYS_PER_PAGE = 14;

const STEPS = ["Dienst", "Datum", "Tijd", "Gegevens", "Controle"] as const;

export function BookingWidget({ services }: { services: PublicService[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    requestBookingAction,
    emptyFormState,
  );

  const bookable = useMemo(() => services.filter((s) => s.bookable), [services]);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [rangeStart, setRangeStart] = useState(() => todayKey());
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [startUtc, setStartUtc] = useState<number | null>(null);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    description: "",
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const service = bookable.find((s) => s.id === serviceId) ?? null;
  const headingRef = useRef<HTMLParagraphElement>(null);

  const loadSlots = useCallback(
    async (id: number, from: string) => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(
          `/api/slots?serviceId=${id}&from=${from}&days=${DAYS_PER_PAGE}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("mislukt");
        const data = (await response.json()) as { days: DaySlots[] };
        setDays(data.days);
      } catch {
        setDays(null);
        setLoadError(
          "De beschikbare tijden konden niet worden geladen. Probeer het opnieuw.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Na een stapwissel de focus naar de nieuwe stap brengen.
  useEffect(() => {
    if (step > 0) headingRef.current?.focus();
  }, [step]);

  const selectedDay = days?.find((d) => d.dateKey === dateKey) ?? null;

  function chooseService(id: number) {
    const from = todayKey();
    setServiceId(id);
    setDateKey(null);
    setStartUtc(null);
    setRangeStart(from);
    setStep(1);
    void loadSlots(id, from);
  }

  function shiftRange(deltaDays: number) {
    const from = addDays(rangeStart, deltaDays);
    setRangeStart(from);
    setDateKey(null);
    if (serviceId) void loadSlots(serviceId, from);
  }

  function chooseDate(key: string) {
    setDateKey(key);
    setStartUtc(null);
    setStep(2);
  }

  function chooseTime(value: number) {
    setStartUtc(value);
    setStep(3);
  }

  function validateDetails(): boolean {
    const errors: Record<string, string> = {};
    if (details.name.trim().length < 2) errors.name = "Vul je naam in.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(details.email.trim())) {
      errors.email = "Vul een geldig e-mailadres in.";
    }
    if (details.location.trim().length < 3) {
      errors.location = "Vul de opnamelocatie in.";
    }
    if (details.description.trim().length < 10) {
      errors.description = "Beschrijf je project in minimaal 10 tekens.";
    }
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  }

  if (state.status === "success" && state.result) {
    return <BookingConfirmation result={state.result} />;
  }

  if (bookable.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-mist-300">
          Er zijn op dit moment geen diensten beschikbaar om online te boeken.
        </p>
        <a href={`mailto:${site.email}`} className="btn btn-ghost mt-5">
          Mail me rechtstreeks
        </a>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <Stepper current={step} onBack={(target) => setStep(target)} />

      <div className="p-5 sm:p-8">
        <p
          ref={headingRef}
          tabIndex={-1}
          aria-live="polite"
          className="display-3 mb-1 outline-none"
        >
          {step === 0 && "Wat wil je laten maken?"}
          {step === 1 && "Kies een datum"}
          {step === 2 && "Kies een tijd"}
          {step === 3 && "Jouw gegevens"}
          {step === 4 && "Controleer je aanvraag"}
        </p>
        <p className="mb-6 text-sm text-mist-500">
          {step === 0 && "Kies de dienst die het beste past. Twijfel je? Begin met een gratis kennismaking."}
          {step === 1 && `Alleen dagen met vrije tijden zijn te kiezen. Tijden in ${"Europe/Amsterdam"}.`}
          {step === 2 && dateKey && formatDateLong(dateKey)}
          {step === 3 && "Ik gebruik deze gegevens alleen om contact met je op te nemen over deze aanvraag."}
          {step === 4 && "Klopt alles? Dan kun je de aanvraag versturen."}
        </p>

        {/* Stap 1 — dienst -------------------------------------------------- */}
        {step === 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {bookable.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => chooseService(item.id)}
                  className={`group h-full w-full rounded-xl border p-5 text-left transition-colors ${
                    serviceId === item.id
                      ? "border-azure-500 bg-azure-600/10"
                      : "border-ink-600 bg-ink-900 hover:border-azure-500/60"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-[family-name:var(--font-display)] text-base font-semibold">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-xs text-mist-500">
                      {item.durationMinutes} min
                    </span>
                  </span>
                  {item.description && (
                    <span className="mt-2 block text-sm leading-relaxed text-mist-500">
                      {item.description}
                    </span>
                  )}
                  <span className="mt-3 block text-sm font-semibold text-azure-300">
                    {item.priceLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Stap 2 — datum --------------------------------------------------- */}
        {step === 1 && (
          <DatePicker
            days={days}
            loading={loading}
            error={loadError}
            rangeStart={rangeStart}
            onRetry={() => {
              if (serviceId) void loadSlots(serviceId, rangeStart);
            }}
            onPrev={() => shiftRange(-DAYS_PER_PAGE)}
            onNext={() => shiftRange(DAYS_PER_PAGE)}
            onPick={chooseDate}
            selected={dateKey}
          />
        )}

        {/* Stap 3 — tijd ---------------------------------------------------- */}
        {step === 2 && (
          <div>
            {!selectedDay || selectedDay.slots.length === 0 ? (
              <EmptyState
                title="Geen vrije tijden op deze dag"
                body="Kies een andere datum."
                action={
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                    Terug naar de datums
                  </button>
                }
              />
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {selectedDay.slots.map((slot) => (
                  <li key={slot.startUtc}>
                    <button
                      type="button"
                      onClick={() => chooseTime(slot.startUtc)}
                      className={`w-full rounded-lg border px-3 py-3 text-sm font-semibold tabular-nums transition-colors ${
                        startUtc === slot.startUtc
                          ? "border-azure-500 bg-azure-600/15 text-azure-300"
                          : "border-ink-600 bg-ink-900 hover:border-azure-500/60"
                      }`}
                    >
                      {formatMinutes(slot.minutes)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Stap 4 — gegevens ------------------------------------------------ */}
        {step === 3 && (
          <DetailsForm
            values={details}
            errors={{ ...localErrors, ...state.errors }}
            onChange={(next) => setDetails(next)}
            onSubmit={() => {
              if (validateDetails()) setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {/* Stap 5 — controle en versturen ---------------------------------- */}
        {step === 4 && service && startUtc && (
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="serviceId" value={service.id} />
            <input type="hidden" name="startUtc" value={startUtc} />
            <input type="hidden" name="name" value={details.name} />
            <input type="hidden" name="email" value={details.email} />
            <input type="hidden" name="phone" value={details.phone} />
            <input type="hidden" name="location" value={details.location} />
            <input type="hidden" name="description" value={details.description} />
            {/* Spamval: onzichtbaar voor mensen, ingevuld door bots. */}
            <input
              type="text"
              name="website"
              defaultValue=""
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <dl className="divide-y divide-ink-700 rounded-xl border border-ink-700 bg-ink-900">
              <Row label="Dienst" value={service.name} />
              <Row label="Wanneer" value={formatTimestamp(startUtc)} />
              <Row label="Duur" value={`${service.durationMinutes} minuten`} />
              <Row label="Indicatie" value={service.priceLabel || "In overleg"} />
              <Row label="Naam" value={details.name} />
              <Row label="E-mail" value={details.email} />
              {details.phone && <Row label="Telefoon" value={details.phone} />}
              <Row label="Opnamelocatie" value={details.location} />
              <Row label="Project" value={details.description} multiline />
            </dl>

            <p className="notice notice-info">{site.bookingDisclaimer}</p>

            {state.status === "error" && (
              <p className="notice notice-error" role="alert">
                {state.message}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Bezig met versturen…" : "Aanvraag versturen"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep(3)}
                disabled={pending}
              >
                Gegevens aanpassen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6">
      <dt className="w-40 shrink-0 text-sm text-mist-500">{label}</dt>
      <dd
        className={`text-sm text-mist-100 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Stepper({
  current,
  onBack,
}: {
  current: number;
  onBack: (step: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-ink-700 bg-ink-900/60 px-4 py-3 text-xs sm:px-8">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex items-center gap-1">
            {done ? (
              <button
                type="button"
                onClick={() => onBack(index)}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-mist-500 hover:text-azure-300"
              >
                <Dot done />
                {label}
              </button>
            ) : (
              <span
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-1.5 px-2 py-1 ${
                  active ? "font-semibold text-mist-100" : "text-mist-600"
                }`}
              >
                <Dot done={false} active={active} />
                {label}
              </span>
            )}
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className="text-ink-600">
                ·
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Dot({ done, active }: { done: boolean; active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        done ? "bg-azure-400" : active ? "bg-mist-100" : "bg-ink-600"
      }`}
    />
  );
}

function DatePicker({
  days,
  loading,
  error,
  rangeStart,
  selected,
  onPrev,
  onNext,
  onPick,
  onRetry,
}: {
  days: DaySlots[] | null;
  loading: boolean;
  error: string | null;
  rangeStart: string;
  selected: string | null;
  onPrev: () => void;
  onNext: () => void;
  onPick: (dateKey: string) => void;
  onRetry: () => void;
}) {
  const today = todayKey();
  const canGoBack = rangeStart > today;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" aria-busy="true">
        {Array.from({ length: DAYS_PER_PAGE }).map((_, i) => (
          <div
            key={i}
            className="h-[4.5rem] animate-pulse rounded-lg border border-ink-700 bg-ink-800"
          />
        ))}
        <span className="sr-only">Beschikbare tijden worden geladen…</span>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Laden mislukt"
        body={error}
        action={
          <button type="button" className="btn btn-ghost" onClick={onRetry}>
            Opnieuw proberen
          </button>
        }
      />
    );
  }

  const available = days?.filter((d) => d.slots.length > 0) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-quiet"
          onClick={onPrev}
          disabled={!canGoBack}
        >
          ← Eerder
        </button>
        <p className="text-sm font-medium text-mist-300">{monthLabel(rangeStart)}</p>
        <button type="button" className="btn btn-quiet" onClick={onNext}>
          Later →
        </button>
      </div>

      {available.length === 0 ? (
        <EmptyState
          title="Geen vrije dagen in deze periode"
          body="Kijk verder vooruit met de knop 'Later', of stuur me een bericht als je iets specifieks zoekt."
          action={
            <button type="button" className="btn btn-ghost" onClick={onNext}>
              Later kijken →
            </button>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days?.map((day) => {
            const free = day.slots.length;
            const disabled = free === 0;
            return (
              <li key={day.dateKey}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(day.dateKey)}
                  className={`h-full w-full rounded-lg border px-2 py-3 text-center transition-colors ${
                    selected === day.dateKey
                      ? "border-azure-500 bg-azure-600/15"
                      : disabled
                        ? "cursor-not-allowed border-ink-800 bg-ink-900/40 text-mist-600"
                        : "border-ink-600 bg-ink-900 hover:border-azure-500/60"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {formatDateShort(day.dateKey)}
                  </span>
                  <span className="mt-1 block text-xs text-mist-500">
                    {disabled ? "—" : `${free} ${free === 1 ? "tijd" : "tijden"}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DetailsForm({
  values,
  errors,
  onChange,
  onSubmit,
  onBack,
}: {
  values: {
    name: string;
    email: string;
    phone: string;
    location: string;
    description: string;
  };
  errors: Record<string, string>;
  onChange: (next: typeof values) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [key]: event.target.value });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="booking-name"
          label="Naam"
          required
          error={errors.name}
          value={values.name}
          onChange={set("name")}
          autoComplete="name"
        />
        <Field
          id="booking-email"
          label="E-mailadres"
          type="email"
          required
          error={errors.email}
          value={values.email}
          onChange={set("email")}
          autoComplete="email"
        />
        <Field
          id="booking-phone"
          label="Telefoonnummer"
          hint="Optioneel. Handig als het weer roet in het eten gooit."
          error={errors.phone}
          value={values.phone}
          onChange={set("phone")}
          autoComplete="tel"
        />
        <Field
          id="booking-location"
          label="Opnamelocatie"
          required
          hint="Adres of omschrijving van de plek."
          error={errors.location}
          value={values.location}
          onChange={set("location")}
        />
      </div>

      <div>
        <label htmlFor="booking-description" className="field-label">
          Korte projectomschrijving <Required />
        </label>
        <textarea
          id="booking-description"
          rows={4}
          required
          className="field-input"
          value={values.description}
          onChange={set("description")}
          aria-invalid={errors.description ? "true" : undefined}
          aria-describedby={
            errors.description ? "booking-description-error" : "booking-description-hint"
          }
        />
        {errors.description ? (
          <p id="booking-description-error" className="field-error">
            {errors.description}
          </p>
        ) : (
          <p id="booking-description-hint" className="field-hint">
            Waar gaat het om, en waarvoor ga je de beelden gebruiken?
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary">
          Naar het overzicht
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Terug
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <Required />}
      </label>
      <input
        id={id}
        type={type}
        className="field-input"
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
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

function Required() {
  return (
    <span className="text-azure-300">
      <span aria-hidden="true">*</span>
      <span className="sr-only">(verplicht)</span>
    </span>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink-600 px-6 py-12 text-center">
      <p className="font-semibold text-mist-100">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-mist-500">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function BookingConfirmation({
  result,
}: {
  result: NonNullable<FormState["result"]>;
}) {
  return (
    <div className="card p-8 text-center" role="status">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-azure-600/20">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12.5 10 17.5 19 7"
            stroke="var(--color-azure-300)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="display-3 mt-5">Je aanvraag is ontvangen</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist-300">
        Ik heb je aanvraag voor <strong>{result.serviceName}</strong> op{" "}
        <strong>{result.when}</strong> binnengekregen. Ik controleer de locatie,
        het luchtruim en het weer en laat je zo snel mogelijk weten of het doorgaat.
      </p>
      <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-900 px-4 py-2 text-sm">
        <span className="text-mist-500">Kenmerk</span>
        <span className="font-semibold tabular-nums">{result.reference}</span>
      </p>
      <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-mist-500">
        {result.mailSent
          ? "Je ontvangt een bevestigingsmail op het opgegeven adres."
          : "Let op: het versturen van e-mail is op deze site nog niet ingesteld, dus je krijgt nu geen bevestigingsmail. Je aanvraag is wél opgeslagen."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/portfolio" className="btn btn-ghost">
          Bekijk mijn werk
        </Link>
        <a href={`mailto:${site.email}`} className="btn btn-quiet">
          Mail me een aanvulling
        </a>
      </div>
    </div>
  );
}

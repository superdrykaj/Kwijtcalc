"use client";

import { useActionState, useMemo, useState } from "react";

import {
  deleteBookingAction,
  rescheduleBookingAction,
  saveBookingNoteAction,
  updateBookingStatusAction,
} from "@/app/actions/admin";
import { emptyActionState, type ActionState } from "@/lib/form-state";
import { StatusBadge } from "@/components/admin/ui";
import {
  dateKeyOf,
  formatDateLong,
  formatMinutes,
  formatTimestamp,
  minutesOfDayOf,
  todayKey,
} from "@/lib/time";
import { STATUS_LABELS, type Booking, type BookingStatus } from "@/lib/types";

type View = "list" | "calendar";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Alles" },
  { key: "pending", label: "Aangevraagd" },
  { key: "confirmed", label: "Bevestigd" },
  { key: "rejected", label: "Afgewezen" },
  { key: "cancelled", label: "Geannuleerd" },
];

export function BookingsManager({
  bookings,
  initialStatus,
  conflictIds,
  mailReady,
}: {
  bookings: Booking[];
  initialStatus: string;
  conflictIds: number[];
  mailReady: boolean;
}) {
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState(initialStatus);
  const [openId, setOpenId] = useState<number | null>(null);

  const shown = useMemo(
    () =>
      filter === "all" ? bookings : bookings.filter((b) => b.status === filter),
    [bookings, filter],
  );

  const conflictSet = useMemo(() => new Set(conflictIds), [conflictIds]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filter op status" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const count =
              item.key === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === item.key).length;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  filter === item.key
                    ? "border-azure-500 bg-azure-600/15 text-azure-300"
                    : "border-ink-600 text-mist-500 hover:text-mist-100"
                }`}
              >
                {item.label}
                <span className="ml-2 text-xs text-mist-600">{count}</span>
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Weergave" className="flex gap-1 rounded-full border border-ink-600 p-1">
          <ViewButton active={view === "list"} onClick={() => setView("list")} label="Lijst" />
          <ViewButton active={view === "calendar"} onClick={() => setView("calendar")} label="Agenda" />
        </div>
      </div>

      {!mailReady && (
        <p className="notice notice-warning mb-5">
          E-mail is niet ingesteld: als je bevestigt of annuleert, krijgt de klant
          géén automatisch bericht. Neem zelf contact op.
        </p>
      )}

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-600 px-6 py-16 text-center">
          <p className="font-semibold">Geen boekingen in deze weergave</p>
          <p className="mt-2 text-sm text-mist-500">
            Pas het filter aan of wacht op nieuwe aanvragen.
          </p>
        </div>
      ) : view === "list" ? (
        <ul className="space-y-3">
          {shown.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              open={openId === booking.id}
              onToggle={() => setOpenId(openId === booking.id ? null : booking.id)}
              conflict={conflictSet.has(booking.id)}
            />
          ))}
        </ul>
      ) : (
        <CalendarView
          bookings={shown}
          onPick={(id) => {
            setView("list");
            setOpenId(id);
          }}
        />
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
        active ? "bg-ink-800 font-semibold text-mist-100" : "text-mist-500"
      }`}
    >
      {label}
    </button>
  );
}

function BookingRow({
  booking,
  open,
  onToggle,
  conflict,
}: {
  booking: Booking;
  open: boolean;
  onToggle: () => void;
  conflict: boolean;
}) {
  return (
    <li className={`card overflow-hidden ${conflict ? "border-amber-500/50" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left hover:bg-ink-800/50"
      >
        <span className="w-48 shrink-0 text-sm tabular-nums text-mist-300">
          {formatTimestamp(booking.startUtc)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{booking.name}</span>
          <span className="block truncate text-sm text-mist-500">
            {booking.serviceName} · {booking.location || "geen locatie"}
          </span>
        </span>
        <StatusBadge status={booking.status} label={STATUS_LABELS[booking.status]} />
        <span className="font-mono text-xs text-mist-600">{booking.reference}</span>
        <span aria-hidden="true" className="text-mist-600">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {conflict && (
        <p className="border-t border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-300">
          Deze afspraak valt buiten je huidige beschikbaarheid.
        </p>
      )}

      {open && <BookingDetail booking={booking} />}
    </li>
  );
}

function BookingDetail({ booking }: { booking: Booking }) {
  const [statusState, statusAction, statusPending] = useActionState<ActionState, FormData>(
    updateBookingStatusAction,
    emptyActionState,
  );
  const [moveState, moveAction, movePending] = useActionState<ActionState, FormData>(
    rescheduleBookingAction,
    emptyActionState,
  );
  const [noteState, noteAction, notePending] = useActionState<ActionState, FormData>(
    saveBookingNoteAction,
    emptyActionState,
  );

  const dateKey = dateKeyOf(booking.startUtc);
  const time = formatMinutes(minutesOfDayOf(booking.startUtc));

  return (
    <div className="border-t border-ink-700 bg-ink-900/60 p-5">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-mist-100">Gegevens</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Kenmerk" value={booking.reference} />
            <Row label="Dienst" value={booking.serviceName} />
            <Row label="Wanneer" value={`${formatDateLong(dateKey)}, ${time}`} />
            <Row
              label="Duur"
              value={`${Math.round((booking.endUtc - booking.startUtc) / 60000)} minuten`}
            />
            <Row label="Naam" value={booking.name} />
            <Row
              label="E-mail"
              value={
                <a href={`mailto:${booking.email}`} className="text-azure-300 hover:underline">
                  {booking.email}
                </a>
              }
            />
            <Row label="Telefoon" value={booking.phone || "—"} />
            <Row label="Locatie" value={booking.location || "—"} />
            <Row label="Aangevraagd op" value={formatTimestamp(booking.createdUtc)} />
          </dl>

          <h3 className="mt-6 text-sm font-semibold text-mist-100">Projectomschrijving</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-lg border border-ink-700 bg-ink-900 p-3 text-sm text-mist-300">
            {booking.description || "—"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Status wijzigen ------------------------------------------------ */}
          <div>
            <h3 className="text-sm font-semibold text-mist-100">Status</h3>
            {statusState.status !== "idle" && (
              <p
                className={`notice mt-3 ${
                  statusState.status === "error" ? "notice-error" : "notice-success"
                }`}
                role="status"
              >
                {statusState.message}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {(["confirmed", "rejected", "cancelled", "pending"] as BookingStatus[])
                .filter((s) => s !== booking.status)
                .map((status) => (
                  <form key={status} action={statusAction}>
                    <input type="hidden" name="id" value={booking.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={statusPending}
                      className={`btn btn-quiet ${
                        status === "confirmed" ? "border-emerald-500/40 text-emerald-300" : ""
                      }`}
                    >
                      {status === "confirmed" && "Bevestigen"}
                      {status === "rejected" && "Afwijzen"}
                      {status === "cancelled" && "Annuleren"}
                      {status === "pending" && "Terug naar aangevraagd"}
                    </button>
                  </form>
                ))}
            </div>
            <p className="field-hint">
              Bij afwijzen of annuleren komt het tijdslot weer vrij voor anderen.
            </p>
          </div>

          {/* Verplaatsen ---------------------------------------------------- */}
          <form action={moveAction}>
            <h3 className="text-sm font-semibold text-mist-100">Verplaatsen</h3>
            {moveState.status !== "idle" && (
              <p
                className={`notice mt-3 ${
                  moveState.status === "error" ? "notice-error" : "notice-success"
                }`}
                role="status"
              >
                {moveState.message}
              </p>
            )}
            <input type="hidden" name="id" value={booking.id} />
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor={`date-${booking.id}`} className="field-label">
                  Datum
                </label>
                <input
                  id={`date-${booking.id}`}
                  name="dateKey"
                  type="date"
                  defaultValue={dateKey}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor={`time-${booking.id}`} className="field-label">
                  Tijd
                </label>
                <input
                  id={`time-${booking.id}`}
                  name="time"
                  type="time"
                  defaultValue={time}
                  className="field-input"
                />
              </div>
              <button type="submit" className="btn btn-ghost" disabled={movePending}>
                {movePending ? "Bezig…" : "Verplaatsen"}
              </button>
            </div>
            <p className="field-hint">
              Als beheerder mag je buiten je openingstijden plannen. Botsingen met
              andere afspraken worden wel tegengehouden.
            </p>
          </form>

          {/* Notitie -------------------------------------------------------- */}
          <form action={noteAction}>
            <label htmlFor={`note-${booking.id}`} className="field-label">
              Interne notitie
            </label>
            <textarea
              id={`note-${booking.id}`}
              name="note"
              rows={3}
              defaultValue={booking.adminNote}
              className="field-input"
            />
            <input type="hidden" name="id" value={booking.id} />
            <div className="mt-3 flex items-center gap-3">
              <button type="submit" className="btn btn-quiet" disabled={notePending}>
                Notitie opslaan
              </button>
              {noteState.status === "success" && (
                <span className="text-xs text-emerald-300" role="status">
                  {noteState.message}
                </span>
              )}
            </div>
          </form>

          <form action={deleteBookingAction} className="border-t border-ink-700 pt-4">
            <input type="hidden" name="id" value={booking.id} />
            <button type="submit" className="btn btn-quiet text-rose-300">
              Definitief verwijderen
            </button>
            <p className="field-hint">
              Verwijderen kan niet ongedaan worden gemaakt. Annuleren is meestal
              genoeg.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-mist-500">{label}</dt>
      <dd className="min-w-0 break-words text-mist-200">{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Agendaweergave                                                             */
/* -------------------------------------------------------------------------- */

function CalendarView({
  bookings,
  onPick,
}: {
  bookings: Booking[];
  onPick: (id: number) => void;
}) {
  const [monthStart, setMonthStart] = useState(() => {
    const today = todayKey();
    return `${today.slice(0, 7)}-01`;
  });

  const [year, month] = monthStart.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Maandag als eerste kolom.
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of bookings) {
      const key = dateKeyOf(booking.startUtc);
      map.set(key, [...(map.get(key) ?? []), booking]);
    }
    return map;
  }, [bookings]);

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setMonthStart(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`,
    );
  }

  const today = todayKey();

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <button type="button" className="btn btn-quiet" onClick={() => shiftMonth(-1)}>
          ← Vorige maand
        </button>
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {new Intl.DateTimeFormat("nl-NL", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(Date.UTC(year, month - 1, 1)))}
        </p>
        <button type="button" className="btn btn-quiet" onClick={() => shiftMonth(1)}>
          Volgende maand →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-mist-600">
        {["ma", "di", "wo", "do", "vr", "za", "zo"].map((day) => (
          <div key={day} className="pb-1 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const items = (byDate.get(dateKey) ?? []).sort(
            (a, b) => a.startUtc - b.startUtc,
          );
          return (
            <div
              key={dateKey}
              className={`min-h-24 rounded-lg border p-1.5 text-left ${
                dateKey === today
                  ? "border-azure-500/60 bg-azure-600/5"
                  : "border-ink-700 bg-ink-900/60"
              }`}
            >
              <span className="block text-xs tabular-nums text-mist-500">{i + 1}</span>
              <ul className="mt-1 space-y-1">
                {items.map((booking) => (
                  <li key={booking.id}>
                    <button
                      type="button"
                      onClick={() => onPick(booking.id)}
                      className={`w-full truncate rounded px-1.5 py-1 text-left text-[11px] leading-tight ${
                        booking.status === "confirmed"
                          ? "bg-emerald-500/15 text-emerald-200"
                          : booking.status === "pending"
                            ? "bg-amber-500/15 text-amber-200"
                            : "bg-ink-800 text-mist-500 line-through"
                      }`}
                      title={`${booking.name} — ${STATUS_LABELS[booking.status]}`}
                    >
                      {formatMinutes(minutesOfDayOf(booking.startUtc))} {booking.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-mist-600">
        Klik op een afspraak om de details in de lijst te openen. Tijden in
        Europe/Amsterdam.
      </p>
    </div>
  );
}

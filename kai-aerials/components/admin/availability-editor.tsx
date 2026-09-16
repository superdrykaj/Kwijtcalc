"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  addOverrideAction,
  deleteOverrideAction,
  saveWeeklyAvailabilityAction,
} from "@/app/actions/admin";
import { emptyActionState, type ActionState } from "@/lib/form-state";
import { Panel } from "@/components/admin/ui";
import {
  formatDateLong,
  formatMinutes,
  formatTimestamp,
  todayKey,
  WEEKDAY_LABELS,
} from "@/lib/time";
import type { BookingSettings, DateOverride, WeeklyWindow } from "@/lib/types";

const SLOTS_PER_DAY = 4;
/** Maandag eerst; de database gebruikt 0 = zondag. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AvailabilityEditor({
  weekly,
  overrides,
  conflicts,
  settings,
}: {
  weekly: WeeklyWindow[];
  overrides: DateOverride[];
  conflicts: { id: number; reference: string; name: string; startUtc: number; reason: string }[];
  settings: BookingSettings;
}) {
  const [weekState, weekAction, weekPending] = useActionState<ActionState, FormData>(
    saveWeeklyAvailabilityAction,
    emptyActionState,
  );
  const [overrideState, overrideAction, overridePending] = useActionState<
    ActionState,
    FormData
  >(addOverrideAction, emptyActionState);

  const [wholeDay, setWholeDay] = useState(true);

  const byWeekday = (weekday: number) =>
    weekly.filter((w) => w.weekday === weekday).slice(0, SLOTS_PER_DAY);

  const blocks = overrides.filter((o) => o.kind === "block");
  const extras = overrides.filter((o) => o.kind === "open");

  return (
    <div className="space-y-8">
      {conflicts.length > 0 && (
        <div className="notice notice-warning">
          <p>
            <strong>{conflicts.length}</strong>{" "}
            {conflicts.length === 1 ? "bestaande boeking valt" : "bestaande boekingen vallen"}{" "}
            buiten je huidige beschikbaarheid. Ze zijn niet verwijderd en blijven
            gewoon staan.
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {conflicts.map((conflict) => (
              <li key={conflict.id}>
                {conflict.reference} — {conflict.name},{" "}
                {formatTimestamp(conflict.startUtc)}
              </li>
            ))}
          </ul>
          <Link href="/admin/boekingen" className="btn btn-quiet mt-3">
            Bekijk en verplaats ze
          </Link>
        </div>
      )}

      {/* Weekschema --------------------------------------------------------- */}
      <Panel
        title="Standaardweek"
        description="Vul per dag maximaal vier periodes in. Laat een rij leeg als je die niet gebruikt. Een dag zonder periodes is niet boekbaar."
      >
        <form action={weekAction}>
          {weekState.status !== "idle" && (
            <p
              className={`notice mb-5 ${
                weekState.status === "error"
                  ? "notice-error"
                  : weekState.status === "warning"
                    ? "notice-warning"
                    : "notice-success"
              }`}
              role="status"
            >
              {weekState.message}
            </p>
          )}

          <div className="space-y-4">
            {WEEK_ORDER.map((weekday) => {
              const windows = byWeekday(weekday);
              return (
                <fieldset
                  key={weekday}
                  className="rounded-xl border border-ink-700 bg-ink-900/60 p-4"
                >
                  <legend className="px-2 text-sm font-semibold">
                    {WEEKDAY_LABELS[weekday]}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => {
                      const existing = windows[slot];
                      return (
                        <div key={slot} className="flex items-center gap-2">
                          <label className="sr-only" htmlFor={`d${weekday}-from-${slot}`}>
                            {WEEKDAY_LABELS[weekday]} periode {slot + 1} begintijd
                          </label>
                          <input
                            id={`d${weekday}-from-${slot}`}
                            name={`d${weekday}-from-${slot}`}
                            type="time"
                            defaultValue={
                              existing ? formatMinutes(existing.startMinute) : ""
                            }
                            className="field-input"
                          />
                          <span aria-hidden="true" className="text-mist-600">
                            –
                          </span>
                          <label className="sr-only" htmlFor={`d${weekday}-to-${slot}`}>
                            {WEEKDAY_LABELS[weekday]} periode {slot + 1} eindtijd
                          </label>
                          <input
                            id={`d${weekday}-to-${slot}`}
                            name={`d${weekday}-to-${slot}`}
                            type="time"
                            defaultValue={
                              existing ? formatMinutes(existing.endMinute) : ""
                            }
                            className="field-input"
                          />
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>

          <button type="submit" className="btn btn-primary mt-6" disabled={weekPending}>
            {weekPending ? "Bezig met opslaan…" : "Weekschema opslaan"}
          </button>
          <p className="field-hint">
            Tijden gelden in Europe/Amsterdam. Zomer- en wintertijd worden
            automatisch verwerkt. Minimaal {settings.minLeadHours} uur vooraf
            boeken, maximaal {settings.maxAdvanceDays} dagen vooruit (aan te passen
            bij Instellingen).
          </p>
        </form>
      </Panel>

      {/* Uitzonderingen ----------------------------------------------------- */}
      <Panel
        title="Uitzonderingen op losse datums"
        description="Blokkeer een dag of dagdeel voor vakantie of andere afspraken, of voeg juist extra beschikbaarheid toe buiten je standaardweek."
      >
        <form action={overrideAction} className="space-y-4">
          {overrideState.status !== "idle" && (
            <p
              className={`notice ${
                overrideState.status === "error"
                  ? "notice-error"
                  : overrideState.status === "warning"
                    ? "notice-warning"
                    : "notice-success"
              }`}
              role="status"
            >
              {overrideState.message}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="override-kind" className="field-label">
                Soort
              </label>
              <select id="override-kind" name="kind" className="field-input" defaultValue="block">
                <option value="block">Blokkeren (niet boekbaar)</option>
                <option value="open">Extra beschikbaarheid</option>
              </select>
            </div>
            <div>
              <label htmlFor="override-date" className="field-label">
                Datum
              </label>
              <input
                id="override-date"
                name="dateKey"
                type="date"
                required
                min={todayKey()}
                defaultValue={todayKey()}
                className="field-input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="override-note" className="field-label">
                Notitie (optioneel)
              </label>
              <input
                id="override-note"
                name="note"
                type="text"
                placeholder="Bijvoorbeeld: vakantie"
                className="field-input"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="wholeDay"
              checked={wholeDay}
              onChange={(event) => setWholeDay(event.target.checked)}
              className="h-4 w-4 rounded border-ink-600 bg-ink-900"
            />
            Hele dag
          </label>

          {!wholeDay && (
            <div className="grid gap-4 sm:grid-cols-2 lg:w-1/2">
              <div>
                <label htmlFor="override-from" className="field-label">
                  Van
                </label>
                <input
                  id="override-from"
                  name="from"
                  type="time"
                  defaultValue="09:00"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="override-to" className="field-label">
                  Tot
                </label>
                <input
                  id="override-to"
                  name="to"
                  type="time"
                  defaultValue="13:00"
                  className="field-input"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-ghost" disabled={overridePending}>
            {overridePending ? "Bezig…" : "Uitzondering toevoegen"}
          </button>
        </form>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <OverrideList
            title="Blokkades"
            empty="Geen blokkades vanaf vandaag."
            items={blocks}
          />
          <OverrideList
            title="Extra beschikbaarheid"
            empty="Geen extra beschikbaarheid vanaf vandaag."
            items={extras}
          />
        </div>
      </Panel>
    </div>
  );
}

function OverrideList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: DateOverride[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-mist-100">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-mist-500">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-700 rounded-xl border border-ink-700">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block text-mist-200">{formatDateLong(item.dateKey)}</span>
                <span className="block text-xs text-mist-500">
                  {item.startMinute === 0 && item.endMinute >= 1440
                    ? "hele dag"
                    : `${formatMinutes(item.startMinute)} – ${formatMinutes(item.endMinute)}`}
                  {item.note && ` · ${item.note}`}
                </span>
              </span>
              <form action={deleteOverrideAction}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="btn btn-quiet">
                  Verwijderen
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

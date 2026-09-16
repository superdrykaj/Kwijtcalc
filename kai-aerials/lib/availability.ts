// Let op: dit bestand draait alleen op de server (leest de database).
import { getDb } from "./db";
import {
  candidateStarts,
  conflictsWithBooking,
  mergeIntervals,
  subtractIntervals,
  type Interval,
} from "./intervals";
import { getSettings } from "./settings";
import {
  addDays,
  dateKeyOf,
  daysBetween,
  todayKey,
  wallTimeExists,
  weekdayOf,
  zonedToUtc,
} from "./time";
import { BLOCKING_STATUSES, type DateOverride, type Service, type WeeklyWindow } from "./types";

/* -------------------------------------------------------------------------- */
/* Standaardbeschikbaarheid per weekdag                                       */
/* -------------------------------------------------------------------------- */

export function listWeeklyWindows(): WeeklyWindow[] {
  return (
    getDb()
      .prepare(
        "SELECT id, weekday, start_minute, end_minute FROM weekly_availability ORDER BY weekday, start_minute",
      )
      .all() as {
      id: number;
      weekday: number;
      start_minute: number;
      end_minute: number;
    }[]
  ).map((r) => ({
    id: r.id,
    weekday: r.weekday,
    startMinute: r.start_minute,
    endMinute: r.end_minute,
  }));
}

/** Vervangt het hele weekschema in één transactie. */
export function replaceWeeklyWindows(
  windows: { weekday: number; startMinute: number; endMinute: number }[],
): void {
  const db = getDb();
  const write = db.transaction(() => {
    db.prepare("DELETE FROM weekly_availability").run();
    const insert = db.prepare(
      "INSERT INTO weekly_availability (weekday, start_minute, end_minute) VALUES (?, ?, ?)",
    );
    for (const w of windows) {
      if (w.endMinute > w.startMinute) {
        insert.run(w.weekday, w.startMinute, w.endMinute);
      }
    }
  });
  write();
}

/* -------------------------------------------------------------------------- */
/* Uitzonderingen op losse datums                                             */
/* -------------------------------------------------------------------------- */

export function listOverrides(fromKey?: string): DateOverride[] {
  const sql = fromKey
    ? "SELECT * FROM date_overrides WHERE date_key >= ? ORDER BY date_key, start_minute"
    : "SELECT * FROM date_overrides ORDER BY date_key, start_minute";
  const rows = (
    fromKey ? getDb().prepare(sql).all(fromKey) : getDb().prepare(sql).all()
  ) as {
    id: number;
    date_key: string;
    kind: string;
    start_minute: number;
    end_minute: number;
    note: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    dateKey: r.date_key,
    kind: r.kind === "open" ? "open" : "block",
    startMinute: r.start_minute,
    endMinute: r.end_minute,
    note: r.note,
  }));
}

export function addOverride(value: Omit<DateOverride, "id">): number {
  const result = getDb()
    .prepare(
      "INSERT INTO date_overrides (date_key, kind, start_minute, end_minute, note) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      value.dateKey,
      value.kind,
      value.startMinute,
      value.endMinute,
      value.note,
    );
  return Number(result.lastInsertRowid);
}

export function deleteOverride(id: number): void {
  getDb().prepare("DELETE FROM date_overrides WHERE id = ?").run(id);
}

/* -------------------------------------------------------------------------- */
/* Beschikbaarheid van één dag                                                */
/* -------------------------------------------------------------------------- */

/**
 * De open tijdvakken van een dag: het weekschema, aangevuld met extra
 * beschikbaarheid, waarna de blokkades eraf gaan.
 */
export function windowsForDate(
  dateKey: string,
  weekly: WeeklyWindow[],
  overrides: DateOverride[],
): Interval[] {
  const weekday = weekdayOf(dateKey);
  const base: Interval[] = weekly
    .filter((w) => w.weekday === weekday)
    .map((w) => ({ start: w.startMinute, end: w.endMinute }));

  const forDate = overrides.filter((o) => o.dateKey === dateKey);
  const extra = forDate
    .filter((o) => o.kind === "open")
    .map((o) => ({ start: o.startMinute, end: o.endMinute }));
  const blocks = forDate
    .filter((o) => o.kind === "block")
    .map((o) => ({ start: o.startMinute, end: o.endMinute }));

  return subtractIntervals(mergeIntervals([...base, ...extra]), blocks);
}

/* -------------------------------------------------------------------------- */
/* Bezette tijdvakken                                                          */
/* -------------------------------------------------------------------------- */

export type BusyBlock = Interval & { id: number };

/** Boekingen die een tijdslot bezet houden, binnen een periode in UTC-ms. */
export function busyBlocks(fromUtc: number, toUtc: number): BusyBlock[] {
  const placeholders = BLOCKING_STATUSES.map(() => "?").join(", ");
  const rows = getDb()
    .prepare(
      `SELECT id, start_utc, end_utc FROM bookings
       WHERE status IN (${placeholders}) AND end_utc > ? AND start_utc < ?
       ORDER BY start_utc`,
    )
    .all(...BLOCKING_STATUSES, fromUtc, toUtc) as {
    id: number;
    start_utc: number;
    end_utc: number;
  }[];
  return rows.map((r) => ({ id: r.id, start: r.start_utc, end: r.end_utc }));
}

/* -------------------------------------------------------------------------- */
/* Tijdsloten voor de boekingsmodule                                          */
/* -------------------------------------------------------------------------- */

export type DaySlots = {
  dateKey: string;
  slots: { startUtc: number; minutes: number }[];
};

/**
 * Berekent de vrije tijdsloten voor een dienst over een reeks dagen.
 * Houdt rekening met: weekschema, uitzonderingen, bestaande boekingen,
 * buffertijd, minimale voorbereidingstijd en de maximale boekingshorizon.
 */
export function slotsForRange(
  service: Service,
  fromKey: string,
  days: number,
  now: number = Date.now(),
): DaySlots[] {
  const settings = getSettings();
  const weekly = listWeeklyWindows();
  const overrides = listOverrides(fromKey);
  const buffer =
    (service.bufferMinutes > 0
      ? service.bufferMinutes
      : settings.defaultBufferMinutes) * 60000;

  const earliest = now + settings.minLeadHours * 3600000;
  const lastKey = addDays(todayKey(now), settings.maxAdvanceDays);

  const rangeStart = zonedToUtc(fromKey, 0);
  const rangeEnd = zonedToUtc(addDays(fromKey, days), 0);
  const busy = busyBlocks(rangeStart - 86400000, rangeEnd + 86400000);

  const result: DaySlots[] = [];
  for (let i = 0; i < days; i++) {
    const dateKey = addDays(fromKey, i);
    if (daysBetween(dateKey, lastKey) < 0) {
      result.push({ dateKey, slots: [] });
      continue;
    }
    const windows = windowsForDate(dateKey, weekly, overrides);
    const starts = candidateStarts(
      windows,
      service.durationMinutes,
      settings.slotIntervalMinutes,
    );
    const slots: { startUtc: number; minutes: number }[] = [];
    for (const minutes of starts) {
      if (!wallTimeExists(dateKey, minutes)) continue; // overgeslagen uur bij zomertijd
      const startUtc = zonedToUtc(dateKey, minutes);
      const endUtc = startUtc + service.durationMinutes * 60000;
      if (startUtc < earliest) continue;
      const blocked = busy.some((b) =>
        conflictsWithBooking({ start: startUtc, end: endUtc }, b, buffer),
      );
      if (blocked) continue;
      slots.push({ startUtc, minutes });
    }
    result.push({ dateKey, slots });
  }
  return result;
}

/**
 * Controleert één aangevraagd tijdstip volledig opnieuw op de server.
 * Geeft null terug als het tijdstip geldig is, anders een foutmelding.
 */
export type SlotCheckOptions = {
  /** Beheerder: mag buiten de openingstijden en voorbereidingstijd plannen. */
  asAdmin?: boolean;
};

export function validateSlot(
  service: Service,
  startUtc: number,
  now: number = Date.now(),
  ignoreBookingId?: number,
  options: SlotCheckOptions = {},
): string | null {
  const settings = getSettings();
  const endUtc = startUtc + service.durationMinutes * 60000;
  const dateKey = dateKeyOf(startUtc);

  if (!options.asAdmin && startUtc < now + settings.minLeadHours * 3600000) {
    return `Dit tijdstip ligt te dichtbij. Boek minimaal ${settings.minLeadHours} uur van tevoren.`;
  }
  if (
    !options.asAdmin &&
    daysBetween(dateKey, addDays(todayKey(now), settings.maxAdvanceDays)) < 0
  ) {
    return `Je kunt maximaal ${settings.maxAdvanceDays} dagen vooruit boeken.`;
  }

  const windows = windowsForDate(dateKey, listWeeklyWindows(), listOverrides(dateKey));
  const startMinutes = Math.round(
    (startUtc - zonedToUtc(dateKey, 0)) / 60000,
  );
  const fits = windows.some(
    (w) =>
      startMinutes >= w.start &&
      startMinutes + service.durationMinutes <= w.end,
  );
  if (!fits && !options.asAdmin) {
    return "Dit tijdstip valt buiten de beschikbare tijden.";
  }

  const buffer =
    (service.bufferMinutes > 0
      ? service.bufferMinutes
      : settings.defaultBufferMinutes) * 60000;
  const busy = busyBlocks(startUtc - 86400000, endUtc + 86400000).filter(
    (b) => b.id !== ignoreBookingId,
  );
  const clash = busy.some((b) =>
    conflictsWithBooking({ start: startUtc, end: endUtc }, b, buffer),
  );
  if (clash) {
    return "Dit tijdslot is net bezet geraakt. Kies een ander moment.";
  }
  return null;
}

/**
 * Boekingen die buiten de huidige beschikbaarheid vallen.
 * De beheeromgeving gebruikt dit om te waarschuwen na een wijziging.
 */
export function conflictingBookings(now: number = Date.now()): {
  id: number;
  reference: string;
  name: string;
  startUtc: number;
  reason: string;
}[] {
  const weekly = listWeeklyWindows();
  const overrides = listOverrides();
  const placeholders = BLOCKING_STATUSES.map(() => "?").join(", ");
  const rows = getDb()
    .prepare(
      `SELECT b.id, b.reference, b.name, b.start_utc, b.end_utc
       FROM bookings b
       WHERE b.status IN (${placeholders}) AND b.start_utc >= ?
       ORDER BY b.start_utc`,
    )
    .all(...BLOCKING_STATUSES, now) as {
    id: number;
    reference: string;
    name: string;
    start_utc: number;
    end_utc: number;
  }[];

  const out = [];
  for (const row of rows) {
    const dateKey = dateKeyOf(row.start_utc);
    const midnight = zonedToUtc(dateKey, 0);
    const startMinutes = Math.round((row.start_utc - midnight) / 60000);
    const endMinutes = Math.round((row.end_utc - midnight) / 60000);
    const windows = windowsForDate(dateKey, weekly, overrides);
    const fits = windows.some(
      (w) => startMinutes >= w.start && endMinutes <= w.end,
    );
    if (!fits) {
      out.push({
        id: row.id,
        reference: row.reference,
        name: row.name,
        startUtc: row.start_utc,
        reason: "valt buiten je huidige beschikbaarheid",
      });
    }
  }
  return out;
}

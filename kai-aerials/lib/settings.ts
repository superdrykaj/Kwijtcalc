// Let op: dit bestand draait alleen op de server (leest de database).
import { getDb } from "./db";
import type { BookingSettings } from "./types";

export const DEFAULT_SETTINGS: BookingSettings = {
  /** Raster waarop tijdsloten beginnen, in minuten. */
  slotIntervalMinutes: 30,
  /** Standaard rusttijd tussen twee afspraken, in minuten. */
  defaultBufferMinutes: 30,
  /** Minimaal aantal uren tussen nu en de eerste boekbare afspraak. */
  minLeadHours: 24,
  /** Hoe ver vooruit bezoekers kunnen boeken, in dagen. */
  maxAdvanceDays: 60,
};

export function getSettings(): BookingSettings {
  const rows = getDb()
    .prepare("SELECT key, value FROM settings")
    .all() as { key: string; value: string }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: keyof BookingSettings) => {
    const raw = map.get(key);
    const parsed = raw === undefined ? NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS[key];
  };
  return {
    slotIntervalMinutes: num("slotIntervalMinutes"),
    defaultBufferMinutes: num("defaultBufferMinutes"),
    minLeadHours: num("minLeadHours"),
    maxAdvanceDays: num("maxAdvanceDays"),
  };
}

export function saveSettings(next: BookingSettings): void {
  const stmt = getDb().prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  const write = getDb().transaction((values: BookingSettings) => {
    for (const [key, value] of Object.entries(values)) {
      stmt.run(key, String(value));
    }
  });
  write(next);
}

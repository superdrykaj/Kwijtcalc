/**
 * Tijdzonehulpmiddelen voor Europe/Amsterdam.
 *
 * Alle tijdstippen worden in de database opgeslagen als UTC-milliseconden.
 * De website en de beheeromgeving tonen en accepteren lokale tijd in
 * Europe/Amsterdam, inclusief de overgang naar zomer- en wintertijd.
 */

export const TIME_ZONE = "Europe/Amsterdam";

export const WEEKDAY_LABELS = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
] as const;

/** Wandkloktijd in Europe/Amsterdam. */
export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  weekday: number; // 0 = zondag
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Zet een UTC-tijdstip om naar de wandkloktijd in Europe/Amsterdam. */
export function toZonedParts(timestamp: number): ZonedParts {
  const parts = partsFormatter.formatToParts(new Date(timestamp));
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  let hour = Number(get("hour"));
  // Intl geeft in sommige omgevingen 24 terug voor middernacht.
  if (hour === 24) hour = 0;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

/** Offset van de tijdzone (in minuten) op het gegeven UTC-tijdstip. */
export function zoneOffsetMinutes(timestamp: number): number {
  const p = toZonedParts(timestamp);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  // Seconden en milliseconden van het oorspronkelijke tijdstip wegstrepen.
  const base = Math.floor(timestamp / 60000) * 60000;
  return (asUtc - base) / 60000;
}

/**
 * Zet een lokale datum ("2026-05-04") plus minuten-na-middernacht om naar een
 * UTC-tijdstip.
 *
 * Rond de zomertijdovergang:
 *  - Bestaat de wandkloktijd niet (nacht van zomertijd), dan geeft deze functie
 *    het tijdstip waarop de klok verspringt. Gebruik `wallTimeExists` om die
 *    situatie te herkennen en het tijdslot over te slaan.
 *  - Komt de wandkloktijd twee keer voor (nacht van wintertijd), dan wordt de
 *    eerste (zomertijd-) variant gekozen.
 */
export function zonedToUtc(dateKey: string, minutesOfDay: number): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const naive = Date.UTC(year, month - 1, day, 0, 0) + minutesOfDay * 60000;

  // Offsets ruim voor en na het gezochte moment: bij een overgang verschillen ze.
  const before = zoneOffsetMinutes(naive - 6 * 3600000);
  const after = zoneOffsetMinutes(naive + 6 * 3600000);

  const candidates = [naive - before * 60000, naive - after * 60000];
  const matching = candidates.filter((candidate) => {
    const p = toZonedParts(candidate);
    return (
      dateKeyFromParts(p) === dateKey &&
      p.hour * 60 + p.minute === minutesOfDay
    );
  });

  if (matching.length > 0) {
    // Komt de tijd twee keer voor (nacht van wintertijd), neem de eerste.
    return Math.min(...matching);
  }

  // De tijd bestaat niet (nacht van zomertijd): geef het moment met de
  // offset van vóór de overgang terug. `wallTimeExists` meldt dit als ongeldig.
  return naive - before * 60000;
}

/** Controleert of een lokale wandkloktijd echt bestaat (niet overgeslagen door zomertijd). */
export function wallTimeExists(dateKey: string, minutesOfDay: number): boolean {
  const utc = zonedToUtc(dateKey, minutesOfDay);
  const p = toZonedParts(utc);
  return (
    dateKeyFromParts(p) === dateKey && p.hour * 60 + p.minute === minutesOfDay
  );
}

export function dateKeyFromParts(p: ZonedParts): string {
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Lokale datumsleutel ("2026-05-04") van een UTC-tijdstip. */
export function dateKeyOf(timestamp: number): string {
  return dateKeyFromParts(toZonedParts(timestamp));
}

/** Minuten na middernacht (lokale tijd) van een UTC-tijdstip. */
export function minutesOfDayOf(timestamp: number): number {
  const p = toZonedParts(timestamp);
  return p.hour * 60 + p.minute;
}

/** Weekdag (0 = zondag) van een lokale datumsleutel. */
export function weekdayOf(dateKey: string): number {
  return toZonedParts(zonedToUtc(dateKey, 12 * 60)).weekday;
}

/** Datumsleutel n dagen later. */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(
    next.getUTCDate(),
  )}`;
}

/** Aantal dagen tussen twee datumsleutels (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000,
  );
}

export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** "09:30" van minuten na middernacht. */
export function formatMinutes(minutesOfDay: number): string {
  return `${pad(Math.floor(minutesOfDay / 60))}:${pad(minutesOfDay % 60)}`;
}

/** "09:30" omzetten naar minuten na middernacht; null bij ongeldige invoer. */
export function parseMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  const total = hours * 60 + minutes;
  return total > 1440 ? null : total;
}

const MONTHS_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

const DAYS_NL_SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];

/** "maandag 4 mei 2026" */
export function formatDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = weekdayOf(dateKey);
  const long = [
    "zondag",
    "maandag",
    "dinsdag",
    "woensdag",
    "donderdag",
    "vrijdag",
    "zaterdag",
  ][weekday];
  return `${long} ${d} ${MONTHS_NL[m - 1]} ${y}`;
}

/** "ma 4 mei" */
export function formatDateShort(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${DAYS_NL_SHORT[weekdayOf(dateKey)]} ${d} ${MONTHS_NL[m - 1]}`;
}

/** "ma 4 mei 2026, 09:30" van een UTC-tijdstip. */
export function formatTimestamp(timestamp: number): string {
  const key = dateKeyOf(timestamp);
  return `${formatDateShort(key)} ${toZonedParts(timestamp).year}, ${formatMinutes(
    minutesOfDayOf(timestamp),
  )}`;
}

export function monthLabel(dateKey: string): string {
  const [y, m] = dateKey.split("-").map(Number);
  return `${MONTHS_NL[m - 1]} ${y}`;
}

/** Datumsleutel van vandaag in Europe/Amsterdam. */
export function todayKey(now: number = Date.now()): string {
  return dateKeyOf(now);
}

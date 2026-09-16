/**
 * Rekenwerk met tijdvakken, zonder database. Alle waarden zijn minuten na
 * middernacht (lokale tijd) of UTC-milliseconden, zoals per functie vermeld.
 */

export type Interval = { start: number; end: number };

/** Voegt overlappende en aansluitende tijdvakken samen. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = intervals
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const current of sorted) {
    const last = out[out.length - 1];
    if (last && current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      out.push({ ...current });
    }
  }
  return out;
}

/** Haalt tijdvakken van elkaar af: `base` min `holes`. */
export function subtractIntervals(
  base: Interval[],
  holes: Interval[],
): Interval[] {
  let result = mergeIntervals(base);
  for (const hole of mergeIntervals(holes)) {
    const next: Interval[] = [];
    for (const piece of result) {
      if (hole.end <= piece.start || hole.start >= piece.end) {
        next.push(piece);
        continue;
      }
      if (hole.start > piece.start) {
        next.push({ start: piece.start, end: hole.start });
      }
      if (hole.end < piece.end) {
        next.push({ start: hole.end, end: piece.end });
      }
    }
    result = next;
  }
  return result;
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Begintijden binnen de beschikbare tijdvakken waar een afspraak van
 * `durationMinutes` volledig in past.
 *
 * @param windows  beschikbare tijdvakken (minuten na middernacht)
 * @param interval raster waarop een afspraak mag beginnen, in minuten
 */
export function candidateStarts(
  windows: Interval[],
  durationMinutes: number,
  interval: number,
): number[] {
  const step = Math.max(5, interval);
  const starts: number[] = [];
  for (const window of mergeIntervals(windows)) {
    // Begin op het eerste rasterpunt op of na het begin van het tijdvak.
    let start = Math.ceil(window.start / step) * step;
    if (start < window.start) start = window.start;
    for (; start + durationMinutes <= window.end; start += step) {
      starts.push(start);
    }
  }
  return [...new Set(starts)].sort((a, b) => a - b);
}

/**
 * Controleert of een afspraak botst met een bestaande boeking.
 * Alle waarden in milliseconden. De buffertijd wordt aan beide kanten van de
 * nieuwe afspraak aangehouden.
 */
export function conflictsWithBooking(
  candidate: Interval,
  booking: Interval,
  bufferMs: number,
): boolean {
  return overlaps(
    { start: candidate.start - bufferMs, end: candidate.end + bufferMs },
    booking,
  );
}

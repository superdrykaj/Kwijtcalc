import { describe, expect, it } from "vitest";
import {
  candidateStarts,
  conflictsWithBooking,
  mergeIntervals,
  subtractIntervals,
} from "./intervals";

describe("tijdvakken", () => {
  it("voegt overlappende tijdvakken samen", () => {
    expect(
      mergeIntervals([
        { start: 540, end: 720 },
        { start: 700, end: 780 },
        { start: 900, end: 1000 },
      ]),
    ).toEqual([
      { start: 540, end: 780 },
      { start: 900, end: 1000 },
    ]);
  });

  it("negeert lege tijdvakken", () => {
    expect(mergeIntervals([{ start: 540, end: 540 }])).toEqual([]);
  });

  it("haalt een blokkade uit het midden weg", () => {
    expect(
      subtractIntervals(
        [{ start: 540, end: 1020 }],
        [{ start: 720, end: 780 }],
      ),
    ).toEqual([
      { start: 540, end: 720 },
      { start: 780, end: 1020 },
    ]);
  });

  it("haalt een hele dag weg", () => {
    expect(
      subtractIntervals([{ start: 540, end: 1020 }], [{ start: 0, end: 1440 }]),
    ).toEqual([]);
  });

  it("geeft begintijden op het raster", () => {
    expect(candidateStarts([{ start: 540, end: 660 }], 60, 30)).toEqual([
      540, 570, 600,
    ]);
  });

  it("geeft geen begintijd als de afspraak niet past", () => {
    expect(candidateStarts([{ start: 540, end: 580 }], 60, 30)).toEqual([]);
  });

  it("houdt buffertijd aan rond bestaande boekingen", () => {
    const booking = { start: 1000, end: 2000 };
    expect(conflictsWithBooking({ start: 2000, end: 3000 }, booking, 0)).toBe(
      false,
    );
    expect(conflictsWithBooking({ start: 2000, end: 3000 }, booking, 1)).toBe(
      true,
    );
    expect(conflictsWithBooking({ start: 500, end: 900 }, booking, 50)).toBe(
      false,
    );
    expect(conflictsWithBooking({ start: 500, end: 900 }, booking, 200)).toBe(
      true,
    );
  });
});

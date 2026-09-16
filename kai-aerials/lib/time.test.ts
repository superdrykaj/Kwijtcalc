import { describe, expect, it } from "vitest";
import {
  addDays,
  dateKeyOf,
  daysBetween,
  formatMinutes,
  minutesOfDayOf,
  parseMinutes,
  wallTimeExists,
  weekdayOf,
  zoneOffsetMinutes,
  zonedToUtc,
} from "./time";

describe("tijdzone Europe/Amsterdam", () => {
  it("gebruikt wintertijd (UTC+1) in januari", () => {
    const utc = zonedToUtc("2026-01-15", 9 * 60 + 30);
    expect(new Date(utc).toISOString()).toBe("2026-01-15T08:30:00.000Z");
    expect(zoneOffsetMinutes(utc)).toBe(60);
  });

  it("gebruikt zomertijd (UTC+2) in juli", () => {
    const utc = zonedToUtc("2026-07-15", 9 * 60 + 30);
    expect(new Date(utc).toISOString()).toBe("2026-07-15T07:30:00.000Z");
    expect(zoneOffsetMinutes(utc)).toBe(120);
  });

  it("rekent heen en terug zonder verschuiving", () => {
    for (const key of ["2026-03-29", "2026-10-25", "2026-06-01"]) {
      for (const minutes of [0, 8 * 60, 13 * 60 + 45, 23 * 60 + 30]) {
        const utc = zonedToUtc(key, minutes);
        if (!wallTimeExists(key, minutes)) continue;
        expect(dateKeyOf(utc)).toBe(key);
        expect(minutesOfDayOf(utc)).toBe(minutes);
      }
    }
  });

  it("herkent het uur dat niet bestaat bij de start van de zomertijd", () => {
    // 29 maart 2026: de klok gaat van 02:00 naar 03:00.
    expect(wallTimeExists("2026-03-29", 2 * 60 + 30)).toBe(false);
    expect(wallTimeExists("2026-03-29", 3 * 60 + 30)).toBe(true);
    expect(wallTimeExists("2026-03-29", 1 * 60 + 30)).toBe(true);
  });

  it("kiest de eerste variant van het dubbele uur bij het eind van de zomertijd", () => {
    // 25 oktober 2026: 02:00 komt twee keer voor.
    const utc = zonedToUtc("2026-10-25", 2 * 60 + 30);
    expect(new Date(utc).toISOString()).toBe("2026-10-25T00:30:00.000Z");
    expect(minutesOfDayOf(utc)).toBe(2 * 60 + 30);
  });

  it("bepaalt weekdagen correct", () => {
    expect(weekdayOf("2026-09-16")).toBe(3); // woensdag
    expect(weekdayOf("2026-09-20")).toBe(0); // zondag
  });

  it("telt dagen op over een zomertijdovergang heen", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-03-01", "2026-04-01")).toBe(31);
  });

  it("leest en schrijft tijden", () => {
    expect(parseMinutes("09:30")).toBe(570);
    expect(parseMinutes("9:05")).toBe(545);
    expect(parseMinutes("24:00")).toBe(1440);
    expect(parseMinutes("25:00")).toBeNull();
    expect(parseMinutes("onzin")).toBeNull();
    expect(formatMinutes(570)).toBe("09:30");
  });
});

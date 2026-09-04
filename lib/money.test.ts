import { describe, expect, it } from "vitest";
import {
  formatCents,
  formatCentsPlain,
  parseAmountToCents,
  roundedDivide,
} from "./money";

function cents(raw: string): number {
  const result = parseAmountToCents(raw);
  if (!result.ok) throw new Error(`Onverwacht ongeldig bedrag: ${raw}`);
  return result.cents;
}

describe("parseAmountToCents", () => {
  it("leest Nederlandse notatie met komma", () => {
    expect(cents("554,48")).toBe(55448);
    expect(cents("466,60")).toBe(46660);
    expect(cents("0,05")).toBe(5);
  });

  it("leest bedragen met duizendtalscheiding", () => {
    expect(cents("1.234,56")).toBe(123456);
    expect(cents("1.234")).toBe(123400);
    expect(cents("123.456,78")).toBe(12345678);
  });

  it("leest een punt als decimaalteken wanneer dat de enige lezing is", () => {
    expect(cents("554.48")).toBe(55448);
    expect(cents("0.5")).toBe(50);
  });

  it("negeert euroteken en spaties", () => {
    expect(cents("€ 642,13")).toBe(64213);
    expect(cents(" 1 234,56 ")).toBe(123456);
    expect(cents(" 642,13")).toBe(64213);
  });

  it("vult ontbrekende decimalen aan", () => {
    expect(cents("500")).toBe(50000);
    expect(cents("500,")).toBe(50000);
    expect(cents("500,5")).toBe(50050);
  });

  it("weigert negatieve bedragen", () => {
    const result = parseAmountToCents("-100");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("negatief");
  });

  it("weigert meer dan twee decimalen", () => {
    const result = parseAmountToCents("100,456");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("te_veel_decimalen");
  });

  it("weigert onzin en lege invoer", () => {
    expect(parseAmountToCents("").ok).toBe(false);
    expect(parseAmountToCents("   ").ok).toBe(false);
    expect(parseAmountToCents("abc").ok).toBe(false);
    expect(parseAmountToCents("12,3,4").ok).toBe(false);
  });

  it("weigert onrealistisch hoge bedragen", () => {
    const result = parseAmountToCents("2.000.000,00");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("te_groot");
  });

  it("houdt centen exact, ook waar drijvende komma zou afronden", () => {
    expect(cents("0,10") + cents("0,20")).toBe(cents("0,30"));
    expect(cents("123456,78")).toBe(12345678);
  });
});

describe("roundedDivide", () => {
  it("rondt halve eenheden naar boven af", () => {
    expect(roundedDivide(5, 2)).toBe(3);
    expect(roundedDivide(7, 2)).toBe(4);
    expect(roundedDivide(4, 2)).toBe(2);
  });

  it("rondt naar beneden onder de helft", () => {
    expect(roundedDivide(10, 4)).toBe(3);
    expect(roundedDivide(9, 4)).toBe(2);
  });

  it("rondt negatieve uitkomsten van nul af", () => {
    expect(roundedDivide(-5, 2)).toBe(-3);
  });

  it("weigert deling door nul", () => {
    expect(() => roundedDivide(1, 0)).toThrow();
  });
});

describe("formatCents", () => {
  it("gebruikt Nederlandse geldnotatie met een vaste spatie na het euroteken", () => {
    expect(formatCents(123456)).toBe("\u20ac\u00a01.234,56");
    expect(formatCents(55000)).toBe("\u20ac\u00a0550,00");
    expect(formatCents(0)).toBe("\u20ac\u00a00,00");
    expect(formatCents(238333)).toBe("\u20ac\u00a02.383,33");
  });

  it("gebruikt geen Engelse notatie", () => {
    expect(formatCents(123456)).not.toContain("1,234.56");
  });

  it("toont bedragen zonder euroteken waar dat past", () => {
    expect(formatCentsPlain(123456)).toBe("1.234,56");
  });
});

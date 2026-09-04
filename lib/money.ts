/**
 * Geldrekenwerk voor KwijtCalc.
 *
 * Alle bedragen worden intern opgeslagen als een geheel aantal eurocenten
 * (`Cents`). Daarmee zijn optellen, aftrekken en vergelijken exact en treden
 * er geen floating-point afrondingsfouten op (0.1 + 0.2 !== 0.3).
 *
 * Afgeleide bedragen (gemiddelden, omrekeningen) worden berekend met exacte
 * breukdeling op gehele getallen en pas op het allerlaatste moment afgerond.
 */

/** Een bedrag in hele eurocenten. Altijd een geheel getal. */
export type Cents = number;

/** Bovengrens per ingevoerd bedrag: 1 miljoen euro. Vangt typefouten af. */
export const MAX_AMOUNT_CENTS: Cents = 100_000_000;

export type AmountParseErrorCode =
  | "leeg"
  | "ongeldig"
  | "te_veel_decimalen"
  | "negatief"
  | "te_groot";

export type AmountParseResult =
  | { ok: true; cents: Cents }
  | { ok: false; code: AmountParseErrorCode; message: string };

const PARSE_ERROR_MESSAGES: Record<AmountParseErrorCode, string> = {
  leeg: "Vul een bedrag in.",
  ongeldig: "Geen geldig bedrag. Gebruik bijvoorbeeld 554,48.",
  te_veel_decimalen: "Gebruik maximaal twee decimalen.",
  negatief: "Een negatief bedrag is hier niet toegestaan.",
  te_groot: "Dit bedrag is te hoog. Controleer de invoer.",
};

function parseError(code: AmountParseErrorCode): AmountParseResult {
  return { ok: false, code, message: PARSE_ERROR_MESSAGES[code] };
}

/**
 * Deelt twee gehele getallen en rondt het resultaat af op een geheel getal,
 * halve centen naar boven (van nul af). Volledig exact: er komt geen
 * drijvendekommagetal aan te pas behalve de deling zelf, waarvan alleen het
 * gehele deel wordt gebruikt.
 */
export function roundedDivide(numerator: number, denominator: number): number {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error("roundedDivide verwacht gehele getallen.");
  }
  if (denominator === 0) {
    throw new Error("Deling door nul.");
  }
  const sign = numerator < 0 !== denominator < 0 ? -1 : 1;
  const a = Math.abs(numerator);
  const b = Math.abs(denominator);
  const quotient = Math.floor(a / b);
  const remainder = a - quotient * b;
  const rounded = remainder * 2 >= b ? quotient + 1 : quotient;
  return sign * rounded;
}

/**
 * Leest een door de gebruiker ingetypt bedrag in Nederlandse notatie.
 *
 * Geaccepteerd: "554,48", "€ 554,48", "1.234,56", "1234.56", "1 234,56", "500".
 * Regels voor de scheidingstekens:
 *  - komen punt en komma allebei voor, dan is het laatste teken het decimaalteken;
 *  - komt alleen een komma voor, dan is dat het decimaalteken;
 *  - komt alleen een punt voor met precies drie cijfers erachter en cijfers
 *    ervoor, dan is het een duizendtalscheiding ("1.234" = 1234);
 *  - in alle andere gevallen is de punt het decimaalteken ("554.48").
 */
export function parseAmountToCents(raw: string): AmountParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") return parseError("leeg");

  let cleaned = trimmed
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(/^€/, "")
    .replace(/€$/, "")
    .replace(/^EUR/i, "");

  if (cleaned === "") return parseError("leeg");

  let negative = false;
  if (cleaned.startsWith("-")) {
    negative = true;
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  if (!/^[\d.,]+$/.test(cleaned)) return parseError("ongeldig");

  const commaCount = (cleaned.match(/,/g) ?? []).length;
  const dotCount = (cleaned.match(/\./g) ?? []).length;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let decimalSeparator: "," | "." | null = null;
  if (commaCount > 0 && dotCount > 0) {
    decimalSeparator = lastComma > lastDot ? "," : ".";
  } else if (commaCount > 0) {
    decimalSeparator = ",";
  } else if (dotCount > 0) {
    // Alleen punten: "1.234" is duizendtalscheiding, "554.48" een decimaalteken.
    const digitsAfterLastDot = cleaned.length - lastDot - 1;
    const looksLikeThousands = digitsAfterLastDot === 3 && lastDot > 0;
    decimalSeparator = looksLikeThousands || dotCount > 1 ? null : ".";
  }

  // Het decimaalteken mag maar één keer voorkomen; het andere teken is
  // duizendtalscheiding en moet in groepjes van drie staan.
  if (decimalSeparator === ",") {
    if (commaCount > 1) return parseError("ongeldig");
  } else if (decimalSeparator === ".") {
    if (dotCount > 1) return parseError("ongeldig");
  } else if (commaCount > 0) {
    return parseError("ongeldig");
  }

  const separatorIndex =
    decimalSeparator === "," ? lastComma : decimalSeparator === "." ? lastDot : -1;

  let integerPart: string;
  let decimalPart: string;
  if (separatorIndex === -1) {
    integerPart = cleaned;
    decimalPart = "";
  } else {
    integerPart = cleaned.slice(0, separatorIndex);
    decimalPart = cleaned.slice(separatorIndex + 1);
  }

  // Zonder decimaalteken is de punt de duizendtalscheiding ("1.234.567").
  const groupingSeparator = decimalSeparator === "." ? "," : ".";
  const groupedPattern = new RegExp(
    `^\\d{1,3}(?:\\${groupingSeparator}\\d{3})+$`,
  );
  if (integerPart === "") {
    integerPart = "0";
  } else if (/^\d+$/.test(integerPart)) {
    // losse cijfers, niets te doen
  } else if (groupedPattern.test(integerPart)) {
    integerPart = integerPart.replace(/[.,]/g, "");
  } else {
    return parseError("ongeldig");
  }

  if (!/^\d*$/.test(decimalPart)) return parseError("ongeldig");
  if (decimalPart.length > 2) return parseError("te_veel_decimalen");
  if (integerPart.length > 12) return parseError("te_groot");

  const cents =
    Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0") || "0");

  if (!Number.isFinite(cents)) return parseError("ongeldig");
  if (negative && cents !== 0) return parseError("negatief");
  if (cents > MAX_AMOUNT_CENTS) return parseError("te_groot");

  return { ok: true, cents };
}

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plainFormatter = new Intl.NumberFormat("nl-NL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Toont centen als Nederlands geldbedrag, bijvoorbeeld "€ 1.234,56". */
export function formatCents(cents: Cents): string {
  // Intl zet een non-breaking space tussen euroteken en bedrag; de smalle
  // variant normaliseren we zodat de opmaak overal identiek is.
  return currencyFormatter.format(cents / 100).replace(/\u202f/g, "\u00a0");
}

/** Toont centen zonder euroteken, bijvoorbeeld "1.234,56". */
export function formatCentsPlain(cents: Cents): string {
  return plainFormatter.format(cents / 100);
}

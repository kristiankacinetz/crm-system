/** Money is stored as integer cents. */

export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currency = "EUR"): string {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("sk-SK", { style: "currency", currency });
    formatters.set(currency, f);
  }
  return f.format(cents / 100);
}

/**
 * Parses amounts as written in Slovak exports: "1 234,50", "1234.5", "1.234,50 €", 1234.5.
 * Returns cents or null when the value is not a number.
 */
export function parseAmount(input: unknown): number | null {
  if (input == null || input === "") return null;
  if (typeof input === "number") return Number.isFinite(input) ? toCents(input) : null;
  let s = String(input)
    .replace(/[\s  ]/g, "")
    .replace(/(EUR|€|Kč|CZK|USD|\$)/gi, "");
  if (s === "" || s === "-") return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // The later separator is the decimal one.
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(",", ".");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return toCents(Number(s));
}

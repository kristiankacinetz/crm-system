/**
 * Document numbers from a pattern: {YYYY} year, {YY} short year, {N}/{NN}/{NNN}/{NNNN} sequence.
 * Example: "CP{YYYY}{NNN}" -> "CP2026001".
 */
export function formatNumber(pattern: string, year: number, seq: number): string {
  return pattern
    .replace("{YYYY}", String(year))
    .replace("{YY}", String(year).slice(-2))
    .replace(/\{(N+)\}/, (_, n: string) => String(seq).padStart(n.length, "0"));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Next free number for the year, one above the highest sequence already used. */
export function nextNumber(pattern: string, year: number, existing: string[]): string {
  const re = new RegExp(
    "^" +
      escape(pattern)
        .replace(escape("{YYYY}"), String(year))
        .replace(escape("{YY}"), String(year).slice(-2))
        .replace(/\\\{N+\\\}/, "(\\d+)") +
      "$",
  );
  let max = 0;
  for (const num of existing) {
    const m = re.exec(num);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return formatNumber(pattern, year, max + 1);
}

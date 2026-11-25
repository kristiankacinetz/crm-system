import type { ImportField } from "../db/repo/settings";
import { parseAmount } from "../domain/money";

import type { Mapping } from "./mapping";

export interface ImportRow {
  rowNumber: number; // 1-based row in the file
  number: string;
  variableSymbol: string | null;
  customerName: string | null;
  customerIco: string | null;
  issueDate: string;
  taxableDate: string | null;
  dueDate: string;
  currency: string;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  paid: number;
  cancelled: boolean;
  /** Invoice columns that the file actually provides; others must not overwrite existing data. */
  provided: ProvidedField[];
}

export type ProvidedField =
  | "variableSymbol"
  | "customerNameRaw"
  | "customerIcoRaw"
  | "taxableDate"
  | "currency"
  | "totalNet"
  | "totalVat"
  | "importedPaid"
  | "cancelled";

export function providedFields(mapping: Mapping): ProvidedField[] {
  const has = (...f: ImportField[]) => f.some((x) => mapping.includes(x));
  const out: ProvidedField[] = [];
  if (has("variableSymbol")) out.push("variableSymbol");
  if (has("customerName")) out.push("customerNameRaw");
  if (has("customerIco")) out.push("customerIcoRaw");
  if (has("taxableDate")) out.push("taxableDate");
  if (has("currency")) out.push("currency");
  if (has("totalNet", "totalVat")) out.push("totalNet", "totalVat");
  if (has("paid", "unpaid", "status", "paidDate")) out.push("importedPaid");
  if (has("status")) out.push("cancelled");
  return out;
}

export interface RowError {
  rowNumber: number;
  message: string;
}

/** Excel serial date (1900 system) to ISO. */
function fromExcelSerial(n: number): string {
  const ms = Math.round((n - 25569) * 86_400_000);
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function parseDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    // Spreadsheet dates are calendar dates: read them in UTC to avoid timezone shifts.
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${String(v.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof v === "number") return v > 20000 && v < 80000 ? fromExcelSerial(v) : null;
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function text(v: unknown): string | null {
  if (v == null) return null;
  const s = (v instanceof Date ? parseDate(v) : String(v))?.trim();
  return s ? s : null;
}

/** Invoice numbers from Excel can come as numbers (e.g. 20260001). */
function invoiceNumber(v: unknown): string | null {
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  return text(v);
}

const isPaidStatus = (s: string) => /^(uhraden|zaplaten|uhrazen)/.test(s) && !/(neuhrad|ciastocn|castecn)/.test(s);
const isCancelledStatus = (s: string) => /storn|zrusen/.test(s);

export function normalizeRows(
  grid: unknown[][],
  headerRow: number,
  mapping: Mapping,
  defaultCurrency = "EUR",
): { rows: ImportRow[]; errors: RowError[] } {
  const rows: ImportRow[] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>();
  const provided = providedFields(mapping);
  const col = (f: ImportField) => mapping.indexOf(f);
  const get = (r: unknown[], f: ImportField) => (col(f) > -1 ? r[col(f)] : undefined);

  for (let r = headerRow + 1; r < grid.length; r++) {
    const raw = grid[r] ?? [];
    const rowNumber = r + 1;
    if (raw.every((c) => c == null || String(c).trim() === "")) continue;
    const number = invoiceNumber(get(raw, "number"));
    if (!number) {
      // Summary lines ("Spolu", totals) have no number: skip silently when they have no date either.
      if (!parseDate(get(raw, "issueDate"))) continue;
      errors.push({ rowNumber, message: "Chýba číslo faktúry" });
      continue;
    }
    const issueDate = parseDate(get(raw, "issueDate"));
    const dueDate = parseDate(get(raw, "dueDate")) ?? issueDate;
    const totalGross = parseAmount(get(raw, "totalGross"));
    const problems: string[] = [];
    if (!issueDate) problems.push("neplatný dátum vystavenia");
    if (!dueDate) problems.push("neplatný dátum splatnosti");
    if (totalGross == null) problems.push("neplatná suma s DPH");
    if (seen.has(number)) problems.push(`číslo ${number} je v súbore viackrát (riadok ${seen.get(number)})`);
    if (problems.length) {
      errors.push({ rowNumber, message: `Faktúra ${number}: ${problems.join(", ")}` });
      continue;
    }
    seen.set(number, rowNumber);

    const status = String(get(raw, "status") ?? "")
      .toLocaleLowerCase("sk")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();
    const cancelled = isCancelledStatus(status);
    let paid = parseAmount(get(raw, "paid"));
    if (paid == null) {
      const unpaid = parseAmount(get(raw, "unpaid"));
      if (unpaid != null) paid = totalGross! - unpaid;
      else if (isPaidStatus(status) || (col("paidDate") > -1 && parseDate(get(raw, "paidDate")))) paid = totalGross!;
      else paid = 0;
    }
    const totalVatRaw = parseAmount(get(raw, "totalVat"));
    const totalNetRaw = parseAmount(get(raw, "totalNet"));
    const totalNet = totalNetRaw ?? (totalVatRaw != null ? totalGross! - totalVatRaw : totalGross!);
    const totalVat = totalVatRaw ?? totalGross! - totalNet;

    rows.push({
      rowNumber,
      number,
      variableSymbol: text(get(raw, "variableSymbol")),
      customerName: text(get(raw, "customerName")),
      customerIco: text(get(raw, "customerIco")),
      issueDate: issueDate!,
      taxableDate: parseDate(get(raw, "taxableDate")),
      dueDate: dueDate!,
      currency: (text(get(raw, "currency")) ?? defaultCurrency).toUpperCase().replace("€", "EUR"),
      totalNet,
      totalVat,
      totalGross: totalGross!,
      paid: Math.max(0, Math.min(paid, totalGross!)),
      cancelled,
      provided,
    });
  }
  return { rows, errors };
}


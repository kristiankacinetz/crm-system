import { eq } from "drizzle-orm";
import { getDb } from "../proxy";
import { settings } from "../schema";
import { CURRENT_USER, nowIso } from "../../domain/ids";

export interface CompanyInfo {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  ico: string;
  dic: string;
  icDph: string;
  registration: string;
  iban: string;
  bank: string;
  swift: string;
  email: string;
  phone: string;
  web: string;
  /** Logo as data URL (PNG/JPEG), shown on PDF quotes. */
  logoDataUrl: string | null;
}

export type ImportField =
  | "number"
  | "variableSymbol"
  | "customerName"
  | "customerIco"
  | "issueDate"
  | "taxableDate"
  | "dueDate"
  | "totalNet"
  | "totalVat"
  | "totalGross"
  | "paid"
  | "unpaid"
  | "currency"
  | "status"
  | "paidDate";

export interface AppSettings {
  company: CompanyInfo;
  currency: string;
  defaultVatRate: number;
  dueSoonDays: number;
  quoteValidityDays: number;
  quoteNumberPattern: string;
  orderNumberPattern: string;
  quoteFooterText: string;
  backupDir: string | null;
  lastBackupAt: string | null;
  lastAlertDate: string | null;
  /** Saved column mapping of the last import: normalized header -> field. */
  importMapping: Record<string, ImportField | ""> | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  company: {
    name: "Vaša firma s.r.o.",
    street: "Ulica 1",
    city: "Bratislava",
    zip: "811 01",
    country: "Slovensko",
    ico: "",
    dic: "",
    icDph: "",
    registration: "",
    iban: "",
    bank: "",
    swift: "",
    email: "",
    phone: "",
    web: "",
    logoDataUrl: null,
  },
  currency: "EUR",
  defaultVatRate: 23,
  dueSoonDays: 3,
  quoteValidityDays: 30,
  quoteNumberPattern: "CP{YYYY}{NNN}",
  orderNumberPattern: "Z{YYYY}{NNN}",
  quoteFooterText: "Ďakujeme za prejavený záujem. V prípade otázok nás neváhajte kontaktovať.",
  backupDir: null,
  lastBackupAt: null,
  lastAlertDate: null,
  importMapping: null,
};

const KEY = "app";

export async function getSettings(): Promise<AppSettings> {
  const row = await getDb().select().from(settings).where(eq(settings.key, KEY)).get();
  if (!row) return structuredClone(DEFAULT_SETTINGS);
  const stored = JSON.parse(row.value) as Partial<AppSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    company: { ...DEFAULT_SETTINGS.company, ...(stored.company ?? {}) },
  };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...patch };
  const value = JSON.stringify(next);
  await getDb()
    .insert(settings)
    .values({ key: KEY, value, updatedAt: nowIso(), updatedBy: CURRENT_USER })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: nowIso(), updatedBy: CURRENT_USER } });
  return next;
}

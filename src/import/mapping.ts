import type { ImportField } from "../db/repo/settings";

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  number: "Číslo faktúry",
  variableSymbol: "Variabilný symbol",
  customerName: "Odberateľ",
  customerIco: "IČO odberateľa",
  issueDate: "Dátum vystavenia",
  taxableDate: "Dátum dodania (DUZP)",
  dueDate: "Dátum splatnosti",
  totalNet: "Suma bez DPH",
  totalVat: "DPH",
  totalGross: "Suma s DPH",
  paid: "Uhradená suma",
  unpaid: "Zostáva uhradiť",
  currency: "Mena",
  status: "Stav úhrady",
  paidDate: "Dátum úhrady",
};

export const REQUIRED_FIELDS: ImportField[] = ["number", "issueDate", "dueDate", "totalGross"];

/** Header names used by iDoklad (SK and CZ) and common spreadsheets, normalized. */
const ALIASES: Record<ImportField, string[]> = {
  number: ["cislo dokladu", "cislo faktury", "cislo", "doklad", "faktura", "cislo dokladu faktury"],
  variableSymbol: ["variabilny symbol", "vs", "var symbol", "var. symbol"],
  customerName: ["odberatel", "odberatel nazov", "nazov odberatela", "partner", "zakaznik", "firma", "kontakt", "obchodne meno", "nazov"],
  customerIco: ["ico", "ic", "ico odberatela", "ic odberatele", "ico partnera"],
  issueDate: ["datum vystavenia", "vystavene", "vystavena", "datum vystaveni", "vystaveno", "datum"],
  taxableDate: ["duzp", "datum dodania", "datum zdanitelneho plnenia", "datum uskutocnenia zdanitelneho plnenia", "dodanie"],
  dueDate: ["datum splatnosti", "splatnost", "splatne", "splatna", "datum splatnosti faktury"],
  totalNet: ["celkom bez dph", "suma bez dph", "bez dph", "zaklad", "zaklad dph", "celkem bez dph", "zaklad celkom"],
  totalVat: ["dph", "suma dph", "celkom dph", "dph celkom", "dan"],
  totalGross: ["celkom s dph", "suma s dph", "s dph", "celkom", "spolu", "celkova suma", "celkem s dph", "celkem", "suma", "k uhrade"],
  paid: ["uhradene", "uhradena suma", "zaplatene", "uhrazeno", "uhradene celkom", "zaplateno"],
  unpaid: ["zostava uhradit", "neuhradene", "zostatok", "zbyva uhradit", "zostava", "nedoplatok"],
  currency: ["mena", "mena dokladu", "mena kod"],
  status: ["stav", "stav uhrady", "uhrada", "uhradenie", "stav dokladu", "stav platby"],
  paidDate: ["datum uhrady", "uhradene dna", "datum zaplatenia", "datum platby"],
};

export function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .toLocaleLowerCase("sk")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9. ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type Mapping = (ImportField | "")[];

/** Proposes a field for each column: exact alias matches first, then partial ones. */
export function suggestMapping(headers: unknown[], saved?: Record<string, ImportField | ""> | null): Mapping {
  const norm = headers.map(normalizeHeader);
  const result: Mapping = norm.map(() => "");
  const usedFields = new Set<ImportField>();

  if (saved) {
    norm.forEach((h, i) => {
      const f = saved[h];
      if (f !== undefined && h) {
        result[i] = f;
        if (f) usedFields.add(f);
      }
    });
  }
  const free = (i: number) => result[i] === "" && !(saved && saved[norm[i]] === "" && norm[i]);
  const fields = Object.keys(ALIASES) as ImportField[];

  // Pass 1: exact.
  for (const f of fields) {
    if (usedFields.has(f)) continue;
    for (const alias of ALIASES[f]) {
      const i = norm.findIndex((h, idx) => h === alias && free(idx));
      if (i > -1) {
        result[i] = f;
        usedFields.add(f);
        break;
      }
    }
  }
  // Pass 2: header contains alias; longer aliases first to prefer "celkom s dph" over "dph".
  const pairs = fields
    .flatMap((f) => ALIASES[f].filter((a) => a.length >= 3).map((a) => ({ f, a })))
    .sort((x, y) => y.a.length - x.a.length);
  for (const { f, a } of pairs) {
    if (usedFields.has(f)) continue;
    const i = norm.findIndex((h, idx) => free(idx) && new RegExp(`(^| )${a.replace(/\./g, "\\.")}( |$)`).test(h));
    if (i > -1) {
      result[i] = f;
      usedFields.add(f);
    }
  }
  return result;
}

/** Finds the header row: the first of the top rows that matches at least 3 known fields. */
export function detectHeaderRow(grid: unknown[][]): number {
  let best = 0;
  let bestScore = -1;
  for (let r = 0; r < Math.min(grid.length, 20); r++) {
    const score = suggestMapping(grid[r]).filter(Boolean).length;
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
    if (score >= 4) return r;
  }
  return best;
}

export function mappingToSaved(headers: unknown[], mapping: Mapping): Record<string, ImportField | ""> {
  const out: Record<string, ImportField | ""> = {};
  headers.forEach((h, i) => {
    const n = normalizeHeader(h);
    if (n) out[n] = mapping[i] ?? "";
  });
  return out;
}

export function missingRequired(mapping: Mapping): ImportField[] {
  return REQUIRED_FIELDS.filter((f) => !mapping.includes(f));
}

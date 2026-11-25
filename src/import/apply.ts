import { eq } from "drizzle-orm";
import { getDb } from "../db/proxy";
import { importBatches, invoices, type Customer, type Invoice } from "../db/schema";
import { created, logAudit, touched } from "../db/repo/audit";
import { createCustomer, emptyCustomer, listCustomers, normalizeIco, normalizeName } from "../db/repo/customers";
import { newId, nowIso } from "../domain/ids";
import type { ImportRow, RowError } from "./normalize";

export type PlanAction = "create" | "update" | "unchanged" | "deleted";

export interface PlanCustomer {
  kind: "ico" | "name" | "new" | "existing" | "none";
  customerId: string | null;
  name: string | null;
}

export interface PlanEntry {
  row: ImportRow;
  action: PlanAction;
  existingId: string | null;
  changes: string[];
  customer: PlanCustomer;
}

export interface ImportPlan {
  entries: PlanEntry[];
  errors: RowError[];
  counts: Record<PlanAction, number>;
}

const FIELD_LABELS: Record<string, string> = {
  variableSymbol: "VS",
  issueDate: "dátum vystavenia",
  taxableDate: "DUZP",
  dueDate: "splatnosť",
  currency: "mena",
  totalNet: "suma bez DPH",
  totalVat: "DPH",
  totalGross: "suma s DPH",
  importedPaid: "uhradené",
  cancelled: "storno",
  customerNameRaw: "odberateľ",
  customerIcoRaw: "IČO",
  customerId: "zákazník",
};

const ALWAYS = ["issueDate", "dueDate", "totalGross"];

/** Invoice columns from a row. */
function invoiceFields(row: ImportRow) {
  return {
    variableSymbol: row.variableSymbol,
    issueDate: row.issueDate,
    taxableDate: row.taxableDate,
    dueDate: row.dueDate,
    currency: row.currency,
    totalNet: row.totalNet,
    totalVat: row.totalVat,
    totalGross: row.totalGross,
    importedPaid: row.paid,
    cancelled: row.cancelled,
    customerNameRaw: row.customerName,
    customerIcoRaw: normalizeIco(row.customerIco),
  };
}

/** Only the columns the file contains, so missing columns never overwrite existing data. */
function providedInvoiceFields(row: ImportRow): Partial<ReturnType<typeof invoiceFields>> {
  const keep = new Set<string>([...ALWAYS, ...row.provided]);
  return Object.fromEntries(Object.entries(invoiceFields(row)).filter(([k]) => keep.has(k)));
}

function matchCustomer(row: ImportRow, customers: Customer[]): PlanCustomer {
  const ico = normalizeIco(row.customerIco);
  if (ico) {
    const c = customers.find((c) => normalizeIco(c.ico) === ico);
    if (c) return { kind: "ico", customerId: c.id, name: c.name };
  }
  if (row.customerName) {
    const n = normalizeName(row.customerName);
    const c = customers.find((c) => normalizeName(c.name) === n);
    if (c) return { kind: "name", customerId: c.id, name: c.name };
    return { kind: "new", customerId: null, name: row.customerName };
  }
  return { kind: "none", customerId: null, name: null };
}

/** Compares parsed rows with the database. Pure read: nothing is written. */
export async function planImport(rows: ImportRow[], errors: RowError[]): Promise<ImportPlan> {
  const [existing, customers] = await Promise.all([getDb().select().from(invoices).all(), listCustomers()]);
  const byNumber = new Map<string, Invoice>(existing.map((i) => [i.number, i]));
  const entries: PlanEntry[] = rows.map((row) => {
    const inv = byNumber.get(row.number);
    const customer: PlanCustomer =
      inv?.customerId && !inv.deletedAt
        ? { kind: "existing", customerId: inv.customerId, name: customers.find((c) => c.id === inv.customerId)?.name ?? null }
        : matchCustomer(row, customers);
    if (!inv) return { row, action: "create", existingId: null, changes: [], customer };
    if (inv.deletedAt) return { row, action: "deleted", existingId: inv.id, changes: [], customer };
    const next: Record<string, unknown> = providedInvoiceFields(row);
    if (!inv.customerId && customer.kind !== "none") next.customerId = customer.customerId ?? "(nový)";
    const changes = Object.keys(next).filter((k) => (inv as Record<string, unknown>)[k] !== next[k]);
    return {
      row,
      action: changes.length ? "update" : "unchanged",
      existingId: inv.id,
      changes: changes.map((k) => FIELD_LABELS[k] ?? k),
      customer,
    };
  });
  const counts = { create: 0, update: 0, unchanged: 0, deleted: 0 } as Record<PlanAction, number>;
  for (const e of entries) counts[e.action]++;
  return { entries, errors, counts };
}

export interface ImportResult {
  batchId: string;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  newCustomers: number;
  errors: RowError[];
}

/**
 * Writes the plan. Idempotent: invoices are matched by number, so running the same file again
 * changes nothing. Manual payments, notes and order links are never touched.
 */
export async function applyImport(plan: ImportPlan, fileName: string): Promise<ImportResult> {
  const db = getDb();
  const batchId = newId();
  await db.insert(importBatches).values({
    id: batchId,
    fileName,
    importedAt: nowIso(),
    rowsTotal: plan.entries.length + plan.errors.length,
    errorCount: plan.errors.length,
    errors: JSON.stringify(plan.errors),
    ...created(),
  });

  const newCustomerIds = new Map<string, string>();
  let newCustomers = 0;
  async function resolveCustomer(e: PlanEntry): Promise<string | null> {
    if (e.customer.customerId) return e.customer.customerId;
    if (e.customer.kind !== "new" || !e.customer.name) return null;
    const key = normalizeIco(e.row.customerIco) ?? normalizeName(e.customer.name);
    let id = newCustomerIds.get(key);
    if (!id) {
      const c = await createCustomer({ ...emptyCustomer(), name: e.customer.name, ico: normalizeIco(e.row.customerIco) });
      id = c.id;
      newCustomerIds.set(key, id);
      newCustomers++;
    }
    return id;
  }

  let createdN = 0;
  let updatedN = 0;
  for (const e of plan.entries) {
    if (e.action === "create") {
      const id = newId();
      await db.insert(invoices).values({
        id,
        number: e.row.number,
        ...invoiceFields(e.row),
        customerId: await resolveCustomer(e),
        source: "import",
        importBatchId: batchId,
        ...created(),
      });
      createdN++;
    } else if (e.action === "update" && e.existingId) {
      const patch: Partial<Invoice> = { ...providedInvoiceFields(e.row), importBatchId: batchId, ...touched() };
      const current = await db.select({ customerId: invoices.customerId }).from(invoices).where(eq(invoices.id, e.existingId)).get();
      if (!current?.customerId) patch.customerId = await resolveCustomer(e);
      await db.update(invoices).set(patch).where(eq(invoices.id, e.existingId));
      updatedN++;
    }
  }
  const result: ImportResult = {
    batchId,
    created: createdN,
    updated: updatedN,
    unchanged: plan.counts.unchanged,
    skipped: plan.counts.deleted,
    newCustomers,
    errors: plan.errors,
  };
  await db
    .update(importBatches)
    .set({ createdCount: createdN, updatedCount: updatedN, unchangedCount: plan.counts.unchanged, ...touched() })
    .where(eq(importBatches.id, batchId));
  await logAudit("import", batchId, "import", { fileName, created: createdN, updated: updatedN });
  return result;
}

export async function listImportBatches() {
  const rows = await getDb().select().from(importBatches).all();
  return rows.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

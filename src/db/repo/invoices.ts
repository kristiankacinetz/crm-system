import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../proxy";
import { invoices, payments, type Invoice, type Payment } from "../schema";
import { newId, nowIso } from "../../domain/ids";
import { daysBetween, todayIso } from "../../domain/dates";
import { invoiceStatus, paidAmount, type InvoiceStatus } from "../../domain/invoiceStatus";
import { created, logAudit, touched } from "./audit";
import { listCustomers } from "./customers";
import { getSettings } from "./settings";

export interface InvoiceView extends Invoice {
  paymentsSum: number;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
  customerName: string;
  daysOverdue: number;
}

export type InvoiceInput = Pick<
  Invoice,
  | "number"
  | "variableSymbol"
  | "customerId"
  | "orderId"
  | "issueDate"
  | "taxableDate"
  | "dueDate"
  | "currency"
  | "totalNet"
  | "totalVat"
  | "totalGross"
  | "cancelled"
  | "note"
>;

export async function listPayments(invoiceId?: string): Promise<Payment[]> {
  const where = invoiceId
    ? and(isNull(payments.deletedAt), eq(payments.invoiceId, invoiceId))
    : isNull(payments.deletedAt);
  return getDb().select().from(payments).where(where).orderBy(desc(payments.paidOn)).all();
}

/** All invoices with derived payment status. */
export async function listInvoices(today = todayIso()): Promise<InvoiceView[]> {
  const [rows, pays, custs, s] = await Promise.all([
    getDb().select().from(invoices).where(isNull(invoices.deletedAt)).orderBy(desc(invoices.issueDate), desc(invoices.number)).all(),
    listPayments(),
    listCustomers(),
    getSettings(),
  ]);
  const sums = new Map<string, number>();
  for (const p of pays) sums.set(p.invoiceId, (sums.get(p.invoiceId) ?? 0) + p.amount);
  const names = new Map(custs.map((c) => [c.id, c.name]));
  return rows.map((inv) => {
    const paymentsSum = sums.get(inv.id) ?? 0;
    const paid = paidAmount({ importedPaid: inv.importedPaid, paymentsSum });
    const status = invoiceStatus({ ...inv, paymentsSum }, today, s.dueSoonDays);
    const daysOverdue = status === "overdue" ? daysBetween(inv.dueDate, today) : 0;
    return {
      ...inv,
      paymentsSum,
      paid,
      remaining: Math.max(0, inv.totalGross - paid),
      status,
      customerName: (inv.customerId && names.get(inv.customerId)) || inv.customerNameRaw || "—",
      daysOverdue,
    };
  });
}

export async function getInvoiceView(id: string): Promise<InvoiceView | undefined> {
  return (await listInvoices()).find((i) => i.id === id);
}

export async function getInvoiceByNumber(number: string): Promise<Invoice | undefined> {
  return getDb().select().from(invoices).where(eq(invoices.number, number.trim())).get();
}

function validate(input: InvoiceInput) {
  if (!input.number.trim()) throw new Error("Číslo faktúry je povinné");
  if (!input.issueDate) throw new Error("Dátum vystavenia je povinný");
  if (!input.dueDate) throw new Error("Dátum splatnosti je povinný");
}

export async function createInvoice(input: InvoiceInput): Promise<string> {
  validate(input);
  const number = input.number.trim();
  const existing = await getInvoiceByNumber(number);
  if (existing && !existing.deletedAt) throw new Error(`Faktúra ${number} už existuje`);
  const id = existing?.id ?? newId();
  if (existing) {
    // Re-use a soft-deleted invoice with the same number (number is unique).
    await getDb().update(invoices).set({ ...input, number, deletedAt: null, source: "manual", ...touched() }).where(eq(invoices.id, id));
  } else {
    await getDb().insert(invoices).values({ ...input, number, id, source: "manual", ...created() });
  }
  await logAudit("invoice", id, "create", { number });
  return id;
}

export async function updateInvoice(id: string, input: Partial<InvoiceInput>) {
  if (input.number !== undefined) {
    const other = await getInvoiceByNumber(input.number);
    if (other && other.id !== id) throw new Error(`Faktúra ${input.number} už existuje`);
  }
  await getDb().update(invoices).set({ ...input, ...touched() }).where(eq(invoices.id, id));
  await logAudit("invoice", id, "update", input);
}

export async function deleteInvoice(id: string) {
  await getDb().update(invoices).set({ deletedAt: nowIso(), ...touched() }).where(eq(invoices.id, id));
  await logAudit("invoice", id, "delete");
}

export async function addPayment(
  invoiceId: string,
  p: { paidOn: string; amount: number; method?: Payment["method"]; note?: string | null },
): Promise<string> {
  if (!(p.amount > 0)) throw new Error("Suma úhrady musí byť kladná");
  const id = newId();
  await getDb().insert(payments).values({ id, invoiceId, paidOn: p.paidOn, amount: p.amount, method: p.method ?? "bank", note: p.note ?? null, ...created() });
  await logAudit("payment", id, "create", { invoiceId, amount: p.amount });
  return id;
}

/** Marks the remaining amount as paid on the given date. */
export async function markPaid(invoiceId: string, paidOn = todayIso()) {
  const inv = await getInvoiceView(invoiceId);
  if (!inv) throw new Error("Faktúra neexistuje");
  if (inv.remaining <= 0) return;
  // Payments are counted with max(imported, payments): top up payments to the full amount.
  await addPayment(invoiceId, { paidOn, amount: inv.totalGross - inv.paymentsSum, note: "Označená ako uhradená" });
}

export async function deletePayment(id: string) {
  await getDb().update(payments).set({ deletedAt: nowIso(), ...touched() }).where(eq(payments.id, id));
  await logAudit("payment", id, "delete");
}

export async function invoicesForCustomer(customerId: string) {
  return (await listInvoices()).filter((i) => i.customerId === customerId);
}

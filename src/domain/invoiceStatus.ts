import { daysBetween } from "./dates";

export type InvoiceStatus = "cancelled" | "paid" | "partial" | "overdue" | "due_soon" | "unpaid";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Neuhradená",
  due_soon: "Blíži sa splatnosť",
  overdue: "Po splatnosti",
  partial: "Čiastočne uhradená",
  paid: "Uhradená",
  cancelled: "Stornovaná",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  unpaid: "gray",
  due_soon: "yellow",
  overdue: "red",
  partial: "orange",
  paid: "green",
  cancelled: "dark",
};

export interface InvoiceStatusInput {
  totalGross: number;
  importedPaid: number;
  paymentsSum: number;
  dueDate: string;
  cancelled: boolean;
}

/** Paid amount: manual payments are never undone by an older import. */
export function paidAmount(i: Pick<InvoiceStatusInput, "importedPaid" | "paymentsSum">): number {
  return Math.max(i.importedPaid, i.paymentsSum);
}

export function invoiceStatus(i: InvoiceStatusInput, today: string, dueSoonDays: number): InvoiceStatus {
  if (i.cancelled) return "cancelled";
  const paid = paidAmount(i);
  if (paid >= i.totalGross) return "paid";
  const daysLeft = daysBetween(today, i.dueDate);
  if (daysLeft < 0) return "overdue";
  if (paid > 0) return "partial";
  if (daysLeft <= dueSoonDays) return "due_soon";
  return "unpaid";
}

/** True when the invoice still needs the executive's attention. */
export function isOpen(status: InvoiceStatus): boolean {
  return status !== "paid" && status !== "cancelled";
}

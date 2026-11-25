import { desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../proxy";
import { orders, type Order, type OrderStatus } from "../schema";
import { newId, nowIso } from "../../domain/ids";
import { todayIso } from "../../domain/dates";
import { nextNumber } from "../../domain/numbering";
import { created, logAudit, touched } from "./audit";
import { listCustomers } from "./customers";
import { getQuote, moveQuoteToStage } from "./quotes";
import { getSettings } from "./settings";
import { listStages } from "./stages";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nová",
  in_progress: "V realizácii",
  done: "Dokončená",
  cancelled: "Zrušená",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new: "blue",
  in_progress: "orange",
  done: "green",
  cancelled: "gray",
};

export type OrderInput = Pick<
  Order,
  "customerId" | "quoteId" | "title" | "status" | "orderDate" | "deadline" | "currency" | "totalNet" | "totalGross" | "note"
>;

export interface OrderView extends Order {
  customerName: string;
}

export async function listOrders(): Promise<OrderView[]> {
  const [rows, custs] = await Promise.all([
    getDb().select().from(orders).where(isNull(orders.deletedAt)).orderBy(desc(orders.orderDate), desc(orders.number)).all(),
    listCustomers(),
  ]);
  const names = new Map(custs.map((c) => [c.id, c.name]));
  return rows.map((o) => ({ ...o, customerName: names.get(o.customerId) ?? "—" }));
}

export async function getOrder(id: string) {
  return getDb().select().from(orders).where(eq(orders.id, id)).get();
}

async function nextOrderNumber(date: string) {
  const s = await getSettings();
  const all = await getDb().select({ number: orders.number }).from(orders).all();
  return nextNumber(s.orderNumberPattern, Number(date.slice(0, 4)), all.map((r) => r.number));
}

export async function saveOrder(input: OrderInput, id?: string): Promise<string> {
  if (!input.customerId) throw new Error("Vyberte zákazníka");
  if (!input.title.trim()) throw new Error("Názov zákazky je povinný");
  if (id) {
    await getDb().update(orders).set({ ...input, ...touched() }).where(eq(orders.id, id));
    await logAudit("order", id, "update", input);
    return id;
  }
  const orderId = newId();
  const number = await nextOrderNumber(input.orderDate);
  await getDb().insert(orders).values({ ...input, id: orderId, number, ...created() });
  await logAudit("order", orderId, "create", { number });
  return orderId;
}

/** Creates an order from a quote and moves the quote to the first "won" stage. */
export async function createOrderFromQuote(quoteId: string): Promise<string> {
  const src = await getQuote(quoteId);
  if (!src) throw new Error("Ponuka neexistuje");
  const { quote } = src;
  const id = await saveOrder({
    customerId: quote.customerId,
    quoteId,
    title: quote.title,
    status: "new",
    orderDate: todayIso(),
    deadline: null,
    currency: quote.currency,
    totalNet: quote.totalNet,
    totalGross: quote.totalGross,
    note: null,
  });
  const won = (await listStages()).find((s) => s.kind === "won");
  if (won && quote.stageId !== won.id) await moveQuoteToStage(quoteId, won.id);
  return id;
}

export async function deleteOrder(id: string) {
  await getDb().update(orders).set({ deletedAt: nowIso(), ...touched() }).where(eq(orders.id, id));
  await logAudit("order", id, "delete");
}

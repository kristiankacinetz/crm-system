import { asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../proxy";
import { orders, quoteItems, quotes, type Quote, type QuoteItem } from "../schema";
import { newId, nowIso } from "../../domain/ids";
import { addDays, todayIso } from "../../domain/dates";
import { nextNumber } from "../../domain/numbering";
import { computeTotals } from "../../domain/quoteTotals";
import { created, logAudit, touched } from "./audit";
import { listCustomers } from "./customers";
import { getSettings } from "./settings";
import { listStages } from "./stages";

export type QuoteItemInput = Pick<QuoteItem, "name" | "description" | "quantity" | "unit" | "unitPrice" | "discountPct" | "vatRate">;
export type QuoteInput = Pick<
  Quote,
  "customerId" | "contactId" | "title" | "stageId" | "issueDate" | "validUntil" | "expectedCloseDate" | "currency" | "introText" | "note" | "lostReason"
>;

export interface QuoteView extends Quote {
  customerName: string;
}

export async function listQuotes(): Promise<QuoteView[]> {
  const [rows, custs] = await Promise.all([
    getDb().select().from(quotes).where(isNull(quotes.deletedAt)).orderBy(desc(quotes.issueDate), desc(quotes.number)).all(),
    listCustomers(),
  ]);
  const names = new Map(custs.map((c) => [c.id, c.name]));
  return rows.map((q) => ({ ...q, customerName: names.get(q.customerId) ?? "—" }));
}

export async function getQuote(id: string): Promise<{ quote: Quote; items: QuoteItem[] } | undefined> {
  const quote = await getDb().select().from(quotes).where(eq(quotes.id, id)).get();
  if (!quote) return undefined;
  const items = await getDb()
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id))
    .orderBy(asc(quoteItems.position))
    .all();
  return { quote, items: items.filter((i) => !i.deletedAt) };
}

async function nextQuoteNumber(issueDate: string) {
  const s = await getSettings();
  const all = await getDb().select({ number: quotes.number }).from(quotes).all();
  return nextNumber(s.quoteNumberPattern, Number(issueDate.slice(0, 4)), all.map((r) => r.number));
}

export async function newQuoteDefaults(customerId = ""): Promise<QuoteInput> {
  const [s, stages] = await Promise.all([getSettings(), listStages()]);
  const today = todayIso();
  return {
    customerId,
    contactId: null,
    title: "",
    stageId: stages[0]?.id ?? "",
    issueDate: today,
    validUntil: addDays(today, s.quoteValidityDays),
    expectedCloseDate: null,
    currency: s.currency,
    introText: null,
    note: null,
    lostReason: null,
  };
}

async function replaceItems(quoteId: string, items: QuoteItemInput[]) {
  const db = getDb();
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  if (items.length) {
    await db.insert(quoteItems).values(items.map((it, i) => ({ ...it, id: newId(), quoteId, position: i + 1, ...created() })));
  }
}

export async function saveQuote(input: QuoteInput, items: QuoteItemInput[], id?: string): Promise<string> {
  if (!input.customerId) throw new Error("Vyberte zákazníka");
  if (!input.title.trim()) throw new Error("Predmet ponuky je povinný");
  const cleanItems = items.filter((i) => i.name.trim());
  const t = computeTotals(cleanItems);
  const totals = { totalNet: t.net, totalVat: t.vat, totalGross: t.gross };
  const db = getDb();
  if (id) {
    await db.update(quotes).set({ ...input, ...totals, ...touched() }).where(eq(quotes.id, id));
    await replaceItems(id, cleanItems);
    await logAudit("quote", id, "update", { ...input, ...totals });
    return id;
  }
  const quoteId = newId();
  const number = await nextQuoteNumber(input.issueDate);
  await db.insert(quotes).values({ ...input, ...totals, id: quoteId, number, ...created() });
  await replaceItems(quoteId, cleanItems);
  await logAudit("quote", quoteId, "create", { number });
  return quoteId;
}

export async function moveQuoteToStage(id: string, stageId: string) {
  await getDb().update(quotes).set({ stageId, ...touched() }).where(eq(quotes.id, id));
  await logAudit("quote", id, "update", { stageId });
}

export async function deleteQuote(id: string) {
  await getDb().update(quotes).set({ deletedAt: nowIso(), ...touched() }).where(eq(quotes.id, id));
  await logAudit("quote", id, "delete");
}

export async function duplicateQuote(id: string): Promise<string> {
  const src = await getQuote(id);
  if (!src) throw new Error("Ponuka neexistuje");
  const d = await newQuoteDefaults(src.quote.customerId);
  const { quote } = src;
  return saveQuote(
    { ...d, contactId: quote.contactId, title: quote.title, currency: quote.currency, introText: quote.introText, note: quote.note },
    src.items,
  );
}

export async function ordersForQuote(quoteId: string) {
  return getDb().select().from(orders).where(eq(orders.quoteId, quoteId)).all();
}

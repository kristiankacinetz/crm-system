import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../testing";
import { createCustomer, emptyCustomer, listContacts, saveContact, updateCustomer } from "./customers";
import { addPayment, createInvoice, deletePayment, listInvoices, markPaid } from "./invoices";
import { createOrderFromQuote, listOrders } from "./orders";
import { getQuote, listQuotes, newQuoteDefaults, saveQuote } from "./quotes";
import { getSettings, saveSettings } from "./settings";
import { deleteStage, listStages } from "./stages";

beforeEach(async () => {
  await createTestDb();
});

const customer = (name: string, ico: string | null = null) => createCustomer({ ...emptyCustomer(), name, ico });

describe("customers", () => {
  it("rejects duplicate IČO and normalizes it", async () => {
    const a = await customer("Alfa", "123 456 78");
    expect(a.ico).toBe("12345678");
    await expect(customer("Iná", "12345678")).rejects.toThrow("už existuje");
    const b = await customer("Beta");
    await expect(updateCustomer(b.id, { ico: "12345678" })).rejects.toThrow();
  });

  it("keeps a single primary contact", async () => {
    const c = await customer("Alfa");
    const base = { role: null, email: null, phone: null, note: null };
    const first = await saveContact(c.id, { ...base, name: "Jana", isPrimary: false });
    const second = await saveContact(c.id, { ...base, name: "Peter", isPrimary: true });
    const list = await listContacts(c.id);
    expect(list.find((x) => x.id === first)!.isPrimary).toBe(false);
    expect(list.find((x) => x.id === second)!.isPrimary).toBe(true);
  });
});

describe("invoices", () => {
  it("tracks manual payments", async () => {
    const c = await customer("Alfa");
    const id = await createInvoice({
      number: "F1", variableSymbol: null, customerId: c.id, orderId: null, issueDate: "2026-11-01", taxableDate: null,
      dueDate: "2026-11-15", currency: "EUR", totalNet: 10000, totalVat: 2300, totalGross: 12300, cancelled: false, note: null,
    });
    await expect(
      createInvoice({ number: "F1", variableSymbol: null, customerId: null, orderId: null, issueDate: "2026-11-01", taxableDate: null, dueDate: "2026-11-15", currency: "EUR", totalNet: 0, totalVat: 0, totalGross: 0, cancelled: false, note: null }),
    ).rejects.toThrow("už existuje");
    expect((await listInvoices("2026-11-25"))[0].status).toBe("overdue");
    const pid = await addPayment(id, { paidOn: "2026-11-20", amount: 2300 });
    expect((await listInvoices("2026-11-25"))[0]).toMatchObject({ status: "overdue", remaining: 10000 });
    await markPaid(id, "2026-11-25");
    expect((await listInvoices("2026-11-25"))[0]).toMatchObject({ status: "paid", remaining: 0, paid: 12300 });
    await deletePayment(pid);
    expect((await listInvoices("2026-11-25"))[0].status).toBe("overdue");
  });
});

describe("quotes and orders", () => {
  it("numbers quotes, computes totals and turns a quote into an order", async () => {
    const c = await customer("Alfa");
    const d = await newQuoteDefaults(c.id);
    const item = { name: "Práca", description: null, quantity: 10, unit: "h", unitPrice: 5000, discountPct: 0, vatRate: 23 };
    const q1 = await saveQuote({ ...d, title: "Web", issueDate: "2026-11-25" }, [item, { ...item, name: " " }]);
    const q2 = await saveQuote({ ...d, title: "E-shop", issueDate: "2026-11-25" }, [item]);
    const quotes = await listQuotes();
    expect(quotes.map((q) => q.number).sort()).toEqual(["CP2026001", "CP2026002"]);
    const full = await getQuote(q1);
    expect(full!.items).toHaveLength(1);
    expect(full!.quote).toMatchObject({ totalNet: 50000, totalVat: 11500, totalGross: 61500 });

    const orderId = await createOrderFromQuote(q2);
    const orders = await listOrders();
    expect(orders[0]).toMatchObject({ id: orderId, number: "Z2026001", totalGross: 61500, quoteId: q2 });
    const won = (await listStages()).find((s) => s.kind === "won")!;
    expect((await getQuote(q2))!.quote.stageId).toBe(won.id);
    await expect(deleteStage(won.id)).rejects.toThrow();
  });
});

describe("settings", () => {
  it("merges saved values with defaults", async () => {
    expect((await getSettings()).defaultVatRate).toBe(23);
    await saveSettings({ dueSoonDays: 7 });
    const s = await getSettings();
    expect(s.dueSoonDays).toBe(7);
    expect(s.company.name).toBeTruthy();
  });
});

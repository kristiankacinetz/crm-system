import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../db/repo/settings";
import type { Customer, Quote, QuoteItem } from "../db/schema";
import { buildQuotePdf } from "./quotePdf";

const audit = { createdAt: "", updatedAt: "", createdBy: "local", updatedBy: "local", deletedAt: null };

describe("quote PDF", () => {
  it("renders a PDF with Slovak characters", async () => {
    const customer: Customer = {
      id: "c", name: "Žltý kôň, s.r.o.", ico: "12345678", dic: "2020123456", icDph: "SK2020123456", street: "Ďumbierska 5",
      city: "Banská Bystrica", zip: "974 01", country: "SK", email: null, phone: null, web: null, note: null, ...audit,
    };
    const quote: Quote = {
      id: "q", number: "CP2026001", customerId: "c", contactId: null, title: "Návrh a vývoj webovej stránky", stageId: "stage-offer",
      issueDate: "2026-11-25", validUntil: "2026-12-25", expectedCloseDate: null, currency: "EUR",
      introText: "Na základe nášho stretnutia vám posielame cenovú ponuku.", note: "Termín dodania: 6 týždňov od objednávky.",
      lostReason: null, totalNet: 0, totalVat: 0, totalGross: 0, ...audit,
    };
    const items: QuoteItem[] = [
      { id: "1", quoteId: "q", position: 1, name: "Analýza a návrh", description: "Workshop, wireframy", quantity: 16, unit: "hod", unitPrice: 5000, discountPct: 0, vatRate: 23, ...audit },
      { id: "2", quoteId: "q", position: 2, name: "Programovanie", description: null, quantity: 40, unit: "hod", unitPrice: 4500, discountPct: 10, vatRate: 23, ...audit },
    ];
    const bytes = await buildQuotePdf({ quote, items, customer, settings: DEFAULT_SETTINGS });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    if (process.env.PDF_OUT) writeFileSync(process.env.PDF_OUT, bytes);
  });
});

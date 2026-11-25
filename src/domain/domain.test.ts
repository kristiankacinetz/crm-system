import { describe, expect, it } from "vitest";
import { addDays, daysBetween } from "./dates";
import { invoiceStatus } from "./invoiceStatus";
import { parseAmount } from "./money";
import { nextNumber } from "./numbering";
import { computeTotals } from "./quoteTotals";

describe("dates", () => {
  it("counts days across month ends", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetween("2026-03-01", "2026-02-27")).toBe(-2);
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });
});

describe("parseAmount", () => {
  it.each([
    ["1 234,50", 123450],
    ["1.234,50 €", 123450],
    ["1,234.50", 123450],
    ["99", 9900],
    [12.345, 1235],
    ["-5,1", -510],
    ["", null],
    ["abc", null],
  ])("%s", (input, cents) => expect(parseAmount(input)).toBe(cents));
});

describe("invoiceStatus", () => {
  const base = { totalGross: 10000, importedPaid: 0, paymentsSum: 0, dueDate: "2026-11-30", cancelled: false };
  it("derives status", () => {
    expect(invoiceStatus(base, "2026-11-10", 3)).toBe("unpaid");
    expect(invoiceStatus(base, "2026-11-28", 3)).toBe("due_soon");
    expect(invoiceStatus(base, "2026-12-01", 3)).toBe("overdue");
    expect(invoiceStatus({ ...base, paymentsSum: 5000 }, "2026-11-10", 3)).toBe("partial");
    expect(invoiceStatus({ ...base, importedPaid: 10000 }, "2026-12-10", 3)).toBe("paid");
    expect(invoiceStatus({ ...base, cancelled: true }, "2026-12-10", 3)).toBe("cancelled");
  });
  it("keeps manual payment when import says unpaid", () => {
    expect(invoiceStatus({ ...base, paymentsSum: 10000, importedPaid: 0 }, "2026-12-10", 3)).toBe("paid");
  });
});

describe("numbering", () => {
  it("continues the highest sequence of the year", () => {
    expect(nextNumber("CP{YYYY}{NNN}", 2026, [])).toBe("CP2026001");
    expect(nextNumber("CP{YYYY}{NNN}", 2026, ["CP2026001", "CP2026007", "CP2025099"])).toBe("CP2026008");
    expect(nextNumber("Z-{YY}/{NN}", 2026, ["Z-26/09"])).toBe("Z-26/10");
  });
});

describe("computeTotals", () => {
  it("sums per VAT rate", () => {
    const t = computeTotals([
      { quantity: 2, unitPrice: 10000, discountPct: 0, vatRate: 23 },
      { quantity: 1, unitPrice: 5000, discountPct: 10, vatRate: 23 },
      { quantity: 1, unitPrice: 1000, discountPct: 0, vatRate: 0 },
    ]);
    expect(t.net).toBe(25500);
    expect(t.vat).toBe(5635);
    expect(t.gross).toBe(31135);
  });
});

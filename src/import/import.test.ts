import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../db/testing";
import { createCustomer, emptyCustomer, listCustomers } from "../db/repo/customers";
import { addPayment, listInvoices } from "../db/repo/invoices";
import { applyImport, planImport } from "./apply";
import { detectHeaderRow, missingRequired, suggestMapping } from "./mapping";
import { normalizeRows } from "./normalize";
import { readGrid } from "./read";

const fixture = (name: string) => new Uint8Array(readFileSync(join(__dirname, "fixtures", name)));

async function parse(name: string) {
  const grid = await readGrid(name, fixture(name));
  const header = detectHeaderRow(grid);
  const mapping = suggestMapping(grid[header]);
  return { grid, header, mapping, ...normalizeRows(grid, header, mapping) };
}

async function runImport(name: string) {
  const p = await parse(name);
  const plan = await planImport(p.rows, p.errors);
  return { plan, result: await applyImport(plan, name) };
}

describe("reading and mapping", () => {
  it("reads xlsx with a title row above the header", async () => {
    const p = await parse("idoklad-sample.xlsx");
    expect(p.header).toBe(2);
    expect(missingRequired(p.mapping)).toEqual([]);
    expect(p.mapping.slice(0, 11)).toEqual([
      "number", "variableSymbol", "customerName", "customerIco", "issueDate", "dueDate",
      "totalNet", "totalVat", "totalGross", "paid", "currency",
    ]);
    expect(p.errors).toEqual([]);
    expect(p.rows).toHaveLength(3); // summary row skipped
    expect(p.rows[2]).toMatchObject({ number: "2026003", issueDate: "2026-11-20", totalGross: 246062, paid: 100000, totalVat: 46012 });
  });

  it("reads semicolon CSV in UTF-8 and Windows-1250 identically", async () => {
    const a = await parse("idoklad-sample.csv");
    const b = await parse("idoklad-cp1250.csv");
    expect(b.rows).toEqual(a.rows);
    expect(a.rows.map((r) => r.number)).toEqual(["2026001", "2026004"]);
    expect(a.rows[0]).toMatchObject({ customerName: "Alfa s.r.o.", paid: 123000, dueDate: "2026-10-15" });
    expect(a.rows[1]).toMatchObject({ paid: 0, totalGross: 9990 });
    expect(a.errors).toHaveLength(1);
    expect(a.errors[0].message).toContain("2026005");
  });
});

describe("applying an import", () => {
  beforeEach(async () => {
    await createTestDb();
  });

  it("creates invoices and matches or creates customers", async () => {
    await createCustomer({ ...emptyCustomer(), name: "Beta a.s.", ico: null });
    const { result } = await runImport("idoklad-sample.xlsx");
    expect(result).toMatchObject({ created: 3, updated: 0, newCustomers: 1 });
    const customers = await listCustomers();
    expect(customers.map((c) => c.name).sort()).toEqual(["Alfa s.r.o.", "Beta a.s."]);
    const inv = await listInvoices("2026-11-25");
    const byNo = Object.fromEntries(inv.map((i) => [i.number, i]));
    expect(byNo["2026001"].status).toBe("paid");
    expect(byNo["2026002"].status).toBe("overdue");
    expect(byNo["2026002"].customerName).toBe("Beta a.s.");
    expect(byNo["2026003"].status).toBe("partial");
  });

  it("is idempotent", async () => {
    await runImport("idoklad-sample.xlsx");
    const { plan, result } = await runImport("idoklad-sample.xlsx");
    expect(plan.counts).toMatchObject({ create: 0, update: 0, unchanged: 3 });
    expect(result.newCustomers).toBe(0);
    expect(await listInvoices()).toHaveLength(3);
  });

  it("updates changed invoices and keeps manual payments", async () => {
    await runImport("idoklad-sample.xlsx");
    const before = (await listInvoices("2026-11-25")).find((i) => i.number === "2026002")!;
    await addPayment(before.id, { paidOn: "2026-11-20", amount: 61500 });
    // CSV re-imports 2026001 (same data, other columns) and adds 2026004.
    const { plan } = await runImport("idoklad-sample.csv");
    expect(plan.counts).toMatchObject({ create: 1, update: 0, unchanged: 1 });
    const after = await listInvoices("2026-11-25");
    expect(after).toHaveLength(4);
    expect(after.find((i) => i.number === "2026002")!.status).toBe("paid");
    expect(after.find((i) => i.number === "2026004")!.customerName).toBe("Gama");
    // CSV has no VAT columns: values from the xlsx import stay.
    expect(after.find((i) => i.number === "2026001")!.totalVat).toBe(23000);
  });
});

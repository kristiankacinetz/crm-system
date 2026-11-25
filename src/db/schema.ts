/**
 * Database schema (Drizzle ORM, SQLite dialect).
 *
 * Conventions (see docs/datovy-model.md):
 * - text UUID primary keys
 * - money as integer cents
 * - dates as "YYYY-MM-DD" text, timestamps as ISO 8601 UTC text
 * - every table carries audit columns and a soft-delete marker
 *
 * Keep this file in sync with src-tauri/migrations (generate with `npm run db:generate`).
 */
import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const audit = {
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  createdBy: text("created_by").notNull().default("local"),
  updatedBy: text("updated_by").notNull().default("local"),
  deletedAt: text("deleted_at"),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  ...audit,
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedBy: text("updated_by").notNull().default("local"),
});

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ico: text("ico"),
    dic: text("dic"),
    icDph: text("ic_dph"),
    street: text("street"),
    city: text("city"),
    zip: text("zip"),
    country: text("country").notNull().default("SK"),
    email: text("email"),
    phone: text("phone"),
    web: text("web"),
    note: text("note"),
    ...audit,
  },
  (t) => [index("customers_ico_idx").on(t.ico), index("customers_name_idx").on(t.name)],
);

export const contacts = sqliteTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    name: text("name").notNull(),
    role: text("role"),
    email: text("email"),
    phone: text("phone"),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    note: text("note"),
    ...audit,
  },
  (t) => [index("contacts_customer_idx").on(t.customerId)],
);

export const pipelineStages = sqliteTable("pipeline_stages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  kind: text("kind", { enum: ["open", "won", "lost"] }).notNull().default("open"),
  color: text("color").notNull().default("blue"),
  ...audit,
});

export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    contactId: text("contact_id").references(() => contacts.id),
    title: text("title").notNull(),
    stageId: text("stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    issueDate: text("issue_date").notNull(),
    validUntil: text("valid_until"),
    expectedCloseDate: text("expected_close_date"),
    currency: text("currency").notNull().default("EUR"),
    introText: text("intro_text"),
    note: text("note"),
    lostReason: text("lost_reason"),
    totalNet: integer("total_net").notNull().default(0),
    totalVat: integer("total_vat").notNull().default(0),
    totalGross: integer("total_gross").notNull().default(0),
    ...audit,
  },
  (t) => [
    uniqueIndex("quotes_number_uq").on(t.number),
    index("quotes_customer_idx").on(t.customerId),
    index("quotes_stage_idx").on(t.stageId),
  ],
);

export const quoteItems = sqliteTable(
  "quote_items",
  {
    id: text("id").primaryKey(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    quantity: real("quantity").notNull().default(1),
    unit: text("unit").notNull().default("ks"),
    unitPrice: integer("unit_price").notNull().default(0),
    discountPct: real("discount_pct").notNull().default(0),
    vatRate: real("vat_rate").notNull().default(23),
    ...audit,
  },
  (t) => [index("quote_items_quote_idx").on(t.quoteId)],
);

export const ORDER_STATUSES = ["new", "in_progress", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    quoteId: text("quote_id").references(() => quotes.id),
    title: text("title").notNull(),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("new"),
    orderDate: text("order_date").notNull(),
    deadline: text("deadline"),
    currency: text("currency").notNull().default("EUR"),
    totalNet: integer("total_net").notNull().default(0),
    totalGross: integer("total_gross").notNull().default(0),
    note: text("note"),
    ...audit,
  },
  (t) => [
    uniqueIndex("orders_number_uq").on(t.number),
    index("orders_customer_idx").on(t.customerId),
  ],
);

export const importBatches = sqliteTable("import_batches", {
  id: text("id").primaryKey(),
  fileName: text("file_name").notNull(),
  importedAt: text("imported_at").notNull(),
  rowsTotal: integer("rows_total").notNull().default(0),
  createdCount: integer("created_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  unchangedCount: integer("unchanged_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  errors: text("errors").notNull().default("[]"),
  ...audit,
});

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    variableSymbol: text("variable_symbol"),
    customerId: text("customer_id").references(() => customers.id),
    orderId: text("order_id").references(() => orders.id),
    customerNameRaw: text("customer_name_raw"),
    customerIcoRaw: text("customer_ico_raw"),
    issueDate: text("issue_date").notNull(),
    taxableDate: text("taxable_date"),
    dueDate: text("due_date").notNull(),
    currency: text("currency").notNull().default("EUR"),
    totalNet: integer("total_net").notNull().default(0),
    totalVat: integer("total_vat").notNull().default(0),
    totalGross: integer("total_gross").notNull().default(0),
    importedPaid: integer("imported_paid").notNull().default(0),
    cancelled: integer("cancelled", { mode: "boolean" }).notNull().default(false),
    source: text("source", { enum: ["import", "manual"] }).notNull().default("manual"),
    importBatchId: text("import_batch_id").references(() => importBatches.id),
    note: text("note"),
    ...audit,
  },
  (t) => [
    uniqueIndex("invoices_number_uq").on(t.number),
    index("invoices_customer_idx").on(t.customerId),
    index("invoices_due_idx").on(t.dueDate),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id),
    paidOn: text("paid_on").notNull(),
    amount: integer("amount").notNull(),
    method: text("method", { enum: ["bank", "cash", "other"] }).notNull().default("bank"),
    note: text("note"),
    ...audit,
  },
  (t) => [index("payments_invoice_idx").on(t.invoiceId)],
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    at: text("at").notNull(),
    userId: text("user_id").notNull().default("local"),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action", { enum: ["create", "update", "delete", "import"] }).notNull(),
    changes: text("changes").notNull().default("{}"),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId)],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type ImportBatch = typeof importBatches.$inferSelect;

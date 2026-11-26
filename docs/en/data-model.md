---
title: "CRM – Data Model"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# CRM – Data Model

Author: Kristián Kačinetz · version 0.1.0

The local database is a single SQLite file (`crm.db` in the application data
folder). The schema is written in Drizzle ORM (`src/db/schema.ts`) and SQL
migrations (`src-tauri/migrations`), so it can later move to a shared database
(Turso/libSQL or PostgreSQL) without rewriting the application.

## Principles

| Principle | Why |
|---|---|
| Primary keys are text UUIDs | Records from several devices or users can be merged without collisions. |
| Money in cents (`INTEGER`) | No rounding errors when summing. The currency is always stored with the document. |
| Dates as text `YYYY-MM-DD`, timestamps as ISO 8601 UTC | Unambiguous, sortable, identical in SQLite and PostgreSQL. |
| Every table has `created_at`, `updated_at`, `created_by`, `updated_by` | With several users it is clear who changed what. |
| Soft delete (`deleted_at`) | Enables sync and recovery of accidentally deleted records. |
| Derived statuses are not stored | "Overdue" is computed from the due date and payments, so it never drifts from reality. |

## Entities

```
users ─┐ (created_by / updated_by in all tables)
       │
customers ──< contacts
    │
    ├──< quotes ──< quote_items        quotes.stage_id ──> pipeline_stages
    │       │
    │       └──< orders (an order is created from a won quote)
    │               │
    └──< invoices ──┘ (optionally linked to an order)
            │
            └──< payments (manually entered payments)

import_batches ──< invoices (which import created / last changed the invoice)
settings (key → JSON value)
audit_log (who, when, what changed)
```

### users
Currently one row (`local`, the executive). Ready for more users.

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| name | text | |
| email | text? | |

### customers

| Column | Type | Note |
|---|---|---|
| id | text PK | UUID |
| name | text | business name |
| ico, dic, ic_dph | text? | company ID, tax ID, VAT ID; company ID is the main key for matching iDoklad imports |
| street, city, zip, country | text? | billing address, country defaults to `SK` |
| email, phone, web | text? | |
| note | text? | |

Index: `ico` (not unique, the ID may be missing; duplicates are prevented by the application).

### contacts

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| customer_id | text FK → customers | |
| name, role, email, phone, note | text | |
| is_primary | integer (0/1) | one primary contact per customer |

### pipeline_stages
Defaults: **Ponuka** (Quote), **Rokovanie** (Negotiation), **Vyhraté** (Won),
**Prehraté** (Lost). They can be renamed, added and reordered in Settings.

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| name | text | |
| position | integer | order on the board |
| kind | text | `open` / `won` / `lost`, tells the application what counts as won |
| color | text | |

### quotes (price quotes = sales opportunities)
A quote is also a card in the pipeline; its stage is `stage_id`.

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| number | text unique | e.g. `CP2026001`, numbering per settings |
| customer_id | FK | |
| contact_id | FK? | addressee |
| title | text | subject |
| stage_id | FK → pipeline_stages | |
| issue_date, valid_until | date | |
| expected_close_date | date? | expected decision |
| currency | text | `EUR` |
| intro_text, note | text? | introduction and note in the PDF |
| lost_reason | text? | why it was lost |
| total_net, total_vat, total_gross | integer (cents) | recomputed from items on every save |

### quote_items

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| quote_id | FK | |
| position | integer | |
| name, description, unit | text | |
| quantity | real | |
| unit_price | integer (cents, excl. VAT) | |
| discount_pct | real | line discount in % |
| vat_rate | real | VAT rate in %, default from settings (23 %) |

### orders
A confirmed order. Created from a won quote (totals are copied) or manually.

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| number | text unique | e.g. `Z2026001` |
| customer_id | FK | |
| quote_id | FK? | |
| title | text | |
| status | text | `new`, `in_progress`, `done`, `cancelled` |
| order_date, deadline | date | |
| currency, total_net, total_gross | | |
| note | text? | |

### invoices
Invoices are issued in iDoklad. CRM takes them over by importing an export
(.xlsx/.csv) or by manual entry. **The invoice number is unique** and enables
repeated imports without duplicates.

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| number | text unique | document number from iDoklad |
| variable_symbol | text? | payment reference |
| customer_id | FK? | matched customer (by company ID, else by name) |
| order_id | FK? | optional order |
| customer_name_raw, customer_ico_raw | text? | as received in the import, for checking the match |
| issue_date, due_date | date | |
| taxable_date | date? | date of supply |
| currency | text | |
| total_net, total_vat, total_gross | integer (cents) | |
| imported_paid | integer (cents) | amount paid according to the last import |
| cancelled | integer (0/1) | cancelled invoice |
| source | text | `import` / `manual` |
| import_batch_id | FK? | last import that created or changed the invoice |
| note | text? | |

**Invoice status is computed** (`src/domain/invoiceStatus.ts`):

- `paid = max(imported_paid, sum of payments)`
- **Cancelled**: `cancelled = 1`
- **Paid**: paid ≥ total incl. VAT
- **Partly paid**: 0 < paid < total
- **Overdue**: unpaid and `due_date` < today
- **Due soon**: unpaid and due within N days (N in settings, 3 by default)
- **Unpaid**: otherwise

Why `max` rather than overwrite: if the user marks an invoice as paid and later
imports an older export where it is not yet paid, the import does not remove
the manual payment.

### payments
Manually recorded payments (no bank connection).

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| invoice_id | FK | |
| paid_on | date | |
| amount | integer (cents) | |
| method | text | `bank` / `cash` / `other` |
| note | text? | |

### import_batches

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| file_name | text | |
| imported_at | text | |
| rows_total, created_count, updated_count, unchanged_count, error_count | integer | |
| errors | text (JSON) | rows that could not be read, with the reason |

### settings
Key → JSON. Company details for PDFs (name, address, IDs, IBAN, contact, logo as
a data URL), default VAT, currency, document numbering, days before due date
for alerts, backup folder, saved import column mapping.

### audit_log

| Column | Type | Note |
|---|---|---|
| id | text PK | |
| at | text | |
| user_id | FK | |
| entity, entity_id | text | |
| action | text | `create` / `update` / `delete` / `import` |
| changes | text (JSON) | changed fields |

## iDoklad import

1. The user picks an export of the issued invoices list (.xlsx or .csv, UTF-8 or Windows-1250).
2. The application finds the header row and proposes a column mapping by name.
   The mapping can be edited and is saved for later imports.
3. The preview shows what is **new**, **changed**, **unchanged**, and failed rows.
4. On confirmation an invoice with the same number is updated, a new one is
   created. The customer is matched by company ID, then by name, otherwise
   created. Manual payments and notes are never overwritten.
5. Importing the same file again changes nothing.

## Alerts

Only for the executive, never for customers: a system notification on start
(once a day) and a list of overdue and soon-due invoices on the Overview.

## Backups

"Back up now" button and an automatic daily backup on start into a chosen
folder (e.g. OneDrive) using `VACUUM INTO`, which creates a consistent copy
while the application runs. The live database must not be in a synced folder.

## Moving to a shared database

- The schema is in Drizzle, which supports SQLite, libSQL (Turso) and PostgreSQL.
- All data access goes through `src/db/repo/*`; the UI writes no SQL.
- UUIDs, `updated_at`, `deleted_at` and the change author enable sync.
- Simplest path to multiple devices: Turso (libSQL) embedded replica.

---

© 2026 Kristián Kačinetz. All rights reserved.

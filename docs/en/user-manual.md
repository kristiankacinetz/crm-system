---
title: "CRM – User Manual"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# CRM – User Manual

| | |
|---|---|
| Product | CRM, desktop application |
| Version | 0.1.0 |
| Author | Kristián Kačinetz, kristian.kacinetz@gmail.com |
| Date | 26 November 2026 |

> The application's user interface is in Slovak. Screen and button names are
> given in Slovak with an English translation in brackets.

## 1. Introduction

CRM is an application for the managing director or owner of a small company.
It keeps customers and contact persons, issued invoices and their status,
price quotes, sales opportunities (pipeline) and orders in one place.
Invoices are still issued in iDoklad and are brought into CRM by importing an
iDoklad export.

All data is stored only on your computer. The application sends nothing to
the internet and nothing to your customers.

### Who this manual is for

Everyday users of the application. Installation is described in the
[Installation Guide](installation.md), data management and backups in the
[Administrator Guide](administration.md).

## 2. First start

1. Start **CRM** from the Start menu.
2. Open **Nastavenia** (Settings), the last item in the left menu.
3. Fill in **Údaje firmy** (Company details): business name, address, company
   ID (IČO), tax ID (DIČ), VAT ID (IČ DPH), registration, IBAN, bank, SWIFT and
   contact details. These are printed on PDF quotes.
4. Upload a **logo** (PNG or JPG, at most 1.5 MB).
5. Check the **defaults**: currency, VAT rate (23 % by default), quote validity
   in days, and how many days before the due date you want to be alerted (3 by
   default).
6. Under **Zálohy** (Backups) click **Vybrať** (Choose) and pick a backup
   folder, for example in OneDrive. Then click **Zálohovať teraz** (Back up now).
7. Click **Uložiť nastavenia** (Save settings).

## 3. Navigation

| Menu item | Purpose |
|---|---|
| Prehľad (Overview) | summary: overdue and soon-due invoices, unpaid totals, pipeline, active orders |
| Zákazníci (Customers) | companies, their details, contact persons and history |
| Faktúry (Invoices) | invoice list, status filters, payments |
| Import z iDokladu (iDoklad import) | loading an invoice export from iDoklad |
| Pipeline | board of sales opportunities by stage |
| Ponuky (Quotes) | price quotes with line items and PDF |
| Zákazky (Orders) | confirmed orders |
| Nastavenia (Settings) | company details, logo, numbering, stages, backups, about |

## 4. Overview

On start the Overview shows the cards **Po splatnosti** (Overdue),
**Neuhradené spolu** (Total unpaid), **Otvorené ponuky** (Open quotes) and
**Aktívne zákazky** (Active orders), followed by lists of overdue and soon-due
invoices and a pipeline summary. **Otvoriť** (Open) goes to the detail.

Once a day, on the first start, the application shows a system notification if
any invoices are overdue or due soon. The notification is for you only.

## 5. Customers

- **Nový zákazník** (New customer): business name and optionally company ID,
  tax ID, VAT ID, address, e-mail, phone, website and a note.
- **Search** by name, company ID or e-mail.
- **Customer detail** shows details, unpaid amount, contact persons, invoices,
  quotes and orders. From here you can **enter an invoice manually** or create
  a **new quote**.
- **Contact persons**: button **Pridať** (Add). One person can be marked as
  **Hlavný kontakt** (Primary contact).
- **Upraviť** (Edit) and **Zmazať** (Delete) are in the detail header. Deletion
  is soft: the record stays in the database, marked as deleted.

Tip: fill in the company ID. The iDoklad import uses it to match invoices to
customers.

## 6. Invoices

### 6.1 List and filters

Filters: **Neuhradené** (Unpaid), **Po splatnosti** (Overdue), **Uhradené**
(Paid), **Stornované** (Cancelled), **Všetky** (All). Search by invoice number
or customer. Below the list you see the count, the total incl. VAT and the
amount still to be paid.

### 6.2 Invoice statuses

The status is calculated automatically and cannot be set by hand:

| Status | When |
|---|---|
| Neuhradená (Unpaid) | not paid, due date still ahead |
| Blíži sa splatnosť (Due soon) | not paid, due within the configured number of days |
| Po splatnosti (Overdue) | not paid, due date has passed |
| Čiastočne uhradená (Partly paid) | part of the amount is paid |
| Uhradená (Paid) | fully paid |
| Stornovaná (Cancelled) | invoice is marked as cancelled |

### 6.3 Payments

There is no bank connection. Record a payment in the invoice detail:

- **Označiť celú sumu ako uhradenú dnes** (Mark the full amount as paid today), or
- **Pridať čiastočnú úhradu** (Add partial payment) with date, amount and method
  (bank, cash, other).

If an iDoklad import contains a "paid" amount, the application uses the higher
value (import or manual payments). An import never removes a manual payment.

### 6.4 Entering an invoice manually

Button **Zadať ručne** (Enter manually): invoice number, customer, variable
symbol, issue date, date of supply, due date, amounts and a note. The invoice
number must be unique.

## 7. iDoklad import

1. In iDoklad open the list of **issued invoices** and export it to **Excel
   (.xlsx)** or **CSV**.
2. In CRM open **Import z iDokladu** and click **Vybrať súbor** (Choose file).
3. The application finds the header row and proposes a column mapping (e.g.
   document number, customer, company ID, due date, total incl. VAT, paid).
   You can change the mapping; it is saved for future imports.
4. Click **Zobraziť náhľad** (Show preview). You see which invoices are **new**,
   **changed** and **unchanged**, and which rows cannot be read and why.
5. Click **Importovať** (Import).

Repeating the import is safe. Invoices are matched by number, so no duplicates
are created. A customer is matched by company ID, then by name, otherwise a new
customer is created. Past imports are listed under **História importov**
(Import history).

Supported CSV encodings: UTF-8 and Windows-1250.

## 8. Price quotes

1. **Ponuky** → **Nová ponuka** (New quote), or from a customer or the Pipeline.
2. Fill in customer, contact person, **subject**, issue date, **valid until**,
   expected decision date, currency and stage.
3. **Pridať položku** (Add item): name, description, quantity, unit, unit
   price excl. VAT, discount % and VAT rate. Totals update automatically.
4. Optionally add an **introduction** (above the items in the PDF) and a
   **note** (below the items).
5. Click **Uložiť** (Save).
6. **PDF** creates the quote as a PDF with your logo and company details.

Other actions: **Kopírovať** (Copy), **Vytvoriť zákazku** (Create order),
**Zmazať ponuku** (Delete quote). For a lost quote you can record the
**reason for losing**.

Quote numbering (e.g. `CP2026001`) is set in Settings. Tokens: `{YYYY}` year,
`{YY}` short year, `{NNN}` sequence number.

## 9. Pipeline

The pipeline is a board where each quote is a card in its stage. The default
stages are **Ponuka** (Quote), **Rokovanie** (Negotiation), **Vyhraté** (Won)
and **Prehraté** (Lost). Drag a card to move it to another stage.

Edit stages in **Nastavenia → Fázy pipeline** (Settings → Pipeline stages):
name, colour, order and type (Open, Won, Lost). A stage that contains quotes
cannot be deleted.

## 10. Orders

An order is a confirmed purchase. It is created:

- from a quote with **Vytvoriť zákazku** (amounts are copied and the quote
  moves to the stage of type Won), or
- manually with **Nová zákazka** (New order).

An order has a title, customer, order date, delivery deadline, amounts, a note
and a status: **Nová** (New), **V realizácii** (In progress), **Dokončená**
(Done), **Zrušená** (Cancelled).

## 11. Settings

| Section | Contents |
|---|---|
| Company details | data for PDF quotes and the logo |
| Defaults | currency, VAT, quote validity, due-soon alert, quote and order numbering, PDF closing text |
| Pipeline stages | name, type, colour, order |
| Backups | backup folder, Back up now, time of last backup |
| About | version, author, copyright |

## 12. Backups in brief

When a backup folder is set, the application saves a copy of the database once
a day on start (file `crm-zaloha-YYYY-MM-DD_HHMMSS.db`). You can click
**Zálohovať teraz** (Back up now) at any time. Restoring is described in the
[Administrator Guide](administration.md#4-restoring-from-a-backup).

## 13. FAQ

**Does the application send reminders to customers?** No. Alerts are visible
only to the user of the application.

**Can I run the import several times?** Yes. Importing the same file again
changes nothing.

**Why is an invoice "Paid" although it is not paid in iDoklad yet?** Because
you marked it as paid in CRM. Manual payments take precedence.

**Does it work offline?** Yes, completely.

**Can I use it on two computers?** This version is for one computer and one
user. Data can be moved using a backup.

## 14. Support

Support contact: **kristian.kacinetz@gmail.com**, phone: **[add phone]**.
The scope of support is defined by the licence agreement or support agreement.

---

© 2026 Kristián Kačinetz. All rights reserved.

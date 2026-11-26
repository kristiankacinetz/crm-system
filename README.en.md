# CRM

[Slovenská verzia](README.md) · Author: Kristián Kačinetz

Internal CRM for a company's managing director: customers and contact persons,
invoices and their status, due-date alerts, price quotes with PDF, a sales
pipeline and orders.

> This is not the first version. It is the newest, rebuilt version of the
> application I have been developing since 2025. The repository of the previous
> version no longer exists, so the commit history here starts with this version.

A local desktop application (Tauri 2 + React + SQLite), primarily for Windows,
also running on macOS and Linux. Data lives in one file on the computer;
nothing is sent to the internet. The user interface is in Slovak.

## Features

- **Overview**: overdue and soon-due invoices, unpaid totals, pipeline, active orders.
- **Customers**: companies with company ID / tax ID / VAT ID, contact persons, history of invoices, quotes and orders.
- **Invoices**: iDoklad import, manual entry, automatic status (Unpaid, Due soon, Overdue, Partly paid, Paid, Cancelled), manual payments.
- **iDoklad import**: export of the issued invoices list (.xlsx or .csv). Columns are mapped automatically, a preview shows new and changed invoices. The import is repeatable; invoices are matched by number and manual payments are never overwritten.
- **Quotes**: line items, discounts, VAT rates, PDF export with logo and company details.
- **Pipeline**: board by stage (Quote, Negotiation, Won, Lost), drag and drop. Stages are editable.
- **Orders**: created from a won quote or manually.
- **Alerts** for the executive only: a system notification once a day on start. Nothing is sent to customers.
- **Backups**: daily to a chosen folder (e.g. OneDrive) and with a "Back up now" button.

## Installation (Windows)

The installer (.msi or .exe) is built automatically in GitHub Actions
(*Actions* tab → latest *CI* run → artifact `crm-windows-installer`).
See the [Installation Guide](docs/en/installation.md).

## Documentation

All documentation in Slovak and English is listed in [docs/README.md](docs/README.md).

## Development

Requirements: Node.js 22, Rust (stable) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
(on Windows WebView2 and Visual Studio Build Tools).

```bash
npm install
npm run tauri dev      # run the application
npm test               # tests (data layer, import, PDF) on in-memory SQLite
npm run typecheck
npm run tauri build    # installer for the current OS
python3 scripts/docs/build.py   # documentation as PDF and DOCX
```

Data is stored in `crm.db` in the application data folder
(Windows: `%APPDATA%\sk.crm.desktop`).

## Licence

© 2026 Kristián Kačinetz. All rights reserved. See [LICENSE](LICENSE).

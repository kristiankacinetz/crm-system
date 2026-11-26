---
title: "CRM – What to Complete Before Selling"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# What to Complete Before Selling

The author's internal checklist. Not intended for customers.

## Legal and business

| # | Task | Why |
|---|---|---|
| 1 | **Business licence** (a Slovak trade licence, e.g. "providing software – sale of finished programs under an agreement with the author"), or selling through your own limited company | Repeated sale of licences is a business activity. As a natural person without a trade licence, licence income can be taxed as income from the use of a work (Section 6(4) of the Slovak Income Tax Act), but for regular sales and support a trade licence is advisable. Check with an accountant. |
| 2 | **Legal review of the EULA** and the privacy information | The texts are drafts. |
| 3 | **Data processing agreement** (template) for support | If customers will send you their database. |
| 4 | **Price list and licensing model** (one-off, yearly, per computer) | Add to the EULA, one-pager and quotes. |
| 5 | **Support terms** (SLA): channel, response time, price, what is and is not included | Add to EULA point 5. |
| 6 | **Contact details** (e-mail, phone, website, address) | All documents contain square-bracket placeholders. |
| 7 | **VAT**: monitor turnover (registration above the threshold) | Tax obligation. |
| 8 | **Trademark / product name** | "CRM" is a generic name. Choose a distinctive name before marketing and check it (Slovak IP Office, EUIPO). |
| 9 | **Open-source licences** | Ship a THIRD-PARTY-NOTICES list with the installer. All libraries used have permissive licences (MIT, Apache-2.0 etc.) but require attribution. |

## Technical

| # | Task | Why |
|---|---|---|
| 10 | **Code signing certificate** (OV certificate or Azure Trusted Signing) | Without a signature Windows SmartScreen warns during installation. The certificate is issued to a natural person or a company. |
| 11 | **Own product icon and logo** | Default icons are used now. |
| 12 | **Automatic updates** (`tauri-plugin-updater`) and a download location | Easier distribution of fixes. |
| 13 | **Licence key / activation** (optional) | Today the application can be copied without restriction. |
| 14 | **English user interface** (optional) | The UI is Slovak only today. |
| 15 | **Show the EULA in the installer** (`bundle.licenseFile`) | After the legal review. |
| 16 | **Screenshots** for the manual and marketing | To be taken in the app with sample data. |
| 17 | **Test on a clean Windows** (install, restore, import) | Before the first sale. |
| 18 | **Distinctive application identifier** (e.g. `sk.kacinetz.crm`) | Changing it moves the data folder, so do it before the first sale or with a data migration. |

## Details missing from the documents

- the author's address, company ID (if any), e-mail and phone,
- price and licensing model,
- support terms,
- SHA-256 checksum of the installer (each release),
- product logo and name, screenshots.

---

© 2026 Kristián Kačinetz. All rights reserved.

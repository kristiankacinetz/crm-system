---
title: "CRM – MVP Plan"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# CRM – MVP Plan

Author: Kristián Kačinetz · version 0.1.0

| Step | Contents |
|---|---|
| 1 | Data model and plan (this document, `data-model.md`) |
| 2 | App skeleton: Tauri 2, React, TypeScript, Vite, Mantine, SQLite via `tauri-plugin-sql`, migrations, Windows build in GitHub Actions |
| 3 | Data layer: Drizzle schema, repositories, tests on SQLite |
| 4 | Customers and contact persons |
| 5 | Invoices: list, status filters, manual entry, manual payment, due-date alerts, Overview |
| 6 | iDoklad export import (.xlsx/.csv) with column mapping and preview |
| 7 | Quotes with line items, pipeline (board), orders |
| 8 | Quote PDF, company and logo settings, stages, numbering, backups |

Outside the MVP: iDoklad API (only with a higher plan), sync between devices
(Turso), multiple users, bank connection.

---

© 2026 Kristián Kačinetz. All rights reserved.

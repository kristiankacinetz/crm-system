---
title: "CRM – Technical Documentation"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# CRM – Technical Documentation

| | |
|---|---|
| Product | CRM, desktop application |
| Version | 0.1.0 |
| Author | Kristián Kačinetz |
| Date | 26 November 2026 |

## 1. Architecture overview

CRM is a local desktop application. It consists of two parts in one installer:

```
┌──────────────────────────────────────────────┐
│ Application window (WebView2 / WebKit)       │
│  React + TypeScript + Mantine (UI)           │
│  src/pages, src/ui                            │
│        │                                      │
│  src/domain  pure logic (invoice status,     │
│              money, dates, numbering)        │
│  src/import  reading the iDoklad export       │
│  src/pdf     quote PDF (pdfmake)              │
│  src/db      Drizzle ORM → sqlite-proxy       │
│        │ IPC (Tauri)                          │
├────────┼─────────────────────────────────────┤
│ Rust (Tauri 2)                                │
│  tauri-plugin-sql  → SQLite file crm.db      │
│  tauri-plugin-dialog / fs / notification     │
│  migrations: src-tauri/migrations            │
└──────────────────────────────────────────────┘
```

- No server and no network calls. The CSP allows only the app's own resources
  and IPC.
- All data access goes through repositories in `src/db/repo/*`. The UI writes
  no SQL.
- Logic that needs testing (invoice statuses, totals, import, PDF) lives in
  pure modules without Tauri dependencies and is tested against in-memory
  SQLite.

## 2. Technology

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust) |
| UI | React 19, TypeScript, Mantine 9, React Router 7 |
| Database | SQLite via `tauri-plugin-sql` |
| ORM and migrations | Drizzle ORM, drizzle-kit |
| Import | `read-excel-file` (.xlsx), `papaparse` (.csv) |
| PDF | `pdfmake` |
| Build | Vite 8 |
| Tests | Vitest, built-in SQLite in Node.js 22 |
| CI | GitHub Actions: typecheck, tests, Windows installer build |

## 3. Repository layout

| Folder | Contents |
|---|---|
| `src/db` | schema (Drizzle), connection, repositories, seed data |
| `src/domain` | money, dates, invoice status, numbering, quote totals |
| `src/import` | reading, normalising, mapping and applying an import |
| `src/pdf` | quote PDF generation |
| `src/services` | backups, alerts, file handling |
| `src/pages`, `src/ui` | screens and shared components |
| `src-tauri` | Rust shell, configuration, icons, migrations |
| `docs` | documentation (SK and EN) |
| `scripts/docs` | building PDF and DOCX from the documentation |

## 4. Data model

The tables are described in the [Data Model](data-model.md). Key principles:

- primary keys are text UUIDs,
- money in cents (integers),
- dates as `YYYY-MM-DD`, timestamps as ISO 8601 UTC,
- every table has `created_at`, `updated_at`, `created_by`, `updated_by`,
- soft delete (`deleted_at`),
- invoice status is never stored, always computed,
- `audit_log` records changes (who, when, what).

## 5. Development environment

Requirements: Node.js 22, Rust (stable) and the Tauri prerequisites (on Windows
WebView2 and Visual Studio Build Tools).

```bash
npm install
npm run tauri dev      # run in development mode
npm test               # tests
npm run typecheck      # type check
npm run tauri build    # installer for the current OS
```

Build output: `src-tauri/target/release/bundle/` (`msi`, `nsis`, `dmg`,
`appimage`, `deb`).

## 6. Changing the database schema

1. Edit `src/db/schema.ts`.
2. `npx drizzle-kit generate` creates a new migration in `src-tauri/migrations`.
3. Add the migration to the list in `src-tauri/src/lib.rs` with the next version
   number.
4. Migrations run automatically on application start. Never edit a migration
   that has been released.

## 7. Releasing a new version

1. Bump the version in `package.json`, `src-tauri/Cargo.toml` and
   `src-tauri/tauri.conf.json`.
2. Update `CHANGELOG.md`.
3. Merge into `main`. CI builds the installer (artifact
   `crm-windows-installer`).
4. Sign the installer with a code signing certificate (see section 9).
5. Build the documentation: `python3 scripts/docs/build.py`.
6. Compute the installer's SHA-256 checksum and put it in the delivery note.

## 8. Metadata and authorship

| Location | Value |
|---|---|
| `package.json` → `author` | Kristián Kačinetz |
| `src-tauri/Cargo.toml` → `authors` | Kristián Kačinetz |
| `tauri.conf.json` → `bundle.publisher` | Kristián Kačinetz (manufacturer in the MSI/NSIS installer and in the .exe properties) |
| `tauri.conf.json` → `bundle.copyright` | © 2026 Kristián Kačinetz |
| Quote PDFs | author = the user's company, Creator/Producer = "CRM, autor Kristián Kačinetz" |
| Documentation (PDF, DOCX) | author, creator and last modified by = Kristián Kačinetz |

The application identifier `sk.crm.desktop` determines the data folder name.
Do not change it, or the application would not find existing data after an
update.

## 9. Security and known limitations

- The database is not encrypted; protection relies on disk encryption and the
  operating system account.
- Single user, no login or roles.
- The installer is not signed yet. Before selling, obtain a code signing
  certificate (e.g. an OV certificate or Azure Trusted Signing) and configure
  `bundle.windows.certificateThumbprint` or signing in CI.
- Automatic updates are not enabled (can be added with `tauri-plugin-updater`).

## 10. Scaling to more users

- Drizzle supports SQLite, libSQL (Turso) and PostgreSQL.
- UUIDs, `updated_at`, `deleted_at` and the change author enable sync.
- Simplest path to multiple devices: Turso (libSQL) with a local replica.
- For several simultaneous users: a shared PostgreSQL database (EU) and login.

---

© 2026 Kristián Kačinetz. All rights reserved.

---
title: "CRM – Administrator Guide"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# CRM – Administrator Guide

| | |
|---|---|
| Product | CRM, desktop application |
| Version | 0.1.0 |
| Author | Kristián Kačinetz |
| Date | 26 November 2026 |

This guide is for the person who installs the application, backs it up and
looks after the data.

## 1. How data is stored

- All data is in a single SQLite file `crm.db` in the application data folder
  (Windows: `%APPDATA%\sk.crm.desktop\`).
- Next to it there may be temporary files `crm.db-wal` and `crm.db-shm`. They
  belong to the database; do not delete them while the application runs.
- The company logo and settings are stored inside the database.
- There is no server and no cloud. Nothing is sent to the internet.

## 2. Backups

### 2.1 Setup

**Nastavenia → Zálohy → Vybrať** (Settings → Backups → Choose) and pick a
folder. We recommend a cloud-synced folder (OneDrive, Google Drive) or a
network drive, so the backup survives a computer failure.

### 2.2 How backups work

- Automatically once a day on start (if at least 20 hours have passed since
  the last backup).
- Manually with **Zálohovať teraz** (Back up now).
- The backup is created with SQLite `VACUUM INTO`, which writes a consistent
  copy even while the application is running.
- File name: `crm-zaloha-YYYY-MM-DD_HHMMSS.db`.

### 2.3 Recommendations

- Never put the live database (`crm.db`) in a synced folder. Syncing during a
  write can corrupt it.
- The application does not delete old backups. Clean up from time to time,
  e.g. keep the last 30 daily backups and one per month.
- Test a restore (section 4) on another computer once a quarter.

## 3. Checking a backup

A backup is a regular SQLite file. It can be opened with, for example, the free
DB Browser for SQLite to check that it contains the `customers`, `invoices`
and other tables.

## 4. Restoring from a backup

1. Close CRM (make sure it is not running in the background).
2. Open the folder `%APPDATA%\sk.crm.desktop\` (type `%APPDATA%\sk.crm.desktop`
   into the Explorer address bar).
3. Rename `crm.db` to `crm.db.before-restore`. If `crm.db-wal` and `crm.db-shm`
   exist, rename them the same way.
4. Copy the chosen backup `crm-zaloha-….db` into this folder and rename it to
   `crm.db`.
5. Start the application and check the data.

If anything goes wrong, put the original files back (step 3 in reverse).

## 5. iDoklad import in detail

- Input: export of the issued invoices list from iDoklad (.xlsx or .csv, UTF-8
  or Windows-1250).
- Invoice matching: by **document number** (unique). Re-importing updates
  existing invoices and creates no duplicates.
- Customer matching: by company ID (IČO), then by name, otherwise a new
  customer is created.
- Payments: the stored "paid according to import" amount is compared with
  manual payments. The higher value applies; a manual payment is never lost.
- The column mapping is saved. If iDoklad renames columns, adjust the mapping
  on the import screen.
- Each import is recorded in the import history (counts of new, changed,
  unchanged and failed rows).
- The free iDoklad plan has no API, so a file export is used. An API connection
  can be added with a higher iDoklad plan.

## 6. Alerts

- Once a day on first start, a system notification about overdue and soon-due
  invoices.
- The "due soon" number of days is configured in Settings.
- If you do not see notifications, enable them in Windows: **Settings → System
  → Notifications → CRM**.

## 7. Security

- The database is not encrypted. Protect the computer with a password and turn
  on disk encryption (BitLocker on Windows, FileVault on macOS).
- Protect the backup folder in the same way.
- The application has no login of its own. Anyone who signs in to the Windows
  user account has access to the data.
- The application does not talk to any server. Its content security policy
  (CSP) forbids loading external content.

## 8. Updates and versions

- The version is shown in **Nastavenia → O aplikácii** (Settings → About).
- Changes between versions are listed in `CHANGELOG.md`.
- To update, run the installer of the new version. Database migrations run
  automatically. Make a backup before updating.

## 9. Troubleshooting

| Problem | Cause and solution |
|---|---|
| "Najprv vyberte priečinok pre zálohy v Nastaveniach" (choose a backup folder first) | No backup folder set. Settings → Backups → Choose. |
| Backup is not created | The folder does not exist or is not writable (e.g. disconnected network drive). Choose another folder. |
| Import found no columns | The file is not an invoice list export or uses other column names. Map the columns manually. |
| Broken diacritics in CSV | Export to .xlsx or to CSV in UTF-8. |
| Invoice assigned to the wrong customer | The import had no company ID and the name matched another customer. Add the company ID to the customer and re-import, or edit the invoice. |
| Application does not start after restore | The backup is damaged or incomplete. Put the original file back and try an older backup. |

When reporting a bug, give the application version, steps to reproduce and, if
possible, a screenshot. Send the database only by agreement; it contains
personal data.

---

© 2026 Kristián Kačinetz. All rights reserved.

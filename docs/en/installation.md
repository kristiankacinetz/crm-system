---
title: "CRM – Installation Guide"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# CRM – Installation Guide

| | |
|---|---|
| Product | CRM, desktop application |
| Version | 0.1.0 |
| Author | Kristián Kačinetz, kristian.kacinetz@gmail.com |
| Date | 26 November 2026 |

## 1. System requirements

| | Minimum |
|---|---|
| Operating system | Windows 10 (64-bit) or Windows 11. macOS 12+ and Linux (Ubuntu 22.04+) are also supported, but Windows is the primary tested platform. |
| CPU | x64, 2 cores |
| Memory | 4 GB RAM |
| Disk | 200 MB for the application and data |
| Other | Microsoft Edge WebView2 Runtime (usually present on Windows 10/11; the installer adds it if needed) |
| Internet | not needed for use, only to download the installer |
| Rights | standard user. The .msi installer may require administrator rights. |

## 2. Installation files

The delivery contains one of these files:

| File | When to use |
|---|---|
| `CRM_0.1.0_x64-setup.exe` | recommended installer for a single user |
| `CRM_0.1.0_x64_sk-SK.msi` | managed or bulk installation (e.g. Intune or GPO) |

Before installing, verify that the file comes from the author (SHA-256
checksum stated in the delivery note: **[to be added]**).

## 3. Installing on Windows

1. Double-click `CRM_0.1.0_x64-setup.exe`.
2. If **Windows protected your PC** (SmartScreen) appears, click **More info** →
   **Run anyway**. This appears for applications not yet signed with a
   publisher certificate.
3. Choose the installer language (Slovak or English) and follow the wizard.
4. When finished, start **CRM** from the Start menu or the desktop shortcut.

Silent MSI installation (for administrators):

```
msiexec /i CRM_0.1.0_x64_sk-SK.msi /qn
```

## 4. Initial setup

After the first start, fill in company details, logo and backup folder in
**Nastavenia** (Settings). See the [User Manual](user-manual.md#2-first-start).

## 5. Where the data lives

| System | Folder |
|---|---|
| Windows | `%APPDATA%\sk.crm.desktop\` (e.g. `C:\Users\<name>\AppData\Roaming\sk.crm.desktop\`) |
| macOS | `~/Library/Application Support/sk.crm.desktop/` |
| Linux | `~/.local/share/sk.crm.desktop/` |

The database is the file `crm.db`. **Do not** put this folder in OneDrive or
any other sync service. Use the built-in backup function instead.

## 6. Updating

1. Close the application.
2. We recommend making a backup first (**Settings → Back up now**).
3. Run the installer of the new version. It installs over the old one and keeps
   your data. Database changes (migrations) run automatically on first start.

## 7. Uninstalling

**Settings → Apps → Installed apps → CRM → Uninstall.** Uninstalling does not
delete data. To remove the data, delete the folder from section 5 after
uninstalling. Keep a backup first.

## 8. Moving to another computer

1. On the old computer: **Back up now**.
2. On the new computer install CRM, start it once and close it.
3. Follow the [Administrator Guide, Restoring from a backup](administration.md#4-restoring-from-a-backup).

## 9. Installation troubleshooting

| Problem | Solution |
|---|---|
| The application does not appear or the window is blank | Install or repair Microsoft Edge WebView2 Runtime (developer.microsoft.com/microsoft-edge/webview2). |
| SmartScreen blocks the installation | More info → Run anyway. Company antivirus may need approval from an administrator. |
| MSI reports insufficient rights | Run as administrator or use the `.exe` installer. |

---

© 2026 Kristián Kačinetz. All rights reserved.

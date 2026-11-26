---
title: "CRM – Technická dokumentácia"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: sk
---

# CRM – Technická dokumentácia

| | |
|---|---|
| Produkt | CRM, desktopová aplikácia |
| Verzia | 0.1.0 |
| Autor | Kristián Kačinetz |
| Dátum | 26. 11. 2026 |

## 1. Prehľad architektúry

CRM je lokálna desktopová aplikácia. Pozostáva z dvoch častí v jednom
inštalačnom balíku:

```
┌──────────────────────────────────────────────┐
│ Okno aplikácie (WebView2 / WebKit)           │
│  React + TypeScript + Mantine (UI)           │
│  src/pages, src/ui                            │
│        │                                      │
│  src/domain  čistá logika (stav faktúry,     │
│              peniaze, dátumy, číslovanie)    │
│  src/import  čítanie exportu iDokladu         │
│  src/pdf     PDF cenovej ponuky (pdfmake)     │
│  src/db      Drizzle ORM → sqlite-proxy       │
│        │ IPC (Tauri)                          │
├────────┼─────────────────────────────────────┤
│ Rust (Tauri 2)                                │
│  tauri-plugin-sql  → SQLite súbor crm.db     │
│  tauri-plugin-dialog / fs / notification     │
│  migrácie: src-tauri/migrations              │
└──────────────────────────────────────────────┘
```

- Žiadny server, žiadne sieťové volania. CSP povoľuje iba vlastné zdroje a IPC.
- Všetok prístup k dátam ide cez repozitáre v `src/db/repo/*`. UI nepíše SQL.
- Logika, ktorú treba testovať (stavy faktúr, súčty, import, PDF), je v čistých
  moduloch bez závislosti na Tauri a testuje sa na SQLite v pamäti.

## 2. Technológie

| Vrstva | Technológia |
|---|---|
| Desktopový obal | Tauri 2 (Rust) |
| UI | React 19, TypeScript, Mantine 9, React Router 7 |
| Databáza | SQLite cez `tauri-plugin-sql` |
| ORM a migrácie | Drizzle ORM, drizzle-kit |
| Import | `read-excel-file` (.xlsx), `papaparse` (.csv) |
| PDF | `pdfmake` |
| Build | Vite 8 |
| Testy | Vitest, vstavané SQLite v Node.js 22 |
| CI | GitHub Actions: typecheck, testy, build inštalátora pre Windows |

## 3. Štruktúra repozitára

| Priečinok | Obsah |
|---|---|
| `src/db` | schéma (Drizzle), pripojenie, repozitáre, počiatočné dáta |
| `src/domain` | peniaze, dátumy, stav faktúry, číslovanie, súčty ponúk |
| `src/import` | čítanie, normalizácia, mapovanie a aplikovanie importu |
| `src/pdf` | generovanie PDF ponuky |
| `src/services` | zálohy, upozornenia, práca so súbormi |
| `src/pages`, `src/ui` | obrazovky a spoločné komponenty |
| `src-tauri` | Rust obal, konfigurácia, ikony, migrácie |
| `docs` | dokumentácia (SK a EN) |
| `scripts/docs` | generovanie PDF a DOCX z dokumentácie |

## 4. Dátový model

Podrobný popis tabuliek je v [Dátovom modeli](datovy-model.md). Hlavné zásady:

- primárne kľúče sú textové UUID,
- peniaze v centoch (celé čísla),
- dátumy ako `YYYY-MM-DD`, časy ako ISO 8601 UTC,
- každá tabuľka má `created_at`, `updated_at`, `created_by`, `updated_by`,
- mazanie je mäkké (`deleted_at`),
- stav faktúry sa nepíše do databázy, vždy sa počíta,
- `audit_log` zaznamenáva zmeny (kto, kedy, čo).

## 5. Vývojové prostredie

Požiadavky: Node.js 22, Rust (stable) a predpoklady Tauri (na Windows
WebView2 a Visual Studio Build Tools).

```bash
npm install
npm run tauri dev      # spustenie vo vývojovom režime
npm test               # testy
npm run typecheck      # kontrola typov
npm run tauri build    # inštalátor pre aktuálny systém
```

Výstupy buildu: `src-tauri/target/release/bundle/` (`msi`, `nsis`, `dmg`,
`appimage`, `deb`).

## 6. Zmena databázovej schémy

1. Upravte `src/db/schema.ts`.
2. `npx drizzle-kit generate` vytvorí novú migráciu v `src-tauri/migrations`.
3. Pridajte migráciu do zoznamu v `src-tauri/src/lib.rs` s ďalším číslom verzie.
4. Migrácie sa spúšťajú automaticky pri štarte aplikácie. Nikdy neupravujte
   už vydanú migráciu.

## 7. Vydanie novej verzie

1. Zvýšte verziu v `package.json`, `src-tauri/Cargo.toml` a
   `src-tauri/tauri.conf.json`.
2. Doplňte `CHANGELOG.md`.
3. Zlúčte zmeny do `main`. CI zostaví inštalátor (artefakt
   `crm-windows-installer`).
4. Inštalátor podpíšte certifikátom na podpisovanie kódu (pozri kapitolu 9).
5. Vygenerujte dokumentáciu: `python3 scripts/docs/build.py`.
6. Vypočítajte kontrolný súčet SHA-256 inštalátora a uveďte ho v dodacom liste.

## 8. Metadáta a autorstvo

| Miesto | Hodnota |
|---|---|
| `package.json` → `author` | Kristián Kačinetz |
| `src-tauri/Cargo.toml` → `authors` | Kristián Kačinetz |
| `tauri.conf.json` → `bundle.publisher` | Kristián Kačinetz (výrobca v inštalátore MSI/NSIS a vo vlastnostiach .exe) |
| `tauri.conf.json` → `bundle.copyright` | © 2026 Kristián Kačinetz |
| PDF ponuky | autor = firma používateľa, tvorca (Creator/Producer) = „CRM, autor Kristián Kačinetz“ |
| Dokumentácia (PDF, DOCX) | autor, tvorca a posledný upravovateľ = Kristián Kačinetz |

Identifikátor aplikácie `sk.crm.desktop` určuje názov dátového priečinka.
Nemeňte ho, inak by aplikácia po aktualizácii nenašla existujúce dáta.

## 9. Bezpečnosť a známe obmedzenia

- Databáza nie je šifrovaná, ochranu zabezpečuje šifrovanie disku a účet
  operačného systému.
- Jeden používateľ, bez prihlasovania a rolí.
- Inštalátor zatiaľ nie je podpísaný. Pred predajom treba certifikát na
  podpisovanie kódu (napr. OV certifikát alebo Azure Trusted Signing) a
  nastavenie `bundle.windows.certificateThumbprint` alebo podpisovanie v CI.
- Automatické aktualizácie nie sú zapnuté (dá sa doplniť `tauri-plugin-updater`).

## 10. Rozšírenie na viac používateľov

- Drizzle podporuje SQLite, libSQL (Turso) aj PostgreSQL.
- UUID, `updated_at`, `deleted_at` a autor zmeny umožňujú synchronizáciu.
- Najjednoduchšia cesta pre viac zariadení: Turso (libSQL) s lokálnou replikou.
- Pre viac používateľov naraz: zdieľaná PostgreSQL databáza (EÚ) a prihlasovanie.

---

© 2026 Kristián Kačinetz. Všetky práva vyhradené.

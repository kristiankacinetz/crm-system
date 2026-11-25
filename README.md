# CRM

Interné CRM pre konateľa firmy: zákazníci a kontaktné osoby, faktúry a ich
stavy, upozornenia na splatnosť, cenové ponuky s PDF, obchodná pipeline a
zákazky.

> Toto nie je prvá verzia. Je to najnovšia, obnovená verzia aplikácie, ktorú
> vyvíjam od roku 2025. Pôvodný repozitár predchádzajúcej verzie už neexistuje,
> preto história commitov v tomto repozitári začína touto verziou.

Lokálna desktopová aplikácia (Tauri 2 + React + SQLite), primárne pre Windows,
funguje aj na macOS a Linuxe. Dáta sú v jednom súbore v počítači, nič sa
neposiela na internet.

## Funkcie

- **Prehľad**: faktúry po splatnosti a blížiace sa k splatnosti, neuhradené sumy, pipeline, aktívne zákazky.
- **Zákazníci**: firmy s IČO/DIČ/IČ DPH, kontaktné osoby, história faktúr, ponúk a zákaziek.
- **Faktúry**: import z iDokladu, ručné zadanie, stav sa počíta automaticky (Neuhradená, Blíži sa splatnosť, Po splatnosti, Čiastočne uhradená, Uhradená, Stornovaná), ručné označenie úhrady.
- **Import z iDokladu**: export zoznamu vydaných faktúr (.xlsx alebo .csv). Stĺpce sa priradia automaticky, náhľad ukáže nové a zmenené faktúry. Import sa dá opakovať, faktúry sa párujú podľa čísla a ručné úhrady sa neprepíšu.
- **Ponuky**: položky, zľavy, sadzby DPH, export do PDF s logom a údajmi firmy.
- **Pipeline**: nástenka podľa fáz (Ponuka, Rokovanie, Vyhraté, Prehraté), presúvanie potiahnutím. Fázy sa dajú upraviť.
- **Zákazky**: vznikajú z vyhratej ponuky alebo ručne.
- **Upozornenia** iba pre konateľa: systémová notifikácia raz denne pri spustení. Zákazníkom sa nič neposiela.
- **Zálohy**: raz denne do zvoleného priečinka (napr. OneDrive) a tlačidlom „Zálohovať teraz“.

## Inštalácia (Windows)

Inštalačný súbor (.msi alebo .exe) sa zostaví automaticky v GitHub Actions
(záložka *Actions* → posledný beh *CI* → artefakt `crm-windows-installer`).

Po prvom spustení vyplňte v **Nastaveniach** údaje firmy, logo a priečinok záloh.

## Vývoj

Požiadavky: Node.js 22, Rust (stable) a [predpoklady Tauri](https://v2.tauri.app/start/prerequisites/)
(na Windows WebView2 a Visual Studio Build Tools).

```bash
npm install
npm run tauri dev      # spustí aplikáciu
npm test               # testy (dátová vrstva, import, PDF) na SQLite v pamäti
npm run typecheck
npm run tauri build    # inštalačka pre aktuálny systém
```

Zmena schémy databázy: upravte `src/db/schema.ts`, spustite
`npx drizzle-kit generate` a novú migráciu pridajte do `src-tauri/src/lib.rs`.

## Štruktúra

| Priečinok | Obsah |
|---|---|
| `src/db` | schéma (Drizzle), pripojenie k SQLite, repozitáre |
| `src/domain` | čistá logika: peniaze, dátumy, stav faktúry, číslovanie, súčty |
| `src/import` | čítanie a import exportu z iDokladu |
| `src/pdf` | PDF cenovej ponuky |
| `src/pages`, `src/ui` | obrazovky a spoločné komponenty |
| `src-tauri` | desktopový obal, migrácie |
| `docs` | [dátový model](docs/datovy-model.md) a [plán](docs/plan.md) |

Dáta sú v súbore `crm.db` v dátovom priečinku aplikácie
(Windows: `%APPDATA%\sk.crm.desktop`).

# Dátový model

Lokálna databáza je jeden súbor SQLite (`crm.db` v dátovom priečinku aplikácie).
Schéma je napísaná v Drizzle ORM (`src/db/schema.ts`) a SQL migráciách
(`src-tauri/migrations`), aby sa dala neskôr preniesť na zdieľanú databázu
(Turso/libSQL alebo PostgreSQL) bez prepisovania aplikácie.

## Zásady

| Zásada | Prečo |
|---|---|
| Primárne kľúče sú textové UUID | Záznamy sa dajú zlučovať z viacerých zariadení alebo používateľov bez kolízií. |
| Peniaze v centoch (`INTEGER`) | Žiadne chyby zaokrúhľovania pri sčítaní. Mena je vždy uložená pri doklade. |
| Dátumy ako text `YYYY-MM-DD`, časy ako ISO 8601 UTC | Jednoznačné, triediteľné, rovnaké v SQLite aj PostgreSQL. |
| Každá tabuľka má `created_at`, `updated_at`, `created_by`, `updated_by` | Pri prechode na viac konateľov je jasné, kto čo zmenil. |
| Mazanie je mäkké (`deleted_at`) | Synchronizácia aj obnova omylom zmazaných záznamov. |
| Odvodené stavy sa nepíšu do DB | „Po splatnosti“ sa počíta z dátumu splatnosti a úhrad, nikdy sa nerozíde s realitou. |

## Entity

```
users ─┐ (created_by / updated_by vo všetkých tabuľkách)
       │
customers ──< contacts
    │
    ├──< quotes ──< quote_items        quotes.stage_id ──> pipeline_stages
    │       │
    │       └──< orders (zákazka vznikne z vyhratej ponuky)
    │               │
    └──< invoices ──┘ (voliteľne previazaná so zákazkou)
            │
            └──< payments (ručne zadané úhrady)

import_batches ──< invoices (z ktorého importu faktúra prišla / bola naposledy zmenená)
settings (kľúč → JSON hodnota)
audit_log (kto, kedy, čo zmenil)
```

### users
Dnes jeden riadok (`local`, konateľ). Pripravené pre viac používateľov.

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| name | text | |
| email | text? | |

### customers (zákazníci)

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | UUID |
| name | text | obchodné meno |
| ico, dic, ic_dph | text? | IČO je hlavný kľúč na spárovanie s importom z iDokladu |
| street, city, zip, country | text? | fakturačná adresa, krajina predvolene `SK` |
| email, phone, web | text? | |
| note | text? | |

Index: `ico` (nie unikátny, IČO môže chýbať; duplicitu stráži aplikácia).

### contacts (kontaktné osoby)

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| customer_id | text FK → customers | |
| name, role, email, phone, note | text | |
| is_primary | integer (0/1) | jeden hlavný kontakt na zákazníka |

### pipeline_stages (fázy obchodu)
Predvolené: **Ponuka**, **Rokovanie**, **Vyhraté**, **Prehraté**. Dajú sa
premenovať, pridať, preusporiadať v Nastaveniach.

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| name | text | |
| position | integer | poradie na nástenke |
| kind | text | `open` / `won` / `lost` – podľa toho aplikácia vie, čo je vyhraté |
| color | text | |

### quotes (cenové ponuky = obchodné príležitosti)
Ponuka je zároveň karta v pipeline. Jej fáza je `stage_id`.

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| number | text unique | napr. `CP2026001`, číslovanie podľa nastavení |
| customer_id | FK | |
| contact_id | FK? | komu je ponuka určená |
| title | text | predmet ponuky |
| stage_id | FK → pipeline_stages | |
| issue_date, valid_until | date | |
| expected_close_date | date? | kedy čakáme rozhodnutie |
| currency | text | `EUR` |
| intro_text, note | text? | úvod a poznámka do PDF |
| lost_reason | text? | prečo sme prehrali |
| total_net, total_vat, total_gross | integer (centy) | prepočítané z položiek pri každom uložení |

### quote_items (položky ponuky)

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| quote_id | FK | |
| position | integer | |
| name, description, unit | text | |
| quantity | real | |
| unit_price | integer (centy, bez DPH) | |
| discount_pct | real | zľava na položku v % |
| vat_rate | real | sadzba DPH v %, predvolená z nastavení (23 %) |

### orders (zákazky)
Potvrdená objednávka. Vzniká z vyhratej ponuky (skopírujú sa sumy) alebo ručne.

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| number | text unique | napr. `Z2026001` |
| customer_id | FK | |
| quote_id | FK? | |
| title | text | |
| status | text | `new` (Nová), `in_progress` (V realizácii), `done` (Dokončená), `cancelled` (Zrušená) |
| order_date, deadline | date | |
| currency, total_net, total_gross | | |
| note | text? | |

### invoices (faktúry)
Faktúry sa vystavujú v iDoklade. CRM ich preberá importom exportu (.xlsx/.csv)
alebo ručným zadaním. **Číslo faktúry je unikátne** a slúži na opakovaný import
bez duplicít.

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| number | text unique | číslo dokladu z iDokladu |
| variable_symbol | text? | |
| customer_id | FK? | spárovaný zákazník (podľa IČO, inak podľa názvu) |
| order_id | FK? | voliteľne zákazka |
| customer_name_raw, customer_ico_raw | text? | ako prišlo v importe, pre kontrolu párovania |
| issue_date, due_date | date | |
| taxable_date | date? | DUZP |
| currency | text | |
| total_net, total_vat, total_gross | integer (centy) | |
| imported_paid | integer (centy) | koľko bolo uhradené podľa posledného importu |
| cancelled | integer (0/1) | stornovaná faktúra |
| source | text | `import` / `manual` |
| import_batch_id | FK? | posledný import, ktorý faktúru vytvoril alebo zmenil |
| note | text? | |

**Stav faktúry sa počíta** (`src/domain/invoiceStatus.ts`):

- `uhradené = max(imported_paid, súčet payments)`
- **Stornovaná** – `cancelled = 1`
- **Uhradená** – uhradené ≥ suma s DPH
- **Čiastočne uhradená** – 0 < uhradené < suma
- **Po splatnosti** – neuhradená a `due_date` < dnes
- **Blíži sa splatnosť** – neuhradená a splatná do N dní (N v nastaveniach, predvolene 3)
- **Neuhradená** – ostatné

Prečo `max` a nie prepis: keď konateľ ručne označí faktúru ako uhradenú a
neskôr naimportuje starší export, kde ešte uhradená nie je, import ručnú úhradu
nezmaže.

### payments (úhrady)
Ručne označené úhrady (bez napojenia na banku).

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| invoice_id | FK | |
| paid_on | date | |
| amount | integer (centy) | |
| method | text | `bank` / `cash` / `other` |
| note | text? | |

### import_batches (história importov)

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| file_name | text | |
| imported_at | text | |
| rows_total, created_count, updated_count, unchanged_count, error_count | integer | |
| errors | text (JSON) | riadky, ktoré sa nepodarilo načítať, s dôvodom |

### settings
Kľúč → JSON. Údaje firmy do PDF (názov, adresa, IČO, DIČ, IČ DPH, IBAN,
kontakt, logo ako data URL), predvolená DPH, mena, číslovanie dokladov, počet dní
pre upozornenie pred splatnosťou, priečinok záloh, uložené mapovanie stĺpcov
importu.

### audit_log

| Stĺpec | Typ | Poznámka |
|---|---|---|
| id | text PK | |
| at | text | |
| user_id | FK | |
| entity, entity_id | text | |
| action | text | `create` / `update` / `delete` / `import` |
| changes | text (JSON) | zmenené polia |

## Import z iDokladu

1. Používateľ vyberie export zoznamu vydaných faktúr (.xlsx alebo .csv, UTF-8 aj Windows-1250).
2. Aplikácia nájde riadok s hlavičkou a navrhne mapovanie stĺpcov podľa názvov
   (napr. „Číslo dokladu“, „Odberateľ“, „IČO“, „Dátum splatnosti“, „Celkom s DPH“, „Uhradené“).
   Mapovanie sa dá upraviť a uloží sa pre ďalšie importy.
3. Náhľad ukáže, čo bude **nové**, **zmenené** a **bez zmeny**, a chybné riadky.
4. Po potvrdení: faktúra s rovnakým číslom sa aktualizuje, nová sa vytvorí.
   Zákazník sa spáruje podľa IČO, potom podľa názvu, inak sa založí nový.
   Ručne zadané úhrady a poznámky sa nikdy neprepíšu.
5. Opakovaný import toho istého súboru nič nezmení.

## Upozornenia

Iba pre konateľa, nikdy nie zákazníkom: pri spustení aplikácie systémová
notifikácia (raz denne) a na Prehľade zoznam faktúr po splatnosti a blížiacich sa
k splatnosti.

## Zálohy

Tlačidlo „Zálohovať teraz“ a automatická záloha raz denne pri spustení do
zvoleného priečinka (napr. OneDrive) cez `VACUUM INTO`, čo vytvorí konzistentnú
kópiu aj počas behu. Živá databáza nesmie byť priamo v synchronizovanom
priečinku.

## Prechod na zdieľanú databázu

- Schéma je v Drizzle, ktorý podporuje SQLite, libSQL (Turso) aj PostgreSQL.
- Všetok prístup k dátam ide cez `src/db/repo/*`, UI nepíše SQL.
- UUID, `updated_at`, `deleted_at` a autor zmeny umožňujú synchronizáciu.
- Najjednoduchšia cesta pre viac zariadení: Turso (libSQL) embedded replica.

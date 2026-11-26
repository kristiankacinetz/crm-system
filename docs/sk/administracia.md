---
title: "CRM – Príručka správcu"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: sk
---

# CRM – Príručka správcu

| | |
|---|---|
| Produkt | CRM, desktopová aplikácia |
| Verzia | 0.1.0 |
| Autor | Kristián Kačinetz |
| Dátum | 26. 11. 2026 |

Príručka je pre osobu, ktorá aplikáciu inštaluje, zálohuje a stará sa o dáta.

## 1. Ako sú uložené dáta

- Všetky údaje sú v jednom súbore SQLite `crm.db` v dátovom priečinku
  aplikácie (Windows: `%APPDATA%\sk.crm.desktop\`).
- Popri ňom môžu byť dočasné súbory `crm.db-wal` a `crm.db-shm`. Patria k
  databáze, nemažte ich, keď aplikácia beží.
- Logo firmy a nastavenia sú uložené priamo v databáze.
- Aplikácia nemá server ani cloud. Nič sa neposiela na internet.

## 2. Zálohovanie

### 2.1 Nastavenie

**Nastavenia → Zálohy → Vybrať** a zvoľte priečinok. Odporúčame priečinok
synchronizovaný do cloudu (OneDrive, Google Drive) alebo sieťový disk, aby
záloha prežila poruchu počítača.

### 2.2 Ako záloha funguje

- Automaticky raz denne pri spustení aplikácie (ak od poslednej zálohy prešlo
  aspoň 20 hodín).
- Ručne tlačidlom **Zálohovať teraz**.
- Záloha sa vytvorí príkazom SQLite `VACUUM INTO`, ktorý zapíše konzistentnú
  kópiu aj počas behu aplikácie.
- Názov súboru: `crm-zaloha-RRRR-MM-DD_HHMMSS.db`.

### 2.3 Odporúčania

- Živú databázu (`crm.db`) nikdy nedávajte do synchronizovaného priečinka.
  Synchronizácia počas zápisu môže databázu poškodiť.
- Aplikácia staré zálohy nemaže. Raz za čas zmažte staré súbory, napríklad
  ponechajte posledných 30 denných a jednu za každý mesiac.
- Raz za štvrťrok vyskúšajte obnovu zálohy (kapitola 4) na inom počítači.

## 3. Kontrola zálohy

Záloha je bežný súbor SQLite. Dá sa otvoriť napríklad bezplatným nástrojom
DB Browser for SQLite a skontrolovať, že obsahuje tabuľky `customers`,
`invoices` a ďalšie.

## 4. Obnova zo zálohy

1. Zatvorte aplikáciu CRM (skontrolujte, že nebeží ani v pozadí).
2. Otvorte priečinok `%APPDATA%\sk.crm.desktop\` (do riadka adresy v
   Prieskumníkovi napíšte `%APPDATA%\sk.crm.desktop`).
3. Premenujte `crm.db` na `crm.db.pred-obnovou`. Ak existujú `crm.db-wal` a
   `crm.db-shm`, premenujte ich rovnako.
4. Skopírujte vybranú zálohu `crm-zaloha-….db` do tohto priečinka a premenujte
   ju na `crm.db`.
5. Spustite aplikáciu a skontrolujte údaje.

Ak by niečo nefungovalo, vráťte pôvodné súbory späť (krok 3 opačne).

## 5. Import z iDokladu, podrobnosti

- Vstup: export zoznamu vydaných faktúr z iDokladu (.xlsx alebo .csv, UTF-8
  alebo Windows-1250).
- Párovanie faktúr: podľa **čísla dokladu** (jedinečné). Opakovaný import
  aktualizuje existujúce faktúry a nevytvára duplicity.
- Párovanie zákazníkov: podľa IČO, potom podľa názvu, inak sa založí nový
  zákazník.
- Úhrady: uložené „uhradené podľa importu“ sa porovná s ručne zadanými
  úhradami. Platí vyššia hodnota, ručná úhrada sa nikdy nestratí.
- Priradenie stĺpcov sa ukladá. Ak iDoklad zmení názvy stĺpcov, upravte
  priradenie na obrazovke importu.
- Každý import sa zapíše do histórie importov (počty nových, zmenených, bez
  zmeny a chybných riadkov).
- Bezplatný plán iDokladu nemá API, preto sa používa export súboru. Napojenie
  cez API je možné doplniť pri vyššom pláne iDokladu.

## 6. Upozornenia

- Raz denne pri prvom spustení systémová notifikácia o faktúrach po splatnosti
  a pred splatnosťou.
- Počet dní „pred splatnosťou“ sa nastavuje v Nastaveniach.
- Ak notifikácie nevidíte, povoľte ich vo Windows: **Nastavenia → Systém →
  Oznámenia → CRM**.

## 7. Bezpečnosť

- Databáza nie je šifrovaná. Chráňte počítač heslom a zapnite šifrovanie
  disku (BitLocker vo Windows, FileVault v macOS).
- Rovnako chráňte priečinok so zálohami.
- Aplikácia nemá vlastné prihlasovanie. Prístup k údajom má každý, kto sa
  prihlási do daného používateľského účtu Windows.
- Aplikácia nekomunikuje so žiadnym serverom. Pravidlá zabezpečenia obsahu
  (CSP) zakazujú načítanie externého obsahu.

## 8. Aktualizácie a verzie

- Verziu zistíte v **Nastavenia → O aplikácii**.
- Zmeny vo verziách sú v súbore `CHANGELOG.md`.
- Aktualizácia sa robí spustením inštalátora novej verzie. Migrácie databázy
  prebehnú automaticky. Pred aktualizáciou vytvorte zálohu.

## 9. Riešenie problémov

| Problém | Príčina a riešenie |
|---|---|
| „Najprv vyberte priečinok pre zálohy v Nastaveniach“ | Nie je nastavený priečinok záloh. Nastavenia → Zálohy → Vybrať. |
| Záloha sa nevytvorí | Priečinok neexistuje alebo doň nie je možné zapisovať (napr. odpojený sieťový disk). Vyberte iný priečinok. |
| Import nenašiel stĺpce | Súbor nie je export zoznamu faktúr alebo má iné názvy stĺpcov. Priraďte stĺpce ručne. |
| Diakritika v CSV je rozbitá | Exportujte do .xlsx alebo CSV v UTF-8. |
| Faktúra je pri zlom zákazníkovi | V importe chýbalo IČO a názov sa zhodoval s iným zákazníkom. Doplňte IČO u zákazníka a import zopakujte, alebo faktúru upravte. |
| Aplikácia sa nespustí po obnove | Záloha je poškodená alebo neúplná. Vráťte pôvodný súbor a skúste staršiu zálohu. |

Pri nahlasovaní chyby uveďte verziu aplikácie, postup, ako chybu vyvolať, a
ak je to možné, snímku obrazovky. Databázu posielajte iba po dohode, obsahuje
osobné údaje.

---

© 2026 Kristián Kačinetz. Všetky práva vyhradené.

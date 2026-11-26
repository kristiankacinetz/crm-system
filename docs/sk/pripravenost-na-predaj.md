---
title: "CRM – Čo treba doplniť pred predajom"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: sk
---

# Čo treba doplniť pred predajom

Interný kontrolný zoznam autora. Nie je určený zákazníkovi.

## Právne a obchodné

| # | Úloha | Prečo |
|---|---|---|
| 1 | **Oprávnenie na podnikanie** (voľná živnosť, napr. „Poskytovanie softvéru – predaj hotových programov na základe zmluvy s autorom“), alebo predaj cez vlastnú s.r.o. | Opakovaný predaj licencií je podnikanie. Ako fyzická osoba bez živnosti môžete príjem z licencií zdaniť ako príjem z použitia diela (§ 6 ods. 4 ZDP), ale pri pravidelnom predaji a podpore je vhodná živnosť. Overiť s účtovníkom. |
| 2 | **Právna kontrola EULA** a informácie o ochrane osobných údajov | Texty sú návrhy. |
| 3 | **Zmluva o spracúvaní osobných údajov** (vzor) pre podporu | Ak budete od zákazníkov dostávať databázu. |
| 4 | **Cenník a licenčný model** (jednorazová licencia, ročná licencia, cena za počítač) | Doplniť do EULA, one-pagera a ponuky. |
| 5 | **Podmienky podpory** (SLA): kanál, reakčná doba, cena, čo je a nie je v cene | Doplniť do EULA bod 5. |
| 6 | **Kontaktné údaje** (e-mail, telefón, web, adresa) | Vo všetkých dokumentoch sú hranaté zátvorky. |
| 7 | **DPH**: sledovať obrat (registrácia nad limit) | Daňová povinnosť. |
| 8 | **Ochranná známka / názov produktu** | „CRM“ je všeobecný názov. Pred marketingom zvoliť vlastný názov a overiť ho (ÚPV SR, EUIPO). |
| 9 | **Licencie open-source knižníc** | Pripojiť zoznam (THIRD-PARTY-NOTICES) k inštalátoru. Všetky použité knižnice majú voľné licencie (MIT, Apache-2.0 a pod.), vyžadujú však uvedenie. |

## Technické

| # | Úloha | Prečo |
|---|---|---|
| 10 | **Certifikát na podpisovanie kódu** (OV certifikát alebo Azure Trusted Signing) | Bez podpisu Windows SmartScreen varuje pri inštalácii. Certifikát sa vydáva na meno fyzickej osoby alebo firmy. |
| 11 | **Vlastná ikona a logo produktu** | Teraz sú predvolené ikony. |
| 12 | **Automatické aktualizácie** (`tauri-plugin-updater`) a miesto, odkiaľ sa stiahnu | Jednoduchšia distribúcia opráv. |
| 13 | **Licenčný kľúč / aktivácia** (voliteľné) | Dnes sa dá aplikácia skopírovať bez obmedzenia. |
| 14 | **Anglický jazyk rozhrania** (voliteľné) | Rozhranie je dnes iba po slovensky. |
| 15 | **Zobrazenie EULA v inštalátore** (`bundle.licenseFile`) | Až po právnej kontrole. |
| 16 | **Snímky obrazovky** do príručky a marketingu | Treba ich urobiť v aplikácii s ukážkovými dátami. |
| 17 | **Overenie na čistom Windows** (inštalácia, obnova zálohy, import) | Pred prvým predajom. |
| 18 | **Jednoznačný identifikátor aplikácie** (napr. `sk.kacinetz.crm`) | Zmena by presunula dátový priečinok, preto ju urobte pred prvým predajom alebo s migráciou dát. |

## Údaje, ktoré chýbajú v dokumentoch

- adresa, IČO (ak bude), e-mail a telefón autora,
- cena a licenčný model,
- podmienky podpory,
- kontrolný súčet SHA-256 inštalátora (pri každom vydaní),
- logo a názov produktu, snímky obrazovky.

---

© 2026 Kristián Kačinetz. Všetky práva vyhradené.

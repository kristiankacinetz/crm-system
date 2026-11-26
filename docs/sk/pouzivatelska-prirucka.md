---
title: "CRM – Používateľská príručka"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: sk
---

# CRM – Používateľská príručka

| | |
|---|---|
| Produkt | CRM, desktopová aplikácia |
| Verzia | 0.1.0 |
| Autor | Kristián Kačinetz, kristian.kacinetz@gmail.com |
| Dátum | 26. 11. 2026 |

## 1. Úvod

CRM je aplikácia pre konateľa alebo majiteľa malej firmy. Na jednom mieste
eviduje zákazníkov a kontaktné osoby, vydané faktúry a ich stav, cenové ponuky,
obchodné príležitosti (pipeline) a zákazky. Faktúry sa naďalej vystavujú
v iDoklade a do CRM sa prenášajú importom exportu.

Všetky údaje sú uložené iba vo vašom počítači. Aplikácia nič neposiela na
internet a nič neposiela vašim zákazníkom.

### Pre koho je príručka

Pre bežného používateľa aplikácie. Inštalácia je opísaná v
[Inštalačnom návode](instalacia.md), správa dát a zálohy v
[Príručke správcu](administracia.md).

## 2. Prvé spustenie

1. Spustite aplikáciu **CRM** z ponuky Štart.
2. Otvorte **Nastavenia** (posledná položka v ľavom menu).
3. Vyplňte **Údaje firmy**: obchodné meno, adresu, IČO, DIČ, IČ DPH, zápis
   v registri, IBAN, banku, SWIFT a kontakt. Tieto údaje sa tlačia do PDF ponúk.
4. Nahrajte **logo** (PNG alebo JPG, najviac 1,5 MB).
5. Skontrolujte **predvolené hodnoty**: mena, sadzba DPH (predvolene 23 %),
   platnosť ponuky v dňoch a počet dní pred splatnosťou, kedy vás aplikácia
   upozorní (predvolene 3).
6. V časti **Zálohy** kliknite na **Vybrať** a zvoľte priečinok pre zálohy,
   napríklad v OneDrive. Potom kliknite na **Zálohovať teraz**.
7. Kliknite na **Uložiť nastavenia**.

## 3. Ovládanie

Ľavé menu obsahuje tieto obrazovky:

| Položka | Na čo slúži |
|---|---|
| Prehľad | súhrn: faktúry po splatnosti a pred splatnosťou, neuhradené sumy, pipeline, aktívne zákazky |
| Zákazníci | firmy, ich údaje, kontaktné osoby a história |
| Faktúry | zoznam faktúr, filtre podľa stavu, úhrady |
| Import z iDokladu | načítanie exportu faktúr z iDokladu |
| Pipeline | nástenka obchodných príležitostí podľa fáz |
| Ponuky | cenové ponuky s položkami a PDF |
| Zákazky | potvrdené objednávky |
| Nastavenia | údaje firmy, logo, číslovanie, fázy, zálohy, informácie o aplikácii |

## 4. Prehľad

Po spustení sa zobrazí Prehľad s kartami **Po splatnosti**, **Neuhradené
spolu**, **Otvorené ponuky** a **Aktívne zákazky**. Pod nimi sú zoznamy faktúr
po splatnosti a faktúr, ktorým sa blíži splatnosť, a súhrn pipeline. Tlačidlom
**Otvoriť** prejdete na detail.

Raz denne pri prvom spustení aplikácia zobrazí systémovú notifikáciu, ak máte
faktúry po splatnosti alebo pred splatnosťou. Notifikácia je určená iba vám.

## 5. Zákazníci

- **Nový zákazník**: vyplňte obchodné meno a podľa potreby IČO, DIČ, IČ DPH,
  adresu, e-mail, telefón, web a poznámku.
- **Vyhľadávanie**: podľa mena, IČO alebo e-mailu.
- **Detail zákazníka** zobrazuje údaje, neuhradenú sumu, kontaktné osoby,
  faktúry, ponuky a zákazky. Odtiaľ môžete **zadať faktúru ručne** alebo
  vytvoriť **novú ponuku**.
- **Kontaktné osoby**: tlačidlo **Pridať**. Jednu osobu môžete označiť ako
  **Hlavný kontakt**.
- **Upraviť** a **Zmazať** sú v hlavičke detailu. Zmazanie je mäkké, záznam
  zostáva v databáze označený ako zmazaný.

Tip: vyplňte IČO. Import z iDokladu podľa neho páruje faktúry so zákazníkmi.

## 6. Faktúry

### 6.1 Zoznam a filtre

Filtre: **Neuhradené**, **Po splatnosti**, **Uhradené**, **Stornované**,
**Všetky**. Vyhľadávať môžete podľa čísla faktúry alebo odberateľa. Pod
zoznamom vidíte počet, sumu s DPH a sumu, ktorá zostáva uhradiť.

### 6.2 Stavy faktúr

Stav sa počíta automaticky, nenastavuje sa ručne:

| Stav | Kedy |
|---|---|
| Neuhradená | nie je uhradená a splatnosť je ešte ďaleko |
| Blíži sa splatnosť | nie je uhradená a splatnosť je do zvoleného počtu dní |
| Po splatnosti | nie je uhradená a dátum splatnosti už uplynul |
| Čiastočne uhradená | časť sumy je uhradená |
| Uhradená | uhradená celá suma |
| Stornovaná | faktúra je označená ako stornovaná |

### 6.3 Úhrady

Aplikácia nie je napojená na banku. Úhradu zaznamenáte v detaile faktúry:

- **Označiť celú sumu ako uhradenú dnes**, alebo
- **Pridať čiastočnú úhradu** s dátumom, sumou a spôsobom (banka, hotovosť, iné).

Ak import z iDokladu prinesie údaj „Uhradené“, aplikácia použije vyššiu z
hodnôt (import alebo ručné úhrady). Ručne zadanú úhradu import nikdy nezmaže.

### 6.4 Ručné zadanie faktúry

Tlačidlo **Zadať ručne**: číslo faktúry, odberateľ, variabilný symbol, dátum
vystavenia, dodania (DUZP) a splatnosti, sumy a poznámka. Číslo faktúry musí
byť jedinečné.

## 7. Import z iDokladu

1. V iDoklade otvorte zoznam **vydaných faktúr** a exportujte ho do **Excelu
   (.xlsx)** alebo **CSV**.
2. V CRM otvorte **Import z iDokladu** a kliknite na **Vybrať súbor**.
3. Aplikácia nájde hlavičku a navrhne priradenie stĺpcov (napr. Číslo dokladu,
   Odberateľ, IČO, Dátum splatnosti, Celkom s DPH, Uhradené). Priradenie môžete
   zmeniť. Uloží sa pre ďalšie importy.
4. Kliknite na **Zobraziť náhľad**. Uvidíte, ktoré faktúry sú **nové**,
   **zmenené** a **bez zmeny**, a riadky, ktoré sa nedajú načítať, s dôvodom.
5. Kliknite na **Importovať**.

Import je bezpečné opakovať. Faktúry sa párujú podľa čísla, takže nevzniknú
duplicity. Zákazník sa spáruje podľa IČO, potom podľa názvu, inak sa založí
nový. Prehľad predchádzajúcich importov je v časti **História importov**.

Podporované kódovania CSV: UTF-8 a Windows-1250.

## 8. Cenové ponuky

1. **Ponuky** → **Nová ponuka** (alebo z detailu zákazníka či z Pipeline).
2. Vyplňte zákazníka, kontaktnú osobu, **predmet ponuky**, dátum vystavenia,
   **platnosť do**, očakávané rozhodnutie, menu a fázu.
3. **Pridať položku**: názov, popis, množstvo, jednotka, cena za MJ bez DPH,
   zľava v % a sadzba DPH. Súčty sa prepočítavajú automaticky.
4. Voliteľne doplňte **úvodný text** (v PDF nad položkami) a **poznámku**
   (v PDF pod položkami).
5. Kliknite na **Uložiť**.
6. Tlačidlo **PDF** vytvorí ponuku vo formáte PDF s logom a údajmi firmy.

Ďalšie akcie: **Kopírovať** (nová ponuka podľa existujúcej), **Vytvoriť
zákazku**, **Zmazať ponuku**. Pri prehratej ponuke môžete zapísať **dôvod
prehry**.

Číslovanie ponúk (napr. `CP2026001`) nastavíte v Nastaveniach. Značky:
`{YYYY}` rok, `{YY}` krátky rok, `{NNN}` poradové číslo.

## 9. Pipeline

Pipeline je nástenka, kde každá ponuka je karta vo svojej fáze. Predvolené
fázy sú **Ponuka**, **Rokovanie**, **Vyhraté** a **Prehraté**. Kartu
presuniete do inej fázy potiahnutím myšou.

Fázy upravíte v **Nastaveniach → Fázy pipeline**: názov, farba, poradie a typ
(Otvorená, Vyhraté, Prehraté). Fázu, v ktorej sú ponuky, nemožno zmazať.

## 10. Zákazky

Zákazka je potvrdená objednávka. Vznikne:

- z ponuky tlačidlom **Vytvoriť zákazku** (sumy sa prenesú a ponuka sa
  presunie do fázy typu Vyhraté), alebo
- ručne tlačidlom **Nová zákazka**.

Zákazka má názov, zákazníka, dátum objednania, termín dodania, sumy, poznámku a
stav: **Nová**, **V realizácii**, **Dokončená**, **Zrušená**.

## 11. Nastavenia

| Časť | Obsah |
|---|---|
| Údaje firmy | údaje do PDF ponúk a logo |
| Predvolené hodnoty | mena, DPH, platnosť ponuky, upozornenie pred splatnosťou, číslovanie ponúk a zákaziek, záverečný text PDF |
| Fázy pipeline | názov, typ, farba, poradie |
| Zálohy | priečinok záloh, Zálohovať teraz, čas poslednej zálohy |
| O aplikácii | verzia, autor, autorské práva |

## 12. Zálohy v skratke

Ak je nastavený priečinok záloh, aplikácia raz denne pri spustení uloží kópiu
databázy (súbor `crm-zaloha-RRRR-MM-DD_HHMMSS.db`). Kedykoľvek môžete kliknúť na
**Zálohovať teraz**. Obnova zo zálohy je opísaná v
[Príručke správcu](administracia.md#4-obnova-zo-zalohy).

## 13. Časté otázky

**Pošle aplikácia upomienku zákazníkovi?** Nie. Upozornenia vidí iba
používateľ aplikácie.

**Môžem import spustiť viackrát?** Áno. Opakovaný import toho istého súboru
nič nezmení.

**Prečo faktúra ukazuje „Uhradená“, hoci v iDoklade ešte nie je?** Pretože
ste ju v CRM ručne označili ako uhradenú. Ručné úhrady majú prednosť.

**Funguje aplikácia bez internetu?** Áno, úplne.

**Môžem aplikáciu používať na dvoch počítačoch?** Táto verzia je pre jeden
počítač a jedného používateľa. Údaje môžete preniesť zálohou.

## 14. Podpora

Kontakt na podporu: **kristian.kacinetz@gmail.com**, telefón: **[doplniť]**.
Rozsah podpory určuje licenčná zmluva alebo zmluva o podpore.

---

© 2026 Kristián Kačinetz. Všetky práva vyhradené.

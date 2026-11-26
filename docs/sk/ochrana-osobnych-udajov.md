---
title: "CRM – Ochrana osobných údajov (GDPR)"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: sk
---

# Ochrana osobných údajov (GDPR)

Informácia pre firmy, ktoré používajú aplikáciu CRM.

> **NÁVRH na právnu kontrolu.** Nie je to právne poradenstvo.

## 1. Kto je prevádzkovateľ

Prevádzkovateľom osobných údajov, ktoré do CRM zadáte (napr. mená, e-maily a
telefóny kontaktných osôb zákazníkov), je **vaša firma**, nie autor
aplikácie. Autor aplikácie, Kristián Kačinetz, k týmto údajom nemá prístup a
nespracúva ich. Nie je preto ani sprostredkovateľom podľa čl. 28 GDPR, kým mu
údaje sami neposkytnete (napr. pri podpore, pozri bod 5).

## 2. Kde sú údaje uložené

- Iba v počítači, kde je aplikácia nainštalovaná (súbor `crm.db`).
- V zálohách v priečinku, ktorý si zvolíte (napr. OneDrive). Pri cloudovom
  priečinku je poskytovateľ cloudu váš sprostredkovateľ, preto overte jeho
  zmluvné podmienky a umiestnenie dát.
- Aplikácia neodosiela žiadne údaje na internet, nepoužíva analytiku, cookies
  ani telemetriu.

## 3. Aké osobné údaje aplikácia môže obsahovať

| Kategória | Príklady |
|---|---|
| Kontaktné osoby zákazníkov | meno, funkcia, e-mail, telefón, poznámka |
| Zákazníci – fyzické osoby (živnostníci) | meno, adresa, IČO, DIČ |
| Obchodné údaje | ponuky, zákazky, faktúry, úhrady |
| Používateľ aplikácie | meno v tabuľke `users`, autor zmien v `audit_log` |

Zvyčajný právny základ: plnenie zmluvy a oprávnený záujem (čl. 6 ods. 1
písm. b) a f) GDPR). Do poznámok nezadávajte osobitné kategórie údajov
(napr. zdravotné údaje).

## 4. Ako aplikácia pomáha plniť povinnosti

| Povinnosť | Ako |
|---|---|
| Prístup a oprava (čl. 15, 16) | údaje osoby nájdete v detaile zákazníka a kontaktu a upravíte ich |
| Vymazanie (čl. 17) | zmazanie v aplikácii je mäkké (záznam zostane označený). Na úplné vymazanie kontaktujte podporu alebo údaje anonymizujte prepísaním. Zohľadnite aj zálohy. |
| Bezpečnosť (čl. 32) | šifrovanie disku (BitLocker), heslo k účtu Windows, ochrana priečinka záloh |
| Uchovávanie | faktúry podliehajú zákonu o účtovníctve (10 rokov). Kontakty uchovávajte, len kým sú potrebné. |
| Záznamy o spracovateľských činnostiach (čl. 30) | doplňte CRM ako systém do svojich záznamov |

## 5. Podpora

Ak pri riešení problému pošlete autorovi databázu alebo zálohu, stáva sa
autor sprostredkovateľom. V takom prípade uzavrite zmluvu o spracúvaní
osobných údajov (vzor: **[doplniť]**) alebo pošlite anonymizovanú kópiu.

## 6. Kontakt

Autor aplikácie: Kristián Kačinetz, **kristian.kacinetz@gmail.com**.

---

© 2026 Kristián Kačinetz. Všetky práva vyhradené.

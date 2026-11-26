# Changelog

Autor / Author: Kristián Kačinetz

Formát podľa [Keep a Changelog](https://keepachangelog.com/), verzie podľa
[Semantic Versioning](https://semver.org/).
Format follows Keep a Changelog, versions follow Semantic Versioning.

## [Nevydané / Unreleased]

### Pridané
- Dokumentácia v slovenčine a angličtine: používateľská príručka, inštalačný
  návod, príručka správcu, technická dokumentácia, dátový model, návrh
  licenčnej zmluvy (EULA), informácia o ochrane osobných údajov, marketingový
  materiál a zoznam funkcií.
- Generovanie dokumentácie do PDF a DOCX s autorom v metadátach.
- Časť **O aplikácii** v Nastaveniach (verzia, autor, autorské práva).
- Autor, vydavateľ a autorské práva v metadátach aplikácie a inštalátora.

### Added
- Documentation in Slovak and English: user manual, installation guide,
  administrator guide, technical documentation, data model, draft EULA,
  privacy information, marketing material and feature list.
- Documentation build to PDF and DOCX with the author in file metadata.
- **About** section in Settings (version, author, copyright).
- Author, publisher and copyright in the application and installer metadata.

## [0.1.0] – 2026-11-25

### Pridané
- Zákazníci a kontaktné osoby.
- Faktúry s automaticky počítaným stavom, ručné zadanie a ručné úhrady.
- Import faktúr z iDokladu (.xlsx, .csv) s mapovaním stĺpcov, náhľadom a
  históriou importov; opakovaný import bez duplicít.
- Cenové ponuky s položkami, zľavami, DPH a exportom do PDF.
- Pipeline s upraviteľnými fázami a presúvaním kariet.
- Zákazky z vyhratých ponúk alebo ručne.
- Prehľad a denné upozornenie na faktúry po splatnosti a pred splatnosťou.
- Nastavenia firmy, loga, číslovania a denné zálohy.
- Inštalátor pre Windows (MSI, NSIS) zostavovaný v CI.

### Added
- Customers and contact persons.
- Invoices with automatically computed status, manual entry and payments.
- iDoklad invoice import (.xlsx, .csv) with column mapping, preview and import
  history; repeated import without duplicates.
- Price quotes with line items, discounts, VAT and PDF export.
- Pipeline with editable stages and drag and drop.
- Orders from won quotes or manually.
- Overview and a daily alert on overdue and soon-due invoices.
- Company, logo and numbering settings, daily backups.
- Windows installer (MSI, NSIS) built in CI.

---
title: "CRM – Personal Data Protection (GDPR)"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: en
---

# Personal Data Protection (GDPR)

Information for companies using the CRM application.

> **DRAFT for legal review.** This is not legal advice.

## 1. Who is the controller

The controller of personal data you enter into CRM (e.g. names, e-mails and
phone numbers of customers' contact persons) is **your company**, not the
author of the application. The author, Kristián Kačinetz, has no access to this
data and does not process it. He is therefore not a processor under Article
28 GDPR unless you give him the data yourself (e.g. for support, see point 5).

## 2. Where data is stored

- Only on the computer where the application is installed (file `crm.db`).
- In backups in the folder you choose (e.g. OneDrive). With a cloud folder the
  cloud provider is your processor, so check its terms and data location.
- The application sends no data to the internet and uses no analytics,
  cookies or telemetry.

## 3. Personal data the application may contain

| Category | Examples |
|---|---|
| Customers' contact persons | name, position, e-mail, phone, note |
| Customers who are natural persons (sole traders) | name, address, company ID, tax ID |
| Business data | quotes, orders, invoices, payments |
| Application user | name in the `users` table, change author in `audit_log` |

Usual legal basis: performance of a contract and legitimate interest
(Article 6(1)(b) and (f) GDPR). Do not enter special categories of data (e.g.
health data) in notes.

## 4. How the application helps you comply

| Obligation | How |
|---|---|
| Access and rectification (Art. 15, 16) | find the person's data in the customer and contact detail and edit it |
| Erasure (Art. 17) | deletion in the app is soft (the record stays marked). For full erasure contact support or anonymise by overwriting. Consider backups too. |
| Security (Art. 32) | disk encryption (BitLocker), Windows account password, protecting the backup folder |
| Retention | invoices are subject to accounting law (10 years in Slovakia). Keep contacts only as long as needed. |
| Records of processing (Art. 30) | add CRM as a system to your records |

## 5. Support

If you send the author a database or backup to solve a problem, the author
becomes a processor. In that case conclude a data processing agreement
(template: **[to be added]**) or send an anonymised copy.

## 6. Contact

Application author: Kristián Kačinetz, **[e-mail]**.

---

© 2026 Kristián Kačinetz. All rights reserved.

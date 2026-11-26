# Dokumentácia CRM / CRM documentation

Autor / Author: **Kristián Kačinetz** · verzia / version 0.1.0

| Dokument | Slovensky | English |
|---|---|---|
| Používateľská príručka / User manual | [pouzivatelska-prirucka.md](sk/pouzivatelska-prirucka.md) | [user-manual.md](en/user-manual.md) |
| Inštalačný návod / Installation guide | [instalacia.md](sk/instalacia.md) | [installation.md](en/installation.md) |
| Príručka správcu / Administrator guide | [administracia.md](sk/administracia.md) | [administration.md](en/administration.md) |
| Technická dokumentácia / Technical documentation | [technicka-dokumentacia.md](sk/technicka-dokumentacia.md) | [technical-documentation.md](en/technical-documentation.md) |
| Dátový model / Data model | [datovy-model.md](sk/datovy-model.md) | [data-model.md](en/data-model.md) |
| Plán MVP / MVP plan | [plan-mvp.md](sk/plan-mvp.md) | [mvp-plan.md](en/mvp-plan.md) |
| Licenčná zmluva (návrh) / EULA (draft) | [licencna-zmluva.md](sk/licencna-zmluva.md) | [eula.md](en/eula.md) |
| Ochrana osobných údajov (návrh) / Privacy (draft) | [ochrana-osobnych-udajov.md](sk/ochrana-osobnych-udajov.md) | [privacy.md](en/privacy.md) |
| Zoznam funkcií / Feature list | [zoznam-funkcii.md](sk/marketing/zoznam-funkcii.md) | [feature-list.md](en/marketing/feature-list.md) |
| One-pager | [one-pager.html](sk/marketing/one-pager.html) | [one-pager.html](en/marketing/one-pager.html) |
| Pred predajom (interné) / Before selling (internal) | [pripravenost-na-predaj.md](sk/pripravenost-na-predaj.md) | [sales-readiness.md](en/sales-readiness.md) |

Zmeny / Changes: [CHANGELOG.md](../CHANGELOG.md) · Licencia / Licence: [LICENSE](../LICENSE)

## PDF a DOCX / PDF and DOCX

```bash
python3 scripts/docs/build.py            # výstup / output: dist-docs/CRM – dokumentácia/
```

Potrebné / Requires: pandoc, Python 3 (`python-docx`, `pypdf`), Node.js s/with Playwright.
Všetky súbory majú v metadátach autora Kristián Kačinetz (autor, tvorca,
producent, posledná úprava). All files carry Kristián Kačinetz as author,
creator, producer and last modified by.

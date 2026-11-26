---
title: "CRM – Inštalačný návod"
author: "Kristián Kačinetz"
version: "0.1.0"
date: "2026-11-26"
lang: sk
---

# CRM – Inštalačný návod

| | |
|---|---|
| Produkt | CRM, desktopová aplikácia |
| Verzia | 0.1.0 |
| Autor | Kristián Kačinetz |
| Dátum | 26. 11. 2026 |

## 1. Systémové požiadavky

| | Minimum |
|---|---|
| Operačný systém | Windows 10 (64-bit) alebo Windows 11. Podporované sú aj macOS 12+ a Linux (Ubuntu 22.04+), primárne sa však testuje Windows. |
| Procesor | x64, 2 jadrá |
| Pamäť | 4 GB RAM |
| Disk | 200 MB pre aplikáciu a dáta |
| Ďalšie | Microsoft Edge WebView2 Runtime (vo Windows 10/11 býva nainštalovaný, inštalátor ho v prípade potreby doinštaluje) |
| Internet | nie je potrebný na používanie, iba na stiahnutie inštalátora |
| Práva | bežný používateľ. Inštalátor .msi môže vyžadovať práva správcu. |

## 2. Inštalačné súbory

Dodávka obsahuje jeden z týchto súborov:

| Súbor | Kedy použiť |
|---|---|
| `CRM_0.1.0_x64-setup.exe` | odporúčaný inštalátor pre jedného používateľa |
| `CRM_0.1.0_x64_sk-SK.msi` | hromadná alebo správcovská inštalácia (napr. cez Intune alebo GPO) |

Pred inštaláciou overte, že súbor pochádza od autora (kontrolný súčet SHA-256
uvedený v dodacom liste: **[doplniť]**).

## 3. Inštalácia vo Windows

1. Dvakrát kliknite na `CRM_0.1.0_x64-setup.exe`.
2. Ak sa zobrazí okno **Windows chránil váš počítač** (SmartScreen), kliknite na
   **Ďalšie informácie** → **Spustiť aj tak**. Toto okno sa zobrazuje pri
   aplikáciách, ktoré zatiaľ nie sú podpísané certifikátom vydavateľa.
3. Vyberte jazyk inštalácie (slovenčina alebo angličtina) a postupujte podľa
   sprievodcu.
4. Po dokončení spustite **CRM** z ponuky Štart alebo z odkazu na ploche.

Tichá inštalácia MSI (pre správcov):

```
msiexec /i CRM_0.1.0_x64_sk-SK.msi /qn
```

## 4. Prvé nastavenie

Po prvom spustení vyplňte v **Nastaveniach** údaje firmy, logo a priečinok
záloh. Postup je v [Používateľskej príručke](pouzivatelska-prirucka.md#2-prve-spustenie).

## 5. Kde sú dáta

| Systém | Priečinok |
|---|---|
| Windows | `%APPDATA%\sk.crm.desktop\` (napr. `C:\Users\<meno>\AppData\Roaming\sk.crm.desktop\`) |
| macOS | `~/Library/Application Support/sk.crm.desktop/` |
| Linux | `~/.local/share/sk.crm.desktop/` |

Databáza je súbor `crm.db`. Tento priečinok **nedávajte** do OneDrive ani inej
synchronizácie. Na zálohy slúži funkcia záloh v aplikácii.

## 6. Aktualizácia

1. Zatvorte aplikáciu.
2. Odporúčame najprv vytvoriť zálohu (**Nastavenia → Zálohovať teraz**).
3. Spustite inštalátor novej verzie. Nainštaluje sa cez starú verziu a dáta
   zostanú zachované. Úpravy databázy (migrácie) sa vykonajú automaticky pri
   prvom spustení.

## 7. Odinštalovanie

**Nastavenia systému → Aplikácie → Nainštalované aplikácie → CRM →
Odinštalovať.** Odinštalovanie nemaže dáta. Ak chcete dáta odstrániť, zmažte
po odinštalovaní priečinok z kapitoly 5. Pred tým si ponechajte zálohu.

## 8. Presun na iný počítač

1. Na starom počítači: **Zálohovať teraz**.
2. Na novom počítači nainštalujte CRM, raz ho spustite a zatvorte.
3. Postupujte podľa [Príručky správcu, kapitola Obnova zo zálohy](administracia.md#4-obnova-zo-zalohy).

## 9. Riešenie problémov pri inštalácii

| Problém | Riešenie |
|---|---|
| Aplikácia sa po spustení nezobrazí alebo okno je biele | Nainštalujte alebo opravte Microsoft Edge WebView2 Runtime (developer.microsoft.com/microsoft-edge/webview2). |
| SmartScreen blokuje inštaláciu | Ďalšie informácie → Spustiť aj tak. Firemný antivírus môže vyžadovať povolenie správcom. |
| MSI hlási nedostatočné práva | Spustite ako správca alebo použite inštalátor `.exe`. |

---

© 2026 Kristián Kačinetz. Všetky práva vyhradené.

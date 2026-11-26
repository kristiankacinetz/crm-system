"""Builds the marketing one-pager (A4) as HTML in Slovak and English.

Author: Kristián Kačinetz
"""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHOR = "Kristián Kačinetz"

TEXT = {
    "sk": {
        "out": "docs/sk/marketing/one-pager.html",
        "title": "CRM – prehľad produktu",
        "kicker": "Desktopové CRM pre malé firmy",
        "headline": "Zákazníci, faktúry a obchody na jednom mieste. Vo vašom počítači.",
        "lead": "CRM je jednoduchá aplikácia pre konateľa alebo majiteľa firmy. Ukáže, kto vám dlží, ktoré faktúry sú po splatnosti, aké ponuky čakajú na rozhodnutie a čo sa práve realizuje. Faktúry naďalej vystavujete v iDoklade, CRM ich načíta z exportu.",
        "stats": [("0 €", "za server alebo cloud"), ("1 súbor", "všetky dáta lokálne"), ("1 klik", "z ponuky zákazka")],
        "features_h": "Čo dostanete",
        "features": [
            ("Prehľad pohľadávok", "Stav faktúr sa počíta sám: blíži sa splatnosť, po splatnosti, čiastočne uhradená, uhradená."),
            ("Import z iDokladu", "Export .xlsx alebo .csv, náhľad zmien, opakovaný import bez duplicít."),
            ("Cenové ponuky v PDF", "Položky, zľavy, DPH a profesionálne PDF s vaším logom."),
            ("Pipeline obchodov", "Nástenka Ponuka, Rokovanie, Vyhraté, Prehraté. Presúvanie myšou."),
            ("Zákazky", "Z vyhratej ponuky jedným klikom, so stavmi realizácie."),
            ("Upozornenia len pre vás", "Denné upozornenie na splatnosť. Zákazníkom sa nič neposiela."),
        ],
        "why_h": "Prečo lokálne",
        "why": [
            "Dáta neopúšťajú váš počítač. Žiadna telemetria.",
            "Funguje bez internetu, okamžite.",
            "Automatické denné zálohy, napr. do OneDrive.",
            "Pripravené na rozšírenie pre viac používateľov.",
        ],
        "for_h": "Pre koho",
        "for": "Konatelia a majitelia malých firiem a živnostníci, ktorí fakturujú v iDoklade a chcú mať prehľad o zákazníkoch, pohľadávkach a obchodoch bez zložitého a drahého CRM.",
        "tech": "Windows 10/11 · macOS · Linux · rozhranie v slovenčine",
        "cta_h": "Záujem o ukážku?",
        "cta": "Kontakt: kristian.kacinetz@gmail.com · [telefón] · [web]",
        "price": "Cena: [doplniť]",
        "foot": f"Autor: {AUTHOR} · © 2026 {AUTHOR}. Všetky práva vyhradené.",
    },
    "en": {
        "out": "docs/en/marketing/one-pager.html",
        "title": "CRM – product overview",
        "kicker": "Desktop CRM for small businesses",
        "headline": "Customers, invoices and deals in one place. On your own computer.",
        "lead": "CRM is a simple application for the managing director or owner of a company. It shows who owes you money, which invoices are overdue, which quotes are awaiting a decision and what is being delivered. You keep issuing invoices in iDoklad; CRM reads them from the export.",
        "stats": [("€0", "for servers or cloud"), ("1 file", "all data stays local"), ("1 click", "from quote to order")],
        "features_h": "What you get",
        "features": [
            ("Receivables at a glance", "Invoice status is computed automatically: due soon, overdue, partly paid, paid."),
            ("iDoklad import", ".xlsx or .csv export, preview of changes, repeatable import without duplicates."),
            ("PDF price quotes", "Line items, discounts, VAT and a professional PDF with your logo."),
            ("Sales pipeline", "Board with Quote, Negotiation, Won, Lost. Drag and drop."),
            ("Orders", "From a won quote in one click, with delivery statuses."),
            ("Alerts for you only", "Daily due-date alert. Nothing is ever sent to customers."),
        ],
        "why_h": "Why local",
        "why": [
            "Your data never leaves your computer. No telemetry.",
            "Works offline, instantly.",
            "Automatic daily backups, e.g. to OneDrive.",
            "Ready to grow to multiple users.",
        ],
        "for_h": "Who it is for",
        "for": "Directors and owners of small companies and sole traders who invoice in iDoklad and want an overview of customers, receivables and deals without a complex, expensive CRM.",
        "tech": "Windows 10/11 · macOS · Linux · user interface in Slovak",
        "cta_h": "Want a demo?",
        "cta": "Contact: kristian.kacinetz@gmail.com · [phone] · [website]",
        "price": "Price: [to be added]",
        "foot": f"Author: {AUTHOR} · © 2026 {AUTHOR}. All rights reserved.",
    },
}

CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1f2933; background: #fff;
  width: 210mm; height: 297mm; font-size: 10.5pt; line-height: 1.45; }
.hero { background: linear-gradient(135deg, #0b4f8a 0%, #1c7ed6 100%); color: #fff; padding: 13mm 16mm 10mm; }
.kicker { text-transform: uppercase; letter-spacing: .12em; font-size: 8.5pt; opacity: .85; font-weight: 600; }
h1 { font-size: 23pt; line-height: 1.15; margin: 3mm 0 4mm; font-weight: 700; max-width: 165mm; }
.lead { font-size: 11pt; max-width: 170mm; opacity: .95; margin: 0; }
.stats { display: flex; gap: 6mm; margin-top: 6mm; }
.stat { background: rgba(255,255,255,.13); border-radius: 3mm; padding: 3.5mm 5mm; flex: 1; }
.stat b { display: block; font-size: 17pt; }
.stat span { font-size: 9pt; opacity: .9; }
main { padding: 7mm 16mm 0; }
h2 { font-size: 13pt; color: #0b4f8a; margin: 0 0 4mm; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 8mm; }
.f { border-left: 1.2mm solid #1c7ed6; padding: 1mm 0 1mm 4mm; }
.f b { display: block; font-size: 10.5pt; margin-bottom: .6mm; }
.f span { color: #52606d; font-size: 9.5pt; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 7mm; }
ul { margin: 0; padding-left: 5mm; }
li { margin-bottom: 1.5mm; }
.box { background: #f1f6fb; border-radius: 3mm; padding: 5mm 6mm; }
.tech { color: #52606d; font-size: 9pt; margin-top: 3mm; }
.cta { margin: 7mm 16mm 0; background: #0b4f8a; color: #fff; border-radius: 3mm; padding: 5mm 7mm;
  display: flex; justify-content: space-between; align-items: center; }
.cta h2 { color: #fff; margin: 0 0 1mm; }
.cta .price { font-weight: 700; font-size: 11pt; }
footer { position: absolute; bottom: 7mm; left: 16mm; right: 16mm; font-size: 8pt; color: #7b8794;
  border-top: .3mm solid #d9e2ec; padding-top: 2.5mm; }
"""


def render(lang: str) -> Path:
    t = TEXT[lang]
    e = escape
    stats = "".join(f'<div class="stat"><b>{e(a)}</b><span>{e(b)}</span></div>' for a, b in t["stats"])
    feats = "".join(f'<div class="f"><b>{e(a)}</b><span>{e(b)}</span></div>' for a, b in t["features"])
    why = "".join(f"<li>{e(x)}</li>" for x in t["why"])
    html = f"""<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8">
<meta name="author" content="{AUTHOR}"><meta name="copyright" content="© 2026 {AUTHOR}">
<title>{e(t['title'])}</title><style>{CSS}</style></head>
<body style="position:relative">
<section class="hero"><div class="kicker">{e(t['kicker'])}</div><h1>{e(t['headline'])}</h1>
<p class="lead">{e(t['lead'])}</p><div class="stats">{stats}</div></section>
<main><h2>{e(t['features_h'])}</h2><div class="grid">{feats}</div>
<div class="cols"><div><h2>{e(t['why_h'])}</h2><ul>{why}</ul></div>
<div class="box"><h2>{e(t['for_h'])}</h2><div>{e(t['for'])}</div><div class="tech">{e(t['tech'])}</div></div></div></main>
<div class="cta"><div><h2>{e(t['cta_h'])}</h2><div>{e(t['cta'])}</div></div><div class="price">{e(t['price'])}</div></div>
<footer>{e(t['foot'])}</footer>
</body></html>
"""
    out = ROOT / t["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return out


if __name__ == "__main__":
    for lang in TEXT:
        print(render(lang))

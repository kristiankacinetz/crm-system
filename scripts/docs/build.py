"""Builds the CRM documentation package (PDF + DOCX, Slovak and English).

Every generated file carries Kristián Kačinetz as author, creator, producer
and last modified by.

Requirements: pandoc, Python 3 with python-docx and pypdf, Node.js with Playwright.
Usage:  python3 scripts/docs/build.py [output folder]   (default: dist-docs/)

Author: Kristián Kačinetz
"""
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import docx
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject

sys.path.insert(0, str(Path(__file__).parent))
import onepager  # noqa: E402

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
AUTHOR = "Kristián Kačinetz"
COPYRIGHT = f"© 2026 {AUTHOR}. Všetky práva vyhradené. All rights reserved."
VERSION = "0.1.0"

# source markdown -> (folder in the package, file name without extension)
DOCS = {
    "sk": {
        "root": "SK – Slovensky",
        "files": [
            ("docs/sk/pouzivatelska-prirucka.md", "01 Používateľ", "CRM – Používateľská príručka"),
            ("docs/sk/instalacia.md", "01 Používateľ", "CRM – Inštalačný návod"),
            ("docs/sk/administracia.md", "02 Správa a technika", "CRM – Príručka správcu"),
            ("docs/sk/technicka-dokumentacia.md", "02 Správa a technika", "CRM – Technická dokumentácia"),
            ("docs/sk/datovy-model.md", "02 Správa a technika", "CRM – Dátový model"),
            ("docs/sk/plan-mvp.md", "02 Správa a technika", "CRM – Plán MVP"),
            ("docs/sk/licencna-zmluva.md", "03 Právne", "CRM – Licenčná zmluva (EULA) – návrh"),
            ("docs/sk/ochrana-osobnych-udajov.md", "03 Právne", "CRM – Ochrana osobných údajov (GDPR) – návrh"),
            ("docs/sk/marketing/zoznam-funkcii.md", "04 Marketing", "CRM – Zoznam funkcií"),
            ("docs/sk/pripravenost-na-predaj.md", "05 Interné (nie pre zákazníka)", "CRM – Čo treba doplniť pred predajom"),
        ],
        "onepager": ("04 Marketing", "CRM – One-pager"),
    },
    "en": {
        "root": "EN – English",
        "files": [
            ("docs/en/user-manual.md", "01 User", "CRM – User Manual"),
            ("docs/en/installation.md", "01 User", "CRM – Installation Guide"),
            ("docs/en/administration.md", "02 Administration and technical", "CRM – Administrator Guide"),
            ("docs/en/technical-documentation.md", "02 Administration and technical", "CRM – Technical Documentation"),
            ("docs/en/data-model.md", "02 Administration and technical", "CRM – Data Model"),
            ("docs/en/mvp-plan.md", "02 Administration and technical", "CRM – MVP Plan"),
            ("docs/en/eula.md", "03 Legal", "CRM – End User Licence Agreement (EULA) – draft"),
            ("docs/en/privacy.md", "03 Legal", "CRM – Personal Data Protection (GDPR) – draft"),
            ("docs/en/marketing/feature-list.md", "04 Marketing", "CRM – Feature List"),
            ("docs/en/sales-readiness.md", "05 Internal (not for customers)", "CRM – What to Complete Before Selling"),
        ],
        "onepager": ("04 Marketing", "CRM – One-pager"),
    },
}


def frontmatter(md: Path) -> dict:
    m = re.match(r"---\n(.*?)\n---\n", md.read_text(encoding="utf-8"), re.S)
    meta = {}
    for line in (m.group(1).splitlines() if m else []):
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip().strip('"')
    return meta


def pandoc(md: Path, out: Path, fmt: str):
    styles = (HERE / "doc.css").read_text(encoding="utf-8")
    cmd = ["pandoc", str(md), "-f", "markdown", "-o", str(out), "--lua-filter", str(HERE / "drop-first-h1.lua"),
           "-M", f"author={AUTHOR}"]
    if fmt == "html":
        cmd += ["-t", "html5", "--standalone", "--template", str(HERE / "template.html"), "-V", f"styles={styles}"]
    else:
        cmd += ["-t", "docx"]
    subprocess.run(cmd, check=True, cwd=md.parent)


def html_to_pdf(pairs: list[tuple[Path, Path]]):
    args = [str(p) for pair in pairs for p in pair]
    subprocess.run(["node", str(HERE / "html2pdf.mjs"), *args], check=True)


def xmp(title: str, lang: str) -> bytes:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    e = lambda s: s.replace("&", "&amp;").replace("<", "&lt;")  # noqa: E731
    return f"""<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
 xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">{e(title)}</rdf:li></rdf:Alt></dc:title>
<dc:creator><rdf:Seq><rdf:li>{AUTHOR}</rdf:li></rdf:Seq></dc:creator>
<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">{e(COPYRIGHT)}</rdf:li></rdf:Alt></dc:rights>
<dc:language><rdf:Bag><rdf:li>{lang}</rdf:li></rdf:Bag></dc:language>
<pdf:Producer>{AUTHOR}</pdf:Producer><xmp:CreatorTool>{AUTHOR}</xmp:CreatorTool>
<xmp:CreateDate>{now}</xmp:CreateDate><xmp:ModifyDate>{now}</xmp:ModifyDate><xmp:MetadataDate>{now}</xmp:MetadataDate>
<xmpRights:Marked>True</xmpRights:Marked>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>""".encode("utf-8")


def stamp_pdf(path: Path, title: str, lang: str):
    writer = PdfWriter(clone_from=PdfReader(path))
    writer._info = None  # drop the info dictionary written by the renderer
    writer.add_metadata({
        "/Title": title, "/Author": AUTHOR, "/Creator": AUTHOR, "/Producer": AUTHOR,
        "/Subject": f"CRM {VERSION}", "/Keywords": "CRM", "/Copyright": COPYRIGHT,
    })
    stream = DecodedStreamObject()
    stream.set_data(xmp(title, lang))
    stream.update({NameObject("/Type"): NameObject("/Metadata"), NameObject("/Subtype"): NameObject("/XML")})
    writer._root_object[NameObject("/Metadata")] = writer._add_object(stream)
    writer.write(path)


def stamp_docx(path: Path, title: str, lang: str):
    d = docx.Document(path)
    cp = d.core_properties
    cp.author = AUTHOR
    cp.last_modified_by = AUTHOR
    cp.title = title
    cp.subject = f"CRM {VERSION}"
    cp.keywords = "CRM"
    cp.comments = COPYRIGHT
    cp.category = "Dokumentácia" if lang == "sk" else "Documentation"
    cp.language = "sk-SK" if lang == "sk" else "en-GB"
    cp.created = cp.modified = datetime.now(timezone.utc).replace(tzinfo=None)
    cp.revision = 1
    d.save(path)
    # app.xml: set Company and Application, so no tool name remains in the file properties
    tmp = path.with_suffix(".tmp")
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "docProps/app.xml":
                s = data.decode("utf-8")
                s = re.sub(r"<Application>.*?</Application>", "", s)
                s = re.sub(r"<Company>.*?</Company>", "", s)
                s = s.replace("</Properties>", f"<Application>{AUTHOR}</Application><Company>{AUTHOR}</Company></Properties>")
                data = s.encode("utf-8")
            zout.writestr(item, data)
    tmp.replace(path)


def main():
    out_root = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist-docs"
    pkg = out_root / "CRM – dokumentácia"
    if pkg.exists():
        shutil.rmtree(pkg)
    pkg.mkdir(parents=True)
    pdf_jobs, stamps = [], []
    with tempfile.TemporaryDirectory() as tmpd:
        tmp = Path(tmpd)
        for lang, cfg in DOCS.items():
            for src, folder, name in cfg["files"]:
                md = ROOT / src
                title = frontmatter(md).get("title", name)
                target = pkg / cfg["root"] / folder
                target.mkdir(parents=True, exist_ok=True)
                html = tmp / f"{lang}-{md.stem}.html"
                pandoc(md, html, "html")
                pdf_jobs.append((html, target / f"{name}.pdf"))
                stamps.append((target / f"{name}.pdf", title, lang))
                pandoc(md, target / f"{name}.docx", "docx")
                stamp_docx(target / f"{name}.docx", title, lang)
            html = onepager.render(lang)
            folder, name = cfg["onepager"]
            pdf_jobs.append((html, pkg / cfg["root"] / folder / f"{name}.pdf"))
            stamps.append((pkg / cfg["root"] / folder / f"{name}.pdf", onepager.TEXT[lang]["title"], lang))
        # changelog (bilingual) at the package root
        cl = tmp / "changelog.md"
        cl.write_text('---\ntitle: "CRM – Changelog"\nversion: "0.1.0"\ndate: "2026-11-26"\nlang: sk\n---\n\n'
                      + (ROOT / "CHANGELOG.md").read_text(encoding="utf-8"), encoding="utf-8")
        html = tmp / "changelog.html"
        pandoc(cl, html, "html")
        pdf_jobs.append((html, pkg / "CRM – Changelog.pdf"))
        stamps.append((pkg / "CRM – Changelog.pdf", "CRM – Changelog", "sk"))
        html_to_pdf(pdf_jobs)
    for path, title, lang in stamps:
        stamp_pdf(path, title, lang)
    shutil.copy(ROOT / "LICENSE", pkg / "LICENSE.txt")
    (pkg / "README.txt").write_text(
        "CRM – dokumentácia / documentation\r\n"
        f"Autor / Author: {AUTHOR}\r\nVerzia / Version: {VERSION}\r\n\r\n"
        "SK – Slovensky\\   dokumenty v slovenčine (PDF na čítanie, DOCX na úpravy)\r\n"
        "EN – English\\     documents in English (PDF to read, DOCX to edit)\r\n\r\n"
        "  01 Používateľ / User                     príručka, inštalácia / manual, installation\r\n"
        "  02 Správa a technika / Administration    správa, technika, dátový model / admin, technical, data model\r\n"
        "  03 Právne / Legal                        EULA a GDPR (návrhy na právnu kontrolu / drafts for legal review)\r\n"
        "  04 Marketing                             one-pager, zoznam funkcií / feature list\r\n"
        "  05 Interné / Internal                    čo doplniť pred predajom (nie pre zákazníka) / not for customers\r\n\r\n"
        f"{COPYRIGHT}\r\n", encoding="utf-8")
    print(pkg)


if __name__ == "__main__":
    main()

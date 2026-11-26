// Renders HTML files to A4 PDF with Chromium. Usage: node html2pdf.mjs in.html out.pdf [in2.html out2.pdf ...]
// Author: Kristián Kačinetz
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
for (let i = 0; i < args.length; i += 2) {
  await page.goto(pathToFileURL(args[i]).href, { waitUntil: "load" });
  const footer = `<div style="font-size:7pt;color:#7b8794;width:100%;padding:0 17mm;display:flex;justify-content:space-between;font-family:Arial,sans-serif"><span>© 2026 Kristián Kačinetz</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  const onePager = args[i].includes("one-pager");
  await page.pdf({
    path: args[i + 1],
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: !onePager,
    headerTemplate: "<span></span>",
    footerTemplate: footer,
  });
}
await browser.close();

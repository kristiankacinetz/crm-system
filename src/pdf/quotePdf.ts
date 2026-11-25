import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { AppSettings } from "../db/repo/settings";
import type { Contact, Customer, Quote, QuoteItem } from "../db/schema";
import { formatDate } from "../domain/dates";
import { formatMoney } from "../domain/money";
import { computeTotals, lineNet } from "../domain/quoteTotals";

// Roboto from pdfmake covers Slovak diacritics.
(pdfMake as unknown as { addVirtualFileSystem: (v: unknown) => void }).addVirtualFileSystem(pdfFonts);

export interface QuotePdfInput {
  quote: Quote;
  items: QuoteItem[];
  customer: Customer;
  contact?: Contact;
  settings: AppSettings;
}

const qty = (n: number) => new Intl.NumberFormat("sk-SK", { maximumFractionDigits: 3 }).format(n);

export function quoteDocDefinition({ quote, items, customer, contact, settings }: QuotePdfInput): TDocumentDefinitions {
  const c = settings.company;
  const m = (cents: number) => formatMoney(cents, quote.currency);
  const totals = computeTotals(items);
  const lines = (xs: (string | null | undefined)[]) => xs.filter((x) => x && x.trim()).join("\n");

  const supplier = lines([
    c.name,
    c.street,
    [c.zip, c.city].filter(Boolean).join(" "),
    c.country,
    c.ico && `IČO: ${c.ico}`,
    c.dic && `DIČ: ${c.dic}`,
    c.icDph && `IČ DPH: ${c.icDph}`,
  ]);
  const buyer = lines([
    customer.name,
    customer.street,
    [customer.zip, customer.city].filter(Boolean).join(" "),
    customer.ico && `IČO: ${customer.ico}`,
    customer.dic && `DIČ: ${customer.dic}`,
    customer.icDph && `IČ DPH: ${customer.icDph}`,
    contact && `\nK rukám: ${contact.name}${contact.role ? `, ${contact.role}` : ""}`,
  ]);

  const header: Content = {
    columns: [
      c.logoDataUrl ? { image: c.logoDataUrl, fit: [150, 60] } : { text: c.name, style: "brand" },
      {
        stack: [
          { text: "CENOVÁ PONUKA", style: "title" },
          { text: quote.number, style: "number" },
        ],
        alignment: "right",
      },
    ],
    margin: [0, 0, 0, 20],
  };

  const body: Content[] = [
    header,
    {
      columns: [
        { stack: [{ text: "Dodávateľ", style: "label" }, { text: supplier }] },
        { stack: [{ text: "Odberateľ", style: "label" }, { text: buyer }] },
        {
          width: 150,
          table: {
            widths: ["*", "auto"],
            body: [
              [{ text: "Dátum vystavenia", style: "label" }, formatDate(quote.issueDate)],
              ...(quote.validUntil ? [[{ text: "Platnosť do", style: "label" }, formatDate(quote.validUntil)]] : []),
            ],
          },
          layout: "noBorders",
        },
      ],
      columnGap: 16,
      margin: [0, 0, 0, 20],
    },
    { text: quote.title, style: "subject" },
  ];
  if (quote.introText) body.push({ text: quote.introText, margin: [0, 0, 0, 12] });

  body.push({
    table: {
      headerRows: 1,
      widths: ["*", 45, 30, 65, 35, 35, 70],
      body: [
        ["Položka", "Množstvo", "MJ", "Cena/MJ", "Zľava", "DPH", "Spolu bez DPH"].map((t, i) => ({
          text: t,
          style: "th",
          alignment: i === 0 ? "left" : "right",
        })),
        ...items.map((it) => [
          { stack: [{ text: it.name, bold: true }, ...(it.description ? [{ text: it.description, style: "small" }] : [])] },
          { text: qty(it.quantity), alignment: "right" },
          { text: it.unit, alignment: "right" },
          { text: m(it.unitPrice), alignment: "right" },
          { text: it.discountPct ? `${qty(it.discountPct)} %` : "", alignment: "right" },
          { text: `${qty(it.vatRate)} %`, alignment: "right" },
          { text: m(lineNet(it)), alignment: "right" },
        ]),
      ],
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.3),
      vLineWidth: () => 0,
      hLineColor: () => "#cccccc",
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
  } as Content);

  body.push({
    columns: [
      { text: "" },
      {
        width: 220,
        margin: [0, 12, 0, 0],
        table: {
          widths: ["*", "auto"],
          body: [
            ["Základ bez DPH", { text: m(totals.net), alignment: "right" }],
            ...totals.byRate.map((r) => [`DPH ${qty(r.rate)} %`, { text: m(r.vat), alignment: "right" }]),
            [
              { text: "Spolu s DPH", bold: true, fontSize: 12 },
              { text: m(totals.gross), bold: true, fontSize: 12, alignment: "right" },
            ],
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
  } as Content);

  if (quote.note) body.push({ text: quote.note, margin: [0, 20, 0, 0] });
  if (settings.quoteFooterText) body.push({ text: settings.quoteFooterText, margin: [0, 20, 0, 0], italics: true, color: "#555555" });

  const footer = lines([
    [c.name, c.registration].filter(Boolean).join(" · "),
    [c.iban && `IBAN: ${c.iban}`, c.bank, c.swift && `SWIFT: ${c.swift}`].filter(Boolean).join(" · "),
    [c.email, c.phone, c.web].filter(Boolean).join(" · "),
  ]);

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 70],
    info: { title: `Cenová ponuka ${quote.number}`, author: c.name },
    defaultStyle: { font: "Roboto", fontSize: 9, lineHeight: 1.2 },
    styles: {
      brand: { fontSize: 16, bold: true },
      title: { fontSize: 16, bold: true, color: "#1c7ed6" },
      number: { fontSize: 11, color: "#555555" },
      label: { fontSize: 8, color: "#777777", margin: [0, 0, 0, 2] },
      subject: { fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
      th: { bold: true, fontSize: 8, color: "#555555" },
      small: { fontSize: 8, color: "#555555" },
    },
    content: body,
    footer: (page: number, pages: number) => ({
      margin: [40, 10, 40, 0],
      columns: [
        { text: footer, fontSize: 7, color: "#777777" },
        { text: `${page} / ${pages}`, alignment: "right", fontSize: 7, color: "#777777", width: 40 },
      ],
    }),
  };
}

export async function buildQuotePdf(input: QuotePdfInput): Promise<Uint8Array> {
  const pdf = pdfMake.createPdf(quoteDocDefinition(input));
  const buf = (await (pdf as unknown as { getBuffer: () => Promise<Uint8Array> }).getBuffer()) as Uint8Array;
  return new Uint8Array(buf);
}

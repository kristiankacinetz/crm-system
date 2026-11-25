import Papa from "papaparse";
import { readSheet } from "read-excel-file/universal";

/** Decodes CSV bytes: UTF-8 when valid, otherwise Windows-1250 (older Slovak/Czech exports). */
export function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1250").decode(bytes);
  }
}

export function parseCsv(content: string): string[][] {
  const res = Papa.parse<string[]>(content.trim(), { delimiter: "", skipEmptyLines: "greedy" });
  return res.data;
}

const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b;

/** Reads an .xlsx or .csv file into a grid of cell values. */
export async function readGrid(fileName: string, bytes: Uint8Array): Promise<unknown[][]> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xls") && !isZip(bytes)) {
    throw new Error("Starý formát .xls nie je podporovaný. V iDoklade zvoľte export do .xlsx alebo .csv.");
  }
  if (lower.endsWith(".xlsx") || isZip(bytes)) {
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return (await readSheet(buf)) as unknown[][];
  }
  return parseCsv(decodeText(bytes));
}

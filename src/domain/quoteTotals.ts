export interface ItemInput {
  quantity: number;
  unitPrice: number; // cents, without VAT
  discountPct: number;
  vatRate: number; // percent
}

export interface Totals {
  net: number;
  vat: number;
  gross: number;
}

export function lineNet(i: ItemInput): number {
  return Math.round(i.quantity * i.unitPrice * (1 - i.discountPct / 100));
}

/** VAT is computed per rate on the summed base (common Slovak practice). */
export function computeTotals(items: ItemInput[]): Totals & { byRate: { rate: number; net: number; vat: number }[] } {
  const byRateMap = new Map<number, number>();
  for (const it of items) byRateMap.set(it.vatRate, (byRateMap.get(it.vatRate) ?? 0) + lineNet(it));
  const byRate = [...byRateMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, net]) => ({ rate, net, vat: Math.round((net * rate) / 100) }));
  const net = byRate.reduce((s, r) => s + r.net, 0);
  const vat = byRate.reduce((s, r) => s + r.vat, 0);
  return { net, vat, gross: net + vat, byRate };
}

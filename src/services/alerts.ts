import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { listInvoices } from "../db/repo/invoices";
import { getSettings, saveSettings } from "../db/repo/settings";
import { todayIso } from "../domain/dates";
import { formatMoney } from "../domain/money";

/** Once a day on start: a system notification for the executive about overdue and soon-due invoices. */
export async function dailyInvoiceAlert() {
  const today = todayIso();
  const s = await getSettings();
  if (s.lastAlertDate === today) return;
  const inv = await listInvoices(today);
  const overdue = inv.filter((i) => i.status === "overdue");
  const soon = inv.filter((i) => i.status === "due_soon");
  await saveSettings({ lastAlertDate: today });
  if (!overdue.length && !soon.length) return;
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (!granted) return;
  const parts: string[] = [];
  if (overdue.length) {
    parts.push(`${overdue.length}× po splatnosti (${formatMoney(overdue.reduce((a, i) => a + i.remaining, 0))})`);
  }
  if (soon.length) parts.push(`${soon.length}× blíži sa splatnosť`);
  sendNotification({ title: "CRM: faktúry", body: parts.join(", ") });
}

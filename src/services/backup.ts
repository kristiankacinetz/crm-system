import { rawExecute } from "../db/tauri";
import { getSettings, saveSettings } from "../db/repo/settings";

function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * Writes a consistent copy of the live database with VACUUM INTO.
 * The target folder may be synced (OneDrive); the live database is never placed there.
 */
export async function backupNow(dir?: string): Promise<string> {
  const s = await getSettings();
  const target = dir ?? s.backupDir;
  if (!target) throw new Error("Najprv vyberte priečinok pre zálohy v Nastaveniach");
  const sep = target.includes("\\") ? "\\" : "/";
  const path = `${target.replace(/[\\/]$/, "")}${sep}crm-zaloha-${stamp()}.db`;
  await rawExecute("VACUUM INTO $1", [path]);
  await saveSettings({ lastBackupAt: new Date().toISOString() });
  return path;
}

/** Daily automatic backup on start, when a folder is configured. */
export async function autoBackup(): Promise<string | null> {
  const s = await getSettings();
  if (!s.backupDir) return null;
  if (s.lastBackupAt && Date.now() - Date.parse(s.lastBackupAt) < 20 * 3600_000) return null;
  return backupNow(s.backupDir);
}

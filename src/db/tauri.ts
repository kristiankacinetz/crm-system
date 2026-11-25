import Database from "@tauri-apps/plugin-sql";
import { createDb, setDb, type Db } from "./proxy";
import { seed } from "./seed";

export const DB_URL = "sqlite:crm.db";

let sqlite: Database | null = null;
let opening: Promise<Db> | null = null;

/** Opens the app database once (migrations run in Rust on load) and seeds defaults. */
export function initTauriDb(): Promise<Db> {
  opening ??= open();
  return opening;
}

async function open(): Promise<Db> {
  sqlite = await Database.load(DB_URL);
  await sqlite.execute("PRAGMA foreign_keys = ON");
  const db = createDb({
    select: (sql, params) => sqlite!.select<Record<string, unknown>[]>(sql, params),
    execute: async (sql, params) => {
      await sqlite!.execute(sql, params);
    },
  });
  setDb(db);
  await seed(db);
  return db;
}

/** Raw SQL access for maintenance tasks (backup). */
export async function rawExecute(sql: string, params: unknown[] = []) {
  if (!sqlite) throw new Error("Databáza nie je otvorená");
  await sqlite.execute(sql, params);
}

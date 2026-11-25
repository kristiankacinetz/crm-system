/** Test helper: in-memory SQLite (built into Node, no native build) with the real migrations applied. */
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createDb, setDb, type Db } from "./proxy";
import { seed } from "./seed";

const MIGRATIONS = join(__dirname, "../../src-tauri/migrations");

export async function createTestDb(): Promise<Db> {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
  }
  type Param = null | number | bigint | string | Uint8Array;
  const toParams = (params: unknown[]) =>
    params.map((p) => (typeof p === "boolean" ? (p ? 1 : 0) : p === undefined ? null : p)) as Param[];
  const db = createDb({
    async select(sql, params) {
      return sqlite.prepare(sql).all(...toParams(params)) as Record<string, unknown>[];
    },
    async execute(sql, params) {
      sqlite.prepare(sql).run(...toParams(params));
    },
  });
  setDb(db);
  await seed(db);
  return db;
}

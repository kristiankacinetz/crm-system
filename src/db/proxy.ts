import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

export type Db = SqliteRemoteDatabase<typeof schema>;

/** Minimal driver interface: what both tauri-plugin-sql and the test driver provide. */
export interface SqlDriver {
  /** Returns rows as objects with keys in column order. */
  select(sql: string, params: unknown[]): Promise<Record<string, unknown>[]>;
  execute(sql: string, params: unknown[]): Promise<void>;
}

/**
 * Wraps a driver into a Drizzle database.
 *
 * Drizzle's sqlite-proxy expects positional row arrays. Drivers return objects
 * whose keys follow the column order, so Object.values() is safe as long as a
 * query never selects two columns with the same name. Repositories therefore
 * avoid SQL joins and combine related rows in code.
 */
export function createDb(driver: SqlDriver): Db {
  return drizzle(
    async (sql, params, method) => {
      if (method === "run") {
        await driver.execute(sql, params);
        return { rows: [] };
      }
      const rows = await driver.select(sql, params);
      if (method === "get") {
        return { rows: rows[0] ? Object.values(rows[0]) : (undefined as unknown as unknown[]) };
      }
      return { rows: rows.map((r) => Object.values(r)) };
    },
    { schema },
  );
}

let current: Db | null = null;

export function setDb(db: Db) {
  current = db;
}

export function getDb(): Db {
  if (!current) throw new Error("Databáza nie je inicializovaná");
  return current;
}

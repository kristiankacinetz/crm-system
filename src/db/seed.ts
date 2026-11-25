import { sql } from "drizzle-orm";
import type { Db } from "./proxy";
import { pipelineStages, users } from "./schema";

export const DEFAULT_STAGES = [
  { id: "stage-offer", name: "Ponuka", position: 1, kind: "open", color: "blue" },
  { id: "stage-negotiation", name: "Rokovanie", position: 2, kind: "open", color: "violet" },
  { id: "stage-won", name: "Vyhraté", position: 3, kind: "won", color: "green" },
  { id: "stage-lost", name: "Prehraté", position: 4, kind: "lost", color: "red" },
] as const;

/** Idempotent defaults: the local user and the pipeline stages. */
export async function seed(db: Db) {
  await db.insert(users).values({ id: "local", name: "Konateľ" }).onConflictDoNothing();
  const count = await db.select({ n: sql<number>`count(*)` }).from(pipelineStages).get();
  if (!count || count.n === 0) {
    await db.insert(pipelineStages).values(DEFAULT_STAGES.map((s) => ({ ...s }))).onConflictDoNothing();
  }
}

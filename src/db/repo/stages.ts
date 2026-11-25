import { asc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../proxy";
import { pipelineStages, quotes, type PipelineStage } from "../schema";
import { newId, nowIso } from "../../domain/ids";
import { created, logAudit, touched } from "./audit";

export async function listStages(): Promise<PipelineStage[]> {
  return getDb().select().from(pipelineStages).where(isNull(pipelineStages.deletedAt)).orderBy(asc(pipelineStages.position)).all();
}

export async function saveStage(input: Pick<PipelineStage, "name" | "kind" | "color">, id?: string) {
  if (!input.name.trim()) throw new Error("Názov fázy je povinný");
  if (id) {
    await getDb().update(pipelineStages).set({ ...input, ...touched() }).where(eq(pipelineStages.id, id));
    await logAudit("stage", id, "update", input);
    return id;
  }
  const stages = await listStages();
  const newIdValue = newId();
  const position = (stages.at(-1)?.position ?? 0) + 1;
  await getDb().insert(pipelineStages).values({ ...input, id: newIdValue, position, ...created() });
  await logAudit("stage", newIdValue, "create", input);
  return newIdValue;
}

/** Persists a new order of stages (ids in display order). */
export async function reorderStages(ids: string[]) {
  for (const [i, id] of ids.entries()) {
    await getDb().update(pipelineStages).set({ position: i + 1, ...touched() }).where(eq(pipelineStages.id, id));
  }
}

export async function deleteStage(id: string) {
  const used = await getDb()
    .select({ n: sql<number>`count(*)` })
    .from(quotes)
    .where(sql`${quotes.stageId} = ${id} and ${quotes.deletedAt} is null`)
    .get();
  if (used && used.n > 0) throw new Error("Fázu nemožno zmazať, sú v nej ponuky. Najprv ich presuňte.");
  const stages = await listStages();
  if (stages.length <= 1) throw new Error("Musí zostať aspoň jedna fáza");
  await getDb().update(pipelineStages).set({ deletedAt: nowIso(), ...touched() }).where(eq(pipelineStages.id, id));
  await logAudit("stage", id, "delete");
}

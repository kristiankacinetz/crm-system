import { getDb } from "../proxy";
import { auditLog } from "../schema";
import { CURRENT_USER, newId, nowIso } from "../../domain/ids";

export async function logAudit(
  entity: string,
  entityId: string,
  action: "create" | "update" | "delete" | "import",
  changes: Record<string, unknown> = {},
) {
  await getDb()
    .insert(auditLog)
    .values({ id: newId(), at: nowIso(), userId: CURRENT_USER, entity, entityId, action, changes: JSON.stringify(changes) });
}

/** Stamp for updates: who and when. */
export const touched = () => ({ updatedAt: nowIso(), updatedBy: CURRENT_USER });
/** Stamp for inserts. */
export const created = () => ({ createdAt: nowIso(), createdBy: CURRENT_USER, ...touched() });

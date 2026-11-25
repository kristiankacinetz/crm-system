export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();
/** Current user. Single-user today; replace when accounts are added. */
export const CURRENT_USER = "local";

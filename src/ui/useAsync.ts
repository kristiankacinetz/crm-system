import { useCallback, useEffect, useState } from "react";

/** Loads data on mount and when deps change; `reload` refreshes after a write. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await load());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload };
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) {
    // Drizzle wraps driver errors; the cause holds the readable SQLite message.
    const cause = (e as { cause?: unknown }).cause;
    if (cause && e.message.startsWith("Failed query")) return errorMessage(cause);
    return e.message;
  }
  return String(e);
}

import { notifications } from "@mantine/notifications";
import { errorMessage } from "./useAsync";

export const notifyOk = (message: string) => notifications.show({ color: "green", message });
export const notifyError = (e: unknown) => notifications.show({ color: "red", title: "Chyba", message: errorMessage(e) });

/** Runs an action and shows its error as a notification. Returns true on success. */
export async function attempt(action: () => Promise<unknown>, okMessage?: string): Promise<boolean> {
  try {
    await action();
    if (okMessage) notifyOk(okMessage);
    return true;
  } catch (e) {
    notifyError(e);
    return false;
  }
}

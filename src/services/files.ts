import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";

export async function pickFile(name: string, extensions: string[]): Promise<{ path: string; fileName: string; bytes: Uint8Array } | null> {
  const path = await open({ multiple: false, directory: false, filters: [{ name, extensions }] });
  if (!path || Array.isArray(path)) return null;
  const bytes = await readFile(path);
  return { path, fileName: path.split(/[\\/]/).pop() ?? path, bytes };
}

export async function saveFile(defaultName: string, bytes: Uint8Array, filterName: string, extensions: string[]): Promise<string | null> {
  const path = await save({ defaultPath: defaultName, filters: [{ name: filterName, extensions }] });
  if (!path) return null;
  await writeFile(path, bytes);
  return path;
}

export async function pickDirectory(): Promise<string | null> {
  const path = await open({ directory: true, multiple: false });
  return typeof path === "string" ? path : null;
}

import { readFile } from "fs/promises";
import path from "path";

export type HomeContent = typeof import("@/data/home.json");

/** Marketing copy — read on the server when needed (see also `getHomeContent`). */
export async function getHomeContent(): Promise<HomeContent> {
  const filePath = path.join(process.cwd(), "src/data/home.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as HomeContent;
}

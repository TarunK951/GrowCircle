import { readFile } from "fs/promises";
import path from "path";
import type { CareersContent } from "@/lib/types";

/** Loads careers copy from disk on the server (not bundled as a client JSON import). */
export async function getCareersContent(): Promise<CareersContent> {
  const filePath = path.join(process.cwd(), "src/data/careers.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as CareersContent;
}

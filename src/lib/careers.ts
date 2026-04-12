import type { CareersContent } from "@/lib/types";
import { careersContent } from "@/data/careersContent";

export async function getCareersContent(): Promise<CareersContent> {
  return careersContent;
}

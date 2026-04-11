import careersData from "@/data/careers.json";
import type { CareersContent } from "@/lib/types";

export function getCareersContent(): CareersContent {
  return careersData as CareersContent;
}

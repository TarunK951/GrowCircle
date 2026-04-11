import homeData from "@/data/home.json";

export type HomeContent = typeof homeData;

export function getHomeContent(): HomeContent {
  return homeData;
}

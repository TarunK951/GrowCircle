/** Approximate map centers for host wizard (OpenStreetMap / pin placement). */
export const CITY_CENTROIDS: Record<string, [number, number]> = {
  circle: [12.9716, 77.5946],
  blr: [12.9716, 77.5946],
  mum: [19.076, 72.8777],
  del: [28.6139, 77.209],
  hyd: [17.385, 78.4867],
  chen: [13.0827, 80.2707],
  kol: [22.5726, 88.3639],
  pun: [18.5204, 73.8567],
  ahm: [23.0225, 72.5714],
  sf: [37.7749, -122.4194],
  nyc: [40.7128, -74.006],
  lon: [51.5074, -0.1278],
  sg: [1.3521, 103.8198],
};

export function centroidForCityId(cityId: string): [number, number] {
  return CITY_CENTROIDS[cityId] ?? CITY_CENTROIDS.blr;
}

/**
 * Asks the browser for the device location (shows the system permission prompt when allowed).
 * Returns null if denied, unavailable, or unsupported.
 */
export function requestBrowserCoordinates(): Promise<{
  lat: number;
  lng: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 15_000,
      },
    );
  });
}

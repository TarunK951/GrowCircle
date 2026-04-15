/**
 * Host suffixes aligned with `next.config.ts` `images.remotePatterns`.
 * For any other HTTPS host (e.g. a new CDN), we render `<img>` so covers still load
 * without redeploying config for every storage provider.
 */
const KNOWN_NEXT_IMAGE_HOST_SUFFIXES = [
  "images.unsplash.com",
  "googleusercontent.com",
  "amazonaws.com",
  "cloudfront.net",
  "up.railway.app",
  "railway.app",
  "r2.dev",
  "r2.cloudflarestorage.com",
  "supabase.co",
  "storage.googleapis.com",
  "blob.core.windows.net",
  "digitaloceanspaces.com",
] as const;

function hostnameMatchesKnownCdn(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return KNOWN_NEXT_IMAGE_HOST_SUFFIXES.some(
    (suffix) => h === suffix || h.endsWith(`.${suffix}`),
  );
}

/**
 * Use native `<img>` for data URLs, invalid URLs, non-HTTPS, localhost, or HTTPS hosts
 * not listed above (avoids Next/Image blocking unknown remote hosts).
 */
export function shouldRenderNativeImg(url: string): boolean {
  const s = url.trim();
  if (!s) return true;
  if (s.startsWith("data:")) return true;
  try {
    const u = new URL(s);
    if (u.protocol === "http:") return true;
    if (u.protocol !== "https:") return true;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    return !hostnameMatchesKnownCdn(host);
  } catch {
    return true;
  }
}

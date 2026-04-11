import { getCircleApiBase } from "@/lib/circle/config";
import type { CircleEnvelope } from "@/lib/circle/types";

export class CircleApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "CircleApiError";
  }
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  /** Skip JSON Content-Type (e.g. CSV download) */
  raw?: boolean;
};

export async function circleRequest<T>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  const base = getCircleApiBase();
  if (!base) {
    throw new CircleApiError("Circle API is not configured", 0);
  }

  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {};
  if (!opts.raw && opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body:
      opts.raw || opts.body === undefined
        ? undefined
        : JSON.stringify(opts.body),
  });

  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = isJson ? await res.json() : await res.text();
    } catch {
      errBody = undefined;
    }
    const msg =
      typeof errBody === "object" &&
      errBody !== null &&
      "message" in errBody &&
      typeof (errBody as { message: unknown }).message === "string"
        ? (errBody as { message: string }).message
        : res.statusText || "Request failed";
    throw new CircleApiError(msg, res.status, errBody);
  }

  if (opts.raw || !isJson) {
    return undefined as T;
  }

  const parsed = (await res.json()) as CircleEnvelope<T> | T;

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "success" in parsed &&
    (parsed as CircleEnvelope<T>).success === false
  ) {
    const env = parsed as CircleEnvelope<T>;
    throw new CircleApiError(
      env.message ?? "Request failed",
      res.status,
      env,
    );
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "data" in parsed &&
    (parsed as CircleEnvelope<T>).success === true
  ) {
    return (parsed as CircleEnvelope<T>).data as T;
  }

  return parsed as T;
}

/** For CSV / binary responses */
export async function circleRequestBlob(
  path: string,
  accessToken: string,
): Promise<Blob> {
  const base = getCircleApiBase();
  if (!base) throw new CircleApiError("Circle API is not configured", 0);
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new CircleApiError(res.statusText, res.status);
  }
  return res.blob();
}

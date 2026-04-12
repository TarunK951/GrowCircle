import { getCircleApiBase } from "@/lib/circle/config";
import type { CircleEnvelope, CircleListMeta } from "@/lib/circle/types";

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

type RequestOptsNoBody = Omit<RequestOpts, "body">;

/**
 * GET requests that return `{ success, data: T[], meta }` (e.g. §5.2 event applications).
 */
export async function circleRequestList<T>(
  path: string,
  opts: RequestOptsNoBody & { accessToken: string },
): Promise<{ data: T[]; meta: CircleListMeta }> {
  const base = getCircleApiBase();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {};
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
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

  if (!isJson) {
    return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  }

  const parsed = (await res.json()) as {
    success?: boolean;
    message?: string;
    data?: T[];
    meta?: CircleListMeta;
  };

  if (parsed.success === false) {
    throw new CircleApiError(parsed.message ?? "Request failed", res.status, parsed);
  }

  const data = Array.isArray(parsed.data) ? parsed.data : [];
  const meta = parsed.meta ?? {
    total: data.length,
    page: 1,
    limit: data.length || 20,
    totalPages: 1,
  };
  return { data, meta };
}

/** For CSV / binary responses */
export async function circleRequestBlob(
  path: string,
  accessToken: string,
): Promise<Blob> {
  const base = getCircleApiBase();
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new CircleApiError(res.statusText, res.status);
  }
  return res.blob();
}

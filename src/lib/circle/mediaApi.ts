/** §14 Media — presigned S3 upload URLs (`/media/upload-url`, `DELETE /media`). */
import { CircleApiError, circleRequest } from "@/lib/circle/client";
import { getCirclePresignedUploadProxyUrl } from "@/lib/circle/config";
import type {
  CircleMediaDeleteBody,
  CircleMediaUploadUrlBody,
  CircleMediaUploadUrlData,
} from "@/lib/circle/types";

function normalizeUploadUrlData(raw: unknown): CircleMediaUploadUrlData {
  if (!raw || typeof raw !== "object") {
    throw new CircleApiError("Invalid media upload response", 500, raw);
  }
  const o = raw as Record<string, unknown>;
  const uploadUrl = typeof o.uploadUrl === "string" ? o.uploadUrl : "";
  const publicUrlRaw =
    typeof o.publicUrl === "string"
      ? o.publicUrl
      : typeof o.fileUrl === "string"
        ? o.fileUrl
        : "";
  const fileKeyRaw =
    typeof o.fileKey === "string"
      ? o.fileKey
      : typeof o.key === "string"
        ? o.key
        : "";
  if (!uploadUrl || !publicUrlRaw || !fileKeyRaw) {
    throw new CircleApiError("Incomplete media upload response", 500, raw);
  }
  return {
    uploadUrl,
    publicUrl: publicUrlRaw,
    fileKey: fileKeyRaw,
    fileUrl: publicUrlRaw,
    key: fileKeyRaw,
  };
}

/** §14.1 */
export async function getMediaUploadUrl(
  accessToken: string,
  body: CircleMediaUploadUrlBody,
) {
  const raw = await circleRequest<unknown>("/media/upload-url", {
    accessToken,
    body,
  });
  return normalizeUploadUrlData(raw);
}

/**
 * Full upload: server calls Circle `POST …/media/upload-url` using {@link getCircleApiBase}, then
 * PUTs bytes to S3. Prefer this from the browser so the Circle base URL (PDF) is used on the
 * server—not a client `fetch` to Railway—and the only browser POST is same-origin to this app.
 */
export async function uploadBlobToCircleStorageViaApp(
  accessToken: string,
  file: Blob,
  meta: CircleMediaUploadUrlBody,
): Promise<CircleMediaUploadUrlData> {
  const form = new FormData();
  form.set("file", file);
  form.set("fileName", meta.fileName);
  const fileType =
    meta.fileType?.trim() ||
    meta.contentType?.trim() ||
    (file.type ? file.type.trim() : "") ||
    "application/octet-stream";
  form.set("fileType", fileType);
  if (meta.folder?.trim()) form.set("folder", meta.folder.trim());

  const res = await fetch(getCirclePresignedUploadProxyUrl(), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  const raw = (await res.json().catch(() => ({}))) as unknown;

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    if (
      raw &&
      typeof raw === "object" &&
      "error" in raw &&
      typeof (raw as { error: unknown }).error === "string"
    ) {
      msg = (raw as { error: string }).error.trim() || msg;
    }
    throw new Error(msg);
  }

  return normalizeUploadUrlData(raw);
}

/** §14.2 — body uses `key` (PDF) and/or `fileKey` (API_REFERENCE); wire sends both when possible. */
export function deleteMedia(accessToken: string, body: CircleMediaDeleteBody) {
  const k = body.key?.trim() || body.fileKey?.trim();
  if (!k) {
    throw new CircleApiError("Missing key or fileKey for media delete", 400, body);
  }
  return circleRequest<unknown>("/media", {
    method: "DELETE",
    accessToken,
    body: { key: k, fileKey: k },
  });
}

/**
 * Upload file bytes to the presigned URL (S3). Call after {@link getMediaUploadUrl}.
 *
 * Uses a same-origin Next.js route to perform the PUT. Prefer {@link uploadBlobToCircleStorageViaApp}
 * so Circle `POST /media/upload-url` also runs on the server with the documented API base URL.
 */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const form = new FormData();
  form.set("uploadUrl", uploadUrl);
  form.set("contentType", contentType);
  form.set("file", file);

  const res = await fetch(getCirclePresignedUploadProxyUrl(), {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j?.error === "string" && j.error.trim()) msg = j.error.trim();
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
}

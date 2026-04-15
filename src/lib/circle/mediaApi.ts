/** §14 Media — presigned S3 upload URLs (`/media/upload-url`, `DELETE /media`). */
import { CircleApiError, circleRequest } from "@/lib/circle/client";
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
 */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}

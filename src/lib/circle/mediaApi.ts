/** §14 Media — presigned S3 upload URLs (`/media/upload-url`, `DELETE /media`). */
import { circleRequest } from "@/lib/circle/client";
import type {
  CircleMediaDeleteBody,
  CircleMediaUploadUrlBody,
  CircleMediaUploadUrlData,
} from "@/lib/circle/types";

/** §14.1 */
export function getMediaUploadUrl(
  accessToken: string,
  body: CircleMediaUploadUrlBody,
) {
  return circleRequest<CircleMediaUploadUrlData>("/media/upload-url", {
    accessToken,
    body,
  });
}

/** §14.2 */
export function deleteMedia(accessToken: string, body: CircleMediaDeleteBody) {
  return circleRequest<unknown>("/media", {
    method: "DELETE",
    accessToken,
    body,
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

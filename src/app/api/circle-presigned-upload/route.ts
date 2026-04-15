import { NextResponse } from "next/server";
import { CircleApiError } from "@/lib/circle/client";
import { getMediaUploadUrl } from "@/lib/circle/mediaApi";

/** Max single file (matches host wizard Circle cap + margin). */
const MAX_BYTES = 6 * 1024 * 1024;

/**
 * AWS SigV4 presigned PUTs often sign only `host` and `content-length`. Sending `Content-Type`
 * when it is not in `X-Amz-SignedHeaders` causes SignatureDoesNotMatch / 403 from S3.
 */
function headersForS3PresignedPut(
  uploadUrl: string,
  contentType: string,
): HeadersInit {
  try {
    const raw =
      new URL(uploadUrl).searchParams.get("X-Amz-SignedHeaders") ?? "";
    const parts = raw
      .toLowerCase()
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.includes("content-type")) {
      return { "Content-Type": contentType };
    }
  } catch {
    /* ignore */
  }
  return {};
}

/**
 * Allow only HTTPS object-storage presigned PUT targets (S3-style and common compat hosts).
 * Blocks open redirects / internal network SSRF via arbitrary URLs.
 */
function isAllowedPresignedPutUrl(urlString: string): boolean {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".local")) {
    return false;
  }
  if (h.includes(".s3.") && h.endsWith(".amazonaws.com")) return true;
  if (h === "s3.amazonaws.com" || h.startsWith("s3.")) return true;
  if (h.endsWith(".r2.cloudflarestorage.com")) return true;
  if (h.endsWith(".digitaloceanspaces.com")) return true;
  return false;
}

async function handleCircleOrchestratedUpload(
  authHeader: string,
  form: FormData,
  file: Blob,
): Promise<Response> {
  const token = authHeader.slice(7).trim();
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  const fileNameRaw = form.get("fileName");
  const fileName =
    typeof fileNameRaw === "string" && fileNameRaw.trim()
      ? fileNameRaw.trim()
      : null;
  if (!fileName) {
    return NextResponse.json({ error: "Missing fileName." }, { status: 400 });
  }

  const folderRaw = form.get("folder");
  const folder =
    typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim()
      : "events";

  const fileTypeRaw = form.get("fileType");
  const fileType =
    typeof fileTypeRaw === "string" && fileTypeRaw.trim()
      ? fileTypeRaw.trim()
      : file.type || "application/octet-stream";

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large or empty." }, { status: 400 });
  }

  let data: Awaited<ReturnType<typeof getMediaUploadUrl>>;
  try {
    data = await getMediaUploadUrl(token, { fileName, fileType, folder });
  } catch (e) {
    if (e instanceof CircleApiError) {
      const st = e.status >= 400 && e.status < 600 ? e.status : 502;
      return NextResponse.json(
        { error: e.message.trim() || "Circle request failed" },
        { status: st },
      );
    }
    throw e;
  }

  const body = Buffer.from(await file.arrayBuffer());
  const putUrl = data.uploadUrl.trim();
  const putHeaders = headersForS3PresignedPut(putUrl, fileType);

  const upstream = await fetch(putUrl, {
    method: "PUT",
    body,
    headers: putHeaders,
    redirect: "manual",
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: `Upload failed (${upstream.status}).`,
        detail: text.slice(0, 200),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    uploadUrl: data.uploadUrl,
    publicUrl: data.publicUrl,
    fileKey: data.fileKey,
    fileUrl: data.fileUrl ?? data.publicUrl,
    key: data.key ?? data.fileKey,
  });
}

async function handleLegacyPresignedPut(
  form: FormData,
  uploadUrl: string,
  file: FormDataEntryValue | null,
): Promise<Response> {
  if (!isAllowedPresignedPutUrl(uploadUrl)) {
    return NextResponse.json({ error: "Invalid upload URL." }, { status: 400 });
  }

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large or empty." }, { status: 400 });
  }

  const contentTypeRaw = form.get("contentType");
  const contentType =
    typeof contentTypeRaw === "string" && contentTypeRaw.trim()
      ? contentTypeRaw.trim()
      : "application/octet-stream";

  const body = Buffer.from(await file.arrayBuffer());
  const putHeaders = headersForS3PresignedPut(uploadUrl, contentType);

  const upstream = await fetch(uploadUrl, {
    method: "PUT",
    body,
    headers: putHeaders,
    redirect: "manual",
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: `Upload failed (${upstream.status}).`,
        detail: text.slice(0, 200),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true as const });
}

/**
 * - **Orchestrated (preferred):** `Authorization: Bearer` + `file` + `fileName` (+ optional `folder`,
 *   `fileType`). Server calls Circle `POST …/media/upload-url` using the documented API base URL,
 *   then PUTs to S3 (no browser→Railway or browser→S3 CORS).
 * - **Legacy:** `uploadUrl` + `file` + `contentType` — PUT bytes to presigned URL from this server.
 */
export async function POST(req: Request) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const uploadUrlRaw = form.get("uploadUrl");
    const auth = req.headers.get("authorization");
    const file = form.get("file");

    const hasLegacyUpload =
      typeof uploadUrlRaw === "string" && uploadUrlRaw.trim().length > 0;

    if (
      !hasLegacyUpload &&
      auth?.startsWith("Bearer ") &&
      file instanceof Blob &&
      file.size > 0
    ) {
      return handleCircleOrchestratedUpload(auth, form, file);
    }

    if (hasLegacyUpload && typeof uploadUrlRaw === "string") {
      return handleLegacyPresignedPut(form, uploadUrlRaw.trim(), file);
    }

    return NextResponse.json(
      {
        error:
          "Expected Authorization + file + fileName (Circle orchestrated upload), or presigned uploadUrl + file.",
      },
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload handler failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = "nodejs";

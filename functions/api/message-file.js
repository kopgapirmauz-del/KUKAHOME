import { storageDownload, storageUpload } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

const BUCKET = "crm-private";
const PREFIX = "messages";

const MIME_MAP = {
  "data:image/png;base64": { ext: ".png", type: "image/png" },
  "data:image/jpeg;base64": { ext: ".jpg", type: "image/jpeg" },
  "data:image/webp;base64": { ext: ".webp", type: "image/webp" },
  "data:image/gif;base64": { ext: ".gif", type: "image/gif" },
  "data:application/pdf;base64": { ext: ".pdf", type: "application/pdf" },
  "data:application/msword;base64": { ext: ".doc", type: "application/msword" },
  "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64": {
    ext: ".docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "data:application/vnd.ms-excel;base64": { ext: ".xls", type: "application/vnd.ms-excel" },
  "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64": {
    ext: ".xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  "data:application/zip;base64": { ext: ".zip", type: "application/zip" },
};

const MAX_BYTES = 15 * 1024 * 1024;

function safeFileName(input, ext) {
  const base = String(input || "").replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/\.+/g, ".").replace(/^\.+/, "");
  const clean = base || `msg_${Date.now()}`;
  if (clean.toLowerCase().endsWith(ext)) return clean;
  return `${clean}${ext}`;
}

function parseDataUrl(dataUrl) {
  const value = String(dataUrl || "");
  const comma = value.indexOf(",");
  if (comma <= 0) return null;
  const meta = value.slice(0, comma).toLowerCase();
  const b64 = value.slice(comma + 1);
  const kind = MIME_MAP[meta];
  if (!kind) return null;
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { ...kind, bytes };
  } catch {
    return null;
  }
}

// Object names are prefixed with a random token so an unauthenticated GET
// (required so Telegram/Meta's servers can fetch the file themselves) can't
// be enumerated - same model as sales-check-file.js.
function normalizeObjectPath(fileName) {
  const value = String(fileName || "").trim();
  if (!value || value.length > 200) return "";
  if (!/^[A-Za-z0-9_.-]+$/.test(value)) return "";
  if (value.includes("..")) return "";
  return `${PREFIX}/${value}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const parsed = parseDataUrl(data?.data_url || "");
    if (!parsed) return Response.json({ success: false, error: "unsupported_file_type" }, { status: 400 });
    if (parsed.bytes.length > MAX_BYTES) {
      return Response.json({ success: false, error: "file_too_large" }, { status: 400 });
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const fileName = safeFileName(`${token}_${data?.file_name || ""}`, parsed.ext);
    const objectPath = `${PREFIX}/${fileName}`;

    await storageUpload(env, BUCKET, objectPath, parsed.bytes, parsed.type);
    return Response.json({
      success: true,
      url: `/api/message-file?file_name=${encodeURIComponent(fileName)}`,
      file_name: fileName,
      content_type: parsed.type,
      is_image: parsed.type.startsWith("image/"),
    });
  } catch {
    return Response.json({ success: false, error: "upload_failed" }, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const fileName = String(url.searchParams.get("file_name") || "").trim();
    const objectPath = normalizeObjectPath(fileName);
    if (!objectPath) return new Response("Not Found", { status: 404 });

    const file = await storageDownload(env, BUCKET, objectPath);
    if (!file) return new Response("Not Found", { status: 404 });

    const contentType = file.headers.get("content-type") || "application/octet-stream";
    return new Response(file.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("Service Unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

import { storageDownload, storageRemove, storageUpload } from "./_supabase.js";

const BUCKET = "crm-private";
const PREFIX = "sales-checks";

function safeFileName(input, ext) {
  const base = String(input || "").replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/\.+/g, ".").replace(/^\.+/, "");
  const clean = base || `sales_check_${Date.now()}`;
  if (clean.toLowerCase().endsWith(ext)) return clean;
  return `${clean}${ext}`;
}

function parseDataUrl(dataUrl) {
  const value = String(dataUrl || "");
  const comma = value.indexOf(",");
  if (comma <= 0) return null;
  const meta = value.slice(0, comma).toLowerCase();
  const b64 = value.slice(comma + 1);
  const map = {
    "data:application/pdf;base64": { ext: ".pdf", type: "application/pdf" },
    "data:image/png;base64": { ext: ".png", type: "image/png" },
    "data:image/jpeg;base64": { ext: ".jpg", type: "image/jpeg" },
    "data:image/webp;base64": { ext: ".webp", type: "image/webp" },
  };
  const kind = map[meta];
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

function normalizeObjectPath(fileName) {
  const value = String(fileName || "").trim();
  if (!value) return "";
  if (value.includes("/")) return value.replace(/^\/+/, "");
  return `${PREFIX}/${value}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const parsed = parseDataUrl(data?.data_url || "");
    if (!parsed) return Response.json({ success: false, error: "unsupported_file_type" }, { status: 400 });

    const fileName = safeFileName(data?.file_name || "", parsed.ext);
    const objectPath = `${PREFIX}/${fileName}`;

    await storageUpload(env, BUCKET, objectPath, parsed.bytes, parsed.type);
    return Response.json({
      success: true,
      url: `/api/sales-check-file?file_name=${encodeURIComponent(fileName)}`,
      path: objectPath,
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
    return new Response("Not Found", { status: 404 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const objectPath = normalizeObjectPath(data?.file_name || "");
    if (!objectPath) return Response.json({ success: false, error: "missing_file_name" }, { status: 400 });

    await storageRemove(env, BUCKET, [objectPath]);
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: "delete_failed" }, { status: 500 });
  }
}

import { restRequest, first } from "./_supabase.js";

export function parseSheetUrl(rawUrl) {
  const url = String(rawUrl || "").trim();
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) return null;
  const gidMatch = url.match(/[?#&]gid=(\d+)/);
  return { spreadsheetId: idMatch[1], gid: gidMatch ? gidMatch[1] : "0" };
}

export async function fetchSheetCsv(spreadsheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid || "0"}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`sheet_fetch_failed_${res.status}`);
  }
  const text = await res.text();
  // A sheet that isn't shared "anyone with the link can view" redirects to
  // an HTML login/consent page instead of CSV - detect that case clearly.
  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error("sheet_not_public");
  }
  return text;
}

// Minimal CSV parser: handles quoted fields with embedded commas/newlines,
// which is all a Google Sheets CSV export needs.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n") {
      pushRow();
    } else if (ch === "\r") {
      // ignore, \n handles the line break
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) pushRow();

  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((cell) => String(cell || "").trim()))
    .map((r) => {
      const obj = {};
      header.forEach((key, idx) => { obj[key] = r[idx] !== undefined ? String(r[idx]).trim() : ""; });
      return obj;
    });
}

function findColumn(headerKeys, patterns) {
  return headerKeys.find((key) => patterns.some((p) => p.test(key)));
}

function parseSheetDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  // Accept "2026-07-29", "29.07.2026", "07/29/2026", or a full datetime string.
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  const dmy = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return new Date(Date.UTC(+year, +dmy[2] - 1, +dmy[1]));
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseSheetTimestamp(value, fallbackDate) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const full = new Date(raw.replace(" ", "T"));
  if (!Number.isNaN(full.getTime()) && /\d{4}/.test(raw)) return full;
  const timeOnly = raw.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
  if (timeOnly && fallbackDate) {
    const d = new Date(fallbackDate);
    d.setUTCHours(+timeOnly[1], +timeOnly[2], +(timeOnly[4] || 0), 0);
    return d;
  }
  return null;
}

/**
 * Reads the connected Google Sheet (an event log written by the Telegram
 * bot - one row per "keldi"/"ketdi" button press) and upserts a per-day
 * check-in/check-out summary per Telegram ID into the attendance table.
 */
export async function syncAttendanceFromSheet(env, channel) {
  const config = channel?.config || {};
  const spreadsheetId = config.spreadsheetId;
  if (!spreadsheetId) throw new Error("missing_spreadsheet_id");

  const csv = await fetchSheetCsv(spreadsheetId, config.gid);
  const rows = parseCsv(csv);
  if (!rows.length) return { synced: 0 };

  const headerKeys = Object.keys(rows[0]);
  const telegramCol = findColumn(headerKeys, [/telegram.*id/, /tg.*id/, /^id$/, /chat.*id/]);
  const dateCol = findColumn(headerKeys, [/sana/, /date/, /kun/]);
  const timeCol = findColumn(headerKeys, [/vaqt/, /time/, /timestamp/]);
  const statusCol = findColumn(headerKeys, [/holat/, /status/, /amal/, /action/, /keldi|ketdi/]);
  const checkInCol = findColumn(headerKeys, [/kelgan/, /kirish/, /check.?in/, /arrival/]);
  const checkOutCol = findColumn(headerKeys, [/ketgan/, /chiqish/, /check.?out/, /leave/]);

  if (!telegramCol) throw new Error("telegram_id_column_not_found");

  // Aggregate per (telegram_id, day): earliest "keldi"/check-in wins,
  // latest "ketdi"/check-out wins.
  const byKey = new Map();

  const ensure = (telegramId, dateObj) => {
    if (!dateObj) return null;
    const dayKey = dateObj.toISOString().slice(0, 10);
    const key = `${telegramId}|${dayKey}`;
    if (!byKey.has(key)) {
      byKey.set(key, { telegramId, workDate: dayKey, checkIn: null, checkOut: null, raw: [] });
    }
    return byKey.get(key);
  };

  for (const row of rows) {
    const telegramId = String(row[telegramCol] || "").trim();
    if (!telegramId) continue;
    const dateVal = dateCol ? parseSheetDate(row[dateCol]) : parseSheetDate(row[timeCol]);
    const entry = ensure(telegramId, dateVal);
    if (!entry) continue;
    entry.raw.push(row);

    if (checkInCol || checkOutCol) {
      const inTs = checkInCol ? parseSheetTimestamp(row[checkInCol], dateVal) : null;
      const outTs = checkOutCol ? parseSheetTimestamp(row[checkOutCol], dateVal) : null;
      if (inTs && (!entry.checkIn || inTs < entry.checkIn)) entry.checkIn = inTs;
      if (outTs && (!entry.checkOut || outTs > entry.checkOut)) entry.checkOut = outTs;
    } else if (statusCol) {
      const status = String(row[statusCol] || "").toLowerCase();
      const ts = parseSheetTimestamp(row[timeCol], dateVal) || dateVal;
      if (!ts) continue;
      const isArrival = /keldi|kirdi|check.?in|arriv/.test(status);
      const isDeparture = /ketdi|chiqdi|check.?out|leav/.test(status);
      if (isArrival && (!entry.checkIn || ts < entry.checkIn)) entry.checkIn = ts;
      if (isDeparture && (!entry.checkOut || ts > entry.checkOut)) entry.checkOut = ts;
    }
  }

  if (!byKey.size) return { synced: 0 };

  const users = await restRequest(env, "users", { query: { select: "id,telegram_id" } });
  const userByTelegramId = new Map(
    (Array.isArray(users) ? users : [])
      .filter((u) => u.telegram_id)
      .map((u) => [String(u.telegram_id), u.id]),
  );

  const payload = Array.from(byKey.values()).map((entry) => ({
    user_id: userByTelegramId.get(entry.telegramId) || null,
    telegram_id: entry.telegramId,
    work_date: entry.workDate,
    check_in: entry.checkIn ? entry.checkIn.toISOString() : null,
    check_out: entry.checkOut ? entry.checkOut.toISOString() : null,
    raw: entry.raw.slice(-5),
    synced_at: new Date().toISOString(),
  }));

  await restRequest(env, "attendance", {
    method: "POST",
    body: payload,
    prefer: "resolution=merge-duplicates,return=minimal",
    query: { on_conflict: "telegram_id,work_date" },
  });

  return { synced: payload.length, matched: payload.filter((p) => p.user_id).length };
}

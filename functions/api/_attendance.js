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

// The Telegram bot writes its check-in log from a phone set to Tashkent
// (UTC+5) local time. This Worker's own runtime clock is UTC, so every
// timestamp read from the sheet has to be explicitly converted from
// "Tashkent wall-clock" to the correct UTC instant before it is stored -
// otherwise a 09:15 arrival is saved as 09:15 UTC (which is 14:15 Tashkent)
// and every lateness calculation downstream is silently wrong by 5 hours.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function tashkentToUtc(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second) - TASHKENT_OFFSET_MS);
}

// Returns the Tashkent-local calendar day ("YYYY-MM-DD") for a UTC instant,
// so grouping by "work day" matches what a person in Tashkent would call
// "today" even for the (rare) check-in logged right around midnight.
function tashkentDayKey(utcDate) {
  return new Date(utcDate.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

function parseSheetDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  // Accept "2026-07-29", "29.07.2026", "07/29/2026" (date-only, no time).
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return tashkentToUtc(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return tashkentToUtc(+year, +dmy[2] - 1, +dmy[1]);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Parses either a combined "date + time" cell (the common case: the bot logs
// one column with both, e.g. "2026-07-29 09:15:00" or "29.07.2026 09:15")
// or a bare "HH:MM[:SS]" value combined with a separately-parsed date.
function parseSheetTimestamp(value, fallbackDate) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const isoDt = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(:(\d{2}))?/);
  if (isoDt) return tashkentToUtc(+isoDt[1], +isoDt[2] - 1, +isoDt[3], +isoDt[4], +isoDt[5], +(isoDt[7] || 0));

  const dmyDt = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})[ T](\d{1,2}):(\d{2})(:(\d{2}))?/);
  if (dmyDt) {
    const year = dmyDt[3].length === 2 ? `20${dmyDt[3]}` : dmyDt[3];
    return tashkentToUtc(+year, +dmyDt[2] - 1, +dmyDt[1], +dmyDt[4], +dmyDt[5], +(dmyDt[7] || 0));
  }

  const timeOnly = raw.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
  if (timeOnly && fallbackDate) {
    const tashkentWallClock = new Date(fallbackDate.getTime() + TASHKENT_OFFSET_MS);
    return tashkentToUtc(
      tashkentWallClock.getUTCFullYear(),
      tashkentWallClock.getUTCMonth(),
      tashkentWallClock.getUTCDate(),
      +timeOnly[1], +timeOnly[2], +(timeOnly[4] || 0),
    );
  }
  return null;
}

/**
 * Reads the connected Google Sheet (an event log written by the Telegram
 * bot - one row per "keldi" button press: column A is the date+time
 * timestamp, column B is the Telegram ID) and upserts a per-day check-in
 * summary per Telegram ID into the attendance table.
 *
 * Also tolerates richer sheet layouts (separate date/time columns, or an
 * explicit "keldi/ketdi" status column, or explicit check-in/check-out
 * columns) so a differently-formatted log still syncs instead of failing.
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

  // The primary timestamp column: prefer whichever header matched a
  // date/time pattern, else fall back to the very first column - the bot
  // log always starts with a date+time stamp in column A even when its
  // header text doesn't match a known pattern (e.g. it's blank or custom).
  const primaryTsCol = dateCol || timeCol || headerKeys[0];

  // Aggregate per (telegram_id, day): earliest event of the day wins as the
  // check-in, latest explicit check-out (if any) wins as the check-out.
  const byKey = new Map();
  const ensure = (telegramId, dayKey) => {
    if (!dayKey) return null;
    const key = `${telegramId}|${dayKey}`;
    if (!byKey.has(key)) byKey.set(key, { telegramId, workDate: dayKey, checkIn: null, checkOut: null, raw: [] });
    return byKey.get(key);
  };

  for (const row of rows) {
    const telegramId = String(row[telegramCol] || "").trim();
    if (!telegramId) continue;

    const primaryRaw = row[primaryTsCol];
    let eventTs = parseSheetTimestamp(primaryRaw, null);
    let dayDate = eventTs || parseSheetDate(primaryRaw);
    if (!dayDate && timeCol && timeCol !== primaryTsCol) {
      const dateOnly = dateCol ? parseSheetDate(row[dateCol]) : null;
      eventTs = parseSheetTimestamp(row[timeCol], dateOnly);
      dayDate = eventTs || dateOnly;
    }
    if (!dayDate) continue;

    const dayKey = tashkentDayKey(dayDate);
    const entry = ensure(telegramId, dayKey);
    if (!entry) continue;
    entry.raw.push(row);

    if (checkInCol || checkOutCol) {
      const inTs = checkInCol ? parseSheetTimestamp(row[checkInCol], dayDate) : null;
      const outTs = checkOutCol ? parseSheetTimestamp(row[checkOutCol], dayDate) : null;
      if (inTs && (!entry.checkIn || inTs < entry.checkIn)) entry.checkIn = inTs;
      if (outTs && (!entry.checkOut || outTs > entry.checkOut)) entry.checkOut = outTs;
    } else if (statusCol) {
      const status = String(row[statusCol] || "").toLowerCase();
      const ts = eventTs || dayDate;
      const isArrival = /keldi|kirdi|check.?in|arriv/.test(status);
      const isDeparture = /ketdi|chiqdi|check.?out|leav/.test(status);
      if (isArrival && (!entry.checkIn || ts < entry.checkIn)) entry.checkIn = ts;
      if (isDeparture && (!entry.checkOut || ts > entry.checkOut)) entry.checkOut = ts;
    } else {
      // No explicit status/check-in/check-out column - every logged row IS
      // an arrival event (the bot only logs a "Keldi" button press).
      // Earliest event of the day wins.
      const ts = eventTs || dayDate;
      if (!entry.checkIn || ts < entry.checkIn) entry.checkIn = ts;
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

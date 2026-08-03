// Shared Excel import/export helpers built on ExcelJS (loaded via CDN in
// index.html as the global `ExcelJS`). The old xlsx.js-based
// buildStyledExportSheet/writeStyledWorkbook could not embed real images
// into a cell (the community-edition xlsx library only supports that in its
// paid tier) - ExcelJS is free and supports both writing and reading
// embedded images, which every export/import in this module now uses.

const EXCEL_HEADER_FILL = "FF7A7A7A";
const EXCEL_BORDER_COLOR = "FF333333";

// Cell values passed into exportRowsToExcel are normally plain strings, but
// a caller can also pass an ExcelJS hyperlink object ({ text, hyperlink })
// for a clickable link cell - this pulls the visible text out of either
// shape so column width and non-image cells display consistently.
function excelCellDisplayText(value) {
  if (value && typeof value === "object" && "text" in value) return String(value.text ?? "");
  return String(value ?? "");
}

function excelBorderStyle() {
  const side = { style: "thin", color: { argb: EXCEL_BORDER_COLOR } };
  return { top: side, bottom: side, left: side, right: side };
}

async function fetchImageForExcel(url) {
  if (!url) return null;
  try {
    const res = typeof apiFetch === "function" ? await apiFetch(url, { cache: "no-store" }) : await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = String(blob.type || "").toLowerCase();
    const extension = type.includes("png") ? "png" : type.includes("gif") ? "gif" : "jpeg";
    const buffer = await blob.arrayBuffer();
    return { buffer, extension };
  } catch {
    return null;
  }
}

function downloadExcelWorkbook(buffer, fileName) {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// headers: string[]. rows: array of arrays, same order as headers. When
// imageColumnIndex >= 0, that column's cell values are treated as image
// URLs to fetch and embed as a real picture instead of writing the URL as
// text.
async function exportRowsToExcel({ title, sheetName, fileName, headers, rows, imageColumnIndex = -1 }) {
  const safeHeaders = Array.isArray(headers) ? headers.map((h) => String(h ?? "")) : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const colCount = Math.max(1, safeHeaders.length);

  const wb = new ExcelJS.Workbook();
  wb.creator = "KUKA HOME CRM";
  wb.created = new Date();
  const ws = wb.addWorksheet(String(sheetName || "Sheet1").slice(0, 31), {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = String(title || "");
  titleCell.font = { name: "Times New Roman", size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.border = excelBorderStyle();
  ws.getRow(1).height = 28;

  const headerRow = ws.getRow(2);
  safeHeaders.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Times New Roman", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_HEADER_FILL } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = excelBorderStyle();
  });
  headerRow.height = 26;
  if (colCount > 0) ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: colCount } };

  const hasImages = imageColumnIndex >= 0 && imageColumnIndex < colCount;
  const imageJobs = [];
  safeRows.forEach((rowValues, r) => {
    const rowNumber = r + 3;
    const row = ws.getRow(rowNumber);
    for (let c = 0; c < colCount; c += 1) {
      const cell = row.getCell(c + 1);
      cell.border = excelBorderStyle();
      cell.font = { name: "Times New Roman", size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      if (c === imageColumnIndex) {
        const url = rowValues[c];
        if (url) imageJobs.push({ rowNumber, url });
        continue;
      }
      const value = rowValues[c];
      cell.value = value === undefined || value === null ? "" : value;
      if (value && typeof value === "object" && "hyperlink" in value) {
        cell.font = { name: "Times New Roman", size: 12, color: { argb: "FF1155CC" }, underline: true };
      }
    }
    row.height = hasImages ? 56 : 22;
  });

  safeHeaders.forEach((h, idx) => {
    let width = idx === 0 ? 6 : Math.max(String(h).length + 3, 12);
    if (idx === imageColumnIndex) {
      width = 14;
    } else {
      safeRows.forEach((r) => {
        const len = excelCellDisplayText(r[idx]).length;
        width = Math.max(width, Math.min(36, len + 2));
      });
    }
    ws.getColumn(idx + 1).width = width;
  });

  if (imageJobs.length) {
    const fetched = await Promise.all(imageJobs.map((job) => fetchImageForExcel(job.url)));
    fetched.forEach((img, idx) => {
      if (!img) return;
      const { rowNumber } = imageJobs[idx];
      const imageId = wb.addImage({ buffer: img.buffer, extension: img.extension });
      ws.addImage(imageId, {
        tl: { col: imageColumnIndex, row: rowNumber - 1 },
        ext: { width: 60, height: 60 },
        editAs: "oneCell",
      });
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  downloadExcelWorkbook(buffer, fileName);
}

function excelCountNonEmptyCells(row) {
  let n = 0;
  row.eachCell({ includeEmpty: false }, () => { n += 1; });
  return n;
}

function excelCellPlainValue(cell) {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text || "").join("");
    if (v.text !== undefined) return String(v.text);
    if (v.result !== undefined) return v.result;
    if (v instanceof Date) return v;
  }
  return v;
}

// Reads an uploaded .xlsx built by exportRowsToExcel (or a plain sheet with
// just a header row). Returns an array of row objects keyed by header text,
// each optionally carrying `__image: { buffer, extension }` when that row
// had an embedded picture anywhere in its columns.
async function importExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // Row 1 is our merged title row, row 2 is headers - but tolerate a plain
  // sheet without the title row by falling back to row 1 as headers when
  // row 2 looks empty.
  const headerRowNumber = excelCountNonEmptyCells(ws.getRow(2)) > 0 ? 2 : 1;
  const headerRow = ws.getRow(headerRowNumber);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? "").trim();
  });

  const imagesByCell = new Map();
  if (typeof ws.getImages === "function") {
    ws.getImages().forEach((img) => {
      const rowNumber = (img.range?.tl?.nativeRow ?? -1) + 1;
      const colNumber = (img.range?.tl?.nativeCol ?? -1) + 1;
      if (rowNumber < 1 || colNumber < 1) return;
      try {
        const desc = wb.getImage(img.imageId);
        if (desc?.buffer) imagesByCell.set(`${rowNumber}:${colNumber}`, desc);
      } catch {
        // malformed embedded image reference - skip it
      }
    });
  }

  const rows = [];
  for (let r = headerRowNumber + 1; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    if (row.actualCellCount === 0 && !Array.from(imagesByCell.keys()).some((k) => k.startsWith(`${r}:`))) continue;
    const record = {};
    let hasValue = false;
    headers.forEach((h, idx) => {
      if (!h) return;
      const cell = row.getCell(idx + 1);
      const value = excelCellPlainValue(cell);
      record[h] = value;
      if (value !== "" && value !== null && value !== undefined) hasValue = true;
      const imgKey = `${r}:${idx + 1}`;
      if (imagesByCell.has(imgKey)) record.__image = imagesByCell.get(imgKey);
    });
    if (!hasValue && !record.__image) continue;
    rows.push(record);
  }
  return rows;
}

// Converts an ExcelJS image descriptor ({buffer, extension}) into a
// data: URL so it can be handed to the app's existing image-upload helper
// (readImageAsDataUrl's output shape) without touching that code path.
function excelImageToDataUrl(image) {
  if (!image?.buffer) return "";
  const bytes = image.buffer instanceof Uint8Array ? image.buffer : new Uint8Array(image.buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  const mime = image.extension === "png" ? "image/png" : image.extension === "gif" ? "image/gif" : "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

// Looks a value up across several possible header spellings/languages,
// mirroring the flexible matching every import handler in this app already
// does inline - centralized here so new imports don't have to reinvent it.
function excelPick(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== "") {
      return record[key];
    }
  }
  return "";
}

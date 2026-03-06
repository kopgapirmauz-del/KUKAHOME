const SHEET_NAMES = {
  products: "products",
  leads: "murojaatlar",
  orders: "sotuv markazi",
  vouchers: "vouchers",
  users: "users",
  stock: "stock",
  shipments: "shipments"
};

const SPREADSHEET_ID = "1ovlBBjoZpGRHkl5KLMpKqIOMR0PDOtX-tu6cVZ79HGs";

function doGet(e) {
  const action = (e.parameter.action || "health").toLowerCase();
  const payload = routeGet_(action, e.parameter || {});
  return json_(payload);
}

function doPost(e) {
  const body = parseBody_(e.postData && e.postData.contents);
  const action = String(body.action || "").toLowerCase();
  const payload = routePost_(action, body);
  return json_(payload);
}

function routeGet_(action, params) {
  switch (action) {
    case "catalog":
      return { ok: true, items: getRows_(SHEET_NAMES.products) };
    case "orders":
      return { ok: true, items: getRows_(SHEET_NAMES.orders) };
    case "leads":
      return { ok: true, items: getRows_(SHEET_NAMES.leads) };
    case "stock":
      return { ok: true, items: getRows_(SHEET_NAMES.stock) };
    case "dashboard":
      return { ok: true, stats: buildDashboard_() };
    case "export_orders":
      return exportRows_(SHEET_NAMES.orders, params.from, params.to, "orders");
    case "export_leads":
      return exportRows_(SHEET_NAMES.leads, params.from, params.to, "leads");
    case "health":
    default:
      return { ok: true, message: "KUKA HOME WebApp is running" };
  }
}

function routePost_(action, body) {
  switch (action) {
    case "chat":
      appendRow_(SHEET_NAMES.leads, {
        ts: isoNow_(),
        phone: body.phone,
        message: body.message,
        page: body.page || "unknown",
        lang: body.lang || "uz",
        status: "New",
        result: ""
      });
      return { ok: true, message: "Lead saved" };
    case "order":
      const orderId = "KH-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMdd-HHmmss");
      appendRow_(SHEET_NAMES.orders, {
        ts: isoNow_(),
        order_id: orderId,
        city: body.city,
        phone: body.phone,
        name: body.name,
        delivery_address: body.delivery_address,
        payment: body.payment,
        total: body.total,
        items_json: JSON.stringify(body.items || []),
        page: body.page || "cart",
        status: "New",
        comment: body.comment || "",
        assigned_to: body.assigned_to || ""
      });
      return { ok: true, order_id: orderId };
    case "register":
      const code = createVoucher_(body.phone);
      appendRow_(SHEET_NAMES.users, {
        ts: isoNow_(),
        name: body.name,
        phone: body.phone,
        voucher_code: code,
        role: "client"
      });
      return {
        ok: true,
        profile: {
          name: body.name,
          phone: body.phone,
          voucherCode: code,
          voucherAmount: 750000
        }
      };
    case "apply_voucher":
      return checkVoucher_(body.code, body.phone);
    default:
      return { ok: false, message: "Unsupported action" };
  }
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function parseBody_(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text, error: error.message };
  }
}

function getSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("Missing sheet: " + name);
  return sheet;
}

function getRows_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values.filter((row) => row.join("") !== "").map((row) => {
    return headers.reduce((acc, header, index) => {
      acc[String(header)] = row[index];
      return acc;
    }, {});
  });
}

function appendRow_(name, record) {
  const sheet = getSheet_(name);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map((header) => record[String(header)] || "");
  sheet.appendRow(row);
}

function createVoucher_(phone) {
  const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-4) || "0000";
  const code = "KUKA" + cleanPhone + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMddHH");
  appendRow_(SHEET_NAMES.vouchers, {
    code: code,
    phone: phone,
    amount: 750000,
    status: "active",
    created_at: isoNow_(),
    used_at: "",
    order_id: "",
    expire_date: expireDate_(45)
  });
  return code;
}

function checkVoucher_(code, phone) {
  const vouchers = getRows_(SHEET_NAMES.vouchers);
  const voucher = vouchers.find((item) => String(item.code) === String(code) && String(item.phone) === String(phone) && String(item.status).toLowerCase() === "active");
  if (!voucher) return { ok: false, message: "Voucher topilmadi" };
  return { ok: true, code: voucher.code, discount: Number(voucher.amount) || 0, expire_date: voucher.expire_date };
}

function exportRows_(sheetName, from, to, prefix) {
  const rows = getRows_(sheetName).filter((item) => {
    const ts = new Date(item.ts || item.created_at || new Date());
    const fromOk = from ? ts >= new Date(from) : true;
    const toOk = to ? ts <= new Date(to + "T23:59:59") : true;
    return fromOk && toOk;
  });
  return {
    ok: true,
    filename: "kuka-" + prefix + "-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm") + ".xls",
    rows: rows
  };
}

function buildDashboard_() {
  return [
    { label: "Yillik loyihalar", value: getRows_(SHEET_NAMES.orders).length || 44 },
    { label: "Murojaatlar", value: getRows_(SHEET_NAMES.leads).length || 3000 },
    { label: "Showroom", value: 3 },
    { label: "Aktiv voucher", value: getRows_(SHEET_NAMES.vouchers).filter((item) => String(item.status).toLowerCase() === "active").length }
  ];
}

function isoNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function expireDate_(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

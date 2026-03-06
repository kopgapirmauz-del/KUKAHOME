import { CONFIG } from "./config.js";
import { dashboardStats, demoLeads, demoOrders, demoProducts, demoStock } from "./data.js";

const buildBody = (payload) => JSON.stringify(payload);

const request = async (method, params = {}, body) => {
  const url = new URL(CONFIG.appsScriptUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body ? buildBody(body) : undefined,
      mode: "cors"
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: response.ok, raw: text };
    }
  } catch {
    return null;
  }
};

export const api = {
  async getProducts() {
    const data = await request("GET", { action: "catalog" });
    if (data?.items?.length) return data.items;
    return demoProducts;
  },
  async submitChat(payload) {
    return request("POST", {}, { action: "chat", ...payload });
  },
  async submitOrder(payload) {
    return request("POST", {}, { action: "order", ...payload });
  },
  async registerUser(payload) {
    const response = await request("POST", {}, { action: "register", ...payload });
    if (response?.ok && response.profile) return response;
    return {
      ok: true,
      profile: {
        name: payload.name,
        phone: payload.phone,
        voucherCode: `KUKA-${String(Date.now()).slice(-6)}`,
        voucherAmount: CONFIG.voucherAmount
      }
    };
  },
  async applyVoucher(code, phone) {
    const response = await request("POST", {}, { action: "apply_voucher", code, phone });
    if (response?.ok) return response;
    return { ok: true, discount: CONFIG.voucherAmount, code };
  },
  async getOrders() {
    const data = await request("GET", { action: "orders" });
    return data?.items?.length ? data.items : demoOrders;
  },
  async getLeads() {
    const data = await request("GET", { action: "leads" });
    return data?.items?.length ? data.items : demoLeads;
  },
  async getStock() {
    const data = await request("GET", { action: "stock" });
    return data?.items?.length ? data.items : demoStock;
  },
  async getDashboard() {
    const data = await request("GET", { action: "dashboard" });
    return data?.stats?.length ? data.stats : dashboardStats;
  },
  async exportRows(type, from, to) {
    const data = await request("GET", { action: `export_${type}`, from, to });
    if (data?.rows?.length) return data;
    const rows = type === "orders" ? demoOrders : demoLeads;
    return {
      ok: true,
      filename: `kuka-${type}-${from || "all"}-${to || "all"}.xls`,
      rows
    };
  }
};

import { api } from "./sheets.js";
import { store } from "./store.js";
import { downloadExcelLikeFile, renderShell, shared, showToast } from "./ui.js";

const page = `admin-${document.body.dataset.page}`;
const getApp = () => document.getElementById("app");

const renderAdminShell = (title, content) => {
  renderShell({ page, title });
  getApp().innerHTML = `
    <section class="admin-shell">
      <div class="admin-grid">
        <aside class="glass-card sidebar">
          <a href="dashboard.html" class="${document.body.dataset.page === "dashboard" ? "active" : ""}">Dashboard</a>
          <a href="orders.html" class="${document.body.dataset.page === "orders" ? "active" : ""}">Orders</a>
          <a href="leads.html" class="${document.body.dataset.page === "leads" ? "active" : ""}">Leads</a>
          <a href="export.html" class="${document.body.dataset.page === "export" ? "active" : ""}">Export</a>
          <a href="stock.html" class="${document.body.dataset.page === "stock" ? "active" : ""}">Sklad</a>
          <a href="index.html">Chiqish</a>
        </aside>
        <div>${content}</div>
      </div>
    </section>`;
};

const table = (headers, rows) => `
  <div class="table-card glass-card"><div class="table-wrap"><table><thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div></div>`;

const initLogin = () => {
  renderShell({ page, title: "Admin login" });
  getApp().innerHTML = `
    <section class="page-section"><div class="glass-card panel" style="max-width:520px;margin:0 auto"><p class="eyebrow">Admin access</p><h2>Dashboardga kirish</h2><form class="auth-form" id="adminLogin"><input name="email" type="email" placeholder="admin@kukahome.uz" required /><input name="password" type="password" placeholder="••••••••" required /><button class="button button-primary" type="submit">Kirish</button></form></div></section>`;
  document.getElementById("adminLogin")?.addEventListener("submit", (event) => {
    event.preventDefault();
    store.setRole("admin");
    window.location.href = "dashboard.html";
  });
};

const initDashboard = async () => {
  const stats = await api.getDashboard();
  const orders = await api.getOrders();
  const leads = await api.getLeads();
  renderAdminShell(
    "Dashboard",
    `<div class="kpi-grid">${stats.map((item) => `<article class="stat-card"><strong>${item.value}</strong><span>${item.label}</span></article>`).join("")}</div>
     <div class="dashboard-grid" style="margin-top:20px"><article class="panel glass-card"><p class="eyebrow">Live feed</p><h3>Oxirgi buyurtmalar</h3><p>${orders.slice(0, 3).map((item) => `${item.order_id} - ${item.status}`).join("<br />")}</p></article><article class="panel glass-card"><p class="eyebrow">CRM</p><h3>Oxirgi murojaatlar</h3><p>${leads.slice(0, 3).map((item) => `${item.phone} - ${item.status}`).join("<br />")}</p></article></div>`
  );
};

const initOrders = async () => {
  const orders = await api.getOrders();
  renderAdminShell(
    "Orders",
    table(
      ["Order ID", "Mijoz", "Shahar", "Jami", "Holat", "Assigned"],
      orders.map((item) => `<tr><td>${item.order_id}</td><td>${item.name}<br />${item.phone}</td><td>${item.city}</td><td>${shared.formatMoney(Number(item.total) || 0)}</td><td><span class="badge ${item.status === "New" ? "red" : "green"}">${item.status}</span></td><td>${item.assigned_to || "-"}</td></tr>`)
    )
  );
};

const initLeads = async () => {
  const leads = await api.getLeads();
  renderAdminShell(
    "Leads",
    table(
      ["Sana", "Telefon", "Xabar", "Sahifa", "Holat"],
      leads.map((item) => `<tr><td>${item.ts}</td><td>${item.phone}</td><td>${item.message}</td><td>${item.page}</td><td>${item.status}</td></tr>`)
    )
  );
};

const initExport = () => {
  renderAdminShell(
    "Export",
    `<div class="panel glass-card"><p class="eyebrow">Excel export</p><h3>Statistika va operatsion fayllar</h3><form id="exportForm" class="order-form" style="max-width:440px"><select name="type"><option value="orders">Orders</option><option value="leads">Leads</option></select><input name="from" type="date" /><input name="to" type="date" /><button class="button button-primary" type="submit">Excel yuklab olish</button></form></div>`
  );
  document.getElementById("exportForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = await api.exportRows(values.type, values.from, values.to);
    downloadExcelLikeFile(payload.filename || `kuka-${values.type}.xls`, payload.rows || []);
    showToast("Excel fayl tayyorlandi");
  });
};

const initStock = async () => {
  const rows = await api.getStock();
  renderAdminShell(
    "Sklad",
    `<div class="panel glass-card"><p class="eyebrow">Inventory + shipments</p><h3>Sklad va Xitoydan kelayotgan buyurtmalar</h3><p>Ushbu MVP stock, showroom mavjudligi va shipment lokatsiyasini yagona sheet orqali boshqarishga tayyor.</p></div>
     <div style="height:20px"></div>
     ${table(["Model", "Showroom", "Soni", "Status", "ETA", "Location"], rows.map((item) => `<tr><td>${item.model}</td><td>${item.showroom}</td><td>${item.quantity}</td><td><span class="badge ${item.in_stock ? "green" : "red"}">${item.china_order_status}</span></td><td>${item.eta}</td><td>${item.location}</td></tr>`))}`
  );
};

const routes = {
  index: initLogin,
  dashboard: initDashboard,
  orders: initOrders,
  leads: initLeads,
  export: initExport,
  stock: initStock
};

routes[document.body.dataset.page]?.();

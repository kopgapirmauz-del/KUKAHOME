import { api } from "./sheets.js";
import { store } from "./store.js";
import { renderShell, shared } from "./ui.js";

const page = `seller-${document.body.dataset.page}`;
const getApp = () => document.getElementById("app");

const initLogin = () => {
  renderShell({ page, title: "Seller login" });
  getApp().innerHTML = `
    <section class="page-section"><div class="glass-card panel" style="max-width:520px;margin:0 auto"><p class="eyebrow">Seller access</p><h2>Menedjer kabineti</h2><form class="auth-form" id="sellerLogin"><input name="email" type="email" placeholder="seller@kukahome.uz" required /><input name="password" type="password" placeholder="••••••••" required /><button class="button button-primary" type="submit">Kirish</button></form></div></section>`;
  document.getElementById("sellerLogin")?.addEventListener("submit", (event) => {
    event.preventDefault();
    store.setRole("seller");
    window.location.href = "orders.html";
  });
};

const initOrders = async () => {
  renderShell({ page, title: "Seller orders" });
  const rows = (await api.getOrders()).filter((item) => item.assigned_to === "seller-1" || item.assigned_to === "seller-2");
  getApp().innerHTML = `
    <section class="seller-shell">
      <div class="panel glass-card"><p class="eyebrow">Assigned orders</p><h2>Menedjer buyurtmalari</h2><p>Faqat biriktirilgan orderlar ko'rsatiladi.</p></div>
      <div style="height:20px"></div>
      <div class="table-card glass-card"><div class="table-wrap"><table><thead><tr><th>Order</th><th>Mijoz</th><th>To'lov</th><th>Jami</th><th>Status</th></tr></thead><tbody>${rows.map((item) => `<tr><td>${item.order_id}</td><td>${item.name}<br />${item.phone}</td><td>${item.payment}</td><td>${shared.formatMoney(Number(item.total) || 0)}</td><td>${item.status}</td></tr>`).join("")}</tbody></table></div></div>
    </section>`;
};

({ index: initLogin, orders: initOrders }[document.body.dataset.page] || initLogin)();

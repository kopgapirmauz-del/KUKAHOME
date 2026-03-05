// /public/js/main.js
// App start: global UI + komponentlar + sahifa scriptini auto-yoqish

import { initUI, initReveal, bindCartBadge } from "./core/ui.js";
import { initI18n } from "./core/i18n.js";
import { initHeader } from "./components/header.js";
import { initFooter } from "./components/footer.js";
import { initChatWidget } from "./components/chatWidget.js";
import { initVoucherPopup } from "./components/voucherPopup.js";

// Page scripts (public)
import { initIndexPage } from "./pages/index.page.js";
import { initCategoryPage } from "./pages/category.page.js";
import { initProductPage } from "./pages/product.page.js";
import { initCartPage } from "./pages/cart.page.js";
import { initAboutPage } from "./pages/about.page.js";
import { initShowroomsPage } from "./pages/showrooms.page.js";
import { initContactPage } from "./pages/contact.page.js";
import { initOrderSuccessPage } from "./pages/order-success.page.js";

// Admin
import { initAdminLoginPage } from "./pages/admin/login.page.js";
import { initAdminDashboardPage } from "./pages/admin/dashboard.page.js";
import { initAdminOrdersPage } from "./pages/admin/orders.page.js";
import { initAdminLeadsPage } from "./pages/admin/leads.page.js";
import { initAdminExportPage } from "./pages/admin/export.page.js";
import { initAdminStockPage } from "./pages/admin/stock.page.js";
import { initAdminShipmentsPage } from "./pages/admin/shipments.page.js";

// Seller
import { initSellerLoginPage } from "./pages/seller/login.page.js";
import { initSellerOrdersPage } from "./pages/seller/orders.page.js";

/**
 * Sahifa nomini aniqlash (qaysi page scriptni chaqirish uchun)
 */
function getPageName() {
  const p = window.location.pathname;

  // admin pages
  if (p.endsWith("/admin/index.html") || p.endsWith("/admin/")) return "admin-login";
  if (p.endsWith("/admin/dashboard.html")) return "admin-dashboard";
  if (p.endsWith("/admin/orders.html")) return "admin-orders";
  if (p.endsWith("/admin/leads.html")) return "admin-leads";
  if (p.endsWith("/admin/export.html")) return "admin-export";
  if (p.endsWith("/admin/stock.html")) return "admin-stock";
  if (p.endsWith("/admin/shipments.html")) return "admin-shipments";

  // seller pages
  if (p.endsWith("/seller/index.html") || p.endsWith("/seller/")) return "seller-login";
  if (p.endsWith("/seller/orders.html")) return "seller-orders";

  // public pages
  if (p.endsWith("/") || p.endsWith("/index.html")) return "index";
  if (p.endsWith("/category.html")) return "category";
  if (p.endsWith("/product.html")) return "product";
  if (p.endsWith("/cart.html")) return "cart";
  if (p.endsWith("/about.html")) return "about";
  if (p.endsWith("/showrooms.html")) return "showrooms";
  if (p.endsWith("/contact.html")) return "contact";
  if (p.endsWith("/order-success.html")) return "order-success";

  return "unknown";
}

/**
 * Global init (hamma sahifada ishlaydi)
 */
async function initGlobal() {
  // UI root + smooth scroll, modal/toast containerlar
  initUI();

  // Header/Footer (hamma sahifada bir xil)
  initHeader();
  initFooter();

  // Til tizimi
  await initI18n();

  // Cart badge (header savat soni)
  bindCartBadge("[data-cart-count]");

  // Section reveal animatsiya (data-reveal bo'lgan joylarda)
  initReveal({ selector: "[data-reveal]" });

  // Chat + Voucher (public sahifalarda)
  // Admin/sellerda ham ishlasa ham zarar qilmaydi, lekin xohlasak keyin cheklaymiz
  initChatWidget();
  initVoucherPopup();
}

/**
 * Page init
 */
function initPage(page) {
  switch (page) {
    case "index":
      return initIndexPage();
    case "category":
      return initCategoryPage();
    case "product":
      return initProductPage();
    case "cart":
      return initCartPage();
    case "about":
      return initAboutPage();
    case "showrooms":
      return initShowroomsPage();
    case "contact":
      return initContactPage();
    case "order-success":
      return initOrderSuccessPage();

    // Admin
    case "admin-login":
      return initAdminLoginPage();
    case "admin-dashboard":
      return initAdminDashboardPage();
    case "admin-orders":
      return initAdminOrdersPage();
    case "admin-leads":
      return initAdminLeadsPage();
    case "admin-export":
      return initAdminExportPage();
    case "admin-stock":
      return initAdminStockPage();
    case "admin-shipments":
      return initAdminShipmentsPage();

    // Seller
    case "seller-login":
      return initSellerLoginPage();
    case "seller-orders":
      return initSellerOrdersPage();

    default:
      // noma'lum sahifa — hech nima qilmaymiz
      return;
  }
}

(async function boot() {
  await initGlobal();
  const page = getPageName();
  initPage(page);
})();
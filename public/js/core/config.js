// /public/js/core/config.js
// KUKA HOME — Global konfiguratsiya (Frontend)

export const CONFIG = {
  // ===== API (Apps Script WebApp) =====
  api: {
    // Siz bergan WebApp URL:
    baseUrl:
      "https://script.google.com/macros/s/AKfycbzG_pKrseNbad3oAxSTIySyj1cuuxPTs1NbRH9RvoZXkt81Ayvpt-i-q8iJVehj7aKcLA/exec",

    // network timeout (ms)
    timeoutMs: 15000,

    // retry count (agar tarmoq o‘chib-qo‘ysa)
    retries: 1,
  },

  // ===== Sayt brand sozlamalari =====
  site: {
    name: "KUKA HOME",
    currency: "UZS",
    accent: "#E30613",
  },

  // ===== Voucher (Loyalty) =====
  voucher: {
    amount: 750000,

    // Ro‘yxatdan o‘tmagan userga voucher popup qaytish vaqti (5 minut)
    popupEveryMinutes: 5,

    // Ro‘yxatdan o‘tgandan keyin umuman chiqmasin:
    hideAfterRegister: true,
  },

  // ===== Chat widget =====
  chat: {
    // Chat bubble’ni X bosib yopsa, qayta chiqish (5 minut)
    reappearMinutes: 5,
  },

  // ===== Til (i18n) =====
  i18n: {
    defaultLang: "uz",
    available: ["uz", "ru", "en"],
  },

  // ===== Auth (Admin / Seller) =====
  // MVP: frontend password check (oddiy). Keyin server auth qo‘shamiz.
  auth: {
    // 7 kun session saqlash (localStorage)
    sessionTtlDays: 7,

    admin: {
      // Admin login paroli (o‘zingizga mos qilib o‘zgartiring)
      password: "admin123",
    },

    seller: {
      // Seller/manager login paroli (o‘zgartiring)
      password: "seller123",

      // Seller ro‘yxati (assigned_to bilan mos ishlatish uchun)
      // Misol: orders sheetda assigned_to = "seller_1"
      users: [
        { id: "seller_1", name: "Manager 1" },
        { id: "seller_2", name: "Manager 2" },
      ],
    },
  },

  // ===== LocalStorage keys (hammasi bir joyda) =====
  storage: {
    lang: "kh_lang",
    cart: "kh_cart_v1",
    registered: "kh_registered_v1",
    voucherCode: "kh_voucher_code_v1",
    voucherNextAt: "kh_voucher_next_at_v1",
    chatNextAt: "kh_chat_next_at_v1",

    adminSession: "kh_admin_session_v1",
    sellerSession: "kh_seller_session_v1",
    deviceId: "kh_device_id_v1",

    analyticsQueue: "kh_analytics_q_v1",
  },

  // ===== Pages =====
  pages: {
    productUrl: "/product.html?id=",
    categoryUrl: "/category.html?c=",

    admin: {
      login: "/admin/index.html",
      dashboard: "/admin/dashboard.html",
    },

    seller: {
      login: "/seller/index.html",
      orders: "/seller/orders.html",
    },
  },

  // ===== Performance toggles =====
  perf: {
    lazyImages: true,
    debounceMs: 200,
  },
};
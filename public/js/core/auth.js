// /public/js/core/auth.js
// Admin/Seller auth (MVP): localStorage session token.
// Oddiy, barqaror, keyin real authga almashtirish oson bo'lsin.

const KEYS = {
  admin: "kh_admin_session_v1",
  seller: "kh_seller_session_v1",
  client: "kh_client_session_v1", // kelajakda profil bo'lsa
};

const DEFAULTS = {
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 kun
};

function now() {
  return Date.now();
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function read(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return safeParse(raw);
}

function write(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

function clear(key) {
  localStorage.removeItem(key);
}

function isExpired(session) {
  if (!session) return true;
  const exp = Number(session.expiresAt || 0);
  if (!exp) return false; // expiresAt bo'lmasa: muddatsiz deb hisoblaymiz (MVP)
  return now() > exp;
}

function makeSession(payload = {}, ttlMs = DEFAULTS.ttlMs) {
  const createdAt = now();
  const expiresAt = createdAt + Number(ttlMs || DEFAULTS.ttlMs);

  return {
    token: payload.token || randomToken_(),
    role: payload.role || "",
    userId: payload.userId || "",
    createdAt,
    expiresAt,
    meta: payload.meta || {},
  };
}

function randomToken_() {
  // oddiy token (MVP). Keyin server token bo'ladi.
  return (
    "tok_" +
    Math.random().toString(36).slice(2) +
    "_" +
    Math.random().toString(36).slice(2)
  );
}

/** ===== AdminAuth ===== */
export const AdminAuth = {
  key: KEYS.admin,

  login(ttlMs) {
    const session = makeSession({ role: "admin", userId: "admin" }, ttlMs);
    write(KEYS.admin, session);
    return session;
  },

  logout() {
    clear(KEYS.admin);
  },

  getSession() {
    const s = read(KEYS.admin);
    if (!s) return null;
    if (isExpired(s)) {
      clear(KEYS.admin);
      return null;
    }
    return s;
  },

  isLoggedIn() {
    return !!this.getSession();
  },
};

/** ===== SellerAuth =====
 * sellerId: manager_1/manager_2/... (assigned_to bilan mos)
 */
export const SellerAuth = {
  key: KEYS.seller,

  login(sellerId, ttlMs) {
    const session = makeSession({ role: "seller", userId: String(sellerId || "") }, ttlMs);
    write(KEYS.seller, session);
    return session;
  },

  logout() {
    clear(KEYS.seller);
  },

  getSession() {
    const s = read(KEYS.seller);
    if (!s) return null;
    if (isExpired(s)) {
      clear(KEYS.seller);
      return null;
    }
    return s;
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  getSellerId() {
    const s = this.getSession();
    return s?.userId ? String(s.userId) : "";
  },
};

/** ===== ClientAuth (kelajakda profil bo'lsa) ===== */
export const ClientAuth = {
  key: KEYS.client,

  login(phone, ttlMs) {
    const session = makeSession({ role: "client", userId: String(phone || "") }, ttlMs);
    write(KEYS.client, session);
    return session;
  },

  logout() {
    clear(KEYS.client);
  },

  getSession() {
    const s = read(KEYS.client);
    if (!s) return null;
    if (isExpired(s)) {
      clear(KEYS.client);
      return null;
    }
    return s;
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  getClientId() {
    const s = this.getSession();
    return s?.userId ? String(s.userId) : "";
  },
};

/** ===== Route Guards (ixtiyoriy helper) ===== */
export function requireAdminOrRedirect(loginUrl = "/admin/index.html") {
  if (!AdminAuth.isLoggedIn()) {
    window.location.href = loginUrl;
    return false;
  }
  return true;
}

export function requireSellerOrRedirect(loginUrl = "/seller/index.html") {
  if (!SellerAuth.isLoggedIn()) {
    window.location.href = loginUrl;
    return false;
  }
  return true;
}
let inboxEventsBound = false;
let channelEventsBound = false;
let inboxActiveConversationId = "";
let inboxActiveConversation = null;
let inboxConversationCache = [];
let inboxPollTimer = null;

function initIntegrationsInboxUI() {
  bindInboxEvents();
  loadInboxConversations();
  clearInterval(inboxPollTimer);
  inboxPollTimer = setInterval(loadInboxConversations, 15000);
}

// ---------------------------------------------------------------------------
// Settings > "Ulanishlar" tab (channel connections) - shown from Settings now,
// not from the Integrations page (which is inbox-only).
// ---------------------------------------------------------------------------
function initSettingsChannelsUI() {
  document.querySelectorAll("[data-admin-only='true']").forEach((el) => {
    el.classList.toggle("hidden", state.user?.role !== "admin");
  });
  bindChannelsEvents();
  loadChannelsList();
  handleMetaOAuthReturn();
}

// ---------------------------------------------------------------------------
// Inbox: conversation list
// ---------------------------------------------------------------------------
async function loadInboxConversations() {
  if (!state.user) return;
  const listEl = document.getElementById("inboxConversationList");
  if (!listEl) return;
  const status = document.getElementById("inboxFilterStatus")?.value || "";
  const platform = document.getElementById("inboxFilterPlatform")?.value || "";
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (platform) params.set("platform", platform);

  try {
    const res = await apiFetch(`/api/conversations?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (!data?.success) return;
    inboxConversationCache = Array.isArray(data.items) ? data.items : [];
    renderInboxConversationList(inboxConversationCache);
  } catch {
    // keep previous list on transient network errors
  }
}

function inboxPlatformBadge(platform) {
  const map = { telegram: "TG", facebook: "FB", instagram: "IG", meta_ads: "ADS", google_sheets: "GS" };
  return map[platform] || String(platform || "").slice(0, 2).toUpperCase();
}

function renderInboxConversationList(items) {
  const listEl = document.getElementById("inboxConversationList");
  if (!listEl) return;
  const query = String(document.getElementById("inboxSearchInput")?.value || "").trim().toLowerCase();
  const visibleItems = query
    ? items.filter((item) => [
      item.contact_name,
      item.contact_handle,
      item.last_message_preview,
      item.channel_name,
      item.assigned_manager_name,
    ].some((value) => String(value || "").toLowerCase().includes(query)))
    : items;
  if (!visibleItems.length) {
    listEl.innerHTML = `<p class="muted" style="padding:16px">${query ? "Qidiruv bo'yicha suhbat topilmadi" : "Hozircha suhbatlar yo'q"}</p>`;
    if (!query) resetMobileInboxThread();
    return;
  }
  if (inboxActiveConversationId && !visibleItems.some((item) => item.id === inboxActiveConversationId)) {
    resetMobileInboxThread();
  }
  listEl.innerHTML = visibleItems
    .map((c) => {
      const active = c.id === inboxActiveConversationId ? "active" : "";
      const unread = c.unread_count > 0 ? `<span class="inbox-unread-dot">${escapeHtml(String(c.unread_count))}</span>` : "";
      const when = typeof fmtDateTime === "function" ? fmtDateTime(c.last_message_at) : String(c.last_message_at || "").slice(0, 16);
      const waitingMinutes = c.last_inbound_at && c.status !== "answered" && c.status !== "closed"
        ? Math.max(0, Math.floor((Date.now() - new Date(c.last_inbound_at).getTime()) / 60000))
        : 0;
      const sla = waitingMinutes >= 15
        ? `<span class="inbox-sla inbox-sla-late">${escapeHtml(String(waitingMinutes))} daq</span>`
        : waitingMinutes > 0
          ? `<span class="inbox-sla">${escapeHtml(String(waitingMinutes))} daq</span>`
          : "";
      const manager = c.assigned_manager_name
        ? `<span class="inbox-conv-owner">${escapeHtml(c.assigned_manager_name)}</span>`
        : `<span class="inbox-conv-owner inbox-conv-unassigned">Tayinlanmagan</span>`;
      return `
        <button type="button" class="inbox-conversation-item ${active}" data-conversation-id="${escapeHtml(c.id)}">
          <span class="inbox-conv-badge inbox-badge-${escapeHtml(c.platform)}">${escapeHtml(inboxPlatformBadge(c.platform))}</span>
          <span class="inbox-conv-main">
            <strong>${escapeHtml(c.contact_name || c.contact_handle || "Noma'lum")}</strong>
            <span class="inbox-conv-preview">${escapeHtml(c.last_message_preview || "")}</span>
            ${manager}
          </span>
          <span class="inbox-conv-meta">
            <span class="inbox-conv-time">${escapeHtml(when || "")}</span>
            ${sla}
            ${unread}
          </span>
        </button>`;
    })
    .join("");

  listEl.querySelectorAll("[data-conversation-id]").forEach((btn) => {
    btn.addEventListener("click", () => openInboxConversation(btn.dataset.conversationId, items));
  });
}

// ---------------------------------------------------------------------------
// Inbox: thread view
// ---------------------------------------------------------------------------
async function openInboxConversation(id, items) {
  inboxActiveConversationId = id;
  const convo = (items || []).find((c) => c.id === id);
  inboxActiveConversation = convo || null;
  document.getElementById("inboxThreadEmpty")?.classList.add("hidden");
  document.getElementById("inboxThreadActive")?.classList.remove("hidden");
  document.getElementById("integrationsInboxView")?.classList.add("mobile-thread-open");
  document.querySelectorAll("#inboxConversationList [data-conversation-id]").forEach((el) => {
    el.classList.toggle("active", el.dataset.conversationId === id);
  });

  if (convo) {
    document.getElementById("inboxThreadName").textContent = convo.contact_name || convo.contact_handle || "Noma'lum";
    document.getElementById("inboxThreadPlatform").textContent = inboxPlatformBadge(convo.platform);
    renderInboxResponseWindow(convo);
    populateInboxManagerSelect(convo.assigned_manager_id);
    const convertBtn = document.getElementById("inboxConvertLeadBtn");
    if (convertBtn) {
      convertBtn.textContent = convo.is_lead ? "Lead qilingan ✓" : "Lead qilish";
      convertBtn.disabled = Boolean(convo.is_lead);
    }
  }

  await loadInboxMessages(id);
}

function populateInboxManagerSelect(currentManagerId) {
  const select = document.getElementById("inboxAssignManager");
  if (!select) return;
  const isAdmin = state.user?.role === "admin";
  const managers = isAdmin
    ? (state.db.users || []).filter((u) => u.role === "manager" || u.role === "admin")
    : [state.user].filter(Boolean);
  const emptyLabel = isAdmin ? "Tayinlanmagan" : "Menga biriktirilmagan";
  select.innerHTML = `<option value="">${emptyLabel}</option>` + managers
    .map((m) => {
      const apiId = String(m.id || "").replace(/^(mgr_|user_)/, "");
      const selected = apiId === String(currentManagerId || "") ? "selected" : "";
      return `<option value="${escapeHtml(apiId)}" ${selected}>${escapeHtml(m.full_name || fullName(m) || m.login)}</option>`;
    })
    .join("");
}

function renderInboxResponseWindow(convo) {
  const el = document.getElementById("inboxResponseWindow");
  if (!el) return;
  el.className = "inbox-response-window";
  if (!["instagram", "facebook"].includes(convo?.platform) || !convo?.last_inbound_at) {
    el.textContent = "";
    return;
  }
  const remainingMs = (24 * 60 * 60 * 1000) - (Date.now() - new Date(convo.last_inbound_at).getTime());
  if (remainingMs <= 0) {
    el.textContent = "24 soatlik javob oynasi tugagan";
    el.classList.add("expired");
    return;
  }
  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  el.textContent = `Javob oynasi: ${hours}s ${minutes}d`;
}

function resetMobileInboxThread() {
  inboxActiveConversationId = "";
  inboxActiveConversation = null;
  document.getElementById("integrationsInboxView")?.classList.remove("mobile-thread-open");
  document.getElementById("inboxThreadActive")?.classList.add("hidden");
  document.getElementById("inboxThreadEmpty")?.classList.remove("hidden");
}

async function loadInboxMessages(conversationId) {
  const wrap = document.getElementById("inboxMessages");
  if (!wrap) return;
  wrap.innerHTML = `<p class="muted">Yuklanmoqda...</p>`;
  try {
    const res = await apiFetch(`/api/messages?conversation_id=${encodeURIComponent(conversationId)}`, { cache: "no-store" });
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    wrap.innerHTML = items
      .map((m) => {
        const mine = m.direction === "out";
        const when = typeof fmtDateTime === "function" ? fmtDateTime(m.created_at) : String(m.created_at || "").slice(0, 16);
        const attachment = m.attachment_url
          ? `<a class="inbox-msg-attachment" href="${escapeHtml(m.attachment_url)}" target="_blank" rel="noopener noreferrer">Faylni ochish</a>`
          : "";
        const delivery = mine && m.delivery_status
          ? `<span class="inbox-msg-delivery">${escapeHtml(m.delivery_status === "sent" ? "Yuborildi" : m.delivery_status)}</span>`
          : "";
        return `<div class="inbox-msg ${mine ? "inbox-msg-out" : "inbox-msg-in"}">
          <div class="inbox-msg-body">${escapeHtml(m.body || "")}</div>
          ${attachment}
          <div class="inbox-msg-time">${delivery}${escapeHtml(when || "")}</div>
        </div>`;
      })
      .join("") || `<p class="muted">Xabarlar yo'q</p>`;
    wrap.scrollTop = wrap.scrollHeight;
  } catch {
    wrap.innerHTML = `<p class="muted">Yuklab bo'lmadi</p>`;
  }
}

function bindInboxEvents() {
  if (inboxEventsBound) return;
  inboxEventsBound = true;

  document.getElementById("inboxFilterStatus")?.addEventListener("change", loadInboxConversations);
  document.getElementById("inboxFilterPlatform")?.addEventListener("change", loadInboxConversations);
  document.getElementById("inboxSearchInput")?.addEventListener("input", () => {
    renderInboxConversationList(inboxConversationCache);
  });
  document.getElementById("inboxMobileBackBtn")?.addEventListener("click", resetMobileInboxThread);
  if (typeof enhanceSelectAsCustom === "function") {
    enhanceSelectAsCustom(document.getElementById("inboxFilterStatus"));
    enhanceSelectAsCustom(document.getElementById("inboxFilterPlatform"));
  }

  document.getElementById("inboxReplyForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("inboxReplyInput");
    const text = String(input?.value || "").trim();
    if (!text || !inboxActiveConversationId) return;
    input.value = "";
    try {
      const res = await apiFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: inboxActiveConversationId, body: text }),
      });
      const data = await res.json();
      if (!data?.success) {
        if (data?.error === "already_claimed") {
          alert("Bu suhbatni boshqa menejer olib bo'ldi.");
          resetMobileInboxThread();
          await loadInboxConversations();
          return;
        }
        if (data?.error === "channel_not_connected") {
          alert("Bu kanal hali ulanmagan.");
        } else if (data?.error === "send_failed") {
          const detail = String(data?.provider_error || "");
          const windowExpired = /24|window|outside|allowed/i.test(detail);
          alert(windowExpired
            ? "Javob berish muddati tugagan. Mijoz yangi xabar yuborgandan keyin javob berish mumkin."
            : `Xabar platformaga yuborilmadi${detail ? `: ${detail}` : "."}`);
        } else {
          alert("Yuborib bo'lmadi.");
        }
        return;
      }
      await loadInboxMessages(inboxActiveConversationId);
      await loadInboxConversations();
    } catch {
      alert("Yuborib bo'lmadi, internetni tekshiring.");
    }
  });

  document.getElementById("inboxAssignManager")?.addEventListener("change", async (e) => {
    if (!inboxActiveConversationId) return;
    const res = await apiFetch("/api/conversations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inboxActiveConversationId, assigned_manager_id: e.target.value || null }),
    });
    if (!res.ok) {
      alert(res.status === 409 ? "Bu suhbatni boshqa menejer olib bo'ldi." : "Biriktirib bo'lmadi.");
      resetMobileInboxThread();
    }
    loadInboxConversations();
  });

  document.getElementById("inboxConvertLeadBtn")?.addEventListener("click", async () => {
    if (!inboxActiveConversationId) return;
    const res = await apiFetch("/api/conversations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inboxActiveConversationId, convert_to_lead: true }),
    });
    const data = await res.json();
    if (data?.success) {
      alert("Mijozlar bazasiga qo'shildi.");
      loadInboxConversations();
    } else if (data?.error === "already_claimed") {
      alert("Bu suhbatni boshqa menejer olib bo'ldi.");
      resetMobileInboxThread();
      loadInboxConversations();
    } else {
      alert("Mijozlar bazasiga qo'shib bo'lmadi.");
    }
  });

  document.getElementById("inboxCloseBtn")?.addEventListener("click", async () => {
    if (!inboxActiveConversationId) return;
    await apiFetch("/api/conversations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inboxActiveConversationId, status: "closed" }),
    });
    resetMobileInboxThread();
    loadInboxConversations();
  });
}

// ---------------------------------------------------------------------------
// Channels: connect/disconnect
// ---------------------------------------------------------------------------
async function loadChannelsList() {
  const wrap = document.getElementById("channelsList");
  if (!wrap || state.user?.role !== "admin") {
    if (wrap) wrap.innerHTML = `<p class="muted">Faqat admin ko'ra oladi</p>`;
    return;
  }
  try {
    const res = await apiFetch("/api/integrations", { cache: "no-store" });
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    document.querySelectorAll("[data-meta-source-card]").forEach((card) => {
      card.hidden = data?.meta_available !== true;
    });
    if (!items.length) {
      wrap.innerHTML = `<p class="muted">Hali hech qanday kanal ulanmagan</p>`;
      loadMetaAdsStatus();
      return;
    }
    wrap.innerHTML = items
      .map((c) => {
        const statusLabel = { connected: "Ulangan", pending: "Kutilmoqda (Meta tasdig'i)", error: "Xato", disconnected: "Uzilgan" }[c.status] || c.status;
        const typeLabel = {
          telegram_bot: "Bot",
          telegram_business: "Business DM",
          instagram_login: "Instagram Login",
          instagram_oauth: "Meta OAuth",
          facebook_page: "Facebook Page",
          meta_lead_ads: "Meta Lead Ads",
        }[c.connection_type] || "";
        const capabilities = c.platform === "instagram"
          ? `<span class="channel-source-capabilities"><span>Direct &amp; Stories</span><span>Kommentariyalar</span></span>`
          : c.platform === "meta_ads"
            ? `<span class="channel-source-capabilities"><span>Lead formalar → voronka</span></span>`
            : "";
        return `<article class="channel-row">
          <span class="inbox-conv-badge inbox-badge-${escapeHtml(c.platform)}">${escapeHtml(inboxPlatformBadge(c.platform))}</span>
          <span class="channel-row-main">
            <strong>${escapeHtml(c.display_name || c.platform)}</strong>
            <span class="muted small">${escapeHtml([statusLabel, typeLabel].filter(Boolean).join(" · "))}</span>
            ${capabilities}
          </span>
          <button type="button" class="btn btn-light" data-disconnect-channel="${escapeHtml(c.id)}">Uzish</button>
        </article>`;
      })
      .join("");
    loadMetaAdsStatus();
    wrap.querySelectorAll("[data-disconnect-channel]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Bu kanalni uzasizmi?")) return;
        await apiFetch("/api/integrations", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: btn.dataset.disconnectChannel }),
        });
        loadChannelsList();
      });
    });
  } catch {
    wrap.innerHTML = `<p class="muted">Yuklab bo'lmadi</p>`;
  }
}

function setInstagramOAuthStatus(message, tone = "") {
  const status = document.getElementById("instagramOAuthStatus");
  if (!status) return;
  status.textContent = String(message || "");
  status.className = `channel-oauth-status${tone ? ` is-${tone}` : ""}`;
}

function setMetaAdsOAuthStatus(message, tone = "") {
  const status = document.getElementById("metaAdsOAuthStatus");
  if (!status) return;
  status.textContent = String(message || "");
  status.className = `channel-oauth-status${tone ? ` is-${tone}` : ""}`;
}

function handleMetaOAuthReturn() {
  const url = new URL(window.location.href);
  const instagramResult = url.searchParams.get("meta_oauth");
  const adsResult = url.searchParams.get("meta_ads_oauth");
  if (!instagramResult && !adsResult) return;
  if (typeof switchPage === "function") switchPage("settings");
  if (typeof switchSettingsTab === "function") switchSettingsTab("channels");
  if (instagramResult === "success") {
    setInstagramOAuthStatus("Instagram ulandi. Direct va kommentariyalar CRM inboxiga tushadi.", "success");
  } else if (instagramResult) {
    const reason = url.searchParams.get("reason");
    const message = reason === "invalid_state" || reason === "expired_state"
      ? "Ulash sessiyasi tugagan. Tugmani qayta bosing."
      : reason === "access_revoked"
        ? "Admin ruxsati o'zgargan. CRM'ga qayta kirib urinib ko'ring."
        : "Instagram ulanmagan. Akkaunt ruxsatlarini tekshirib qayta urinib ko'ring.";
    setInstagramOAuthStatus(message, "error");
  }
  if (adsResult === "success") {
    setMetaAdsOAuthStatus("Lead formalar ulandi. Yangi leadlar avtomatik savdo voronkasiga tushadi.", "success");
  } else if (adsResult) {
    const reason = url.searchParams.get("reason");
    const message = reason === "invalid_state" || reason === "expired_state"
      ? "Ulash sessiyasi tugagan. Tugmani qayta bosing."
      : reason === "access_revoked"
        ? "Admin ruxsati o'zgargan. CRM'ga qayta kirib urinib ko'ring."
        : reason === "no_pages"
          ? "Tanlangan Meta Business hisobida boshqariladigan sahifa topilmadi."
          : "Lead formalar ulanmagan. Sahifa va reklama ruxsatlarini tekshiring.";
    setMetaAdsOAuthStatus(message, "error");
  }
  loadChannelsList();
  url.searchParams.delete("meta_oauth");
  url.searchParams.delete("meta_ads_oauth");
  url.searchParams.delete("reason");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

async function startMetaAdsOAuth() {
  const button = document.getElementById("connectMetaAdsOAuthBtn");
  if (!button || button.disabled) return;
  button.disabled = true;
  setMetaAdsOAuthStatus("Reklama lead formalari uchun xavfsiz ulanish ochilmoqda...");
  try {
    const response = await apiFetch("/api/meta-ads-oauth-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data?.authorization_url) {
      const message = data?.error === "meta_oauth_not_configured"
        ? "Ulash xizmati hali tayyor emas. Texnik administratorga xabar bering."
        : data?.error === "invalid_meta_oauth_redirect"
          ? "Ulash manzili noto'g'ri sozlangan."
          : "Lead formalarni ulashni boshlab bo'lmadi. Qayta urinib ko'ring.";
      setMetaAdsOAuthStatus(message, "error");
      button.disabled = false;
      return;
    }
    window.location.assign(data.authorization_url);
  } catch {
    setMetaAdsOAuthStatus("Internet bilan aloqa yo'q. Qayta urinib ko'ring.", "error");
    button.disabled = false;
  }
}

async function loadMetaAdsStatus() {
  const wrap = document.getElementById("metaAdsConnectionSummary");
  if (!wrap || state.user?.role !== "admin") return;
  try {
    const response = await apiFetch("/api/meta-ads-status", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      wrap.innerHTML = `<span class="meta-ads-summary-muted">Holat ulanishdan keyin ko'rinadi.</span>`;
      return;
    }
    const pages = Array.isArray(data.pages) ? data.pages : [];
    const accounts = Array.isArray(data.ad_accounts) ? data.ad_accounts : [];
    const leads = data.leads || {};
    if (!pages.length && !accounts.length) {
      wrap.innerHTML = `<span class="meta-ads-summary-muted">Hali reklama lead formasi ulanmagan.</span>`;
      return;
    }
    wrap.innerHTML = `
      <span><b>${escapeHtml(String(pages.filter((page) => page.status === "connected").length))}</b> sahifa</span>
      <span><b>${escapeHtml(String(accounts.length))}</b> Ads hisob</span>
      <span><b>${escapeHtml(String(leads.completed || 0))}</b> lead</span>
      ${Number(leads.errors || 0) > 0 ? `<span class="is-error"><b>${escapeHtml(String(leads.errors))}</b> xato</span>` : ""}
    `;
  } catch {
    wrap.innerHTML = `<span class="meta-ads-summary-muted">Holatni yuklab bo'lmadi.</span>`;
  }
}

async function startInstagramOAuth() {
  const button = document.getElementById("connectInstagramOAuthBtn");
  if (!button || button.disabled) return;
  button.disabled = true;
  setInstagramOAuthStatus("Instagram xavfsiz ulanish oynasi tayyorlanmoqda...");
  try {
    const response = await apiFetch("/api/meta-oauth-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data?.authorization_url) {
      if (data?.error === "meta_oauth_not_configured") {
        setInstagramOAuthStatus("Ulash xizmati hali tayyor emas. Texnik administratorga xabar bering.", "error");
      } else if (data?.error === "invalid_meta_oauth_redirect") {
        setInstagramOAuthStatus("Ulash manzili noto'g'ri sozlangan.", "error");
      } else {
        setInstagramOAuthStatus("Instagram ulanishini boshlab bo'lmadi. Qayta urinib ko'ring.", "error");
      }
      button.disabled = false;
      return;
    }
    window.location.assign(data.authorization_url);
  } catch {
    setInstagramOAuthStatus("Internet bilan aloqa yo'q. Qayta urinib ko'ring.", "error");
    button.disabled = false;
  }
}

function bindChannelsEvents() {
  if (channelEventsBound) return;
  channelEventsBound = true;

  document.getElementById("connectInstagramOAuthBtn")?.addEventListener("click", startInstagramOAuth);
  document.getElementById("connectMetaAdsOAuthBtn")?.addEventListener("click", startMetaAdsOAuth);

  document.getElementById("connectTelegramForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const botToken = String(new FormData(form).get("botToken") || "").trim();
    const res = await apiFetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "telegram", botToken }),
    });
    const data = await res.json();
    if (data?.success) {
      form.reset();
      alert(data.supports_business
        ? "Telegram ulandi. Bot Telegram Business akkauntiga ham ulanishni qo'llab-quvvatlaydi."
        : "Telegram bot ulandi.");
      loadChannelsList();
    } else {
      alert("Ulanmadi: token noto'g'ri bo'lishi mumkin.");
    }
  });

  document.getElementById("connectFacebookForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const res = await apiFetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "facebook",
        displayName: String(fd.get("displayName") || ""),
        externalAccountId: String(fd.get("externalAccountId") || ""),
        pageAccessToken: String(fd.get("pageAccessToken") || ""),
      }),
    });
    const data = await res.json();
    if (data?.success) {
      form.reset();
      alert(`Saqlandi. Meta App dashboard'da webhook URL sifatida shuni kiriting:\n${data.webhook_url}\nVerify token: ${data.verify_token}`);
      loadChannelsList();
    }
  });

  document.getElementById("connectInstagramForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const res = await apiFetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "instagram",
        displayName: String(fd.get("displayName") || ""),
        externalAccountId: String(fd.get("externalAccountId") || ""),
        pageAccessToken: String(fd.get("pageAccessToken") || ""),
      }),
    });
    const data = await res.json();
    if (data?.success) {
      form.reset();
      alert(`Saqlandi. Meta App dashboard'da webhook URL sifatida shuni kiriting:\n${data.webhook_url}\nVerify token: ${data.verify_token}`);
      loadChannelsList();
    } else {
      alert(`Instagram ulanmadi${data?.provider_error ? `: ${data.provider_error}` : "."}`);
    }
  });

  document.getElementById("connectSheetsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const sheetUrl = String(fd.get("sheetUrl") || "").trim();
    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    try {
      const res = await apiFetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "google_sheets", sheetUrl }),
      });
      const data = await res.json();
      if (data?.success) {
        form.reset();
        alert("Google Sheets ulandi. Davomat HR bo'limida ko'rinadi.");
        loadChannelsList();
      } else {
        alert(data?.error === "invalid_sheet_url" ? "Havola noto'g'ri. Google Sheets havolasini to'liq nusxalab qo'ying." : "Ulanmadi, havolani tekshiring.");
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

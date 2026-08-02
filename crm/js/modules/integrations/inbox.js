let inboxEventsBound = false;
let channelEventsBound = false;
let inboxActiveConversationId = "";
let inboxActiveConversation = null;
let inboxConversationCache = [];
let inboxPollTimer = null;

function confirmChannelDisconnect() {
  const message = "O'chirilgandan keyin bu kanal qaytib tiklanmaydi. Undan qayta foydalanish uchun uni yana ulashingiz kerak bo'ladi. Davom etasizmi?";
  if (!refs.confirmModal || !refs.confirmModalTitle || !refs.confirmModalMessage || !refs.confirmOkBtn || !refs.confirmCancelBtn) {
    return Promise.resolve(window.confirm(message));
  }
  if (confirmResolver) {
    confirmResolver(false);
    confirmResolver = null;
  }
  refs.confirmModalTitle.textContent = "Kanalni o'chirish";
  refs.confirmModalMessage.textContent = message;
  refs.confirmCancelBtn.textContent = t("cancel");
  refs.confirmOkBtn.textContent = t("deleteAction");
  toggleModal(refs.confirmModal, true);
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function channelEditFormHtml(c) {
  if (c.platform === "google_sheets") {
    return `<form class="channel-edit-form" data-edit-submit="${escapeHtml(c.id)}" data-edit-platform="google_sheets">
      <input name="sheetUrl" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." value="${escapeHtml(c.sheet_url || "")}" required />
      <div class="channel-edit-actions">
        <button type="button" class="btn btn-light" data-edit-cancel="${escapeHtml(c.id)}">Bekor qilish</button>
        <button type="submit" class="btn btn-primary">Yangilash</button>
      </div>
    </form>`;
  }
  if (c.platform === "telegram") {
    return `<form class="channel-edit-form" data-edit-submit="${escapeHtml(c.id)}" data-edit-platform="telegram">
      <input name="botToken" type="password" placeholder="Yangi bot token (masalan: 123456:AAExample)" autocomplete="off" spellcheck="false" required />
      <div class="channel-edit-actions">
        <button type="button" class="btn btn-light" data-edit-cancel="${escapeHtml(c.id)}">Bekor qilish</button>
        <button type="submit" class="btn btn-primary">Yangilash</button>
      </div>
    </form>`;
  }
  if (c.platform === "facebook") {
    return `<form class="channel-edit-form" data-edit-submit="${escapeHtml(c.id)}" data-edit-platform="facebook">
      <input name="displayName" type="text" placeholder="Sahifa nomi" value="${escapeHtml(c.display_name || "")}" />
      <input name="externalAccountId" type="text" placeholder="Page ID" value="${escapeHtml(c.external_account_id || "")}" required />
      <input name="pageAccessToken" type="password" placeholder="Yangi Page Access Token" autocomplete="off" spellcheck="false" required />
      <div class="channel-edit-actions">
        <button type="button" class="btn btn-light" data-edit-cancel="${escapeHtml(c.id)}">Bekor qilish</button>
        <button type="submit" class="btn btn-primary">Yangilash</button>
      </div>
    </form>`;
  }
  if (c.platform === "instagram" && c.connection_type !== "instagram_oauth") {
    return `<form class="channel-edit-form" data-edit-submit="${escapeHtml(c.id)}" data-edit-platform="instagram">
      <input name="displayName" type="text" placeholder="Akkaunt nomi" value="${escapeHtml(c.display_name || "")}" />
      <input name="externalAccountId" type="text" placeholder="Instagram Business ID" value="${escapeHtml(c.external_account_id || "")}" required />
      <input name="pageAccessToken" type="password" placeholder="Yangi Instagram User Access Token" autocomplete="off" spellcheck="false" required />
      <div class="channel-edit-actions">
        <button type="button" class="btn btn-light" data-edit-cancel="${escapeHtml(c.id)}">Bekor qilish</button>
        <button type="submit" class="btn btn-primary">Yangilash</button>
      </div>
    </form>`;
  }
  return `<p class="muted small channel-edit-note">Bu kanal OAuth orqali ulangan. Qayta ulash uchun avval "o'chirish" bilan uzing, so'ng tegishli "Ulash" tugmasini bosing.</p>`;
}

async function submitChannelEdit(form) {
  const platform = form.dataset.editPlatform;
  const channelId = form.dataset.editSubmit;
  const fd = new FormData(form);
  const payload = { platform };
  if (platform === "google_sheets") payload.sheetUrl = String(fd.get("sheetUrl") || "").trim();
  if (platform === "telegram") payload.botToken = String(fd.get("botToken") || "").trim();
  if (platform === "facebook" || platform === "instagram") {
    payload.displayName = String(fd.get("displayName") || "").trim();
    payload.externalAccountId = String(fd.get("externalAccountId") || "").trim();
    payload.pageAccessToken = String(fd.get("pageAccessToken") || "").trim();
  }
  const submitBtn = form.querySelector("button[type=submit]");
  if (submitBtn) submitBtn.disabled = true;
  try {
    await apiFetch("/api/integrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: channelId }),
    });
    const res = await apiFetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data?.success) {
      showConnectSuccess("Yangilandi!", "Ulanish muvaffaqiyatli yangilandi.");
      loadChannelsList();
    } else {
      alert("Yangilanmadi: kiritilgan ma'lumotni tekshiring.");
      if (submitBtn) submitBtn.disabled = false;
    }
  } catch {
    alert("Yangilanmadi, qayta urinib ko'ring.");
    if (submitBtn) submitBtn.disabled = false;
  }
}

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
    el.classList.toggle("hidden", !isAdminRole(state.user?.role));
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

function inboxPlatformIcon(platform) {
  const icons = {
    telegram: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M21.94 3.36 2.7 10.86c-1.28.5-1.27 1.2-.23 1.52l4.93 1.54 1.91 5.86c.23.63.35.88.78.88.36 0 .53-.16.75-.37l1.8-1.75 3.98 2.94c.85.47 1.46.23 1.68-.79l3.04-14.33c.31-1.25-.46-1.83-1.5-1.4Zm-11.63 9.9-1.5-4.6L18.02 6l-7.71 7.26Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34v7.03C18.34 21.24 22 17.08 22 12.06Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2c-2.72 0-3.06.01-4.13.06-1.06.05-1.79.22-2.43.47a4.9 4.9 0 0 0-1.77 1.15A4.9 4.9 0 0 0 2.53 5.44c-.25.64-.42 1.37-.47 2.43C2.01 8.94 2 9.28 2 12s.01 3.06.06 4.13c.05 1.06.22 1.79.47 2.43a4.9 4.9 0 0 0 1.15 1.77 4.9 4.9 0 0 0 1.77 1.15c.64.25 1.37.42 2.43.47C8.94 21.99 9.28 22 12 22s3.06-.01 4.13-.06c1.06-.05 1.79-.22 2.43-.47a4.9 4.9 0 0 0 1.77-1.15 4.9 4.9 0 0 0 1.15-1.77c.25-.64.42-1.37.47-2.43.05-1.07.06-1.41.06-4.13s-.01-3.06-.06-4.13c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 0 0-1.15-1.77A4.9 4.9 0 0 0 18.56 2.53c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2Zm0 3.05c2.67 0 2.99.01 4.04.06.98.05 1.5.2 1.86.34.47.18.8.4 1.15.75.35.35.57.68.75 1.15.14.36.29.88.34 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.05.98-.2 1.5-.34 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.14-.88.29-1.86.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.05-1.5-.2-1.86-.34a3.1 3.1 0 0 1-1.15-.75 3.1 3.1 0 0 1-.75-1.15c-.14-.36-.29-.88-.34-1.86-.05-1.05-.06-1.37-.06-4.04s.01-2.99.06-4.04c.05-.98.2-1.5.34-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.14.88-.29 1.86-.34 1.05-.05 1.37-.06 4.04-.06Zm0 3.05a5.15 5.15 0 1 0 0 10.3 5.15 5.15 0 0 0 0-10.3Zm0 8.5a3.35 3.35 0 1 1 0-6.7 3.35 3.35 0 0 1 0 6.7Zm5.35-8.7a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z"/></svg>',
  };
  return icons[platform] || "";
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
          <span class="inbox-conv-badge inbox-badge-${escapeHtml(c.platform)}">${inboxPlatformIcon(c.platform) || escapeHtml(inboxPlatformBadge(c.platform))}</span>
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
// targetolog sees every conversation (server-side: INBOX_READ_ONLY_ROLES in
// functions/api/_conversation_access.js) but must not reply, assign, close,
// or convert one to a lead - the write endpoints reject it either way, this
// just keeps the UI from offering controls that would only ever 403.
function isInboxReadOnly() {
  return state.user?.role === "targetolog";
}

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

  const readOnly = isInboxReadOnly();
  const replyInput = document.getElementById("inboxReplyInput");
  const replySubmit = document.querySelector("#inboxReplyForm button[type=submit]");
  if (replyInput) replyInput.disabled = readOnly;
  if (replySubmit) replySubmit.disabled = readOnly;
  const closeBtn = document.getElementById("inboxCloseBtn");
  if (closeBtn) closeBtn.classList.toggle("hidden", readOnly);

  if (convo) {
    document.getElementById("inboxThreadName").textContent = convo.contact_name || convo.contact_handle || "Noma'lum";
    document.getElementById("inboxThreadPlatform").textContent = inboxPlatformBadge(convo.platform);
    renderInboxResponseWindow(convo);
    populateInboxManagerSelect(convo.assigned_manager_id);
    const convertBtn = document.getElementById("inboxConvertLeadBtn");
    if (convertBtn) {
      convertBtn.textContent = convo.is_lead ? "Lead qilingan ✓" : "Lead qilish";
      convertBtn.disabled = readOnly || Boolean(convo.is_lead);
    }
  }

  await loadInboxMessages(id);
}

function populateInboxManagerSelect(currentManagerId) {
  const select = document.getElementById("inboxAssignManager");
  if (!select) return;
  const isFullAccess = ["admin", "director", "community_manager", "employee"].includes(state.user?.role);
  const managers = isFullAccess
    ? (state.db.users || []).filter((u) => ["manager", "admin", "director", "community_manager", "employee"].includes(u.role))
    : [state.user].filter(Boolean);
  const emptyLabel = isFullAccess ? "Tayinlanmagan" : "Menga biriktirilmagan";
  select.innerHTML = `<option value="">${emptyLabel}</option>` + managers
    .map((m) => {
      const apiId = String(m.id || "").replace(/^(mgr_|user_)/, "");
      const selected = apiId === String(currentManagerId || "") ? "selected" : "";
      return `<option value="${escapeHtml(apiId)}" ${selected}>${escapeHtml(m.full_name || fullName(m) || m.login)}</option>`;
    })
    .join("");
  select.disabled = isInboxReadOnly();
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
  if (!wrap || !isAdminRole(state.user?.role)) {
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
        return `<div class="channel-row-wrap">
          <article class="channel-row">
            <span class="inbox-conv-badge inbox-badge-${escapeHtml(c.platform)}">${inboxPlatformIcon(c.platform) || escapeHtml(inboxPlatformBadge(c.platform))}</span>
            <span class="channel-row-main">
              <strong>${escapeHtml(c.display_name || c.platform)}</strong>
              <span class="muted small">${escapeHtml([statusLabel, typeLabel].filter(Boolean).join(" · "))}</span>
              ${capabilities}
            </span>
            <span class="chip-actions">
              <button type="button" class="action-btn" data-edit-channel="${escapeHtml(c.id)}" aria-label="o'zgartirish"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button>
              <button type="button" class="action-btn" data-disconnect-channel="${escapeHtml(c.id)}" aria-label="o'chirish"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>
            </span>
          </article>
          <div class="channel-edit-panel hidden" data-edit-panel="${escapeHtml(c.id)}">${channelEditFormHtml(c)}</div>
        </div>`;
      })
      .join("");
    loadMetaAdsStatus();
    wrap.querySelectorAll("[data-disconnect-channel]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!(await confirmChannelDisconnect())) return;
        await apiFetch("/api/integrations", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: btn.dataset.disconnectChannel }),
        });
        loadChannelsList();
      });
    });
    wrap.querySelectorAll("[data-edit-channel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = wrap.querySelector(`[data-edit-panel="${CSS.escape(btn.dataset.editChannel)}"]`);
        if (!panel) return;
        const wasOpen = !panel.classList.contains("hidden");
        wrap.querySelectorAll(".channel-edit-panel").forEach((el) => el.classList.add("hidden"));
        if (!wasOpen) {
          panel.classList.remove("hidden");
          panel.querySelector("input")?.focus();
        }
      });
    });
    wrap.querySelectorAll("[data-edit-cancel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.closest(".channel-edit-panel")?.classList.add("hidden");
      });
    });
    wrap.querySelectorAll(".channel-edit-form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submitChannelEdit(form);
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
    showConnectSuccess("Ulandi!", "Instagram muvaffaqiyatli ulandi.");
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
    showConnectSuccess("Ulandi!", "Meta Lead Forms muvaffaqiyatli ulandi.");
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
  if (!wrap || !isAdminRole(state.user?.role)) return;
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
      showConnectSuccess("Ulandi!", data.supports_business
        ? "Telegram bot ulandi va Business akkauntni ham qo'llab-quvvatlaydi."
        : "Telegram bot muvaffaqiyatli ulandi.");
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
        showConnectSuccess("Ulandi!", "Google Sheets muvaffaqiyatli ulandi. Davomat HR bo'limida ko'rinadi.");
        loadChannelsList();
      } else {
        alert(data?.error === "invalid_sheet_url" ? "Havola noto'g'ri. Google Sheets havolasini to'liq nusxalab qo'ying." : "Ulanmadi, havolani tekshiring.");
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

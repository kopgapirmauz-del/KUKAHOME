let inboxEventsBound = false;
let inboxActiveConversationId = "";
let inboxPollTimer = null;
let inboxActiveTab = "inbox";

function initIntegrationsInboxUI() {
  bindIntegrationsTabbar();
  bindInboxEvents();
  bindChannelsEvents();
  showIntegrationsTab(inboxActiveTab);
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function bindIntegrationsTabbar() {
  document.querySelectorAll("[data-integrations-tab]").forEach((btn) => {
    if (btn.dataset.inboxTabBound) return;
    btn.dataset.inboxTabBound = "1";
    btn.addEventListener("click", () => showIntegrationsTab(btn.dataset.integrationsTab));
  });
}

function showIntegrationsTab(tab) {
  inboxActiveTab = tab || "inbox";
  document.querySelectorAll("[data-integrations-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.integrationsTab === inboxActiveTab);
  });
  const views = {
    inbox: document.getElementById("integrationsInboxView"),
    funnel: document.getElementById("integrationsFunnelView"),
  };
  Object.entries(views).forEach(([key, el]) => {
    if (el) el.classList.toggle("hidden", key !== inboxActiveTab);
  });

  clearInterval(inboxPollTimer);
  if (inboxActiveTab === "inbox") {
    loadInboxConversations();
    inboxPollTimer = setInterval(loadInboxConversations, 15000);
  }
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
    renderInboxConversationList(data.items || []);
  } catch {
    // keep previous list on transient network errors
  }
}

function inboxPlatformBadge(platform) {
  const map = { telegram: "TG", facebook: "FB", instagram: "IG" };
  return map[platform] || String(platform || "").slice(0, 2).toUpperCase();
}

function renderInboxConversationList(items) {
  const listEl = document.getElementById("inboxConversationList");
  if (!listEl) return;
  if (!items.length) {
    listEl.innerHTML = `<p class="muted" style="padding:16px">Hozircha suhbatlar yo'q</p>`;
    return;
  }
  listEl.innerHTML = items
    .map((c) => {
      const active = c.id === inboxActiveConversationId ? "active" : "";
      const unread = c.unread_count > 0 ? `<span class="inbox-unread-dot">${escapeHtml(String(c.unread_count))}</span>` : "";
      const when = typeof fmtDateTime === "function" ? fmtDateTime(c.last_message_at) : String(c.last_message_at || "").slice(0, 16);
      return `
        <button type="button" class="inbox-conversation-item ${active}" data-conversation-id="${escapeHtml(c.id)}">
          <span class="inbox-conv-badge inbox-badge-${escapeHtml(c.platform)}">${escapeHtml(inboxPlatformBadge(c.platform))}</span>
          <span class="inbox-conv-main">
            <strong>${escapeHtml(c.contact_name || c.contact_handle || "Noma'lum")}</strong>
            <span class="inbox-conv-preview">${escapeHtml(c.last_message_preview || "")}</span>
          </span>
          <span class="inbox-conv-meta">
            <span class="inbox-conv-time">${escapeHtml(when || "")}</span>
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
  document.getElementById("inboxThreadEmpty")?.classList.add("hidden");
  document.getElementById("inboxThreadActive")?.classList.remove("hidden");
  document.querySelectorAll("#inboxConversationList [data-conversation-id]").forEach((el) => {
    el.classList.toggle("active", el.dataset.conversationId === id);
  });

  if (convo) {
    document.getElementById("inboxThreadName").textContent = convo.contact_name || convo.contact_handle || "Noma'lum";
    document.getElementById("inboxThreadPlatform").textContent = inboxPlatformBadge(convo.platform);
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
  const managers = (state.db.users || []).filter((u) => u.role === "manager" || u.role === "admin");
  select.innerHTML = `<option value="">Tayinlanmagan</option>` + managers
    .map((m) => `<option value="${escapeHtml(m.id)}" ${m.id === currentManagerId ? "selected" : ""}>${escapeHtml(m.full_name || m.login)}</option>`)
    .join("");
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
        return `<div class="inbox-msg ${mine ? "inbox-msg-out" : "inbox-msg-in"}">
          <div class="inbox-msg-body">${escapeHtml(m.body || "")}</div>
          <div class="inbox-msg-time">${escapeHtml(when || "")}</div>
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
        alert(data?.error === "channel_not_connected" ? "Bu kanal hali ulanmagan." : "Yuborib bo'lmadi.");
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
    await apiFetch("/api/conversations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inboxActiveConversationId, assigned_manager_id: e.target.value || null }),
    });
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
    }
  });

  document.getElementById("inboxCloseBtn")?.addEventListener("click", async () => {
    if (!inboxActiveConversationId) return;
    await apiFetch("/api/conversations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inboxActiveConversationId, status: "closed" }),
    });
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
    if (!items.length) {
      wrap.innerHTML = `<p class="muted">Hali hech qanday kanal ulanmagan</p>`;
      return;
    }
    wrap.innerHTML = items
      .map((c) => {
        const statusLabel = { connected: "Ulangan", pending: "Kutilmoqda (Meta tasdig'i)", error: "Xato", disconnected: "Uzilgan" }[c.status] || c.status;
        return `<article class="channel-row">
          <span class="inbox-conv-badge inbox-badge-${escapeHtml(c.platform)}">${escapeHtml(inboxPlatformBadge(c.platform))}</span>
          <span class="channel-row-main">
            <strong>${escapeHtml(c.display_name || c.platform)}</strong>
            <span class="muted small">${escapeHtml(statusLabel)}</span>
          </span>
          <button type="button" class="btn btn-light" data-disconnect-channel="${escapeHtml(c.id)}">Uzish</button>
        </article>`;
      })
      .join("");
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

function bindChannelsEvents() {
  if (inboxEventsBound === "channels") return;

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
      alert("Telegram bot ulandi!");
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
    }
  });
}

let inboxEventsBound = false;
let channelEventsBound = false;
let inboxActiveConversationId = "";
let inboxActiveConversation = null;
let inboxConversationCache = [];
let inboxMessagesCache = [];
let inboxReplyTarget = null;
let inboxPollTimer = null;
let inboxLastUnreadTotal = -1;
let inboxThreadTypeFilter = "";

// A raw Meta id is a placeholder the backend stores when a profile lookup
// fails, not something a manager should ever have to read.
function inboxContactLabel(convo) {
  const name = String(convo?.contact_name || "").trim();
  if (name && !/^\d+$/.test(name)) return name;
  const handle = String(convo?.contact_handle || "").trim();
  if (handle && !/^\d+$/.test(handle)) return `@${handle}`;
  return t("inboxUnknownContact");
}

function inboxIsCommentThread(convo) {
  return convo?.thread_type === "comment";
}

const INBOX_EMOJI_LIST = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😉", "🙂", "🙃",
  "😎", "🤩", "🥳", "😢", "😭", "😡", "🤔", "👍", "👎", "🙏",
  "👏", "🔥", "❤️", "🎉", "✅", "❌", "📌", "⭐", "🤝", "💯",
];

// Neither Telegram nor Meta's send APIs used here support native message
// threading, so replying to a specific message is implemented as a quoted
// text prefix that both sides render as a quote block.
function inboxQuoteParts(body) {
  const text = String(body || "");
  if (!text.startsWith("↩ ")) return null;
  const nl = text.indexOf("\n");
  if (nl === -1) return { quote: text.slice(2), rest: "" };
  return { quote: text.slice(2, nl), rest: text.slice(nl + 1) };
}

function inboxMessagePreview(m) {
  const parts = inboxQuoteParts(m?.body);
  const rawBody = (parts ? parts.rest : (m?.body || "")).trim();
  if (rawBody) return rawBody.slice(0, 80);
  if (m?.message_type === "image") return t("inboxAttachmentImage");
  if (m?.attachment_url) return t("inboxAttachmentFile");
  return "";
}

function setInboxReplyTarget(msg) {
  inboxReplyTarget = msg;
  const bar = document.getElementById("inboxReplyPreview");
  const textEl = document.getElementById("inboxReplyPreviewText");
  if (!bar || !textEl) return;
  textEl.textContent = inboxMessagePreview(msg);
  bar.classList.remove("hidden");
  document.getElementById("inboxReplyInput")?.focus();
}

function clearInboxReplyTarget() {
  inboxReplyTarget = null;
  document.getElementById("inboxReplyPreview")?.classList.add("hidden");
}

async function sendInboxPayload(payload) {
  if (!inboxActiveConversationId) return { success: false };
  const body = { conversation_id: inboxActiveConversationId, ...payload };
  if (inboxReplyTarget) {
    const quote = inboxMessagePreview(inboxReplyTarget);
    if (quote) body.body = `↩ ${quote}\n${body.body || ""}`.trimEnd();
  }
  try {
    const res = await apiFetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data?.success) {
      if (data?.error === "already_claimed") {
        alert(t("inboxAlreadyClaimed"));
        resetMobileInboxThread();
        await loadInboxConversations();
        return data;
      }
      if (data?.error === "channel_not_connected") {
        alert(t("inboxChannelNotConnected"));
      } else if (data?.error === "comment_not_found") {
        alert(t("inboxCommentNotFound"));
      } else if (data?.error === "comment_attachment_unsupported") {
        alert(t("inboxCommentAttachmentUnsupported"));
      } else if (data?.error === "send_failed") {
        const detail = String(data?.provider_error || "");
        const windowExpired = /24|window|outside|allowed/i.test(detail);
        alert(windowExpired
          ? t("inboxResponseExpiredAlert")
          : `${t("inboxSendFailedWithDetail")}${detail ? `: ${detail}` : "."}`);
      } else {
        alert(t("inboxSendFailedGeneric"));
      }
      return data;
    }
    clearInboxReplyTarget();
    await loadInboxMessages(inboxActiveConversationId);
    await loadInboxConversations();
    return data;
  } catch {
    alert(t("inboxSendFailedNetwork"));
    return { success: false };
  }
}

function toggleInboxEmojiPicker(forceClose = false) {
  const pop = document.getElementById("inboxEmojiPicker");
  if (!pop) return;
  if (forceClose) {
    pop.classList.add("hidden");
    return;
  }
  const willOpen = pop.classList.contains("hidden");
  pop.classList.toggle("hidden");
  if (!willOpen) return;
  if (!pop.dataset.built) {
    pop.dataset.built = "1";
    pop.innerHTML = INBOX_EMOJI_LIST
      .map((emoji) => `<button type="button" class="inbox-emoji-item" data-emoji="${emoji}">${emoji}</button>`)
      .join("");
    pop.querySelectorAll("[data-emoji]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById("inboxReplyInput");
        if (input) {
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          const emoji = btn.dataset.emoji;
          input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
          input.focus();
          input.selectionStart = input.selectionEnd = start + emoji.length;
        }
        toggleInboxEmojiPicker(true);
      });
    });
  }
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

async function sendInboxAttachment(file) {
  if (!inboxActiveConversationId) return;
  if (file.size > 15 * 1024 * 1024) {
    alert(t("inboxFileTooLarge"));
    return;
  }
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const uploadRes = await apiFetch("/api/message-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data_url: dataUrl, file_name: file.name }),
    });
    const uploadData = await uploadRes.json();
    if (!uploadData?.success) {
      alert(t("inboxFileUploadFailed"));
      return;
    }
    const input = document.getElementById("inboxReplyInput");
    const caption = String(input?.value || "").trim();
    if (input) input.value = "";
    await sendInboxPayload({
      body: caption,
      attachment_url: uploadData.url,
      message_type: uploadData.is_image ? "image" : "file",
    });
  } catch {
    alert(t("inboxFileUploadFailed"));
  }
}

function updateInboxUnreadBadge(total) {
  // Shows up in two places (sidebar menu item + mobile bottom dock icon),
  // and the dock's badge span gets rebuilt from scratch on every
  // updateRoleBasedMenus() call, so this targets the shared class rather
  // than a single fixed id.
  document.querySelectorAll(".inbox-unread-badge").forEach((badge) => {
    badge.textContent = total > 99 ? "99+" : String(total);
    badge.classList.toggle("hidden", total === 0);
  });
  if (inboxLastUnreadTotal === -1) {
    inboxLastUnreadTotal = total;
    return;
  }
  if (total > inboxLastUnreadTotal && typeof playNotificationSound === "function") {
    playNotificationSound();
  }
  inboxLastUnreadTotal = total;
}

// Keeps the sidebar badge current even while the user is on another page -
// loadInboxConversations() only runs while the Suhbatlar page itself is
// open, so this is hooked into the app's global sync loop instead.
async function refreshInboxUnreadBadge() {
  if (!state.user) return;
  try {
    const res = await apiFetch("/api/conversations", { cache: "no-store" });
    const data = await res.json();
    if (!data?.success) return;
    const items = Array.isArray(data.items) ? data.items : [];
    const total = items.reduce((sum, c) => sum + Math.max(0, Number(c.unread_count) || 0), 0);
    updateInboxUnreadBadge(total);
  } catch {
    // keep previous badge state on transient network errors
  }
}

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
  if (c.platform === "whatsapp") {
    return `<form class="channel-edit-form" data-edit-submit="${escapeHtml(c.id)}" data-edit-platform="whatsapp">
      <input name="phoneNumberId" type="text" placeholder="Phone Number ID" value="${escapeHtml(c.external_account_id || "")}" required />
      <input name="accessToken" type="password" placeholder="Yangi Access Token" autocomplete="off" spellcheck="false" required />
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
  if (platform === "whatsapp") {
    payload.phoneNumberId = String(fd.get("phoneNumberId") || "").trim();
    payload.accessToken = String(fd.get("accessToken") || "").trim();
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
  if (inboxThreadTypeFilter) params.set("thread_type", inboxThreadTypeFilter);

  try {
    const res = await apiFetch(`/api/conversations?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (!data?.success) return;
    inboxConversationCache = Array.isArray(data.items) ? data.items : [];
    renderInboxConversationList(inboxConversationCache);
    if (!status && !platform && !inboxThreadTypeFilter) {
      const total = inboxConversationCache.reduce((sum, c) => sum + Math.max(0, Number(c.unread_count) || 0), 0);
      updateInboxUnreadBadge(total);
    }
  } catch {
    // keep previous list on transient network errors
  }
}

function inboxPlatformBadge(platform) {
  const map = { telegram: "TG", facebook: "FB", instagram: "IG", whatsapp: "WA", meta_ads: "ADS", google_sheets: "GS" };
  return map[platform] || String(platform || "").slice(0, 2).toUpperCase();
}

// Official brand marks, traced from each platform's own logo geometry rather
// than approximated - they render crisply at any size because they are vector
// paths, and they inherit the surrounding colour via currentColor so the same
// markup works on a coloured badge and on a white card.
const PLATFORM_ICON_PATHS = {
  telegram: '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>',
  whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
  facebook: '<path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>',
  instagram: '<path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>',
  google_sheets: '<path d="M11.318 12.545H7.91v-1.909h3.41v1.91zM14.728 0v6h6l-6-6zm1.363 10.636h-3.41v1.91h3.41v-1.91zm0 3.273h-3.41v1.91h3.41v-1.91zM20.727 6.5v15.864c0 .904-.732 1.636-1.636 1.636H4.909a1.636 1.636 0 0 1-1.636-1.636V1.636C3.273.732 4.005 0 4.909 0h9.318v6.5h6.5zm-3.273 2.773H6.545v7.909h10.91v-7.91zm-6.136 4.636H7.91v1.91h3.41v-1.91z"/>',
  meta_ads: '<path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"/>',
};

function inboxPlatformIcon(platform, size = 16) {
  const paths = PLATFORM_ICON_PATHS[platform];
  if (!paths) return "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${paths}</svg>`;
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
    listEl.innerHTML = `<p class="muted" style="padding:16px">${escapeHtml(query ? t("inboxNoResultsFound") : t("inboxNoConversationsYet"))}</p>`;
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
      // A plain date and time, not a countdown. The old "javob oynasi"
      // counter answered a question nobody was asking and hid the one thing
      // that matters at a glance: when the message actually arrived.
      const when = typeof fmtDateTime === "function" ? fmtDateTime(c.last_message_at) : String(c.last_message_at || "").slice(0, 16);
      const kind = inboxIsCommentThread(c)
        ? `<span class="inbox-conv-kind is-comment">${escapeHtml(t("inboxThreadComment"))}</span>`
        : "";
      const manager = c.assigned_manager_name
        ? `<span class="inbox-conv-owner">${escapeHtml(c.assigned_manager_name)}</span>`
        : `<span class="inbox-conv-owner inbox-conv-unassigned">${escapeHtml(t("inboxUnassigned"))}</span>`;
      return `
        <button type="button" class="inbox-conversation-item ${active}" data-conversation-id="${escapeHtml(c.id)}">
          <span class="inbox-conv-badge inbox-badge-${escapeHtml(c.platform)}">${inboxPlatformIcon(c.platform) || escapeHtml(inboxPlatformBadge(c.platform))}</span>
          <span class="inbox-conv-main">
            <span class="inbox-conv-title">
              <strong>${escapeHtml(inboxContactLabel(c))}</strong>
              ${kind}
            </span>
            <span class="inbox-conv-preview">${escapeHtml(c.last_message_preview || "")}</span>
            ${manager}
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
// targetolog sees every conversation (server-side: INBOX_READ_ONLY_ROLES in
// functions/api/_conversation_access.js) but must not reply, assign, close,
// or convert one to a lead - the write endpoints reject it either way, this
// just keeps the UI from offering controls that would only ever 403.
function isInboxReadOnly() {
  return state.user?.role === "targetolog";
}

async function openInboxConversation(id, items) {
  inboxActiveConversationId = id;
  clearInboxReplyTarget();
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
  if (convo) {
    document.getElementById("inboxThreadName").textContent = inboxContactLabel(convo);
    document.getElementById("inboxThreadPlatform").textContent = inboxPlatformBadge(convo.platform);
    const isComment = inboxIsCommentThread(convo);
    const kindEl = document.getElementById("inboxThreadKind");
    if (kindEl) {
      kindEl.textContent = isComment ? t("inboxThreadComment") : t("inboxThreadDirect");
      kindEl.classList.toggle("is-comment", isComment);
    }
    renderInboxThreadTime(convo);
    populateInboxManagerSelect(convo.assigned_manager_id);
    // Meta's comment endpoints accept text only, so the attachment tools
    // would just produce a failed send on a comment thread.
    document.getElementById("inboxAttachBtn")?.classList.toggle("hidden", isComment);
    document.getElementById("inboxLocationBtn")?.classList.toggle("hidden", isComment);
    const replyBox = document.getElementById("inboxReplyInput");
    if (replyBox) {
      replyBox.placeholder = isComment ? t("inboxCommentReplyPlaceholder") : t("inboxReplyPlaceholder");
    }
    const convertBtn = document.getElementById("inboxConvertLeadBtn");
    if (convertBtn) {
      const label = convertBtn.querySelector("span");
      if (label) label.textContent = convo.is_lead ? t("inboxLeadDone") : t("inboxMakeLead");
      convertBtn.disabled = readOnly || Boolean(convo.is_lead);
    }
    const deleteBtn = document.getElementById("inboxDeleteConversationBtn");
    if (deleteBtn) deleteBtn.classList.toggle("hidden", readOnly);
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
  const emptyLabel = isFullAccess ? t("inboxUnassigned") : t("inboxNotAssignedToMe");
  select.innerHTML = `<option value="">${emptyLabel}</option>` + managers
    .map((m) => {
      const apiId = String(m.id || "").replace(/^(mgr_|user_)/, "");
      const selected = apiId === String(currentManagerId || "") ? "selected" : "";
      return `<option value="${escapeHtml(apiId)}" ${selected}>${escapeHtml(m.full_name || fullName(m) || m.login)}</option>`;
    })
    .join("");
  select.disabled = isInboxReadOnly();
}

// Replaces the old "Javob oynasi: 21s 57d" countdown. Managers asked for the
// plain date and time of the last message instead: the countdown was noisy,
// needed decoding, and told them nothing they could act on.
function renderInboxThreadTime(convo) {
  const el = document.getElementById("inboxThreadTime");
  if (!el) return;
  const stamp = convo?.last_message_at || convo?.last_inbound_at || "";
  if (!stamp) {
    el.textContent = "";
    return;
  }
  el.textContent = typeof fmtDateTime === "function" ? fmtDateTime(stamp) : String(stamp).slice(0, 16);
}

function resetMobileInboxThread() {
  inboxActiveConversationId = "";
  inboxActiveConversation = null;
  clearInboxReplyTarget();
  document.getElementById("integrationsInboxView")?.classList.remove("mobile-thread-open");
  document.getElementById("inboxThreadActive")?.classList.add("hidden");
  document.getElementById("inboxThreadEmpty")?.classList.remove("hidden");
}

async function loadInboxMessages(conversationId) {
  const wrap = document.getElementById("inboxMessages");
  if (!wrap) return;
  wrap.innerHTML = `<p class="muted">${escapeHtml(t("inboxLoadingMessages"))}</p>`;
  try {
    const res = await apiFetch(`/api/messages?conversation_id=${encodeURIComponent(conversationId)}`, { cache: "no-store" });
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    inboxMessagesCache = items;
    const readOnly = isInboxReadOnly();
    wrap.innerHTML = items
      .map((m) => {
        const mine = m.direction === "out";
        const when = typeof fmtDateTime === "function" ? fmtDateTime(m.created_at) : String(m.created_at || "").slice(0, 16);
        const isImage = m.message_type === "image" && m.attachment_url;
        const attachment = m.attachment_url
          ? isImage
            ? `<a class="inbox-msg-image" href="${escapeHtml(m.attachment_url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(m.attachment_url)}" alt="" loading="lazy" /></a>`
            : `<a class="inbox-msg-attachment" href="${escapeHtml(m.attachment_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("inboxOpenFile"))}</a>`
          : "";
        const parts = inboxQuoteParts(m.body);
        const bodyText = parts ? parts.rest : (m.body || "");
        const quoteHtml = parts ? `<div class="inbox-msg-quote">${escapeHtml(parts.quote)}</div>` : "";
        const delivery = mine && m.delivery_status
          ? `<span class="inbox-msg-delivery">${escapeHtml(m.delivery_status === "sent" ? t("inboxMessageSent") : m.delivery_status)}</span>`
          : "";
        // A reply written in the Instagram/Messenger app arrives as an
        // outbound message with sender_type "channel" - labelling it keeps a
        // manager from wondering who in the CRM sent it.
        const origin = m.sender_type === "channel"
          ? `<span class="inbox-msg-origin">${escapeHtml(t("inboxSentFromApp"))}</span>`
          : "";
        const commentTag = m.message_type === "comment"
          ? `<span class="inbox-msg-origin is-comment">${escapeHtml(t("inboxThreadComment"))}</span>`
          : "";
        const replyBtn = readOnly ? "" : `<button type="button" class="inbox-msg-reply" data-inbox-msg-reply="${escapeHtml(String(m.id || ""))}" aria-label="${escapeHtml(t("inboxReplyAction"))}" title="${escapeHtml(t("inboxReplyAction"))}"><svg viewBox="0 0 24 24"><path d="M10 8V4l-8 7 8 7v-4.1c4 0 7 1.3 9 4.1-.6-4.6-3.4-8.8-9-9Z"/></svg></button>`;
        return `<div class="inbox-msg ${mine ? "inbox-msg-out" : "inbox-msg-in"}">
          ${replyBtn}
          ${quoteHtml}
          ${bodyText ? `<div class="inbox-msg-body">${escapeHtml(bodyText)}</div>` : ""}
          ${attachment}
          <div class="inbox-msg-time">${commentTag}${origin}${delivery}${escapeHtml(when || "")}</div>
        </div>`;
      })
      .join("") || `<p class="muted">${escapeHtml(t("inboxNoMessages"))}</p>`;
    wrap.scrollTop = wrap.scrollHeight;
    wrap.querySelectorAll("[data-inbox-msg-reply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.inboxMsgReply;
        const msg = inboxMessagesCache.find((x) => String(x.id) === String(id));
        if (msg) setInboxReplyTarget(msg);
      });
    });
  } catch {
    wrap.innerHTML = `<p class="muted">${escapeHtml(t("inboxLoadFailed"))}</p>`;
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
  document.querySelectorAll("[data-thread-type]").forEach((tab) => {
    tab.addEventListener("click", () => {
      inboxThreadTypeFilter = tab.dataset.threadType || "";
      document.querySelectorAll("[data-thread-type]").forEach((el) => {
        const on = el === tab;
        el.classList.toggle("active", on);
        el.setAttribute("aria-selected", String(on));
      });
      resetMobileInboxThread();
      loadInboxConversations();
    });
  });
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
    await sendInboxPayload({ body: text });
  });

  document.getElementById("inboxReplyPreviewCancel")?.addEventListener("click", clearInboxReplyTarget);

  document.getElementById("inboxEmojiBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleInboxEmojiPicker();
  });
  document.addEventListener("click", (e) => {
    const pop = document.getElementById("inboxEmojiPicker");
    if (!pop || pop.classList.contains("hidden")) return;
    if (pop.contains(e.target) || e.target.id === "inboxEmojiBtn") return;
    toggleInboxEmojiPicker(true);
  });

  document.getElementById("inboxLocationBtn")?.addEventListener("click", () => {
    if (!inboxActiveConversationId) return;
    if (!navigator.geolocation) {
      alert(t("inboxLocationUnavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const text = `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\nhttps://maps.google.com/?q=${latitude},${longitude}`;
        await sendInboxPayload({ body: text });
      },
      () => alert(t("inboxLocationDenied")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  document.getElementById("inboxAttachBtn")?.addEventListener("click", () => {
    if (!inboxActiveConversationId) return;
    document.getElementById("inboxFileInput")?.click();
  });
  document.getElementById("inboxFileInput")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await sendInboxAttachment(file);
  });

  document.getElementById("inboxAssignManager")?.addEventListener("change", async (e) => {
    if (!inboxActiveConversationId) return;
    const res = await apiFetch("/api/conversations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inboxActiveConversationId, assigned_manager_id: e.target.value || null }),
    });
    if (!res.ok) {
      alert(res.status === 409 ? t("inboxAlreadyClaimed") : t("inboxAssignFailedGeneric"));
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
      alert(t("inboxLeadAdded"));
      loadInboxConversations();
    } else if (data?.error === "already_claimed") {
      alert(t("inboxAlreadyClaimed"));
      resetMobileInboxThread();
      loadInboxConversations();
    } else {
      alert(t("inboxLeadAddFailed"));
    }
  });

  document.getElementById("inboxDeleteConversationBtn")?.addEventListener("click", async () => {
    if (!inboxActiveConversationId) return;
    if (!(await confirmPermanentDelete())) return;
    try {
      const res = await apiFetch("/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inboxActiveConversationId }),
      });
      const data = await res.json();
      if (!data?.success) {
        showToast(t("saveFailed"), "error");
        return;
      }
      resetMobileInboxThread();
      await loadInboxConversations();
    } catch {
      showToast(t("saveFailed"), "error");
    }
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
          facebook_page: "Facebook (texnik token)",
          facebook_oauth: "Facebook OAuth",
          whatsapp_cloud: "WhatsApp Cloud API",
          meta_lead_ads: "Meta Lead Ads",
        }[c.connection_type] || "";
        const capabilities = c.platform === "instagram"
          ? `<span class="channel-source-capabilities"><span>Direct &amp; Stories</span><span>Kommentariyalar</span></span>`
          : c.platform === "facebook"
            ? `<span class="channel-source-capabilities"><span>Messenger</span><span>Kommentariyalar</span></span>`
            : c.platform === "whatsapp"
              ? `<span class="channel-source-capabilities"><span>WhatsApp xabarlar</span><span>Rasm va fayl</span></span>`
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

function setWhatsappStatus(message, tone = "") {
  const status = document.getElementById("whatsappConnectStatus");
  if (!status) return;
  status.textContent = String(message || "");
  status.className = `channel-oauth-status${tone ? ` is-${tone}` : ""}`;
}

function setFacebookOAuthStatus(message, tone = "") {
  const status = document.getElementById("facebookOAuthStatus");
  if (!status) return;
  status.textContent = String(message || "");
  status.className = `channel-oauth-status${tone ? ` is-${tone}` : ""}`;
}

const META_OAUTH_KINDS = {
  instagram: {
    statusFn: (...args) => setInstagramOAuthStatus(...args),
    button: "connectInstagramOAuthBtn",
    successMessage: "Instagram ulandi. Direct va kommentariyalar CRM inboxiga tushadi.",
    successTitle: "Instagram muvaffaqiyatli ulandi.",
    defaultError: "Instagram ulanmagan. Akkaunt ruxsatlarini tekshirib qayta urinib ko'ring.",
  },
  meta_ads: {
    statusFn: (...args) => setMetaAdsOAuthStatus(...args),
    button: "connectMetaAdsOAuthBtn",
    successMessage: "Lead formalar ulandi. Yangi leadlar avtomatik savdo voronkasiga tushadi.",
    successTitle: "Meta Lead Forms muvaffaqiyatli ulandi.",
    defaultError: "Lead formalar ulanmagan. Sahifa va reklama ruxsatlarini tekshiring.",
    noPagesError: "Tanlangan Meta Business hisobida boshqariladigan sahifa topilmadi.",
  },
  facebook: {
    statusFn: (...args) => setFacebookOAuthStatus(...args),
    button: "connectFacebookOAuthBtn",
    successMessage: "Facebook ulandi. Messenger va kommentariyalar CRM inboxiga tushadi.",
    successTitle: "Facebook muvaffaqiyatli ulandi.",
    defaultError: "Facebook ulanmagan. Sahifa ruxsatlarini tekshirib qayta urinib ko'ring.",
    noPagesError: "Tanlangan Meta Business hisobida boshqariladigan sahifa topilmadi.",
  },
  whatsapp: {
    statusFn: (...args) => setWhatsappStatus(...args),
    button: "connectWhatsappOAuthBtn",
    successMessage: "WhatsApp ulandi. Mijoz xabarlari CRM inboxiga tushadi.",
    successTitle: "WhatsApp muvaffaqiyatli ulandi.",
    defaultError: "WhatsApp ulanmagan. Raqam ruxsatlarini tekshirib qayta urinib ko'ring.",
    noAccountsError: "Ruxsat berildi, lekin Meta Business hisobingizda WhatsApp Business akkaunti topilmadi. business.facebook.com > WhatsApp Accounts bo'limida akkaunt yarating va raqamingizni qo'shing.",
  },
};

const META_OAUTH_MESSAGE_TYPES = {
  "kuka-meta-oauth": "instagram",
  "kuka-meta-ads-oauth": "meta_ads",
  "kuka-meta-facebook-oauth": "facebook",
  "kuka-meta-whatsapp-oauth": "whatsapp",
};

function metaOAuthErrorMessage(kind, reason) {
  const cfg = META_OAUTH_KINDS[kind];
  if (reason === "invalid_state" || reason === "expired_state") return "Ulash sessiyasi tugagan. Tugmani qayta bosing.";
  if (reason === "access_revoked") return "Admin ruxsati o'zgargan. CRM'ga qayta kirib urinib ko'ring.";
  if (reason === "no_pages" && cfg.noPagesError) return cfg.noPagesError;
  if (reason === "whatsapp_scope_not_granted") {
    return "Meta ilovangizga WhatsApp mahsuloti qo'shilmagan, shuning uchun ruxsat so'ralmadi. Meta for Developers > ilovangiz > Add product > WhatsApp'ni qo'shing, so'ng qayta urinib ko'ring.";
  }
  if (reason === "no_whatsapp_accounts" && cfg.noAccountsError) return cfg.noAccountsError;
  if (reason === "no_whatsapp_numbers") return "WhatsApp Business akkauntida ulanadigan raqam topilmadi.";
  // Surface the raw provider error code too - a bare default message hides
  // which step actually failed (code exchange vs. profile fetch vs. webhook
  // subscribe), which makes remote debugging effectively impossible.
  return reason ? `${cfg.defaultError} (${reason})` : cfg.defaultError;
}

function applyMetaOAuthResult(kind, success, reason) {
  const cfg = META_OAUTH_KINDS[kind];
  if (!cfg) return;
  if (success) {
    cfg.statusFn(cfg.successMessage, "success");
    showConnectSuccess("Ulandi!", cfg.successTitle);
  } else {
    cfg.statusFn(metaOAuthErrorMessage(kind, reason), "error");
  }
  const btn = document.getElementById(cfg.button);
  if (btn) btn.disabled = false;
  loadChannelsList();
}

function bindMetaOAuthPopupListener() {
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    const kind = META_OAUTH_MESSAGE_TYPES[event.data?.type];
    if (!kind) return;
    applyMetaOAuthResult(kind, Boolean(event.data.success), String(event.data.reason || ""));
  });
}

// Fallback for browsers that block the OAuth popup: meta-oauth-result.js
// then redirects the current tab instead, landing back here with query params.
function handleMetaOAuthReturn() {
  const url = new URL(window.location.href);
  const instagramResult = url.searchParams.get("meta_oauth");
  const adsResult = url.searchParams.get("meta_ads_oauth");
  const facebookResult = url.searchParams.get("meta_facebook_oauth");
  const whatsappResult = url.searchParams.get("meta_whatsapp_oauth");
  if (!instagramResult && !adsResult && !facebookResult && !whatsappResult) return;
  if (typeof switchPage === "function") switchPage("settings");
  if (typeof switchSettingsTab === "function") switchSettingsTab("channels");
  const reason = url.searchParams.get("reason") || "";
  if (instagramResult) applyMetaOAuthResult("instagram", instagramResult === "success", reason);
  if (adsResult) applyMetaOAuthResult("meta_ads", adsResult === "success", reason);
  if (facebookResult) applyMetaOAuthResult("facebook", facebookResult === "success", reason);
  if (whatsappResult) applyMetaOAuthResult("whatsapp", whatsappResult === "success", reason);
  url.searchParams.delete("meta_oauth");
  url.searchParams.delete("meta_ads_oauth");
  url.searchParams.delete("meta_facebook_oauth");
  url.searchParams.delete("meta_whatsapp_oauth");
  url.searchParams.delete("reason");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function openMetaOAuthPopup(url) {
  const width = 640;
  const height = 720;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  const popup = window.open(url, "kuka-meta-oauth", `width=${width},height=${height},left=${left},top=${top}`);
  if (!popup) window.location.assign(url);
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
    openMetaOAuthPopup(data.authorization_url);
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

async function startFacebookOAuth() {
  const button = document.getElementById("connectFacebookOAuthBtn");
  if (!button || button.disabled) return;
  button.disabled = true;
  setFacebookOAuthStatus("Facebook xavfsiz ulanish oynasi tayyorlanmoqda...");
  try {
    const response = await apiFetch("/api/meta-facebook-oauth-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data?.authorization_url) {
      const message = data?.error === "meta_oauth_not_configured"
        ? "Ulash xizmati hali tayyor emas. Texnik administratorga xabar bering."
        : data?.error === "invalid_meta_oauth_redirect"
          ? "Ulash manzili noto'g'ri sozlangan."
          : "Facebook ulanishini boshlab bo'lmadi. Qayta urinib ko'ring.";
      setFacebookOAuthStatus(message, "error");
      button.disabled = false;
      return;
    }
    openMetaOAuthPopup(data.authorization_url);
  } catch {
    setFacebookOAuthStatus("Internet bilan aloqa yo'q. Qayta urinib ko'ring.", "error");
    button.disabled = false;
  }
}

async function startWhatsappOAuth() {
  const button = document.getElementById("connectWhatsappOAuthBtn");
  if (!button || button.disabled) return;
  button.disabled = true;
  setWhatsappStatus("WhatsApp xavfsiz ulanish oynasi tayyorlanmoqda...");
  try {
    const response = await apiFetch("/api/meta-whatsapp-oauth-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data?.authorization_url) {
      const message = data?.error === "meta_oauth_not_configured"
        ? "Ulash xizmati hali tayyor emas. Texnik administratorga xabar bering."
        : data?.error === "invalid_meta_oauth_redirect"
          ? "Ulash manzili noto'g'ri sozlangan."
          : "WhatsApp ulanishini boshlab bo'lmadi. Qayta urinib ko'ring.";
      setWhatsappStatus(message, "error");
      button.disabled = false;
      return;
    }
    openMetaOAuthPopup(data.authorization_url);
  } catch {
    setWhatsappStatus("Internet bilan aloqa yo'q. Qayta urinib ko'ring.", "error");
    button.disabled = false;
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
    openMetaOAuthPopup(data.authorization_url);
  } catch {
    setInstagramOAuthStatus("Internet bilan aloqa yo'q. Qayta urinib ko'ring.", "error");
    button.disabled = false;
  }
}

function bindChannelsEvents() {
  if (channelEventsBound) return;
  channelEventsBound = true;
  bindMetaOAuthPopupListener();

  document.getElementById("connectInstagramOAuthBtn")?.addEventListener("click", startInstagramOAuth);
  document.getElementById("connectMetaAdsOAuthBtn")?.addEventListener("click", startMetaAdsOAuth);
  document.getElementById("connectFacebookOAuthBtn")?.addEventListener("click", startFacebookOAuth);
  document.getElementById("connectWhatsappOAuthBtn")?.addEventListener("click", startWhatsappOAuth);

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

  document.getElementById("connectWhatsappForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    setWhatsappStatus("Raqam tekshirilmoqda...");
    try {
      const res = await apiFetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "whatsapp",
          phoneNumberId: String(fd.get("phoneNumberId") || "").trim(),
          accessToken: String(fd.get("accessToken") || "").trim(),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        form.reset();
        setWhatsappStatus(
          `Ulandi${data.display_phone_number ? `: ${data.display_phone_number}` : ""}. Meta App'da webhook URL sifatida ${data.webhook_url} va "messages" maydonini yoqing.`,
          "success",
        );
        showConnectSuccess("Ulandi!", "WhatsApp muvaffaqiyatli ulandi.");
        loadChannelsList();
      } else if (data?.error === "whatsapp_credentials_required") {
        setWhatsappStatus("Phone Number ID va Access Token to'ldirilishi shart.", "error");
      } else {
        setWhatsappStatus(`Ulanmadi${data?.provider_error ? `: ${data.provider_error}` : "."}`, "error");
      }
    } catch {
      setWhatsappStatus("Internet bilan aloqa yo'q. Qayta urinib ko'ring.", "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
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

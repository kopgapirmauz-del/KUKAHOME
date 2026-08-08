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
  telegram: '<path d="M23.91 3.79 20.3 20.84c-.25 1.21-.98 1.5-2 .94l-5.5-4.07-2.66 2.57c-.3.3-.55.56-1.1.56-.72 0-.6-.27-.84-.95L6.3 13.7l-5.45-1.7c-1.18-.35-1.19-1.16.26-1.75l21.26-8.2c.97-.43 1.9.24 1.54 1.73Z"/>',
  facebook: '<path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"/>',
  instagram: '<path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"/>',
  whatsapp: '<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35ZM12.05 21.8h-.02a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37a9.78 9.78 0 0 1-1.5-5.22c0-5.4 4.4-9.8 9.82-9.8 2.62 0 5.08 1.03 6.93 2.88a9.74 9.74 0 0 1 2.87 6.93c0 5.4-4.4 9.81-9.8 9.81ZM20.52 3.45A11.75 11.75 0 0 0 12.05 0C5.55 0 .26 5.29.26 11.79c0 2.08.54 4.1 1.58 5.9L.16 24l6.45-1.69a11.76 11.76 0 0 0 5.44 1.38h.01c6.5 0 11.79-5.29 11.79-11.79 0-3.15-1.23-6.11-3.45-8.34Z"/>',
  google_sheets: '<path d="M14.73 0H4.36C3.6 0 3 .6 3 1.36v21.28C3 23.4 3.6 24 4.36 24h15.28c.75 0 1.36-.6 1.36-1.36V6.27L14.73 0Z"/><path d="M14.73 0v4.9c0 .76.6 1.37 1.36 1.37H21L14.73 0Z" opacity=".55"/><path d="M7.36 11.32v7.09h9.28v-7.09H7.36Zm4.09 5.86H8.6v-1.6h2.85v1.6Zm0-2.84H8.6v-1.6h2.85v1.6Zm3.95 2.84h-2.84v-1.6h2.84v1.6Zm0-2.84h-2.84v-1.6h2.84v1.6Z" fill="#fff"/>',
  meta_ads: '<path d="M5.4 17.7c-1.7 0-2.9-1.3-2.9-3.1 0-2.6 2-6.6 4.2-6.6 1.3 0 2.3 1.6 3.8 4l.7 1 1.5-2.4C14.2 8.3 15.3 7 17 7c2.8 0 4.5 4.1 4.5 7.5 0 2-1.1 3.2-2.8 3.2-1.6 0-2.7-1.2-4.7-4.2l-1-1.6-.7 1.1c-2 3.2-3.5 4.7-6.9 4.7Zm1.2-7.6c-.9 0-2.4 2.9-2.4 4.5 0 .9.4 1.4 1.2 1.4 1.6 0 2.8-1.3 4.7-4.2-1.5-2.3-2.3-3.7-3.5-3.7Zm10.4-1.4c-.9 0-1.7 1-3 3l1.4 2.1c1.5 2.2 2.2 2.5 3.3 2.5.7 0 1.1-.5 1.1-1.7 0-2.5-1.2-5.9-2.8-5.9Z"/>',
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
};

const META_OAUTH_MESSAGE_TYPES = {
  "kuka-meta-oauth": "instagram",
  "kuka-meta-ads-oauth": "meta_ads",
  "kuka-meta-facebook-oauth": "facebook",
};

function metaOAuthErrorMessage(kind, reason) {
  const cfg = META_OAUTH_KINDS[kind];
  if (reason === "invalid_state" || reason === "expired_state") return "Ulash sessiyasi tugagan. Tugmani qayta bosing.";
  if (reason === "access_revoked") return "Admin ruxsati o'zgargan. CRM'ga qayta kirib urinib ko'ring.";
  if (reason === "no_pages" && cfg.noPagesError) return cfg.noPagesError;
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
  if (!instagramResult && !adsResult && !facebookResult) return;
  if (typeof switchPage === "function") switchPage("settings");
  if (typeof switchSettingsTab === "function") switchSettingsTab("channels");
  const reason = url.searchParams.get("reason") || "";
  if (instagramResult) applyMetaOAuthResult("instagram", instagramResult === "success", reason);
  if (adsResult) applyMetaOAuthResult("meta_ads", adsResult === "success", reason);
  if (facebookResult) applyMetaOAuthResult("facebook", facebookResult === "success", reason);
  url.searchParams.delete("meta_oauth");
  url.searchParams.delete("meta_ads_oauth");
  url.searchParams.delete("meta_facebook_oauth");
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

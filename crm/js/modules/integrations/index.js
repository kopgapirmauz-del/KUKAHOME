let integrationEventsBound = false;
let integrationEditingConnectionId = "";
let integrationDragLeadId = "";
let integrationViewMode = "columns";
let integrationSearchTerm = "";

function ensureIntegrationsState() {
  state.db.integrations = state.db.integrations && typeof state.db.integrations === "object" ? state.db.integrations : {};
  const integrations = state.db.integrations;
  integrations.connections = Array.isArray(integrations.connections) ? integrations.connections : [];
  integrations.columns = Array.isArray(integrations.columns) ? integrations.columns : [];
  integrations.leads = Array.isArray(integrations.leads) ? integrations.leads : [];

  if (!integrations.columns.length) {
    integrations.columns = [{ id: "new", title: t("sourceNewClient") }];
  }

  const hadWorkedColumn = integrations.columns.some((c) => String(c.id || "") === "worked");
  if (hadWorkedColumn) {
    integrations.columns = integrations.columns.filter((c) => String(c.id || "") !== "worked");
    integrations.leads.forEach((lead) => {
      if (String(lead.columnId || "") === "worked") lead.columnId = "new";
    });
  }

  if (!integrations.columns.some((c) => String(c.id || "") === "new")) {
    integrations.columns.unshift({ id: "new", title: t("sourceNewClient") });
  }
  return integrations;
}

function integrationPlatformLabel(platform) {
  if (platform === "whatsapp") return "WhatsApp";
  if (platform === "facebook") return "Facebook";
  if (platform === "telegram") return "Telegram";
  return "Instagram";
}

function integrationColumnAccent(columnId, idx) {
  const integrations = ensureIntegrationsState();
  const byId = integrations.columns.find((c) => String(c.id || "") === String(columnId || ""));
  const custom = String(byId?.color || "").trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(custom)) return custom;
  const fixed = {
    new: "#111111",
  };
  if (fixed[columnId]) return fixed[columnId];
  const palette = ["#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa", "#fb7185", "#22d3ee"];
  return palette[idx % palette.length];
}

function integrationLeadInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "L";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function integrationLeadDateLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (typeof fmtDateTime === "function") {
    const full = String(fmtDateTime(raw) || "").trim();
    if (!full) return "";
    if (full.includes(" | ")) return full;
    const normalized = full.replace(",", " ").replace(/\s+/g, " ").trim();
    const m = normalized.match(/^(.*?)(\d{1,2}:\d{2})$/);
    if (m) return `${m[1].trim()} | ${m[2]}`;
    return normalized;
  }
  if (typeof fmtDate === "function") return fmtDate(raw);
  return raw.slice(0, 10);
}

function renderIntegrationsPage() {
  if (!state.user) return;
  const integrations = ensureIntegrationsState();
  bindIntegrationEvents();

  const isAdmin = state.user.role === "admin";
  const addColumnBtn = document.getElementById("integrationAddColumnBtn");
  if (addColumnBtn) addColumnBtn.classList.toggle("hidden", !isAdmin);

  document.querySelectorAll("[data-platform-trigger]").forEach((btn) => {
    const platform = String(btn.dataset.platform || "instagram");
    const connected = integrations.connections.some((c) => c.platform === platform);
    btn.classList.toggle("connected", connected);
  });

  const columnsEl = document.getElementById("integrationColumns");
  if (!columnsEl) return;
  const searchInput = document.getElementById("integrationSearchInput");
  if (searchInput && searchInput.value !== integrationSearchTerm) {
    searchInput.value = integrationSearchTerm;
  }

  const searchValue = String(integrationSearchTerm || "").trim().toLowerCase();
  const visibleLeads = !searchValue
    ? integrations.leads.slice()
    : integrations.leads.filter((lead) => {
      const haystack = [
        lead.fullName,
        lead.contact,
        lead.message,
        integrationPlatformLabel(lead.platform || "instagram"),
        lead.channel,
      ].map((v) => String(v || "").toLowerCase()).join(" ");
      return haystack.includes(searchValue);
    });

  const countEl = document.getElementById("integrationConversationCount");
  if (countEl) {
    countEl.textContent = `${visibleLeads.length} ${t("integrationConversationCount")}`;
  }

  const listBtn = document.getElementById("integrationViewListBtn");
  const columnsBtn = document.getElementById("integrationViewColumnsBtn");
  if (listBtn) listBtn.classList.toggle("active", integrationViewMode === "list");
  if (columnsBtn) columnsBtn.classList.toggle("active", integrationViewMode !== "list");

  if (integrationViewMode === "list") {
    const stageMap = new Map(integrations.columns.map((c) => [String(c.id), String(c.title || "-")]));
    if (!visibleLeads.length) {
      columnsEl.innerHTML = `<div class="integration-list-view"><p class="muted">${escapeHtml(t("integrationNoLeads"))}</p></div>`;
    } else {
      columnsEl.innerHTML = `<div class="integration-list-view"><div class="integration-list-head"><span>${escapeHtml(t("hrCandidate"))}</span><span>${escapeHtml(t("contact"))}</span><span>${escapeHtml(t("source"))}</span><span>${escapeHtml(t("status"))}</span><span>${escapeHtml(t("date"))}</span>${isAdmin ? `<span>${escapeHtml(t("action"))}</span>` : ""}</div><div class="integration-list-body">${visibleLeads.map((lead) => {
        const dateLabel = integrationLeadDateLabel(lead.updatedAt || lead.createdAt);
        const stage = stageMap.get(String(lead.columnId || "new")) || "-";
        const actions = isAdmin
          ? `<span class="integration-list-actions"><button type="button" class="action-btn" data-lead-reply="${escapeHtml(String(lead.id || ""))}" title="${escapeHtml(t("integrationReply"))}"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/></svg></button><button type="button" class="action-btn" data-lead-edit="${escapeHtml(String(lead.id || ""))}" title="${escapeHtml(t("integrationEdit"))}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button type="button" class="action-btn" data-lead-convert="${escapeHtml(String(lead.id || ""))}" title="${escapeHtml(t("integrationToClient"))}"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 9Z"/></svg></button><button type="button" class="action-btn" data-lead-delete="${escapeHtml(String(lead.id || ""))}" title="${escapeHtml(t("deleteAction"))}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span>`
          : "";
        return `<article class="integration-list-row"><span>${escapeHtml(String(lead.fullName || t("integrationUnknownLead")))}</span><span>${escapeHtml(String(lead.contact || "-"))}</span><span>${escapeHtml(integrationPlatformLabel(lead.platform || "instagram"))}</span><span>${escapeHtml(stage)}</span><span>${escapeHtml(dateLabel)}</span>${isAdmin ? actions : ""}</article>`;
      }).join("")}</div></div>`;
    }

    columnsEl.querySelectorAll("button[data-lead-edit]").forEach((btn) => {
      btn.addEventListener("click", () => editIntegrationLead(btn.dataset.leadEdit));
    });
    columnsEl.querySelectorAll("button[data-lead-delete]").forEach((btn) => {
      btn.addEventListener("click", () => deleteIntegrationLead(btn.dataset.leadDelete));
    });
    columnsEl.querySelectorAll("button[data-lead-reply]").forEach((btn) => {
      btn.addEventListener("click", () => replyIntegrationLead(btn.dataset.leadReply));
    });
    columnsEl.querySelectorAll("button[data-lead-convert]").forEach((btn) => {
      btn.addEventListener("click", () => convertLeadToClient(btn.dataset.leadConvert));
    });

    renderIntegrationConnections();
    return;
  }

  columnsEl.innerHTML = integrations.columns.map((column, idx) => {
    const items = visibleLeads.filter((lead) => String(lead.columnId || "new") === String(column.id));
    const cards = items.length
      ? items.map((lead) => {
        const actions = "";
        const dateLabel = integrationLeadDateLabel(lead.updatedAt || lead.createdAt);
        const initials = escapeHtml(integrationLeadInitials(lead.fullName || ""));
        const avatarUrl = String(lead.avatar || lead.avatarUrl || "").trim();
        const avatarBlock = avatarUrl
          ? `<img class="integration-card-avatar-img" src="${escapeHtml(avatarUrl)}" alt="" />`
          : `<span class="integration-card-avatar-fallback">${initials}</span>`;
        const noteText = String(lead.message || "-").trim();
        const quickActions = isAdmin
          ? `<div class="integration-card-quick-actions"><button type="button" class="action-btn danger" draggable="false" data-lead-delete="${lead.id}" title="${escapeHtml(t("deleteAction"))}" aria-label="${escapeHtml(t("deleteAction"))}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button><button type="button" class="action-btn success" draggable="false" data-lead-mark="${lead.id}" title="${escapeHtml(t("markRead"))}" aria-label="${escapeHtml(t("markRead"))}"><svg viewBox="0 0 24 24"><path d="M20.3 6.7a1 1 0 0 0-1.4-1.4l-9 9-3.2-3.2a1 1 0 0 0-1.4 1.4l3.9 3.9a1 1 0 0 0 1.4 0l9.7-9.7Z"/></svg></button></div>`
          : "";
        return `<article class="integration-card${isAdmin ? " integration-card-draggable" : ""}" ${isAdmin ? `draggable="true" data-lead-draggable="${lead.id}"` : ""}><div class="integration-card-top"><span class="integration-card-avatar">${avatarBlock}</span><div class="integration-card-head"><p class="integration-card-title">${escapeHtml(String(lead.fullName || t("integrationUnknownLead")))}</p><p class="integration-card-note integration-card-note-compact">${escapeHtml(noteText)}</p></div><p class="integration-card-date">${escapeHtml(dateLabel)}</p></div>${quickActions}${actions}</article>`;
      }).join("")
      : `<p class="muted">${escapeHtml(t("integrationNoLeads"))}</p>`;
    const addLeadBtn = "";
    const deleteColBtn = isAdmin && !["new", "worked"].includes(String(column.id))
      ? `<button class="btn btn-light" type="button" data-delete-column="${column.id}">${escapeHtml(t("integrationDeleteColumn"))}</button>`
      : "";
    const accent = integrationColumnAccent(String(column.id || ""), idx);
    const applicationsMeta = `<p class="integration-column-apps">${escapeHtml(`Arizalar soni: ${items.length}`)}</p><div class="integration-column-divider" aria-hidden="true"></div>`;
    return `<section class="integration-column" style="--integration-accent:${escapeHtml(accent)}"><div class="integration-column-head"><h4>${escapeHtml(String(column.title || "Ustun"))}</h4></div><div class="integration-column-actions">${addLeadBtn}${deleteColBtn}</div>${applicationsMeta}<div class="integration-column-cards" data-column-drop="${escapeHtml(String(column.id || ""))}">${cards}</div></section>`;
  }).join("");

  columnsEl.querySelectorAll("button[data-add-lead]").forEach((btn) => {
    btn.addEventListener("click", () => addIntegrationLead(btn.dataset.addLead));
  });
  columnsEl.querySelectorAll("button[data-lead-edit]").forEach((btn) => {
    btn.addEventListener("click", () => editIntegrationLead(btn.dataset.leadEdit));
  });
  columnsEl.querySelectorAll("button[data-lead-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteIntegrationLead(btn.dataset.leadDelete));
  });
  columnsEl.querySelectorAll("button[data-lead-reply]").forEach((btn) => {
    btn.addEventListener("click", () => replyIntegrationLead(btn.dataset.leadReply));
  });
  columnsEl.querySelectorAll("button[data-lead-convert]").forEach((btn) => {
    btn.addEventListener("click", () => convertLeadToClient(btn.dataset.leadConvert));
  });
  columnsEl.querySelectorAll("button[data-lead-mark]").forEach((btn) => {
    btn.addEventListener("click", () => markIntegrationLeadRead(btn.dataset.leadMark));
  });
  columnsEl.querySelectorAll("button[data-delete-column]").forEach((btn) => {
    btn.addEventListener("click", () => deleteIntegrationColumn(btn.dataset.deleteColumn));
  });

  if (isAdmin) bindIntegrationDragAndDrop(columnsEl);

  renderIntegrationConnections();
}

function bindIntegrationDragAndDrop(root) {
  root.querySelectorAll("[data-lead-draggable]").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      if (e.target && e.target.closest("button")) {
        e.preventDefault();
        return;
      }
      const leadId = String(card.dataset.leadDraggable || "");
      if (!leadId) {
        e.preventDefault();
        return;
      }
      integrationDragLeadId = leadId;
      card.classList.add("is-dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", leadId);
      }
    });
    card.addEventListener("dragend", () => {
      integrationDragLeadId = "";
      card.classList.remove("is-dragging");
      document.querySelectorAll(".integration-column-cards.drag-over").forEach((el) => el.classList.remove("drag-over"));
    });
  });

  root.querySelectorAll("[data-column-drop]").forEach((dropZone) => {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-over");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      const targetColumnId = String(dropZone.dataset.columnDrop || "");
      const leadId = integrationDragLeadId || String(e.dataTransfer?.getData("text/plain") || "");
      if (!targetColumnId || !leadId) return;
      moveIntegrationLeadToColumn(leadId, targetColumnId);
    });
  });
}

function moveIntegrationLeadToColumn(leadId, columnId) {
  if (state.user?.role !== "admin") return;
  const integrations = ensureIntegrationsState();
  const lead = integrations.leads.find((x) => String(x.id) === String(leadId));
  if (!lead) return;
  if (String(lead.columnId || "new") === String(columnId)) return;
  lead.columnId = String(columnId);
  lead.status = String(columnId) === "worked" ? "converted" : "in_progress";
  lead.updatedAt = new Date().toISOString();
  saveDB();
  renderIntegrationsPage();
}

function bindIntegrationEvents() {
  if (integrationEventsBound) return;
  integrationEventsBound = true;

  const settingsBtn = document.getElementById("integrationSettingsBtn");
  const modal = document.getElementById("integrationSettingsModal");
  const closeBtn = document.getElementById("closeIntegrationSettingsModal");
  const form = document.getElementById("integrationConnectionForm");
  const addColumnBtn = document.getElementById("integrationAddColumnBtn");
  const viewListBtn = document.getElementById("integrationViewListBtn");
  const viewColumnsBtn = document.getElementById("integrationViewColumnsBtn");
  const searchInput = document.getElementById("integrationSearchInput");

  if (settingsBtn && modal) settingsBtn.addEventListener("click", () => toggleModal(modal, true));
  document.querySelectorAll("[data-platform-trigger]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (modal) toggleModal(modal, true);
    });
  });
  if (closeBtn && modal) closeBtn.addEventListener("click", () => toggleModal(modal, false));
  if (modal) modal.addEventListener("click", () => {});

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (state.user?.role !== "admin") return;
      const integrations = ensureIntegrationsState();
      const fd = new FormData(form);
      const payload = {
        id: integrationEditingConnectionId || uid("conn"),
        platform: String(fd.get("platform") || "instagram"),
        account: String(fd.get("account") || "").trim(),
        token: String(fd.get("token") || "").trim(),
        note: String(fd.get("note") || "").trim(),
        updatedAt: new Date().toISOString(),
      };
      if (!payload.account || !payload.token) {
        showToast(t("fillRequired"));
        return;
      }
      const idx = integrations.connections.findIndex((c) => c.id === payload.id);
      if (idx >= 0) integrations.connections[idx] = payload;
      else integrations.connections.unshift(payload);
      integrationEditingConnectionId = "";
      form.reset();
      saveDB();
      renderIntegrationsPage();
      showToast(t("integrationSaved"));
    });
  }

  if (addColumnBtn) {
    addColumnBtn.addEventListener("click", () => {
      if (state.user?.role !== "admin") return;
      const title = window.prompt(t("integrationAddColumn"), t("integrationAddColumn"));
      if (!title) return;
      const colorInput = window.prompt("Ustun chiziq rangi (#000000)", "#111111") || "#111111";
      const color = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(colorInput).trim()) ? String(colorInput).trim() : "#111111";
      const integrations = ensureIntegrationsState();
      integrations.columns.push({ id: uid("col"), title: String(title).trim() || t("integrationAddColumn"), color });
      saveDB();
      renderIntegrationsPage();
    });
  }

  if (viewListBtn) {
    viewListBtn.addEventListener("click", () => {
      integrationViewMode = "list";
      renderIntegrationsPage();
    });
  }
  if (viewColumnsBtn) {
    viewColumnsBtn.addEventListener("click", () => {
      integrationViewMode = "columns";
      renderIntegrationsPage();
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      integrationSearchTerm = String(e.target.value || "");
      renderIntegrationsPage();
    });
  }
}

function renderIntegrationConnections() {
  const list = document.getElementById("integrationConnectionsList");
  if (!list) return;
  const integrations = ensureIntegrationsState();
  if (!integrations.connections.length) {
    list.innerHTML = `<p class="muted">${escapeHtml(t("integrationNoConnections"))}</p>`;
    return;
  }
  list.innerHTML = integrations.connections.map((conn) => {
    return `<article class="framed integrations-connection-item"><div><strong>${escapeHtml(integrationPlatformLabel(conn.platform))}</strong><p class="muted">${escapeHtml(conn.account)}</p></div><div class="chip-actions"><button class="action-btn" type="button" data-conn-edit="${conn.id}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" type="button" data-conn-delete="${conn.id}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></div></article>`;
  }).join("");

  list.querySelectorAll("button[data-conn-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.user?.role !== "admin") return;
      const integrations = ensureIntegrationsState();
      const row = integrations.connections.find((c) => c.id === btn.dataset.connEdit);
      const form = document.getElementById("integrationConnectionForm");
      if (!row || !form) return;
      integrationEditingConnectionId = row.id;
      form.platform.value = row.platform;
      form.account.value = row.account;
      form.token.value = row.token;
      form.note.value = row.note || "";
    });
  });
  list.querySelectorAll("button[data-conn-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (state.user?.role !== "admin") return;
      if (!(await confirmPermanentDelete())) return;
      const integrations = ensureIntegrationsState();
      integrations.connections = integrations.connections.filter((c) => c.id !== btn.dataset.connDelete);
      saveDB();
      renderIntegrationsPage();
    });
  });
}

function addIntegrationLead(columnId) {
  if (state.user?.role !== "admin") return;
  const fullName = window.prompt(t("sourceNewClient"), "");
  if (!fullName) return;
  const contact = window.prompt(t("contact"), "") || "";
  const message = window.prompt(t("comment"), "") || "";
  const platform = String(window.prompt("Platforma: instagram/facebook/whatsapp/telegram", "instagram") || "instagram").toLowerCase();
  const channel = String(window.prompt("Kanal: direct/comment", "direct") || "direct").toLowerCase();
  const adSource = String(window.prompt("Qaysi reklama manbasidan keldi", "Instagram reklama") || "").trim();
  const integrations = ensureIntegrationsState();
  integrations.leads.unshift({
    id: uid("lead"),
    fullName: String(fullName).trim(),
    contact: String(contact).trim(),
    message: String(message).trim(),
    platform: ["facebook", "telegram", "instagram", "whatsapp"].includes(platform) ? platform : "instagram",
    channel: channel === "comment" ? "comment" : "direct",
    columnId: "new",
    adSource,
    status: "new",
    createdAt: new Date().toISOString(),
  });
  saveDB();
  renderIntegrationsPage();
}

function editIntegrationLead(leadId) {
  if (state.user?.role !== "admin") return;
  const integrations = ensureIntegrationsState();
  const lead = integrations.leads.find((x) => x.id === leadId);
  if (!lead) return;
  const nextName = window.prompt(t("sourceNewClient"), lead.fullName || "");
  if (!nextName) return;
  lead.fullName = String(nextName).trim();
  lead.contact = String(window.prompt(t("contact"), lead.contact || "") || "").trim();
  lead.message = String(window.prompt(t("comment"), lead.message || "") || "").trim();
  lead.updatedAt = new Date().toISOString();
  saveDB();
  renderIntegrationsPage();
}

async function deleteIntegrationLead(leadId) {
  if (state.user?.role !== "admin") return;
  if (!(await confirmPermanentDelete())) return;
  const integrations = ensureIntegrationsState();
  integrations.leads = integrations.leads.filter((x) => x.id !== leadId);
  saveDB();
  renderIntegrationsPage();
}

function replyIntegrationLead(leadId) {
  if (state.user?.role !== "admin") return;
  const integrations = ensureIntegrationsState();
  const lead = integrations.leads.find((x) => x.id === leadId);
  if (!lead) return;
  const replyText = window.prompt(t("integrationReply"), "");
  if (!replyText) return;
  lead.lastReply = String(replyText).trim();
  lead.repliedAt = new Date().toISOString();
  lead.status = "in_progress";
  saveDB();
  showToast(t("integrationSaved"));
  renderIntegrationsPage();
}

function markIntegrationLeadRead(leadId) {
  if (state.user?.role !== "admin") return;
  const integrations = ensureIntegrationsState();
  const lead = integrations.leads.find((x) => x.id === leadId);
  if (!lead) return;
  lead.status = "read";
  lead.readAt = new Date().toISOString();
  lead.updatedAt = new Date().toISOString();
  saveDB();
  renderIntegrationsPage();
}

function convertLeadToClient(leadId) {
  if (state.user?.role !== "admin") return;
  const integrations = ensureIntegrationsState();
  const lead = integrations.leads.find((x) => x.id === leadId);
  if (!lead) return;

  const manager = managers()[0];
  const storeId = manager?.storeId || state.db.stores[0]?.id || "";
  if (!manager?.id || !storeId) {
    showToast(t("integrationNeedManagerStore"));
    return;
  }

  state.db.clients = Array.isArray(state.db.clients) ? state.db.clients : [];
  state.db.clients.unshift({
    id: uid("client"),
    date: new Date().toISOString().slice(0, 10),
    contact: String(lead.contact || lead.fullName || "").trim(),
    source: lead.platform === "instagram" ? "instagram" : "new_client",
    interest: String(lead.message || "").trim(),
    comment: `Integratsiya lead: ${lead.fullName || "-"}`,
    attended: "",
    price: null,
    currency: "UZS",
    status: "",
    storeId,
    managerId: manager.id,
    createdAt: new Date().toISOString(),
    createdBy: state.user.id,
  });

  lead.status = "converted";
  lead.convertedAt = new Date().toISOString();
  saveDB();
  showToast(t("integrationConverted"));
  switchPage("clients");
}

async function deleteIntegrationColumn(columnId) {
  if (state.user?.role !== "admin") return;
  const safeId = String(columnId || "");
  if (!safeId || ["new", "worked"].includes(safeId)) return;
  if (!(await confirmPermanentDelete())) return;
  const integrations = ensureIntegrationsState();
  integrations.columns = integrations.columns.filter((x) => x.id !== safeId);
  integrations.leads.forEach((lead) => {
    if (String(lead.columnId || "") === safeId) lead.columnId = "new";
  });
  saveDB();
  renderIntegrationsPage();
}


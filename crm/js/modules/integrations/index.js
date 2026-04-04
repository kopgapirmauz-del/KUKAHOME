let integrationEventsBound = false;
let integrationEditingConnectionId = "";

function ensureIntegrationsState() {
  state.db.integrations = state.db.integrations && typeof state.db.integrations === "object" ? state.db.integrations : {};
  const integrations = state.db.integrations;
  integrations.connections = Array.isArray(integrations.connections) ? integrations.connections : [];
  integrations.columns = Array.isArray(integrations.columns) ? integrations.columns : [];
  integrations.leads = Array.isArray(integrations.leads) ? integrations.leads : [];

  if (!integrations.columns.length) {
    integrations.columns = [
      { id: "new", title: t("sourceNewClient") },
      { id: "worked", title: t("integrationToClient") },
    ];
  }
  return integrations;
}

function integrationPlatformLabel(platform) {
  if (platform === "facebook") return "Facebook";
  if (platform === "telegram") return "Telegram";
  return "Instagram";
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

  columnsEl.innerHTML = integrations.columns.map((column) => {
    const items = integrations.leads.filter((lead) => String(lead.columnId || "new") === String(column.id));
    const cards = items.length
      ? items.map((lead) => {
        const actions = isAdmin
          ? `<div class="integration-card-actions"><button type="button" class="btn btn-light" data-lead-reply="${lead.id}">${escapeHtml(t("integrationReply"))}</button><button type="button" class="btn btn-light" data-lead-edit="${lead.id}">${escapeHtml(t("integrationEdit"))}</button><button type="button" class="btn btn-light" data-lead-convert="${lead.id}">${escapeHtml(t("integrationToClient"))}</button><button type="button" class="btn btn-light" data-lead-delete="${lead.id}">${escapeHtml(t("deleteAction"))}</button></div>`
          : "";
        return `<article class="integration-card"><p class="integration-card-title">${escapeHtml(String(lead.fullName || t("integrationUnknownLead")))}</p><p class="integration-card-meta">${escapeHtml(String(lead.contact || "-"))}</p><p class="integration-card-meta">${escapeHtml(integrationPlatformLabel(lead.platform || "instagram"))} • ${escapeHtml(String(lead.channel || "direct"))}</p><p class="integration-card-note">${escapeHtml(String(lead.message || ""))}</p>${actions}</article>`;
      }).join("")
      : `<p class="muted">${escapeHtml(t("integrationNoLeads"))}</p>`;
    const addLeadBtn = isAdmin ? `<button class="btn btn-primary" type="button" data-add-lead="${column.id}">+ ${escapeHtml(t("sourceNewClient"))}</button>` : "";
    const deleteColBtn = isAdmin && !["new", "worked"].includes(String(column.id))
      ? `<button class="btn btn-light" type="button" data-delete-column="${column.id}">${escapeHtml(t("integrationDeleteColumn"))}</button>`
      : "";
    return `<section class="integration-column"><div class="integration-column-head"><h4>${escapeHtml(String(column.title || "Ustun"))}</h4><span class="integration-column-count">${items.length}</span></div><div class="integration-column-actions">${addLeadBtn}${deleteColBtn}</div><div class="integration-column-cards">${cards}</div></section>`;
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
  columnsEl.querySelectorAll("button[data-delete-column]").forEach((btn) => {
    btn.addEventListener("click", () => deleteIntegrationColumn(btn.dataset.deleteColumn));
  });

  renderIntegrationConnections();
}

function bindIntegrationEvents() {
  if (integrationEventsBound) return;
  integrationEventsBound = true;

  const settingsBtn = document.getElementById("integrationSettingsBtn");
  const modal = document.getElementById("integrationSettingsModal");
  const closeBtn = document.getElementById("closeIntegrationSettingsModal");
  const form = document.getElementById("integrationConnectionForm");
  const addColumnBtn = document.getElementById("integrationAddColumnBtn");

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
      const integrations = ensureIntegrationsState();
      integrations.columns.push({ id: uid("col"), title: String(title).trim() || t("integrationAddColumn") });
      saveDB();
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
  const platform = String(window.prompt("Platforma: instagram/facebook/telegram", "instagram") || "instagram").toLowerCase();
  const channel = String(window.prompt("Kanal: direct/comment", "direct") || "direct").toLowerCase();
  const integrations = ensureIntegrationsState();
  integrations.leads.unshift({
    id: uid("lead"),
    fullName: String(fullName).trim(),
    contact: String(contact).trim(),
    message: String(message).trim(),
    platform: ["facebook", "telegram", "instagram"].includes(platform) ? platform : "instagram",
    channel: channel === "comment" ? "comment" : "direct",
    columnId: String(columnId || "new"),
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

  lead.columnId = integrations.columns.find((c) => c.id === "worked")?.id || lead.columnId;
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


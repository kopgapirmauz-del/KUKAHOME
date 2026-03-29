function renderTableWithLoading() {
  refs.tableLoading.classList.add("show");
  setTimeout(() => {
    renderTable();
    refs.tableLoading.classList.remove("show");
  }, 120);
}

function renderTable() {
  const isAdmin = state.user.role === "admin";
  const headers = [
    t("number"),
    t("date"),
    ...(isAdmin ? [t("store"), t("manager")] : []),
    t("contact"),
    t("source"),
    t("interest"),
    t("comment"),
    t("attended"),
    t("price"),
    t("status"),
    t("action"),
  ];
  refs.tableHeadRow.innerHTML = headers.map((h) => `<th>${h}</th>`).join("");

  const rows = getFilteredClients();
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (state.pageIndex > pageCount) state.pageIndex = pageCount;
  const start = (state.pageIndex - 1) * PAGE_SIZE;
  const current = rows.slice(start, start + PAGE_SIZE);

  if (!current.length) {
    refs.clientsTbody.innerHTML = `<tr><td colspan="${headers.length}">${t("noData")}</td></tr>`;
  } else {
    refs.clientsTbody.innerHTML = current.map((c, idx) => {
      const manager = getUser(c.managerId);
      const store = getStore(c.storeId);
      const canDelete = isAdmin;
      const currency = String(c.currency || "UZS").toUpperCase();
      const symbol = currency === "USD" ? "$" : "SO'M";
      const price = (c.price || c.price === 0) ? `${numberFmt(c.price)} ${symbol}` : "-";
      const attendedText = c.attended === "yes" ? t("attendedYes") : c.attended === "no" ? t("attendedNo") : "-";
      const statusCell = ["green", "yellow", "red"].includes(c.status) ? `<span class="tag ${c.status}">${t(c.status)}</span>` : "-";
      const cells = [
        start + idx + 1,
        fmtDate(c.date),
        ...(isAdmin ? [
          `<span class="cell-text cell-store">${escapeHtml(store ? store.name : "-")}</span>`,
          `<span class="cell-text cell-manager">${escapeHtml(manager ? `${manager.firstName} ${manager.lastName}` : "-")}</span>`,
        ] : []),
        `<span class="cell-text cell-contact">${escapeHtml(c.contact)}</span>`,
        `<span class="cell-text">${escapeHtml(sourceLabel(c.source))}</span>`,
        `<span class="cell-text cell-interest">${escapeHtml(c.interest || "-")}</span>`,
        `<span class="cell-text cell-comment">${escapeHtml(c.comment || "-")}</span>`,
        attendedText,
        price,
        statusCell,
        `<div class="action-pack"><button class="action-btn" data-action="edit" data-id="${c.id}" aria-label="edit"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button>${canDelete ? `<button class="action-btn" data-action="delete" data-id="${c.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button>` : ""}</div>`,
      ];
      return `<tr>${cells.map((v, i) => `<td data-label="${headers[i]}">${v}</td>`).join("")}</tr>`;
    }).join("");
  }

  refs.countInfo.textContent = t("pageInfo").replace("{total}", total).replace("{shown}", current.length);
  renderPagination(pageCount);

  refs.clientsTbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") openClientModal(id);
      if (btn.dataset.action === "delete") deleteClient(id);
    });
  });
}

function renderPagination(pageCount) {
  refs.pagination.innerHTML = "";
  const chunkSize = 10;
  const showChunkNav = pageCount > chunkSize;
  const currentChunk = Math.floor((state.pageIndex - 1) / chunkSize);
  const chunkStart = currentChunk * chunkSize + 1;
  const chunkEnd = Math.min(chunkStart + chunkSize - 1, pageCount);

  if (showChunkNav) {
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "page-btn";
    prev.textContent = "<";
    prev.disabled = chunkStart === 1;
    prev.addEventListener("click", () => {
      const target = Math.max(1, chunkStart - chunkSize);
      if (target === state.pageIndex) return;
      state.pageIndex = target;
      renderTableWithLoading();
    });
    refs.pagination.appendChild(prev);
  }

  for (let i = chunkStart; i <= chunkEnd; i += 1) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `page-btn ${state.pageIndex === i ? "active" : ""}`;
    b.textContent = String(i);
    b.addEventListener("click", () => {
      state.pageIndex = i;
      renderTableWithLoading();
    });
    refs.pagination.appendChild(b);
  }

  if (showChunkNav) {
    const next = document.createElement("button");
    next.type = "button";
    next.className = "page-btn";
    next.textContent = ">";
    next.disabled = chunkEnd >= pageCount;
    next.addEventListener("click", () => {
      const target = Math.min(pageCount, chunkStart + chunkSize);
      if (target === state.pageIndex) return;
      state.pageIndex = target;
      renderTableWithLoading();
    });
    refs.pagination.appendChild(next);
  }
}

function getFilteredClients() {
  return state.db.clients
    .filter((c) => (state.user.role === "admin" ? true : c.managerId === state.user.id))
    .filter((c) => (state.filters.status ? c.status === state.filters.status : true))
    .filter((c) => (state.filters.attended ? c.attended === state.filters.attended : true))
    .filter((c) => (state.filters.storeId ? c.storeId === state.filters.storeId : true))
    .filter((c) => (state.filters.managerId ? c.managerId === state.filters.managerId : true))
    .filter((c) => {
      if (!state.dateRange.from && !state.dateRange.to) return true;
      if (state.dateRange.from && c.date < state.dateRange.from) return false;
      if (state.dateRange.to && c.date > state.dateRange.to) return false;
      return true;
    })
    .filter((c) => {
      const q = state.filters.search.trim().toLowerCase();
      if (!q) return true;
      return [c.contact, c.interest, c.comment, sourceLabel(c.source)].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aTs = Date.parse(a.createdAt || "") || 0;
      const bTs = Date.parse(b.createdAt || "") || 0;
      if (aTs !== bTs) return bTs - aTs;
      const aDate = String(a.date || "");
      const bDate = String(b.date || "");
      if (aDate === bDate) return 0;
      return aDate < bDate ? 1 : -1;
    });
}


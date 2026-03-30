function renderSettings() {
  refs.profileForm.firstName.value = state.user.firstName;
  refs.profileForm.lastName.value = state.user.lastName;
  refs.profileForm.login.value = state.user.login || "";
  refs.profileForm.phone.value = formatUzPhone(state.user.phone || "");
  const isAdmin = state.user.role === "admin";
  if (refs.adminLoginField) refs.adminLoginField.classList.add("hidden");
  refs.adminSettings.classList.toggle("hidden", !isAdmin);
  refs.passwordSettingsCard.classList.toggle("hidden", false);
  if (refs.settingsUsersTab) refs.settingsUsersTab.classList.toggle("hidden", !isAdmin);
  setAdminActionActive(null);
  const requestedTab = isAdmin ? state.settingsTab : "profile";
  switchSettingsTab(requestedTab);
  if (!isAdmin) return;

  if (!refs.managerRoleSelect.value) refs.managerRoleSelect.value = "manager";
  refs.managerStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");
  syncManagerRoleStoreFields("create");

  refs.managerList.innerHTML = state.db.users.filter((u) => u.role !== "admin").map((m, idx) => {
    const store = getStore(m.storeId);
    const name = `${m.lastName || ""} ${m.firstName || ""}`.trim() || m.login || "-";
    const roleText = roleLabel(m.role);
    const lineText = m.role === "manager"
      ? `${idx + 1}. ${name} (${roleText}) - ${store ? store.name : "-"}`
      : `${idx + 1}. ${name} (${roleText})`;
    return `<li><span class="user-row-text">${lineText}</span><span class="chip-actions"><button class="action-btn" data-edit-mid="${m.id}" aria-label="edit"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-mid="${m.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span></li>`;
  }).join("");
  refs.managerList.querySelectorAll("button[data-edit-mid]").forEach((btn) => {
    btn.addEventListener("click", () => openManagerEditModal(btn.dataset.editMid));
  });
  refs.managerList.querySelectorAll("button[data-mid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.mid;
      if (!(await confirmPermanentDelete())) return;
      const deletedViaApi = REMOTE_DB_ENABLED ? await deleteManagerViaApi(id) : false;
      if (deletedViaApi) {
        await loadManagersFromApi();
        await loadClients();
      } else {
        state.db.users = state.db.users.filter((u) => u.id !== id);
        state.db.clients = state.db.clients.filter((c) => c.managerId !== id);
        saveDB();
      }
      renderSettings();
      renderFilters();
      renderTableWithLoading();
      showToast(t("managerDeleted"));
    });
  });

  refs.storeList.innerHTML = state.db.stores.map((s, idx) => `<li><span class="store-row-text">${idx + 1}. ${s.name}</span><span class="chip-actions"><button class="action-btn" data-edit-sid="${s.id}" aria-label="edit"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" data-sid="${s.id}" aria-label="delete"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span></li>`).join("");
  refs.storeList.querySelectorAll("button[data-edit-sid]").forEach((btn) => {
    btn.addEventListener("click", () => openStoreEditModal(btn.dataset.editSid));
  });
  refs.storeList.querySelectorAll("button[data-sid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.sid;
      const inUse = state.db.users.some((u) => u.storeId === id) || state.db.clients.some((c) => c.storeId === id);
      if (inUse) {
        showToast(t("cannotDeleteStore"));
        return;
      }
      if (!(await confirmPermanentDelete())) return;
      state.db.stores = state.db.stores.filter((s) => s.id !== id);
      saveDB();
      renderSettings();
      renderFilters();
      showToast(t("storeDeleted"));
    });
  });
}


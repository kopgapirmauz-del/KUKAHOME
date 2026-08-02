async function onManagerAdd(e) {
  e.preventDefault();
  if (!isAdminRole(state.user.role)) return;
  const fd = new FormData(refs.managerForm);
  const login = String(fd.get("login") || "").trim();
  if (state.db.users.some((u) => u.login === login)) {
    showToast(t("loginTaken"));
    return;
  }
  const role = String(fd.get("role") || "manager");
  const storeIdRaw = String(fd.get("storeId") || "");
  const storeId = roleNeedsStore(role) ? storeIdRaw : "";
  if (roleNeedsStore(role) && !storeId) {
    showToast(t("fillRequired"));
    return;
  }
  const showroom = getStore(storeId)?.name || "";
  const firstName = String(fd.get("firstName") || "").trim();
  const lastName = String(fd.get("lastName") || "").trim();
  const password = String(fd.get("password") || "").trim();
  const phone = formatUzPhone(String(fd.get("phone") || "").trim());
  const telegramId = String(fd.get("telegramId") || "").trim();
  if (!password) {
    showToast(t("fillRequired"));
    return;
  }

  const savedViaApi = await addManagerViaApi({
    full_name: `${firstName} ${lastName}`.trim(),
    login,
    password,
    role,
    showroom,
    phone,
    telegram_id: telegramId,
  });

  if (!savedViaApi) {
    if (REMOTE_DB_ENABLED) {
      showToast(t("saveFailed"), "error");
      return;
    }
    state.db.users.push({
      id: uid("user"),
      role,
      firstName,
      lastName,
      login,
      password,
      phone,
      storeId,
      avatar: defaultAvatar(),
    });
    saveDB();
  } else {
    await loadManagersFromApi();
  }
  refs.managerForm.reset();
  refs.managerRoleSelect.value = "manager";
  syncManagerRoleStoreFields("create");
  renderSettings();
  renderFilters();
  showToast(t("managerAdded"));
  toggleModal(refs.managerModal, false);
}

function openManagerEditModal(managerId) {
  if (!isAdminRole(state.user.role)) return;
  setAdminActionActive("user");
  state.editingManagerId = managerId;
  const manager = state.db.users.find((u) => u.id === managerId && u.role !== "admin");
  if (!manager) return;
  refs.managerEditStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");
  refs.managerEditRoleSelect.value = manager.role || "manager";
  refs.managerEditForm.firstName.value = manager.firstName;
  refs.managerEditForm.lastName.value = manager.lastName;
  refs.managerEditForm.login.value = manager.login;
  refs.managerEditForm.password.value = "";
  refs.managerEditForm.phone.value = formatUzPhone(manager.phone || "");
  refs.managerEditForm.telegramId.value = manager.telegramId || "";
  refs.managerEditForm.storeId.value = manager.storeId || "";
  syncManagerRoleStoreFields("edit");
  toggleModal(refs.managerEditModal, true);
}

function closeManagerEditModal() {
  toggleModal(refs.managerEditModal, false);
  refs.managerEditForm.reset();
  state.editingManagerId = null;
}

async function onManagerEditSubmit(e) {
  e.preventDefault();
  if (!isAdminRole(state.user.role)) return;
  if (!state.editingManagerId) return;
  const manager = state.db.users.find((u) => u.id === state.editingManagerId && u.role !== "admin");
  if (!manager) return;
  const fd = new FormData(refs.managerEditForm);
  const login = String(fd.get("login") || "").trim();
  const loginUsed = state.db.users.some((u) => u.login === login && u.id !== manager.id);
  if (loginUsed) {
    showToast(t("loginTaken"));
    return;
  }
  const nextFirstName = String(fd.get("firstName") || "").trim();
  const nextLastName = String(fd.get("lastName") || "").trim();
  const nextPassword = String(fd.get("password") || "").trim();
  const nextPhone = formatUzPhone(String(fd.get("phone") || "").trim());
  const nextTelegramId = String(fd.get("telegramId") || "").trim();
  const nextRole = String(fd.get("role") || "manager");
  const nextStoreId = String(fd.get("storeId") || "");
  if (roleNeedsStore(nextRole) && !nextStoreId) {
    showToast(t("fillRequired"));
    return;
  }
  const nextManager = {
    ...manager,
    firstName: nextFirstName,
    lastName: nextLastName,
    login,
    password: nextPassword || manager.password || "",
    phone: nextPhone,
    telegramId: nextTelegramId,
    role: nextRole,
    storeId: roleNeedsStore(nextRole) ? nextStoreId : "",
  };
  let updatedViaApi = false;
  if (REMOTE_DB_ENABLED) {
    updatedViaApi = await updateManagerViaApi({
      id: nextManager.id,
      full_name: `${nextManager.firstName} ${nextManager.lastName}`.trim(),
      login: nextManager.login,
      password: nextPassword,
      role: nextManager.role,
      showroom: getStore(nextManager.storeId)?.name || "",
      phone: nextManager.phone || "",
      telegram_id: nextManager.telegramId || "",
    });
  }
  if (updatedViaApi) {
    await loadManagersFromApi();
  } else {
    if (REMOTE_DB_ENABLED) {
      showToast(t("saveFailed"), "error");
      return;
    }
    Object.assign(manager, nextManager);
    saveDB();
  }
  renderSettings();
  renderFilters();
  renderTableWithLoading();
  closeManagerEditModal();
  showToast(t("managerUpdated"));
}


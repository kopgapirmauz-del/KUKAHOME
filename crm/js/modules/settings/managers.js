async function onManagerAdd(e) {
  e.preventDefault();
  if (state.user.role !== "admin") return;
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
  });

  if (!savedViaApi) {
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
  if (state.user.role !== "admin") return;
  setAdminActionActive("user");
  state.editingManagerId = managerId;
  const manager = state.db.users.find((u) => u.id === managerId && u.role !== "admin");
  if (!manager) return;
  refs.managerEditStoreSelect.innerHTML = state.db.stores.map((s) => option(s.id, s.name)).join("");
  refs.managerEditRoleSelect.value = manager.role || "manager";
  refs.managerEditForm.firstName.value = manager.firstName;
  refs.managerEditForm.lastName.value = manager.lastName;
  refs.managerEditForm.login.value = manager.login;
  refs.managerEditForm.password.value = manager.password;
  refs.managerEditForm.phone.value = formatUzPhone(manager.phone || "");
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
  if (state.user.role !== "admin") return;
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
  manager.firstName = String(fd.get("firstName") || "").trim();
  manager.lastName = String(fd.get("lastName") || "").trim();
  manager.login = login;
  const nextPassword = String(fd.get("password") || "").trim();
  manager.password = nextPassword || manager.password || "";
  manager.phone = formatUzPhone(String(fd.get("phone") || "").trim());
  manager.role = String(fd.get("role") || "manager");
  const nextStoreId = String(fd.get("storeId") || "");
  if (roleNeedsStore(manager.role) && !nextStoreId) {
    showToast(t("fillRequired"));
    return;
  }
  manager.storeId = roleNeedsStore(manager.role) ? nextStoreId : "";
  let updatedViaApi = false;
  if (REMOTE_DB_ENABLED) {
    updatedViaApi = await updateManagerViaApi({
      id: manager.id,
      full_name: `${manager.firstName} ${manager.lastName}`.trim(),
      login: manager.login,
      password: manager.password,
      role: manager.role,
      showroom: getStore(manager.storeId)?.name || "",
      phone: manager.phone || "",
    });
  }
  if (updatedViaApi) {
    await loadManagersFromApi();
  } else {
    saveDB();
  }
  renderSettings();
  renderFilters();
  renderTableWithLoading();
  closeManagerEditModal();
  showToast(t("managerUpdated"));
}


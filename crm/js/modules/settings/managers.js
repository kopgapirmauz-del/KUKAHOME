// Keep in sync with MIN_PASSWORD_LENGTH in functions/api/managers.js - a
// password the server rejects must never look like a generic save failure.
const MIN_MANAGER_PASSWORD_LENGTH = 4;

function managerErrorMessage(code) {
  if (code === "invalid_password_length") return t("passwordTooShort");
  if (code === "password_not_stored") return t("passwordNotStored");
  if (code === "invalid_login") return t("invalidLogin");
  return t("saveFailed");
}

async function onManagerAdd(e) {
  e.preventDefault();
  if (!isAdminRole(state.user.role)) return;
  const fd = new FormData(refs.managerForm);
  const login = String(fd.get("login") || "").trim();
  // Logins are compared case-insensitively on the server (and the database
  // enforces that), so "Ali" and "ali" are the same account here too.
  const loginKey = login.toLowerCase();
  if (state.db.users.some((u) => String(u.login || "").trim().toLowerCase() === loginKey)) {
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
  if (password.length < MIN_MANAGER_PASSWORD_LENGTH) {
    showToast(t("passwordTooShort"));
    return;
  }

  const saveResult = await addManagerViaApi({
    full_name: `${firstName} ${lastName}`.trim(),
    login,
    password,
    role,
    showroom,
    phone,
    telegram_id: telegramId,
  });

  if (!saveResult.ok) {
    if (REMOTE_DB_ENABLED) {
      showToast(managerErrorMessage(saveResult.error), "error");
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
  if (nextPassword && nextPassword.length < MIN_MANAGER_PASSWORD_LENGTH) {
    showToast(t("passwordTooShort"));
    return;
  }
  let updateResult = { ok: false, error: "" };
  if (REMOTE_DB_ENABLED) {
    updateResult = await updateManagerViaApi({
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
  if (updateResult.ok) {
    await loadManagersFromApi();
  } else {
    if (REMOTE_DB_ENABLED) {
      showToast(managerErrorMessage(updateResult.error), "error");
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


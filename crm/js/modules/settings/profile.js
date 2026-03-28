async function onProfileSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.profileForm);
  state.user.firstName = String(fd.get("firstName") || "").trim();
  state.user.lastName = String(fd.get("lastName") || "").trim();
  if (state.user.role === "admin") {
    const adminLogin = String(fd.get("adminLogin") || "").trim();
    if (!adminLogin) {
      showToast(t("fillRequired"));
      return;
    }
    const loginUsed = state.db.users.some((u) => u.login === adminLogin && u.id !== state.user.id);
    if (loginUsed) {
      showToast(t("loginTaken"));
      return;
    }
    state.user.login = adminLogin;
  }
  if (REMOTE_DB_ENABLED) {
    const updated = await updateCurrentUserViaApi({
      full_name: fullName(state.user),
      login: state.user.login,
      password: state.user.password,
      role: state.user.role,
      showroom: getStore(state.user.storeId)?.name || "",
    });
    if (!updated) {
      showToast(t("saveFailed"));
      return;
    }
  }
  saveDB();
  localStorage.removeItem(LS_REMEMBER);
  renderProfile();
  showToast(t("profileSaved"));
}

async function onPasswordSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.passwordForm);
  const currentPassword = String(fd.get("currentPassword") || "").trim();
  const newPassword = String(fd.get("newPassword") || "").trim();
  const confirmPassword = String(fd.get("confirmPassword") || "").trim();
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast(t("fillRequired"));
    return;
  }
  if (state.user.password !== currentPassword) {
    showToast(t("currentPasswordWrong"));
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast(t("passwordMismatch"));
    return;
  }
  state.user.password = newPassword;
  if (REMOTE_DB_ENABLED) {
    const updated = await updateCurrentUserViaApi({
      full_name: fullName(state.user),
      login: state.user.login,
      password: state.user.password,
      role: state.user.role,
      showroom: getStore(state.user.storeId)?.name || "",
    });
    if (!updated) {
      showToast(t("saveFailed"));
      return;
    }
  }
  saveDB();
  localStorage.removeItem(LS_REMEMBER);
  refs.passwordForm.reset();
  showToast(t("passwordUpdated"));
}


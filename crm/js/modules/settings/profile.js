async function onProfileSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.profileForm);
  const nextLogin = String(fd.get("login") || "").trim();
  const nextPhone = formatUzPhone(String(fd.get("phone") || "").trim());
  const previous = {
    firstName: state.user.firstName,
    lastName: state.user.lastName,
    login: state.user.login,
    phone: state.user.phone,
  };
  state.user.firstName = String(fd.get("firstName") || "").trim();
  state.user.lastName = String(fd.get("lastName") || "").trim();
  if (!nextLogin) {
    showToast(t("fillRequired"));
    return;
  }
  const loginUsed = state.db.users.some((u) => u.login === nextLogin && u.id !== state.user.id);
  if (loginUsed) {
    showToast(t("loginTaken"));
    return;
  }
  state.user.login = nextLogin;
  state.user.phone = nextPhone;
  if (!state.user.login) {
    showToast(t("fillRequired"));
    return;
  }
  if (REMOTE_DB_ENABLED) {
    const updated = await updateCurrentUserViaApi({
      full_name: fullName(state.user),
      current_login: previous.login,
      login: state.user.login,
      password: state.user.password,
      role: state.user.role,
      showroom: getStore(state.user.storeId)?.name || "",
      phone: state.user.phone || "",
    });
    if (!updated) {
      if (state.user.role === "admin") {
        saveDB();
        await syncDbSnapshotNow();
        localStorage.removeItem(LS_REMEMBER);
        renderProfile();
        showToast(t("profileSaved"));
        return;
      }
      state.user.firstName = previous.firstName;
      state.user.lastName = previous.lastName;
      state.user.login = previous.login;
      state.user.phone = previous.phone;
      showToast(t("saveFailed"));
      return;
    }
  }
  saveDB();
  if (REMOTE_DB_ENABLED) await syncDbSnapshotNow();
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
  const previousPassword = state.user.password;
  state.user.password = newPassword;
  if (REMOTE_DB_ENABLED) {
    const updated = await updateCurrentUserViaApi({
      full_name: fullName(state.user),
      current_login: state.user.login,
      login: state.user.login,
      password: state.user.password,
      role: state.user.role,
      showroom: getStore(state.user.storeId)?.name || "",
      phone: state.user.phone || "",
    });
    if (!updated) {
      if (state.user.role === "admin") {
        saveDB();
        await syncDbSnapshotNow();
        localStorage.removeItem(LS_REMEMBER);
        refs.passwordForm.reset();
        showToast(t("passwordUpdated"));
        return;
      }
      state.user.password = previousPassword;
      showToast(t("saveFailed"));
      return;
    }
  }
  saveDB();
  if (REMOTE_DB_ENABLED) await syncDbSnapshotNow();
  localStorage.removeItem(LS_REMEMBER);
  refs.passwordForm.reset();
  showToast(t("passwordUpdated"));
}


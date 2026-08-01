async function onProfileSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.profileForm);
  const nextFirstName = String(fd.get("firstName") || "").trim();
  const nextLastName = String(fd.get("lastName") || "").trim();
  const nextLogin = String(fd.get("login") || "").trim();
  const nextPhone = formatUzPhone(String(fd.get("phone") || "").trim());
  const nextTelegramId = String(fd.get("telegramId") || "").trim();
  if (!nextFirstName || !nextLogin) {
    showToast(t("fillRequired"));
    return;
  }
  const loginUsed = state.db.users.some((u) => u.login === nextLogin && u.id !== state.user.id);
  if (loginUsed) {
    showToast(t("loginTaken"));
    return;
  }

  if (REMOTE_DB_ENABLED) {
    const result = await updateCurrentUserViaApi({
      full_name: `${nextFirstName} ${nextLastName}`.trim(),
      login: nextLogin,
      phone: nextPhone,
      telegram_id: nextTelegramId,
    });
    if (!result?.ok) {
      showToast(result?.status === 409 ? t("loginTaken") : t("saveFailed"), "error");
      return;
    }
  } else {
    state.user.firstName = nextFirstName;
    state.user.lastName = nextLastName;
    state.user.login = nextLogin;
    state.user.phone = nextPhone;
    state.user.telegramId = nextTelegramId;
  }

  if (REMOTE_DB_ENABLED) await saveDBNow();
  else saveDB();
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
  if (newPassword !== confirmPassword) {
    showToast(t("passwordMismatch"));
    return;
  }

  if (REMOTE_DB_ENABLED) {
    const result = await updateCurrentUserViaApi({
      full_name: fullName(state.user),
      login: state.user.login,
      phone: state.user.phone || "",
      current_password: currentPassword,
      new_password: newPassword,
    });
    if (!result?.ok) {
      showToast(result?.error === "current_password_wrong" ? t("currentPasswordWrong") : t("saveFailed"), "error");
      return;
    }
  } else {
    if (state.user.password !== currentPassword) {
      showToast(t("currentPasswordWrong"));
      return;
    }
    state.user.password = newPassword;
  }

  if (REMOTE_DB_ENABLED) await saveDBNow();
  else saveDB();
  localStorage.removeItem(LS_REMEMBER);
  refs.passwordForm.reset();
  showToast(t("passwordUpdated"));
}


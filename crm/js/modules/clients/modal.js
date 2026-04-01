function openClientModal(clientId) {
  closeSidebar();
  state.editingClientId = clientId || null;
  const editing = state.db.clients.find((c) => c.id === clientId);
  refs.clientModalTitle.textContent = editing ? t("editClientTitle") : t("addClientTitle");
  const fd = refs.clientForm;

  const optionalForAdmin = state.user.role === "admin";
  fd.querySelector("select[name='attended']").innerHTML = [
    ...(optionalForAdmin ? [option("", "-")] : []),
    option("yes", t("attendedYes")),
    option("no", t("attendedNo")),
  ].join("");
  fd.querySelector("select[name='source']").innerHTML = [
    option("", "-"),
    option("instagram", t("sourceInstagram")),
    option("new_client", t("sourceNewClient")),
    option("potential_client", t("sourcePotential")),
  ].join("");
  fd.querySelector("select[name='currency']").innerHTML = [option("UZS", "SO'M"), option("USD", "$")].join("");
  fd.querySelector("select[name='status']").innerHTML = [
    ...(optionalForAdmin ? [option("", "-")] : []),
    option("green", t("green")),
    option("yellow", t("yellow")),
    option("red", t("red")),
  ].join("");
  const storeSelect = fd.querySelector("select[name='storeId']");
  const managerSelect = fd.querySelector("select[name='managerId']");
  storeSelect.innerHTML = [
    option("", t("selectStore")),
    ...state.db.stores.map((s) => option(s.id, s.name)),
  ].join("");

  const syncManagerOptions = (preferredManagerId = "") => {
    const scopedManagers = managersByStore(storeSelect.value);
    if (!storeSelect.value) {
      managerSelect.innerHTML = option("", t("selectStoreFirst"));
      managerSelect.value = "";
      managerSelect.disabled = true;
      return;
    }
    managerSelect.disabled = false;
    managerSelect.innerHTML = [
      option("", t("selectManager")),
      ...scopedManagers.map((m) => option(m.id, `${m.firstName} ${m.lastName}`)),
    ].join("");
    if (!scopedManagers.length) {
      managerSelect.innerHTML = option("", t("allManagers"));
      managerSelect.value = "";
      return;
    }
    if (preferredManagerId && scopedManagers.some((m) => m.id === preferredManagerId)) {
      managerSelect.value = preferredManagerId;
      return;
    }
    managerSelect.value = "";
  };

  storeSelect.onchange = () => syncManagerOptions();

  const adminOnly = fd.querySelectorAll(".admin-only");
  adminOnly.forEach((el) => el.classList.toggle("hidden", state.user.role !== "admin"));

  const requiredByRole = state.user.role !== "admin";
  fd.querySelector("[name='source']").required = true;
  ["interest", "comment", "attended", "price", "status"].forEach((name) => {
    fd.querySelector(`[name='${name}']`).required = requiredByRole;
  });

  if (!editing) {
    fd.reset();
    fd.date.value = new Date().toISOString().slice(0, 10);
    fd.attended.value = optionalForAdmin ? "" : "yes";
    fd.source.value = "";
    fd.status.value = optionalForAdmin ? "" : "green";
    fd.currency.value = "UZS";
    if (state.user.role === "admin") {
      fd.storeId.value = "";
      syncManagerOptions();
    } else {
      fd.storeId.value = state.user.storeId;
      syncManagerOptions(state.user.id);
    }
  } else {
    fd.date.value = editing.date;
    fd.contact.value = editing.contact;
    fd.source.value = editing.source || "";
    fd.interest.value = editing.interest;
    fd.comment.value = editing.comment;
    fd.attended.value = editing.attended;
    fd.price.value = editing.price;
    fd.currency.value = editing.currency;
    fd.status.value = editing.status;
    fd.storeId.value = editing.storeId;
    syncManagerOptions(editing.managerId);
  }
  toggleModal(refs.clientModal, true);
}

function closeClientModal() {
  toggleModal(refs.clientModal, false);
  state.editingClientId = null;
}

async function onClientSubmit(e) {
  e.preventDefault();
  const fd = new FormData(refs.clientForm);
  const payload = {
    date: String(fd.get("date") || ""),
    contact: String(fd.get("contact") || "").trim(),
    source: String(fd.get("source") || "").trim(),
    interest: String(fd.get("interest") || "").trim(),
    comment: String(fd.get("comment") || "").trim(),
    attended: String(fd.get("attended") || ""),
    price: String(fd.get("price") || "").trim() === "" ? null : parseNumericInput(fd.get("price")),
    currency: String(fd.get("currency") || "UZS"),
    status: String(fd.get("status") || "").trim(),
    storeId: state.user.role === "admin" ? String(fd.get("storeId") || "") : state.user.storeId,
    managerId: state.user.role === "admin" ? String(fd.get("managerId") || "") : state.user.id,
  };
  const managerNeedsAll = state.user.role !== "admin";
  const managerMissing = !payload.interest || !payload.comment || !payload.attended || !payload.status || payload.price === null || Number.isNaN(payload.price);
  const invalidPrice = payload.price !== null && Number.isNaN(payload.price);
  if (!payload.date || !payload.contact || !payload.source || !payload.managerId || !payload.storeId || invalidPrice || (managerNeedsAll && managerMissing)) {
    showToast(t("fillRequired"));
    return;
  }

  if (state.editingClientId) {
    const client = state.db.clients.find((x) => x.id === state.editingClientId);
    const updatedClient = { ...(client || {}), ...payload };
    const updatedViaApi = await updateClientViaApi(state.editingClientId, updatedClient);
    if (!updatedViaApi) {
      Object.assign(client, payload);
      saveDB();
    } else {
      if (client) Object.assign(client, payload);
      await loadClients();
    }
    showToast(t("updated"));
  } else {
    const createdClient = {
      id: uid("client"),
      ...payload,
      createdAt: new Date().toISOString(),
      createdBy: state.user.id,
    };
    const apiCreated = await addClient(createdClient);
    if (!apiCreated) {
      state.db.clients.unshift(createdClient);
    }
    if (!apiCreated && state.user.role === "admin" && createdClient.managerId) {
      addNotification({
        type: "assigned_by_admin",
        toUserId: createdClient.managerId,
        actorId: state.user.id,
        clientId: createdClient.id,
        clientContact: createdClient.contact,
      });
    }
    if (state.user.role !== "admin" && !apiCreated) {
      admins().forEach((admin) => {
        addNotification({
          type: "new_client_from_manager",
          toUserId: admin.id,
          actorId: state.user.id,
          clientId: createdClient.id,
          clientContact: createdClient.contact,
        });
      });
    }
    showToast(t("created"));
    saveDB();
    if (apiCreated) {
      await loadClients();
      await loadNotificationsFromApi();
    }
  }
  closeClientModal();
  renderTableWithLoading();
}

async function deleteClient(id) {
  if (state.user.role !== "admin") return;
  if (!(await confirmPermanentDelete())) return;
  const removedViaApi = await deleteClientViaApi(id);
  if (!removedViaApi) {
    state.db.clients = state.db.clients.filter((c) => c.id !== id);
    saveDB();
  } else {
    await loadClients();
  }
  showToast(t("deleted"));
  renderTableWithLoading();
}


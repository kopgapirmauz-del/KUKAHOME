function openStoreModalForCreate() {
  setAdminActionActive("store");
  state.editingStoreId = null;
  refs.storeModalTitle.textContent = t("addStore");
  refs.storeForm.reset();
  toggleModal(refs.storeModal, true);
}

function openStoreEditModal(storeId) {
  setAdminActionActive("store");
  state.editingStoreId = storeId;
  const store = getStore(storeId);
  if (!store) return;
  refs.storeModalTitle.textContent = t("editStoreTitle");
  refs.storeForm.storeName.value = store.name;
  toggleModal(refs.storeModal, true);
}

function closeStoreModal() {
  toggleModal(refs.storeModal, false);
  refs.storeForm.reset();
  state.editingStoreId = null;
}

async function onStoreAdd(e) {
  e.preventDefault();
  if (state.user.role !== "admin") return;
  const fd = new FormData(refs.storeForm);
  const storeName = String(fd.get("storeName") || "").trim();
  if (!storeName) return;
  if (state.editingStoreId) {
    const store = getStore(state.editingStoreId);
    if (!store) return;
    store.name = storeName;
    showToast(t("storeUpdated"));
    saveDB();
  } else {
    const savedViaApi = await addShowroomViaApi(storeName);
    if (!savedViaApi) {
      state.db.stores.push({ id: uid("store"), name: storeName });
      saveDB();
    } else {
      await loadShowroomsFromApi();
    }
    showToast(t("storeAdded"));
  }
  renderSettings();
  renderFilters();
  closeStoreModal();
}


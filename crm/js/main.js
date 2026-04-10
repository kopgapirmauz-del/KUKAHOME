init().catch((err) => {
  document.body.classList.remove("booting");
  const authView = document.getElementById("authView");
  const appView = document.getElementById("appView");
  if (authView) authView.classList.remove("hidden");
  if (appView) appView.classList.add("hidden");
  console.error("CRM init failed:", err);
});

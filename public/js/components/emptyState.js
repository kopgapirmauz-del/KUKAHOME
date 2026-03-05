// /public/js/components/emptyState.js
// Empty state component
// Masalan: cart bo'sh, product topilmadi, orders yo'q

export function renderEmptyState(options = {}) {

  const {
    icon = "📦",
    title = "Hech narsa topilmadi",
    text = "",
    buttonText = "",
    buttonLink = ""
  } = options;

  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";

  wrapper.innerHTML = `
    <div class="empty-state-icon">
      ${icon}
    </div>

    <h3 class="empty-state-title">
      ${title}
    </h3>

    ${text ? `<p class="empty-state-text">${text}</p>` : ""}

    ${buttonText ? `
      <a href="${buttonLink}" class="empty-state-btn">
        ${buttonText}
      </a>
    ` : ""}
  `;

  return wrapper;
}
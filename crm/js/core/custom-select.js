/* Turns every native <select> in the app into a styled custom dropdown
 * (matching the app's look) while keeping the original <select> in the DOM
 * so all existing code that reads/writes `.value` or listens for "change"
 * keeps working with zero changes anywhere else.
 *
 * Opt out of a specific select with class="no-custom-select".
 */
(function () {
  const ENHANCED_ATTR = "data-cs-enhanced";
  // select -> { trigger, syncLabel, lastSeen } for the shared poller below.
  const registry = new Map();

  function optionsOf(select) {
    return Array.from(select.options || []);
  }

  function labelFor(select) {
    const opt = select.options[select.selectedIndex];
    return opt ? opt.textContent : "";
  }

  function buildPanel(select, panel) {
    panel.innerHTML = "";
    optionsOf(select).forEach((opt) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "cs-option" + (opt.selected ? " selected" : "") + (opt.disabled ? " disabled" : "");
      row.textContent = opt.textContent;
      row.disabled = opt.disabled;
      row.addEventListener("click", () => {
        if (select.value !== opt.value) {
          select.value = opt.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          select.dispatchEvent(new Event("input", { bubbles: true }));
        }
        closePanel(select);
      });
      panel.appendChild(row);
    });
  }

  function closeAllPanels(except) {
    document.querySelectorAll(".cs-wrap.open").forEach((wrap) => {
      if (wrap !== except) {
        wrap.classList.remove("open");
        wrap._csPanel?.classList.remove("cs-panel-open");
      }
    });
  }

  function closePanel(select) {
    const wrap = select.previousElementSibling?.closest?.(".cs-wrap") || select.closest?.(".cs-wrap");
    wrap?.classList.remove("open");
    wrap?._csPanel?.classList.remove("cs-panel-open");
  }

  // The panel is position:fixed (viewport-relative) rather than
  // position:absolute nested inside .cs-wrap, because selects opened from
  // inside a scrolling container (e.g. .modal-content { overflow: auto })
  // would otherwise get visually clipped by that ancestor's overflow box -
  // the options would render but sit outside the visible/scrollable area,
  // making them unclickable. Fixed positioning plus JS-computed viewport
  // coordinates escapes that clipping regardless of which container the
  // select lives in.
  function positionPanel(wrap, panel) {
    const rect = wrap.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;
    const margin = 8;
    const needed = Math.min(panel.scrollHeight || 240, 360);

    panel.style.left = `${rect.left}px`;
    panel.style.width = `${rect.width}px`;

    if (spaceBelow < needed + 12 && spaceAbove > spaceBelow) {
      panel.style.top = "auto";
      panel.style.bottom = `${viewportH - rect.top + margin}px`;
      panel.style.maxHeight = `${Math.max(120, spaceAbove - margin - 12)}px`;
    } else {
      panel.style.bottom = "auto";
      panel.style.top = `${rect.bottom + margin}px`;
      panel.style.maxHeight = `${Math.max(120, spaceBelow - margin - 12)}px`;
    }
  }

  function enhanceSelect(select) {
    if (!select || select.hasAttribute(ENHANCED_ATTR)) return;
    if (select.classList.contains("no-custom-select")) return;
    if (select.multiple) return;

    select.setAttribute(ENHANCED_ATTR, "1");
    select.classList.add("cs-native");

    const wrap = document.createElement("div");
    wrap.className = "cs-wrap";
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cs-trigger";
    trigger.innerHTML = `<span class="cs-trigger-label"></span><svg class="cs-arrow" viewBox="0 0 24 24" width="16" height="16"><path d="M7 10l5 5 5-5z" fill="currentColor"/></svg>`;
    wrap.appendChild(trigger);

    const panel = document.createElement("div");
    panel.className = "cs-panel";
    wrap.appendChild(panel);
    wrap._csPanel = panel;

    const syncLabel = () => {
      trigger.querySelector(".cs-trigger-label").textContent = labelFor(select);
    };
    const syncSelectedState = () => {
      panel.querySelectorAll(".cs-option").forEach((row, i) => {
        row.classList.toggle("selected", select.options[i]?.selected);
      });
    };

    trigger.addEventListener("click", () => {
      if (select.disabled) return;
      const isOpen = wrap.classList.contains("open");
      closeAllPanels(wrap);
      syncLabel();
      if (!isOpen) {
        buildPanel(select, panel);
        // Reparented to <body> (once) so position:fixed is always
        // viewport-relative - an ancestor with backdrop-filter/transform
        // (e.g. .glass-card) would otherwise become the fixed containing
        // block instead of the viewport, throwing off every coordinate
        // positionPanel() computes.
        if (panel.parentNode !== document.body) document.body.appendChild(panel);
        wrap.classList.add("open");
        panel.classList.add("cs-panel-open");
        positionPanel(wrap, panel);
      } else {
        wrap.classList.remove("open");
        panel.classList.remove("cs-panel-open");
      }
    });

    select.addEventListener("change", () => {
      syncLabel();
      syncSelectedState();
    });

    trigger.disabled = select.disabled;
    // Some app code repopulates options, sets .value, or toggles .disabled
    // programmatically without a stable event to hook everywhere - the
    // shared poller below covers all of that with one timer for every
    // enhanced select instead of one per select.
    registry.set(select, {
      trigger,
      syncLabel,
      lastSeen: `${select.value}::${optionsOf(select).length}::${select.disabled}`,
    });

    syncLabel();
  }

  // A single shared interval + registry instead of a setInterval(500ms) and
  // a MutationObserver per enhanced <select>. crm/index.html keeps every
  // page's markup mounted at once (just .hidden-toggled), so that used to
  // mean dozens of independent timers/observers running forever, most of
  // them watching selects nobody is looking at - and none of them were
  // ever torn down when their select left the DOM (e.g. a form reset via
  // innerHTML = ""), leaking both the timer and the detached node it
  // closed over. Dead entries are pruned here instead via isConnected.
  setInterval(() => {
    registry.forEach((entry, select) => {
      if (!select.isConnected) {
        registry.delete(select);
        return;
      }
      entry.trigger.disabled = select.disabled;
      entry.trigger.classList.toggle("disabled", select.disabled);
      const now = `${select.value}::${optionsOf(select).length}::${select.disabled}`;
      if (now !== entry.lastSeen) {
        entry.lastSeen = now;
        entry.syncLabel();
      }
    });
  }, 500);

  function scan(root) {
    (root || document).querySelectorAll("select:not([" + ENHANCED_ATTR + "])").forEach(enhanceSelect);
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cs-wrap") && !e.target.closest(".cs-panel")) closeAllPanels();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllPanels();
  });
  window.addEventListener("scroll", () => closeAllPanels(), true);
  window.addEventListener("resize", () => closeAllPanels());

  const bodyObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.tagName === "SELECT") enhanceSelect(node);
          else if (node.querySelectorAll) scan(node);
        });
      }
    }
  });

  function start() {
    scan(document);
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

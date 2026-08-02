(() => {
  const PIPELINE_PAGE_ROLES = ["admin", "manager", "director", "targetolog", "community_manager", "employee"];
  // Everyone in PIPELINE_PAGE_ROLES can open the board except targetolog,
  // which mirrors the server-side PIPELINE_WRITE_ROLES split in
  // functions/api/pipeline.js - it can see every card but not move, edit, or
  // remove one.
  function isPipelineReadOnly() {
    return state.user?.role === "targetolog";
  }

  const STAGES = [
    { key: "new", uz: "Yangi so'rov", ru: "Новый запрос", zh: "新询盘" },
    { key: "contacted", uz: "Aloqa qilindi", ru: "Связались", zh: "已联系" },
    { key: "consultation", uz: "Tanlov va maslahat", ru: "Подбор и консультация", zh: "选品咨询" },
    { key: "measurement", uz: "O'lchov / loyiha", ru: "Замер / проект", zh: "测量 / 方案" },
    { key: "proposal", uz: "Taklif yuborildi", ru: "Предложение отправлено", zh: "已报价" },
    { key: "decision", uz: "Qaror kutilmoqda", ru: "Ожидаем решение", zh: "等待决定" },
    { key: "won", uz: "Sotuv", ru: "Продано", zh: "成交" },
    { key: "lost", uz: "Yo'qotildi", ru: "Потеряно", zh: "流失" },
  ];

  const COPY = {
    uz: {
      eyebrow: "KUKA HOME · SOTUV NAZORATI",
      introTitle: "Har bir mijozning keyingi qadami aniq",
      intro: "Mijozlarni bosqichlar orasida suring, telefon orqali ishlaganda esa kartadagi bosqichni tanlang. Har bir kartada bitta aniq keyingi aloqa sanasi bo'lsin.",
      add: "Mijozni voronkaga qo'shish",
      active: "Faol mijozlar",
      overdue: "Kechikkan aloqa",
      today: "Bugungi vazifa",
      conversion: "Yopilganlardan sotuv",
      planned: "Faol qiymat",
      search: "Telefon, qiziqish yoki menedjer",
      allFollowups: "Barcha vazifalar",
      followToday: "Bugun",
      followOverdue: "Kechikkan",
      followNoDate: "Sanasiz",
      allQuality: "Barcha darajalar",
      hot: "Issiq",
      warm: "Iliq",
      cold: "Sovuq",
      allManagers: "Barcha menedjerlar",
      emptyColumn: "Bu bosqichda mijoz yo'q",
      noAction: "Keyingi aloqa belgilanmagan",
      call: "Qo'ng'iroq",
      details: "Batafsil",
      mobileMove: "Bosqichni o'zgartirish",
      addTitle: "Mijozni tanlang",
      addHint: "Klient bazasidagi mavjud mijozni qidiring. Yangi mijoz yaratish klient bazasida qoladi.",
      clientSearch: "Telefon, qiziqish yoki menedjer bo'yicha",
      noClients: "Qo'shish uchun mos mijoz topilmadi",
      addThis: "Qo'shish",
      editTitle: "Sotuv kartasi",
      stage: "Bosqich",
      quality: "Mijoz darajasi",
      nextAction: "Keyingi aloqa",
      lastContact: "Oxirgi aloqa",
      value: "Kutilayotgan summa",
      note: "Keyingi qadam / izoh",
      notePlaceholder: "Masalan: ertaga divan ranglarini yuborish",
      lostReason: "Yo'qotish sababi",
      save: "Saqlash",
      cancel: "Bekor qilish",
      remove: "Voronkadan chiqarish",
      removeAgain: "Tasdiqlash uchun yana bosing",
      history: "Bosqich tarixi",
      noHistory: "Hali tarix yo'q",
      loading: "Savdo voronkasi yuklanmoqda...",
      loadError: "Voronkani yuklab bo'lmadi",
      retry: "Qayta urinish",
      saved: "Savdo kartasi saqlandi",
      moved: "Bosqich yangilandi",
      conflict: "Boshqa brauzerda yangilangan. Eng so'nggi ma'lumot yuklandi.",
      removed: "Mijoz voronkadan chiqarildi",
      requiredLost: "Yo'qotish sababini yozing",
      selectClient: "Mijoz tanlang",
      overdueBadge: "Kechikkan",
      todayBadge: "Bugun",
      tomorrowBadge: "Ertaga",
      dragHint: "Kartani ushlab boshqa bosqichga suring",
    },
    ru: {
      eyebrow: "KUKA HOME · КОНТРОЛЬ ПРОДАЖ",
      introTitle: "У каждого клиента есть следующий шаг",
      intro: "Перетаскивайте карточки между этапами, а на телефоне меняйте этап в самой карточке. Для каждой сделки назначайте один конкретный следующий контакт.",
      add: "Добавить клиента в воронку",
      active: "Активные клиенты",
      overdue: "Просроченные контакты",
      today: "Задачи на сегодня",
      conversion: "Продажи из закрытых",
      planned: "Активная сумма",
      search: "Телефон, интерес или менеджер",
      allFollowups: "Все задачи",
      followToday: "Сегодня",
      followOverdue: "Просрочено",
      followNoDate: "Без даты",
      allQuality: "Все уровни",
      hot: "Горячий",
      warm: "Тёплый",
      cold: "Холодный",
      allManagers: "Все менеджеры",
      emptyColumn: "На этом этапе нет клиентов",
      noAction: "Следующий контакт не назначен",
      call: "Позвонить",
      details: "Подробнее",
      mobileMove: "Изменить этап",
      addTitle: "Выберите клиента",
      addHint: "Найдите клиента из существующей базы. Создание нового клиента остаётся в разделе клиентской базы.",
      clientSearch: "Телефон, интерес или менеджер",
      noClients: "Подходящие клиенты не найдены",
      addThis: "Добавить",
      editTitle: "Карточка продажи",
      stage: "Этап",
      quality: "Качество клиента",
      nextAction: "Следующий контакт",
      lastContact: "Последний контакт",
      value: "Ожидаемая сумма",
      note: "Следующий шаг / заметка",
      notePlaceholder: "Например: завтра отправить варианты цветов",
      lostReason: "Причина потери",
      save: "Сохранить",
      cancel: "Отмена",
      remove: "Убрать из воронки",
      removeAgain: "Нажмите ещё раз для подтверждения",
      history: "История этапов",
      noHistory: "Истории пока нет",
      loading: "Воронка загружается...",
      loadError: "Не удалось загрузить воронку",
      retry: "Повторить",
      saved: "Карточка сохранена",
      moved: "Этап обновлён",
      conflict: "Данные изменены в другом браузере. Загружена свежая версия.",
      removed: "Клиент удалён из воронки",
      requiredLost: "Укажите причину потери",
      selectClient: "Выберите клиента",
      overdueBadge: "Просрочено",
      todayBadge: "Сегодня",
      tomorrowBadge: "Завтра",
      dragHint: "Перетащите карточку в другой этап",
    },
    zh: {
      eyebrow: "KUKA HOME · 销售管控",
      introTitle: "每位客户都有明确的下一步",
      intro: "桌面端可拖动卡片，手机端可直接选择阶段。每笔销售都应设置一个明确的下次跟进时间。",
      add: "添加客户到漏斗",
      active: "活跃客户",
      overdue: "逾期跟进",
      today: "今日任务",
      conversion: "已关闭成交率",
      planned: "活跃金额",
      search: "电话、意向或经理",
      allFollowups: "全部任务",
      followToday: "今天",
      followOverdue: "已逾期",
      followNoDate: "无日期",
      allQuality: "全部等级",
      hot: "高意向",
      warm: "中意向",
      cold: "低意向",
      allManagers: "全部经理",
      emptyColumn: "此阶段暂无客户",
      noAction: "未设置下次跟进",
      call: "拨打",
      details: "详情",
      mobileMove: "更改阶段",
      addTitle: "选择客户",
      addHint: "从现有客户库中搜索。新客户仍在客户库中创建。",
      clientSearch: "按电话、意向或经理搜索",
      noClients: "没有可添加的客户",
      addThis: "添加",
      editTitle: "销售卡片",
      stage: "阶段",
      quality: "客户等级",
      nextAction: "下次跟进",
      lastContact: "最近联系",
      value: "预计金额",
      note: "下一步 / 备注",
      notePlaceholder: "例如：明天发送沙发颜色",
      lostReason: "流失原因",
      save: "保存",
      cancel: "取消",
      remove: "移出漏斗",
      removeAgain: "再次点击确认",
      history: "阶段历史",
      noHistory: "暂无历史",
      loading: "正在加载销售漏斗...",
      loadError: "无法加载销售漏斗",
      retry: "重试",
      saved: "销售卡片已保存",
      moved: "阶段已更新",
      conflict: "数据已在其他浏览器更新，已加载最新内容。",
      removed: "客户已移出漏斗",
      requiredLost: "请填写流失原因",
      selectClient: "选择客户",
      overdueBadge: "已逾期",
      todayBadge: "今天",
      tomorrowBadge: "明天",
      dragHint: "拖动卡片到其他阶段",
    },
  };

  const ui = {
    items: [],
    loading: false,
    loadedAt: 0,
    error: "",
    search: "",
    followup: "",
    quality: "",
    manager: "",
    draggedClientId: "",
    addPage: 1,
  };
  const ADD_MODAL_PAGE_SIZE = 10;

  let keyboardBound = false;

  function copy() {
    return COPY[state.lang] || COPY.uz;
  }

  function stageLabel(key) {
    const stage = STAGES.find((item) => item.key === key) || STAGES[0];
    return stage[state.lang] || stage.uz;
  }

  function qualityLabel(value) {
    return copy()[value] || copy().warm;
  }

  function pipelineRoot() {
    return document.getElementById("pipelineRoot");
  }

  function svgIcon(name) {
    const paths = {
      add: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
      phone: "M6.6 10.8a15.7 15.7 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.37 2.3.56 3.5.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.56 3.5a1 1 0 0 1-.25 1l-2.2 2.3Z",
      clock: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11h-5V7h2v4h3v2Z",
      arrow: "m9 18 6-6-6-6",
      close: "M6 6l12 12M18 6 6 18",
      refresh: "M20 6v5h-5M4 18v-5h5M6.1 8a7 7 0 0 1 11.3-1.7L20 11M4 13l2.6 4.7A7 7 0 0 0 17.9 16",
    };
    const stroke = name === "arrow" || name === "close" || name === "refresh";
    return `<svg viewBox="0 0 24 24" aria-hidden="true"${stroke ? ` fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"` : ""}><path d="${paths[name] || paths.arrow}"/></svg>`;
  }

  function isClosed(item) {
    return item.stage === "won" || item.stage === "lost";
  }

  function dateState(value) {
    if (!value) return { key: "none", text: copy().noAction };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { key: "none", text: copy().noAction };
    const now = new Date();
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const nowKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`;
    if (date < now && dateKey !== nowKey) return { key: "overdue", text: copy().overdueBadge };
    if (dateKey === nowKey) return { key: "today", text: copy().todayBadge };
    if (dateKey === tomorrowKey) return { key: "tomorrow", text: copy().tomorrowBadge };
    return {
      key: "future",
      text: new Intl.DateTimeFormat(state.lang === "ru" ? "ru-RU" : state.lang === "zh" ? "zh-CN" : "uz-UZ", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
    };
  }

  function formatMoney(value, currency) {
    const number = Number(value || 0);
    return `${numberFmt(number)} ${currency === "USD" ? "$" : "SO'M"}`;
  }

  function localDateTimeInput(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function selected(value, expected) {
    return String(value || "") === String(expected || "") ? " selected" : "";
  }

  function optionHtml(value, label, current) {
    return `<option value="${escapeHtml(value)}"${selected(current, value)}>${escapeHtml(label)}</option>`;
  }

  function stageOptions(current) {
    return STAGES.map((stage) => optionHtml(stage.key, stageLabel(stage.key), current)).join("");
  }

  function clientTitle(item) {
    return item.client?.contact || item.client?.interest || copy().selectClient;
  }

  function filteredItems() {
    const term = ui.search.trim().toLowerCase();
    const now = new Date();
    return ui.items.filter((item) => {
      const haystack = [
        item.client?.contact,
        item.client?.interest,
        item.client?.managerName,
        item.client?.storeName,
        item.note,
      ].join(" ").toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (ui.quality && item.temperature !== ui.quality) return false;
      if (ui.manager && item.client?.managerId !== ui.manager) return false;
      const due = item.nextActionAt ? new Date(item.nextActionAt) : null;
      if (ui.followup === "none" && due) return false;
      if (ui.followup === "overdue" && (!due || due >= now || isClosed(item))) return false;
      if (ui.followup === "today") {
        if (!due || isClosed(item)) return false;
        const dueKey = `${due.getFullYear()}-${due.getMonth()}-${due.getDate()}`;
        const nowKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        if (dueKey !== nowKey) return false;
      }
      return true;
    });
  }

  function statsHtml() {
    const active = ui.items.filter((item) => !isClosed(item));
    const overdue = active.filter((item) => dateState(item.nextActionAt).key === "overdue").length;
    const today = active.filter((item) => dateState(item.nextActionAt).key === "today").length;
    const closed = ui.items.filter(isClosed);
    const won = ui.items.filter((item) => item.stage === "won").length;
    const conversion = closed.length ? Math.round((won / closed.length) * 100) : 0;
    const uzs = active.filter((item) => item.currency === "UZS").reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0);
    const usd = active.filter((item) => item.currency === "USD").reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0);
    const cards = [
      { label: copy().active, value: active.length, tone: "neutral" },
      { label: copy().overdue, value: overdue, tone: overdue ? "danger" : "neutral" },
      { label: copy().today, value: today, tone: today ? "warm" : "neutral" },
      { label: copy().conversion, value: `${conversion}%`, tone: "success" },
      { label: copy().planned, value: `<span>${formatMoney(uzs, "UZS")}</span><small>${formatMoney(usd, "USD")}</small>`, tone: "value" },
    ];
    return cards.map((card) => `
      <article class="pipeline-kpi pipeline-kpi-${card.tone}">
        <span>${escapeHtml(card.label)}</span>
        <strong>${card.value}</strong>
      </article>
    `).join("");
  }

  function cardHtml(item) {
    const due = dateState(item.nextActionAt);
    const phone = typeof parseClientContact === "function" ? parseClientContact(item.client?.contact || "") : null;
    const callLink = phone?.telHref
      ? `<a class="pipeline-card-call" href="${escapeHtml(phone.telHref)}" data-pipeline-stop title="${escapeHtml(copy().call)}">${svgIcon("phone")}<span>${escapeHtml(copy().call)}</span></a>`
      : "";
    const readOnly = isPipelineReadOnly();
    return `
      <article class="pipeline-card pipeline-temperature-${escapeHtml(item.temperature)}" draggable="${readOnly ? "false" : "true"}" tabindex="0"
        data-pipeline-card="${escapeHtml(item.clientId)}" aria-label="${escapeHtml(clientTitle(item))}">
        <div class="pipeline-card-grip" title="${escapeHtml(copy().dragHint)}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="pipeline-card-top">
          <span class="pipeline-quality pipeline-quality-${escapeHtml(item.temperature)}">${escapeHtml(qualityLabel(item.temperature))}</span>
          <span class="pipeline-store">${escapeHtml(item.client?.storeName || "-")}</span>
        </div>
        <h4>${escapeHtml(clientTitle(item))}</h4>
        <p class="pipeline-card-interest">${escapeHtml(item.client?.interest || item.note || "-")}</p>
        <div class="pipeline-card-meta">
          <span>${escapeHtml(item.client?.managerName || "-")}</span>
          <strong>${escapeHtml(formatMoney(item.estimatedValue, item.currency))}</strong>
        </div>
        <div class="pipeline-next pipeline-next-${due.key}">
          ${svgIcon("clock")}
          <span>${escapeHtml(due.text)}</span>
        </div>
        ${readOnly ? "" : `
        <label class="pipeline-mobile-stage" data-pipeline-stop>
          <span>${escapeHtml(copy().mobileMove)}</span>
          <select data-pipeline-stage="${escapeHtml(item.clientId)}">${stageOptions(item.stage)}</select>
        </label>`}
        <div class="pipeline-card-actions">
          ${callLink}
          <button type="button" class="pipeline-card-detail" data-pipeline-detail="${escapeHtml(item.clientId)}">
            <span>${escapeHtml(copy().details)}</span>${svgIcon("arrow")}
          </button>
        </div>
      </article>
    `;
  }

  function boardHtml() {
    const items = filteredItems();
    return `
      <div class="pipeline-board" role="region" aria-label="${escapeHtml(copy().dragHint)}">
        ${STAGES.map((stage) => {
          const rows = items.filter((item) => item.stage === stage.key);
          const totalUzs = rows.filter((item) => item.currency === "UZS").reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0);
          const totalUsd = rows.filter((item) => item.currency === "USD").reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0);
          return `
            <section class="pipeline-column pipeline-stage-${stage.key}" data-pipeline-drop="${stage.key}">
              <header>
                <div><i aria-hidden="true"></i><h3>${escapeHtml(stageLabel(stage.key))}</h3></div>
                <span>${rows.length}</span>
              </header>
              <p class="pipeline-column-value">
                <span>${escapeHtml(formatMoney(totalUzs, "UZS"))}</span>
                ${totalUsd ? `<small>${escapeHtml(formatMoney(totalUsd, "USD"))}</small>` : ""}
              </p>
              <div class="pipeline-column-cards">
                ${rows.length ? rows.map(cardHtml).join("") : `<div class="pipeline-empty-column">${escapeHtml(copy().emptyColumn)}</div>`}
              </div>
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  function toolbarHtml() {
    const managers = [...new Map(ui.items
      .filter((item) => item.client?.managerId)
      .map((item) => [item.client.managerId, item.client.managerName || "-"]))]
      .sort((a, b) => a[1].localeCompare(b[1]));
    return `
      <section class="pipeline-toolbar glass-card">
        <label class="pipeline-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 20.3-4.9-4.9a7 7 0 1 0-1.4 1.4l4.9 4.9 1.4-1.4ZM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5Z"/></svg>
          <input id="pipelineSearch" type="search" value="${escapeHtml(ui.search)}" placeholder="${escapeHtml(copy().search)}" />
        </label>
        <select id="pipelineFollowupFilter">
          ${optionHtml("", copy().allFollowups, ui.followup)}
          ${optionHtml("today", copy().followToday, ui.followup)}
          ${optionHtml("overdue", copy().followOverdue, ui.followup)}
          ${optionHtml("none", copy().followNoDate, ui.followup)}
        </select>
        <select id="pipelineQualityFilter">
          ${optionHtml("", copy().allQuality, ui.quality)}
          ${optionHtml("hot", copy().hot, ui.quality)}
          ${optionHtml("warm", copy().warm, ui.quality)}
          ${optionHtml("cold", copy().cold, ui.quality)}
        </select>
        ${["admin", "director", "targetolog", "community_manager", "employee"].includes(state.user?.role) ? `
          <select id="pipelineManagerFilter">
            ${optionHtml("", copy().allManagers, ui.manager)}
            ${managers.map(([id, name]) => optionHtml(id, name, ui.manager)).join("")}
          </select>
        ` : ""}
        <button id="pipelineRefreshBtn" class="pipeline-refresh-btn" type="button" aria-label="${escapeHtml(copy().retry)}">${svgIcon("refresh")}</button>
      </section>
    `;
  }

  function shellHtml() {
    return `
      <section class="pipeline-hero">
        <div>
          <span class="pipeline-eyebrow">${escapeHtml(copy().eyebrow)}</span>
          <h3>${escapeHtml(copy().introTitle)}</h3>
          <p>${escapeHtml(copy().intro)}</p>
        </div>
        ${isPipelineReadOnly() ? "" : `<button id="pipelineAddBtn" class="btn btn-primary pipeline-add-btn" type="button">${svgIcon("add")}<span>${escapeHtml(copy().add)}</span></button>`}
      </section>
      <section class="pipeline-kpis">${statsHtml()}</section>
      ${toolbarHtml()}
      ${boardHtml()}
      <div id="pipelineAddModal" class="pipeline-modal hidden" role="dialog" aria-modal="true"></div>
      <div id="pipelineDetailModal" class="pipeline-modal hidden" role="dialog" aria-modal="true"></div>
    `;
  }

  function renderLoading() {
    const root = pipelineRoot();
    if (!root) return;
    root.innerHTML = `
      <div class="pipeline-state-card">
        <div class="pipeline-loader" aria-hidden="true"></div>
        <strong>${escapeHtml(copy().loading)}</strong>
      </div>
    `;
  }

  function renderError() {
    const root = pipelineRoot();
    if (!root) return;
    root.innerHTML = `
      <div class="pipeline-state-card pipeline-state-error">
        <strong>${escapeHtml(copy().loadError)}</strong>
        <p>${escapeHtml(ui.error)}</p>
        <button id="pipelineErrorRetry" class="btn btn-primary" type="button">${escapeHtml(copy().retry)}</button>
      </div>
    `;
    document.getElementById("pipelineErrorRetry")?.addEventListener("click", () => loadPipeline(true));
  }

  async function loadPipeline(force = false) {
    if (ui.loading) return;
    if (!force && ui.loadedAt && (Date.now() - ui.loadedAt) < 5000) {
      render();
      return;
    }
    ui.loading = true;
    ui.error = "";
    renderLoading();
    try {
      const response = await apiFetch(`${API_PIPELINE_URL}?ts=${Date.now()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success !== true || !Array.isArray(payload.items)) {
        throw new Error(payload?.detail || payload?.error || `HTTP ${response.status}`);
      }
      ui.items = payload.items;
      ui.loadedAt = Date.now();
    } catch (error) {
      ui.error = String(error?.message || copy().loadError);
    } finally {
      ui.loading = false;
    }
    if (ui.error) renderError();
    else render();
  }

  function bindFilters() {
    const search = document.getElementById("pipelineSearch");
    const followup = document.getElementById("pipelineFollowupFilter");
    const quality = document.getElementById("pipelineQualityFilter");
    const manager = document.getElementById("pipelineManagerFilter");
    search?.addEventListener("input", () => {
      ui.search = search.value;
      refreshBoardOnly();
    });
    followup?.addEventListener("change", () => {
      ui.followup = followup.value;
      refreshBoardOnly();
    });
    quality?.addEventListener("change", () => {
      ui.quality = quality.value;
      refreshBoardOnly();
    });
    manager?.addEventListener("change", () => {
      ui.manager = manager.value;
      refreshBoardOnly();
    });
    document.getElementById("pipelineRefreshBtn")?.addEventListener("click", () => loadPipeline(true));
    if (typeof enhanceSelectAsCustom === "function") {
      enhanceSelectAsCustom(followup);
      enhanceSelectAsCustom(quality);
      enhanceSelectAsCustom(manager);
    }
  }

  function refreshBoardOnly() {
    const board = document.querySelector("#pipelineRoot .pipeline-board");
    if (!board) return render();
    const temp = document.createElement("div");
    temp.innerHTML = boardHtml();
    board.replaceWith(temp.firstElementChild);
    bindBoard();
  }

  function bindBoard() {
    document.querySelectorAll("[data-pipeline-card]").forEach((card) => {
      card.addEventListener("dragstart", (event) => {
        ui.draggedClientId = card.dataset.pipelineCard || "";
        card.classList.add("dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", ui.draggedClientId);
        }
      });
      card.addEventListener("dragend", () => {
        ui.draggedClientId = "";
        card.classList.remove("dragging");
        document.querySelectorAll(".pipeline-column.drag-over").forEach((column) => column.classList.remove("drag-over"));
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.target.closest("select,a,button")) openDetail(card.dataset.pipelineCard);
      });
    });
    document.querySelectorAll("[data-pipeline-drop]").forEach((column) => {
      column.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        column.classList.add("drag-over");
      });
      column.addEventListener("dragleave", (event) => {
        if (!column.contains(event.relatedTarget)) column.classList.remove("drag-over");
      });
      column.addEventListener("drop", (event) => {
        event.preventDefault();
        column.classList.remove("drag-over");
        const clientId = event.dataTransfer?.getData("text/plain") || ui.draggedClientId;
        if (clientId) moveItem(clientId, column.dataset.pipelineDrop);
      });
    });
    document.querySelectorAll("[data-pipeline-stage]").forEach((select) => {
      select.addEventListener("change", (event) => {
        event.stopPropagation();
        moveItem(select.dataset.pipelineStage, select.value);
      });
      if (typeof enhanceSelectAsCustom === "function") enhanceSelectAsCustom(select);
    });
    document.querySelectorAll("[data-pipeline-detail]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openDetail(button.dataset.pipelineDetail);
      });
    });
    document.querySelectorAll("[data-pipeline-stop]").forEach((element) => {
      element.addEventListener("click", (event) => event.stopPropagation());
    });
  }

  async function moveItem(clientId, stage) {
    const item = ui.items.find((row) => row.clientId === clientId);
    if (!item || item.stage === stage) return;
    const previous = item.stage;
    item.stage = stage;
    render();
    const ok = await saveItem(item, false);
    if (!ok) {
      item.stage = previous;
      await loadPipeline(true);
      return;
    }
    showToast(copy().moved);
  }

  async function saveItem(item, fromForm) {
    try {
      const response = await apiFetch(API_PIPELINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: item.clientId,
          version: item.updatedAt || "",
          stage: item.stage,
          temperature: item.temperature,
          nextActionAt: item.nextActionAt || "",
          lastContactAt: item.lastContactAt || "",
          estimatedValue: item.estimatedValue || 0,
          currency: item.currency || "UZS",
          note: item.note || "",
          lostReason: item.lostReason || "",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 409) {
        showToast(copy().conflict, "error");
        return false;
      }
      if (!response.ok || payload?.success !== true || !payload.item) {
        throw new Error(payload?.detail || payload?.error || `HTTP ${response.status}`);
      }
      Object.assign(item, payload.item);
      ui.loadedAt = Date.now();
      if (fromForm) showToast(copy().saved);
      return true;
    } catch (error) {
      showToast(String(error?.message || copy().loadError), "error");
      return false;
    }
  }

  function addModalHtml() {
    return `
      <div class="pipeline-modal-backdrop" data-pipeline-close></div>
      <section class="pipeline-dialog pipeline-add-dialog">
        <header>
          <div><span class="pipeline-eyebrow">${escapeHtml(copy().eyebrow)}</span><h3>${escapeHtml(copy().addTitle)}</h3></div>
          <button type="button" class="pipeline-dialog-close" data-pipeline-close aria-label="${escapeHtml(copy().cancel)}">${svgIcon("close")}</button>
        </header>
        <p class="pipeline-dialog-hint">${escapeHtml(copy().addHint)}</p>
        <label class="pipeline-client-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 20.3-4.9-4.9a7 7 0 1 0-1.4 1.4l4.9 4.9 1.4-1.4ZM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5Z"/></svg>
          <input id="pipelineClientSearch" type="search" placeholder="${escapeHtml(copy().clientSearch)}" autofocus />
        </label>
        <div id="pipelineClientResults" class="pipeline-client-results"></div>
        <div id="pipelineClientPagination" class="pagination pipeline-client-pagination"></div>
      </section>
    `;
  }

  function availableClients(term = "") {
    const enrolled = new Set(ui.items.map((item) => String(item.clientId)));
    const needle = String(term || "").trim().toLowerCase();
    return (state.db?.clients || [])
      .filter((client) => !enrolled.has(String(client.id)))
      .filter((client) => {
        if (!needle) return true;
        const manager = getUser(client.managerId);
        const store = getStore(client.storeId);
        return [client.contact, client.interest, client.comment, fullName(manager), store?.name]
          .join(" ").toLowerCase().includes(needle);
      })
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  function renderClientResults(term = "") {
    const container = document.getElementById("pipelineClientResults");
    const paginationEl = document.getElementById("pipelineClientPagination");
    if (!container) return;
    const allClients = availableClients(term);
    const totalPages = Math.max(1, Math.ceil(allClients.length / ADD_MODAL_PAGE_SIZE));
    if (ui.addPage > totalPages) ui.addPage = totalPages;
    if (ui.addPage < 1) ui.addPage = 1;
    const start = (ui.addPage - 1) * ADD_MODAL_PAGE_SIZE;
    const clients = allClients.slice(start, start + ADD_MODAL_PAGE_SIZE);

    container.innerHTML = clients.length ? clients.map((client) => {
      const manager = getUser(client.managerId);
      const store = getStore(client.storeId);
      return `
        <article class="pipeline-client-option">
          <div>
            <strong>${escapeHtml(client.contact || client.interest || "-")}</strong>
            <span>${escapeHtml(client.interest || client.comment || "-")}</span>
            <small>${escapeHtml([fullName(manager), store?.name].filter(Boolean).join(" · ") || "-")}</small>
          </div>
          <button type="button" class="btn btn-primary" data-pipeline-add-client="${escapeHtml(client.id)}">${escapeHtml(copy().addThis)}</button>
        </article>
      `;
    }).join("") : `<div class="pipeline-empty-results">${escapeHtml(copy().noClients)}</div>`;
    container.querySelectorAll("[data-pipeline-add-client]").forEach((button) => {
      button.addEventListener("click", () => addClientToPipeline(button.dataset.pipelineAddClient, button));
    });

    renderClientResultsPagination(paginationEl, totalPages, term);
  }

  function renderClientResultsPagination(paginationEl, totalPages, term) {
    if (!paginationEl) return;
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;

    const chunkSize = 10;
    const currentChunk = Math.floor((ui.addPage - 1) / chunkSize);
    const chunkStart = currentChunk * chunkSize + 1;
    const chunkEnd = Math.min(chunkStart + chunkSize - 1, totalPages);

    const goTo = (page) => {
      if (page === ui.addPage) return;
      ui.addPage = page;
      renderClientResults(term);
    };

    if (chunkStart > 1) {
      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "page-btn";
      prev.textContent = "<";
      prev.addEventListener("click", () => goTo(Math.max(1, chunkStart - chunkSize)));
      paginationEl.appendChild(prev);
    }

    for (let i = chunkStart; i <= chunkEnd; i += 1) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `page-btn ${ui.addPage === i ? "active" : ""}`;
      b.textContent = String(i);
      b.addEventListener("click", () => goTo(i));
      paginationEl.appendChild(b);
    }

    if (chunkEnd < totalPages) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "page-btn";
      next.textContent = ">";
      next.addEventListener("click", () => goTo(Math.min(totalPages, chunkStart + chunkSize)));
      paginationEl.appendChild(next);
    }
  }

  async function openAdd() {
    if (typeof loadClients === "function") await loadClients();
    const modal = document.getElementById("pipelineAddModal");
    if (!modal) return;
    ui.addPage = 1;
    modal.innerHTML = addModalHtml();
    setPipelineModal(modal, true);
    modal.querySelectorAll("[data-pipeline-close]").forEach((element) => {
      element.addEventListener("click", () => setPipelineModal(modal, false));
    });
    const search = document.getElementById("pipelineClientSearch");
    search?.addEventListener("input", () => {
      ui.addPage = 1;
      renderClientResults(search.value);
    });
    renderClientResults();
    search?.focus();
  }

  async function addClientToPipeline(clientId, button) {
    const client = (state.db?.clients || []).find((row) => String(row.id) === String(clientId));
    if (!client || button.disabled) return;
    button.disabled = true;
    const draft = {
      clientId: String(client.id),
      stage: "new",
      temperature: "warm",
      nextActionAt: "",
      lastContactAt: "",
      estimatedValue: Number(client.price || 0),
      currency: String(client.currency || "UZS"),
      note: "",
      lostReason: "",
      updatedAt: "",
    };
    const ok = await saveItem(draft, false);
    if (!ok) {
      button.disabled = false;
      return;
    }
    setPipelineModal(document.getElementById("pipelineAddModal"), false);
    await loadPipeline(true);
    openDetail(clientId);
  }

  function historyHtml(item) {
    const history = Array.isArray(item.history) ? [...item.history].reverse() : [];
    if (!history.length) return `<p class="pipeline-no-history">${escapeHtml(copy().noHistory)}</p>`;
    return history.map((event) => `
      <li>
        <i aria-hidden="true"></i>
        <div><strong>${escapeHtml(stageLabel(event.to))}</strong><span>${escapeHtml(event.by || "-")} · ${escapeHtml(formatHistoryDate(event.at))}</span></div>
      </li>
    `).join("");
  }

  function formatHistoryDate(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat(state.lang === "ru" ? "ru-RU" : state.lang === "zh" ? "zh-CN" : "uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function detailModalHtml(item) {
    const phone = typeof parseClientContact === "function" ? parseClientContact(item.client?.contact || "") : null;
    const readOnly = isPipelineReadOnly();
    const ro = readOnly ? "disabled" : "";
    return `
      <div class="pipeline-modal-backdrop" data-pipeline-close></div>
      <section class="pipeline-dialog pipeline-detail-dialog">
        <header>
          <div><span class="pipeline-eyebrow">${escapeHtml(copy().editTitle)}</span><h3>${escapeHtml(clientTitle(item))}</h3><p>${escapeHtml([item.client?.interest, item.client?.managerName, item.client?.storeName].filter(Boolean).join(" · "))}</p></div>
          <button type="button" class="pipeline-dialog-close" data-pipeline-close aria-label="${escapeHtml(copy().cancel)}">${svgIcon("close")}</button>
        </header>
        ${phone?.telHref ? `<a class="pipeline-detail-call" href="${escapeHtml(phone.telHref)}">${svgIcon("phone")}<span>${escapeHtml(copy().call)}</span></a>` : ""}
        <form id="pipelineDetailForm" class="pipeline-detail-form">
          <div class="pipeline-form-grid">
            <label><span>${escapeHtml(copy().stage)}</span><select name="stage" ${ro}>${stageOptions(item.stage)}</select></label>
            <label><span>${escapeHtml(copy().quality)}</span><select name="temperature" ${ro}>
              ${optionHtml("hot", copy().hot, item.temperature)}
              ${optionHtml("warm", copy().warm, item.temperature)}
              ${optionHtml("cold", copy().cold, item.temperature)}
            </select></label>
            <label><span>${escapeHtml(copy().nextAction)}</span><input name="nextActionAt" type="datetime-local" value="${escapeHtml(localDateTimeInput(item.nextActionAt))}" ${ro} /></label>
            <label><span>${escapeHtml(copy().lastContact)}</span><input name="lastContactAt" type="datetime-local" value="${escapeHtml(localDateTimeInput(item.lastContactAt))}" ${ro} /></label>
            <label class="pipeline-value-field"><span>${escapeHtml(copy().value)}</span><div><input name="estimatedValue" inputmode="decimal" value="${escapeHtml(String(item.estimatedValue || ""))}" ${ro} /><select name="currency" ${ro}>${optionHtml("UZS", "SO'M", item.currency)}${optionHtml("USD", "$", item.currency)}</select></div></label>
          </div>
          <label class="pipeline-form-wide"><span>${escapeHtml(copy().note)}</span><textarea name="note" rows="3" placeholder="${escapeHtml(copy().notePlaceholder)}" ${ro}>${escapeHtml(item.note || "")}</textarea></label>
          <label class="pipeline-form-wide pipeline-lost-field"><span>${escapeHtml(copy().lostReason)}</span><input name="lostReason" value="${escapeHtml(item.lostReason || "")}" ${ro} /></label>
          ${readOnly ? "" : `
          <div class="pipeline-detail-actions">
            <button type="button" class="pipeline-remove-btn" id="pipelineRemoveBtn">${escapeHtml(copy().remove)}</button>
            <div><button type="button" class="btn btn-light" data-pipeline-close>${escapeHtml(copy().cancel)}</button><button type="submit" class="btn btn-primary">${escapeHtml(copy().save)}</button></div>
          </div>`}
        </form>
        <section class="pipeline-history"><h4>${escapeHtml(copy().history)}</h4><ol>${historyHtml(item)}</ol></section>
      </section>
    `;
  }

  function openDetail(clientId) {
    const item = ui.items.find((row) => String(row.clientId) === String(clientId));
    const modal = document.getElementById("pipelineDetailModal");
    if (!item || !modal) return;
    modal.innerHTML = detailModalHtml(item);
    setPipelineModal(modal, true);
    modal.querySelectorAll("[data-pipeline-close]").forEach((element) => {
      element.addEventListener("click", () => setPipelineModal(modal, false));
    });
    const form = document.getElementById("pipelineDetailForm");
    form?.addEventListener("submit", (event) => saveDetail(event, item));
    document.getElementById("pipelineRemoveBtn")?.addEventListener("click", (event) => removeItem(item, event.currentTarget));
  }

  async function saveDetail(event, item) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const stage = String(data.get("stage") || "new");
    const lostReason = String(data.get("lostReason") || "").trim();
    if (stage === "lost" && !lostReason) {
      showToast(copy().requiredLost, "error");
      form.elements.lostReason.focus();
      return;
    }
    const nextValue = String(data.get("nextActionAt") || "");
    const lastValue = String(data.get("lastContactAt") || "");
    Object.assign(item, {
      stage,
      temperature: String(data.get("temperature") || "warm"),
      nextActionAt: nextValue ? new Date(nextValue).toISOString() : "",
      lastContactAt: lastValue ? new Date(lastValue).toISOString() : "",
      estimatedValue: parseNumericInput(data.get("estimatedValue") || 0),
      currency: String(data.get("currency") || "UZS"),
      note: String(data.get("note") || "").trim(),
      lostReason,
    });
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    const ok = await saveItem(item, true);
    submit.disabled = false;
    if (!ok) {
      // loadPipeline re-renders the whole shell, which destroys this modal's
      // DOM. Closing it first is what runs syncUiLock; skipping that left
      // body.ui-lock applied, so the board stayed unscrollable - and unusable
      // on mobile - until the user navigated to another page.
      closePipelineModals();
      await loadPipeline(true);
      return;
    }
    setPipelineModal(document.getElementById("pipelineDetailModal"), false);
    render();
  }

  async function removeItem(item, button) {
    if (button.dataset.confirmed !== "true") {
      button.dataset.confirmed = "true";
      button.textContent = copy().removeAgain;
      setTimeout(() => {
        if (button.isConnected) {
          button.dataset.confirmed = "false";
          button.textContent = copy().remove;
        }
      }, 4000);
      return;
    }
    button.disabled = true;
    try {
      const response = await apiFetch(API_PIPELINE_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: item.clientId, version: item.updatedAt || "" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 409) {
        showToast(copy().conflict, "error");
        // Same as saveDetail: release the UI lock before the shell re-render
        // tears this modal out of the DOM.
        closePipelineModals();
        await loadPipeline(true);
        return;
      }
      if (!response.ok || payload?.success !== true) throw new Error(payload?.detail || payload?.error || `HTTP ${response.status}`);
      ui.items = ui.items.filter((row) => row.clientId !== item.clientId);
      setPipelineModal(document.getElementById("pipelineDetailModal"), false);
      showToast(copy().removed);
      render();
    } catch (error) {
      button.disabled = false;
      showToast(String(error?.message || copy().loadError), "error");
    }
  }

  function setPipelineModal(modal, show) {
    if (!modal) return;
    if (show) {
      document.querySelectorAll(".pipeline-modal").forEach((other) => {
        if (other !== modal) other.classList.add("hidden");
      });
      if (refs.notifMenu) refs.notifMenu.classList.add("hidden");
      if (refs.langMenu) refs.langMenu.classList.add("hidden");
      closeSidebar();
    }
    modal.classList.toggle("hidden", !show);
    if (typeof syncUiLock === "function") syncUiLock();
    else document.body.classList.toggle("ui-lock", show);
  }

  function closePipelineModals() {
    document.querySelectorAll(".pipeline-modal").forEach((modal) => modal.classList.add("hidden"));
    if (typeof syncUiLock === "function") syncUiLock();
    else document.body.classList.remove("ui-lock");
  }

  function bindShell() {
    document.getElementById("pipelineAddBtn")?.addEventListener("click", openAdd);
    bindFilters();
    bindBoard();
    if (!keyboardBound) {
      keyboardBound = true;
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closePipelineModals();
      });
    }
  }

  function render() {
    const root = pipelineRoot();
    if (!root) return;
    root.innerHTML = shellHtml();
    bindShell();
  }

  window.renderPipelinePage = function renderPipelinePage() {
    if (!state.user || !PIPELINE_PAGE_ROLES.includes(state.user.role)) return;
    loadPipeline(true);
  };

  window.closePipelineModals = closePipelineModals;
})();

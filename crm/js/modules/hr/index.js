let hrRenderToken = 0;
let hrEventsBound = false;
const HR_VACANCY_PAGE_SIZE = 10;
let hrVacancyPageIndex = 1;
let hrVacancyOpenContactId = "";
let hrResumeEnsureQueued = false;
let hrAttendancePreset = "last7";
let hrEditingOpeningId = "";
const hrVacancyFilters = {
  search: "",
  position: "",
};

function bindHrEvents() {
  if (hrEventsBound) return;
  hrEventsBound = true;

  const openModalHandler = () => {
    const modal = document.getElementById("hrVacancyModal");
    if (!modal) return;
    resetHrCreateVacancyForm();
    toggleModal(modal, true);
  };
  const openBtnTop = document.getElementById("hrOpenVacancyModalBtn");
  if (openBtnTop) openBtnTop.addEventListener("click", openModalHandler);
  const openBtnBottom = document.getElementById("hrOpenVacancyModalBtnBottom");
  if (openBtnBottom) openBtnBottom.addEventListener("click", openModalHandler);

  if (refs.hrCreateVacancyCancelBtn) {
    refs.hrCreateVacancyCancelBtn.addEventListener("click", () => {
      resetHrCreateVacancyForm();
      const modal = document.getElementById("hrVacancyModal");
      if (modal) toggleModal(modal, false);
    });
  }

  if (refs.hrCreateVacancyForm) {
    refs.hrCreateVacancyForm.addEventListener("submit", onHrCreateVacancySubmit);
  }

  const modal = document.getElementById("hrVacancyModal");
  if (modal) modal.addEventListener("click", () => {});

  const searchInput = document.getElementById("hrVacancySearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      hrVacancyFilters.search = String(e.target.value || "").trim().toLowerCase();
      hrVacancyPageIndex = 1;
      renderHrVacancies(state.db.vacancies || []);
    });
  }

  const positionFilter = document.getElementById("hrVacancyPositionFilter");
  if (positionFilter) {
    positionFilter.addEventListener("change", (e) => {
      hrVacancyFilters.position = String(e.target.value || "");
      hrVacancyPageIndex = 1;
      renderHrVacancies(state.db.vacancies || []);
    });
  }

  const exportBtn = document.getElementById("hrVacancyExportBtn");
  if (exportBtn) exportBtn.addEventListener("click", exportHrVacanciesExcel);

  const rangeSelect = document.getElementById("hrAttendanceRangeSelect");
  if (rangeSelect) {
    rangeSelect.value = hrAttendancePreset;
    rangeSelect.addEventListener("change", () => {
      hrAttendancePreset = rangeSelect.value || "last7";
      if (hrAttendancePreset !== "custom") state.hrDateRange = { from: "", to: "" };
      renderHRDashboard();
    });
  }

  const customBtn = document.getElementById("hrAttendanceCustomBtn");
  if (customBtn) {
    customBtn.addEventListener("click", () => {
      hrAttendancePreset = "custom";
      if (rangeSelect) rangeSelect.value = "custom";
      if (typeof openDateRangeModal === "function") openDateRangeModal("hr");
    });
  }
}

function resetHrCreateVacancyForm() {
  if (!refs.hrCreateVacancyForm) return;
  refs.hrCreateVacancyForm.reset();
  const dateInput = document.getElementById("hrVacancyDateInput");
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  hrEditingOpeningId = "";
}

async function onHrCreateVacancySubmit(e) {
  e.preventDefault();
  if (!refs.hrCreateVacancyForm) return;

  const position = String(refs.hrVacancyPositionInput?.value || "").trim();
  const regulation = String(refs.hrVacancyRegulationInput?.value || "").trim();
  const publishDate = String(document.getElementById("hrVacancyDateInput")?.value || "").trim();
  if (!position || !regulation || !publishDate) {
    showToast(t("fillRequired"));
    return;
  }

  const submitBtn = refs.hrCreateVacancyForm.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.disabled = true;

  const payload = {
    id: hrEditingOpeningId,
    position,
    regulation,
    publishDate,
    createdBy: fullName(state.user || {}) || String(state.user?.login || ""),
  };

  const saved = hrEditingOpeningId
    ? (typeof updateVacancyOpeningViaApi === "function" ? await updateVacancyOpeningViaApi(payload) : null)
    : (typeof createVacancyOpeningViaApi === "function" ? await createVacancyOpeningViaApi(payload) : null);

  if (!saved) {
    showToast(t("saveFailed"));
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  state.db.vacancyOpenings = Array.isArray(state.db.vacancyOpenings) ? state.db.vacancyOpenings : [];
  const nextRow = {
    id: String(saved.id || hrEditingOpeningId || uid("open")),
    position,
    regulation,
    createdAt: String(saved.createdAt || `${publishDate}T09:00:00`),
    source: "vacancy_opening",
  };
  if (hrEditingOpeningId) {
    const idx = state.db.vacancyOpenings.findIndex((x) => String(x.id) === String(hrEditingOpeningId));
    if (idx >= 0) state.db.vacancyOpenings[idx] = nextRow;
    else state.db.vacancyOpenings.unshift(nextRow);
  } else {
    state.db.vacancyOpenings.unshift(nextRow);
  }
  saveDB();

  resetHrCreateVacancyForm();
  showToast(t("hrVacancyCreated"));
  const modal = document.getElementById("hrVacancyModal");
  if (modal) toggleModal(modal, false);
  await renderHRDashboard();
  if (submitBtn) submitBtn.disabled = false;
}

async function renderHRDashboard() {
  if (!refs.hrPage || refs.hrPage.classList.contains("hidden")) return;
  const token = ++hrRenderToken;
  const vacancies = await loadHrVacancies();
  let openings = [];
  try {
    openings = await loadHrVacancyOpenings();
  } catch {
    openings = Array.isArray(state.db.vacancyOpenings) ? state.db.vacancyOpenings : [];
  }
  if (token !== hrRenderToken) return;

  const managerStats = buildManagerPerformance();
  const attendance = buildAttendanceAnalytics();
  renderHrKpis(managerStats);
  renderHrAttendance(attendance);
  renderHrVacancies(vacancies);
  renderHrOpenings(openings);
}

async function loadHrVacancies() {
  state.db.vacancies = Array.isArray(state.db.vacancies) ? state.db.vacancies : [];
  if (typeof fetchVacanciesViaApi === "function") {
    const rows = await fetchVacanciesViaApi();
    if (Array.isArray(rows)) {
      if (!rows.length) {
        seedHrDemoVacanciesIfNeeded();
        return state.db.vacancies;
      }
      state.db.vacancies = rows;
      localStorage.setItem(LS_DB, JSON.stringify(state.db));
      scheduleHrResumeEnsure(rows);
      return rows;
    }
  }
  if (REMOTE_DB_ENABLED) return state.db.vacancies;
  seedHrDemoVacanciesIfNeeded();
  scheduleHrResumeEnsure(state.db.vacancies);
  return state.db.vacancies;
}

function scheduleHrResumeEnsure(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length || hrResumeEnsureQueued) return;
  hrResumeEnsureQueued = true;
  const run = async () => {
    try {
      const changed = await ensureHrVacancyResumes(list);
      if (changed && refs.hrPage && !refs.hrPage.classList.contains("hidden")) {
        renderHrVacancies(state.db.vacancies || []);
      }
    } catch {
      // keep UI responsive even if resume generation fails
    } finally {
      hrResumeEnsureQueued = false;
    }
  };
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => {
      run();
    }, { timeout: 1200 });
    return;
  }
  setTimeout(run, 140);
}

function seedHrDemoVacanciesIfNeeded() {
  state.db.meta = state.db.meta && typeof state.db.meta === "object" ? state.db.meta : {};
  const existing = Array.isArray(state.db.vacancies) ? state.db.vacancies : [];
  if (state.db.meta.hrVacancyDemoSeeded && existing.length) return;
  if (existing.length) {
    state.db.meta.hrVacancyDemoSeeded = true;
    return;
  }
  state.db.vacancies = [{
    id: uid("vac_demo"),
    fullName: "Muxammad Erimbetov",
    phone: "+998 (90) 123 45 67",
    birthDate: "1998-04-14",
    position: "Sotuv menedjeri",
    languages: ["Uzbek", "Russian", "English"],
    otherLanguage: "",
    jobs: [
      { company: "KUKA HOME", role: "Sotuv konsultanti", years: "2 yil" },
      { company: "Home Plus", role: "Call markaz operatori", years: "1 yil" },
    ],
    expectedSalary: "12000000",
    salaryCurrency: "UZS",
    additionalInfo: "Mijozlar bilan ishlash va premium sotuv texnikalarini yaxshi biladi.",
    resumeUrl: "",
    resumeFileName: "",
    avatarUrl: defaultAvatar(),
    source: "website_vacancy",
    status: "new",
    lang: "uz",
    createdAt: new Date().toISOString(),
  }];
  state.db.meta.hrVacancyDemoSeeded = true;
  saveDB();
}

function vacancyResumeEndpoints() {
  return [API_SALES_CHECK_FILE_URL];
}

async function saveHrResumePdfToServer(fileName, dataUrl) {
  for (const endpoint of vacancyResumeEndpoints()) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName, data_url: dataUrl }),
      });
      if (!res.ok) continue;
      const body = await res.json().catch(() => ({}));
      if (body?.url) return String(body.url);
    } catch {
      // try next
    }
  }
  return "";
}

function getFileNameFromResumeUrl(url) {
  try {
    const parsed = new URL(String(url || ""), window.location.origin);
    return String(parsed.searchParams.get("file_name") || "").trim();
  } catch {
    return "";
  }
}

async function deleteHrResumePdfFromServer(resumeUrl) {
  const fileName = getFileNameFromResumeUrl(resumeUrl);
  if (!fileName) return false;
  for (const endpoint of vacancyResumeEndpoints()) {
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName }),
      });
      if (res.ok) return true;
    } catch {
      // try next
    }
  }
  return false;
}

async function generateHrResumePdfDataUrl(row) {
  const PDF = window.PDFLib;
  if (!PDF) return "";
  const safe = (value) => String(value || "").replace(/[^\x20-\x7E\n]/g, " ");
  const pickLang = String(row?.lang || state.lang || "uz").trim().toLowerCase();
  const TEXT = {
    uz: {
      birthDate: "Tug'ilgan sana",
      phone: "Telefon",
      languages: "Qaysi tillarni bilishi",
      experience: "Ish tajribasi",
      salary: "So'ralayotgan oylik",
      info: "Qo'shimcha ma'lumot",
      noInfo: "Ma'lumot ko'rsatilmagan",
      noExp: "Ish tajribasi kiritilmagan",
      noLang: "Ko'rsatilmagan",
      currency: { UZS: "so'm", USD: "$" },
      knownLangs: { Uzbek: "O'zbek tili", Russian: "Rus tili", Kazakh: "Qozoq tili", Chinese: "Xitoy tili", English: "Ingliz tili" },
    },
    ru: {
      birthDate: "Data rojdeniya",
      phone: "Telefon",
      languages: "Yazyki",
      experience: "Opyt raboty",
      salary: "Ozhidaemaya zarplata",
      info: "Dopolnitelnaya informatsiya",
      noInfo: "Informatsiya ne ukazana",
      noExp: "Opyt raboty ne ukazan",
      noLang: "Ne ukazano",
      currency: { UZS: "sum", USD: "$" },
      knownLangs: { Uzbek: "Uzbekskiy", Russian: "Russkiy", Kazakh: "Kazahskiy", Chinese: "Kitayskiy", English: "Angliyskiy" },
    },
    zh: {
      birthDate: "Shengri",
      phone: "Dianhua",
      languages: "Yuyan",
      experience: "Gongzuo jingyan",
      salary: "Qiwang xinzi",
      info: "Buchong xinxi",
      noInfo: "Wei tianxie",
      noExp: "Wei tianxie gongzuo jingyan",
      noLang: "Wei tianxie",
      currency: { UZS: "sum", USD: "$" },
      knownLangs: { Uzbek: "Wuzibieke yu", Russian: "Eyu", Kazakh: "Hasake yu", Chinese: "Zhongwen", English: "Yingyu" },
    },
    en: {
      birthDate: "Date of birth",
      phone: "Phone",
      languages: "Languages",
      experience: "Work experience",
      salary: "Expected salary",
      info: "Additional information",
      noInfo: "Not provided",
      noExp: "No work experience provided",
      noLang: "Not provided",
      currency: { UZS: "UZS", USD: "$" },
      knownLangs: { Uzbek: "Uzbek", Russian: "Russian", Kazakh: "Kazakh", Chinese: "Chinese", English: "English" },
    },
    kz: {
      birthDate: "Tugan kuni",
      phone: "Telefon",
      languages: "Biletin tilderi",
      experience: "Jumys tajiriesi",
      salary: "Kutilgen aylik",
      info: "Kosymsha akparat",
      noInfo: "Korsetilmegen",
      noExp: "Tajirie korsetilmegen",
      noLang: "Korsetilmegen",
      currency: { UZS: "sum", USD: "$" },
      knownLangs: { Uzbek: "Ozbek tili", Russian: "Orys tili", Kazakh: "Kazak tili", Chinese: "Kytay tili", English: "Agylshyn tili" },
    },
  };
  const dict = TEXT[pickLang] || TEXT.uz;
  const pdfDoc = await PDF.PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const title = safe(String(row.fullName || "Nomzod"));
  const position = safe(String(row.position || "-"));
  const birthDate = safe(String(row.birthDate || "-"));
  const phone = safe(String(row.phone || "-"));
  const jobs = Array.isArray(row.jobs) ? row.jobs : [];
  const knownLanguages = Array.isArray(row.languages) ? row.languages : [];
  const otherLanguage = safe(String(row.otherLanguage || "").trim());
  const languageText = knownLanguages
    .map((lang) => dict.knownLangs[String(lang || "").trim()] || String(lang || "").trim())
    .filter(Boolean)
    .concat(otherLanguage ? [otherLanguage] : []);
  const salaryRaw = String(row.expectedSalary || "").trim();
  const currencyCode = String(row.salaryCurrency || "UZS").trim().toUpperCase();
  const salary = salaryRaw ? `${salaryRaw} ${dict.currency[currencyCode] || currencyCode}` : "-";
  const additionalInfo = safe(String(row.additionalInfo || row.note || "").trim());

  page.drawRectangle({ x: 0, y: height - 148, width, height: 148, color: PDF.rgb(0.94, 0.95, 0.97) });
  page.drawRectangle({ x: 0, y: height - 152, width, height: 4, color: PDF.rgb(0.72, 0.11, 0.11) });

  const avatarSize = 74;
  const avatarX = 36;
  const avatarY = height - 112;
  page.drawRectangle({ x: avatarX, y: avatarY, width: avatarSize, height: avatarSize, color: PDF.rgb(0.88, 0.9, 0.93), borderColor: PDF.rgb(0.78, 0.8, 0.85), borderWidth: 1.1 });
  try {
    const url = String(row.avatarUrl || "").trim();
    if (url) {
      const bytes = url.startsWith("data:")
        ? Uint8Array.from(atob(url.split(",")[1] || ""), (ch) => ch.charCodeAt(0))
        : await fetch(url).then((res) => (res.ok ? res.arrayBuffer() : null));
      if (bytes) {
        const isPng = url.startsWith("data:image/png") || /\.png(\?|$)/i.test(url);
        const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        page.drawImage(image, { x: avatarX + 2, y: avatarY + 2, width: avatarSize - 4, height: avatarSize - 4 });
      }
    }
  } catch {
    // keep placeholder avatar
  }

  page.drawText(title, { x: 126, y: height - 72, size: 23, color: PDF.rgb(0.12, 0.12, 0.12) });
  page.drawText(position, { x: 126, y: height - 99, size: 13, color: PDF.rgb(0.63, 0.2, 0.2) });

  const normal = await pdfDoc.embedFont(PDF.StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(PDF.StandardFonts.HelveticaBold);
  const drawWrapped = (text, x, startY, maxWidth, size, color, lineStep, font) => {
    const raw = safe(String(text || "-")).replace(/\s+/g, " ").trim() || "-";
    const words = raw.split(" ");
    let line = "";
    let y = startY;
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        return;
      }
      if (line) {
        page.drawText(line, { x, y, size, color, font });
        y -= lineStep;
      }
      line = word;
    });
    if (line) {
      page.drawText(line, { x, y, size, color, font });
      y -= lineStep;
    }
    return y;
  };

  let y = height - 184;
  const line = (label, value) => {
    page.drawText(label, { x: 36, y, size: 11, color: PDF.rgb(0.44, 0.44, 0.44), font: normal });
    y = drawWrapped(value || "-", 192, y, width - 230, 12, PDF.rgb(0.1, 0.1, 0.1), 15, bold);
    y -= 6;
  };
  line(dict.birthDate, birthDate);
  line(dict.phone, phone);
  line(dict.languages, languageText.length ? languageText.join(", ") : dict.noLang);
  line(dict.salary, salary);

  y -= 4;
  page.drawText(dict.experience, { x: 36, y, size: 13, color: PDF.rgb(0.18, 0.18, 0.18), font: bold });
  y -= 20;
  if (jobs.length) {
    jobs.slice(0, 4).forEach((job, idx) => {
      const company = safe(String(job?.company || "").trim());
      const role = safe(String(job?.role || "").trim());
      const years = safe(String(job?.years || "").trim());
      const jobLine = `${idx + 1}. ${company || "-"} | ${role || "-"}${years ? ` | ${years}` : ""}`;
      y = drawWrapped(jobLine, 36, y, width - 72, 11, PDF.rgb(0.22, 0.22, 0.22), 15, normal);
    });
  } else {
    y = drawWrapped(dict.noExp, 36, y, width - 72, 11, PDF.rgb(0.22, 0.22, 0.22), 15, normal);
  }

  y -= 8;
  page.drawText(dict.info, { x: 36, y, size: 13, color: PDF.rgb(0.18, 0.18, 0.18), font: bold });
  y -= 20;
  drawWrapped(additionalInfo || dict.noInfo, 36, y, width - 72, 11, PDF.rgb(0.22, 0.22, 0.22), 15, normal);

  const bytes = await pdfDoc.save();
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return `data:application/pdf;base64,${btoa(bin)}`;
}

async function ensureHrVacancyResumes(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let changed = false;
  for (const row of list) {
    try {
      const currentUrl = String(row.resumeUrl || "").trim();
      const needsCreate = !currentUrl || !currentUrl.includes("/api/sales-check-file");
      if (!needsCreate) continue;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const dataUrl = await generateHrResumePdfDataUrl(row);
      if (!dataUrl) continue;
      const fileName = `resume_${String(row.id || uid("vac")).replace(/[^A-Za-z0-9_.-]+/g, "_")}.pdf`;
      const remoteUrl = await saveHrResumePdfToServer(fileName, dataUrl);
      row.resumeUrl = remoteUrl || "";
      row.resumeDataUrl = remoteUrl ? "" : dataUrl;
      row.resumeFileName = fileName;
      changed = true;
      if (remoteUrl && typeof updateVacancyApplicationResumeViaApi === "function") {
        await updateVacancyApplicationResumeViaApi({ id: row.id, resumeUrl: remoteUrl, resumeFileName: fileName });
      }
    } catch {
      // skip problematic row and continue
    }
  }
  if (changed) saveDB();
  return changed;
}

async function loadHrVacancyOpenings() {
  state.db.vacancyOpenings = Array.isArray(state.db.vacancyOpenings) ? state.db.vacancyOpenings : [];
  if (typeof fetchVacancyOpeningsViaApi === "function") {
    const rows = await fetchVacancyOpeningsViaApi();
    if (Array.isArray(rows)) {
      state.db.vacancyOpenings = rows;
      localStorage.setItem(LS_DB, JSON.stringify(state.db));
      return rows;
    }
  }
  if (REMOTE_DB_ENABLED) return state.db.vacancyOpenings;
  seedHrDemoOpeningsIfNeeded();
  return state.db.vacancyOpenings;
}

function seedHrDemoOpeningsIfNeeded() {
  state.db.meta = state.db.meta && typeof state.db.meta === "object" ? state.db.meta : {};
  if (state.db.meta.hrOpeningDemoSeeded) return;
  const existing = Array.isArray(state.db.vacancyOpenings) ? state.db.vacancyOpenings : [];
  if (existing.length) {
    state.db.meta.hrOpeningDemoSeeded = true;
    return;
  }
  state.db.vacancyOpenings = [
    {
      id: uid("open"),
      position: "Sotuv menedjeri kerak",
      regulation: "Savdo rejasini bajarish, mijozlar bilan ishlash va CRM hisobotlarini yuritish.",
      createdAt: "2026-04-01T09:00:00+05:00",
      source: "vacancy_opening",
    },
    {
      id: uid("open"),
      position: "Omborchi kerak",
      regulation: "Kirim-chiqim nazorati, mahsulot qabul qilish va inventarizatsiya jarayonini yuritish.",
      createdAt: "2026-04-01T09:00:00+05:00",
      source: "vacancy_opening",
    },
  ];
  state.db.meta.hrOpeningDemoSeeded = true;
  saveDB();
}

function buildManagerPerformance() {
  const managerUsers = (state.db.users || []).filter((u) => u.role === "manager");
  const clients = state.db.clients || [];
  const checks = state.db.salesChecks || [];
  return managerUsers.map((manager) => {
    const leads = clients.filter((c) => c.managerId === manager.id);
    const sales = checks.filter((s) => s.managerId === manager.id);
    const attended = leads.filter((c) => c.attended === "yes").length;
    const conversion = leads.length ? Math.round((sales.length / leads.length) * 100) : 0;
    const score = Math.round((sales.length * 3) + (attended * 1.2) + (conversion * 0.6));
    return {
      id: manager.id,
      name: fullName(manager),
      leads: leads.length,
      sales: sales.length,
      conversion,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

function renderHrKpis(managerStats) {
  if (!refs.hrSummaryGrid) return;
  const staffUsers = (state.db.users || []).filter((u) => String(u.role || "") !== "admin");
  const totalStaff = staffUsers.length;
  const rangeRows = getHrRangeRows();
  const scopedClients = rangeRows.clients;
  const leads = scopedClients.length;
  const soldClients = scopedClients.filter((row) => isClientSold(row));
  const salesTotals = soldClients.reduce((acc, row) => {
    const parsed = parseClientPriceByCurrency(row);
    acc.uzs += parsed.uzs;
    acc.usd += parsed.usd;
    return acc;
  }, { uzs: 0, usd: 0 });
  const avgConversion = leads ? Math.round((soldClients.length / leads) * 100) : 0;
  const rankedManagers = buildManagerActivityRank(managerStats, rangeRows);
  const activeManagers = rankedManagers.filter((row) => row.activityScore > 0).length;
  const rangeLabel = getHrRangeLabel();
  const activeManagersTooltip = rankedManagers.length
    ? rankedManagers.slice(0, 10).map((row, idx) => `
      <div class="hr-kpi-tooltip-row">
        <span>${idx + 1}. ${escapeHtml(row.name || "-")}</span>
        <em>${escapeHtml(t("hrKpiActivityScore"))}: ${escapeHtml(String(row.activityScore))}</em>
      </div>
    `).join("")
    : `<div class="hr-kpi-tooltip-row"><span>-</span><em>0</em></div>`;
  const cards = [
    {
      label: t("hrKpiManagersTotal"),
      value: totalStaff,
      tone: "neutral",
      sub: t("hrKpiOverall"),
    },
    {
      label: t("hrKpiMostActiveManagers"),
      value: activeManagers,
      tone: "warm",
      sub: t("hrKpiHoverHint"),
      tooltip: activeManagersTooltip,
    },
    {
      label: t("hrKpiClients"),
      value: leads,
      tone: "rose",
      sub: rangeLabel,
    },
    {
      label: t("hrKpiSalesAmount"),
      valueHtml: `<span class="hr-kpi-money"><b>${escapeHtml(numberFmt(salesTotals.uzs))} ${escapeHtml(t("hrCurrencyUzs"))}</b><b>${escapeHtml(numberFmt(salesTotals.usd))} $</b></span>`,
      tone: "gold",
      sub: rangeLabel,
    },
    {
      label: t("hrKpiConversion"),
      value: `${avgConversion}%`,
      tone: "dark",
      sub: rangeLabel,
    },
  ];
  refs.hrSummaryGrid.innerHTML = cards.map((card) => `
    <div class="hr-kpi-card hr-kpi-${escapeHtml(card.tone || "neutral")} ${card.tooltip ? "hr-kpi-has-tooltip" : ""}">
      <small>${escapeHtml(card.label)}</small>
      <strong>${card.valueHtml || escapeHtml(String(card.value || ""))}</strong>
      <span class="hr-kpi-sub">${escapeHtml(card.sub || "")}</span>
      ${card.tooltip ? `<div class="hr-kpi-tooltip">${card.tooltip}</div>` : ""}
    </div>
  `).join("");
}

function getHrRangeRows() {
  const today = new Date().toISOString().slice(0, 10);
  const from = String(state.hrDateRange?.from || today);
  const to = String(state.hrDateRange?.to || today);
  const inRange = (row) => {
    const day = String(row?.date || row?.orderDate || "").slice(0, 10);
    if (day) {
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    }
    const ts = extractEventTimestamp(row);
    if (!ts) return false;
    const iso = new Date(ts).toISOString().slice(0, 10);
    if (from && iso < from) return false;
    if (to && iso > to) return false;
    return true;
  };
  return {
    from,
    to,
    clients: (state.db.clients || []).filter((row) => inRange(row)),
    checks: (state.db.salesChecks || []).filter((row) => inRange(row)),
  };
}

function getHrRangeLabel() {
  const today = new Date().toISOString().slice(0, 10);
  const from = String(state.hrDateRange?.from || today);
  const to = String(state.hrDateRange?.to || today);
  if (from === to) return `${t("today")}: ${fmtDate(from)}`;
  return `${fmtDate(from)} - ${fmtDate(to)}`;
}

function isClientSold(client) {
  const price = Number(client?.price || 0);
  return Number.isFinite(price) && price > 0;
}

function parseClientPriceByCurrency(client) {
  const num = Number(client?.price || 0);
  if (!Number.isFinite(num) || num <= 0) return { uzs: 0, usd: 0 };
  const currency = String(client?.currency || "UZS").toUpperCase();
  if (currency === "USD") return { uzs: 0, usd: num };
  return { uzs: num, usd: 0 };
}

function buildManagerActivityRank(managerStats, monthRows) {
  const clients = state.db.clients || [];
  const salesChecks = state.db.salesChecks || [];
  const monthClients = monthRows.clients || [];
  const monthChecks = monthRows.checks || [];
  const perfById = new Map(managerStats.map((row) => [row.id, row]));

  return (state.db.users || [])
    .filter((u) => u.role === "manager")
    .map((manager) => {
      const managerId = manager.id;
      const assignedByAdmin = clients.filter((c) => c.managerId === managerId && c.createdBy && c.createdBy !== managerId).length;
      const selfAdded = clients.filter((c) => c.managerId === managerId && c.createdBy === managerId).length;
      const monthClientActions = monthClients.filter((c) => c.managerId === managerId).length;
      const monthSalesActions = monthChecks.filter((s) => s.managerId === managerId).length;
      const totalSales = salesChecks.filter((s) => s.managerId === managerId).length;
      const loginCount = Math.max(0, Number(manager.loginCount || 0));
      const perf = perfById.get(managerId);
      const activityScore = Math.round(
        (assignedByAdmin * 3.5)
        + (selfAdded * 4)
        + (monthClientActions * 2)
        + (monthSalesActions * 3)
        + (totalSales * 1.5)
        + (loginCount * 0.8)
        + (Number(perf?.conversion || 0) * 0.5)
      );
      return {
        id: managerId,
        name: fullName(manager),
        activityScore,
      };
    })
    .sort((a, b) => (b.activityScore - a.activityScore) || a.name.localeCompare(b.name));
}

function renderHrTopManagers(managerStats) {
  if (!refs.hrTopManagers) return;
  const rows = managerStats.slice(0, 6);
  const maxScore = Math.max(1, ...rows.map((row) => row.score));
  refs.hrTopManagers.innerHTML = rows.length
    ? rows.map((row, idx) => {
      const width = Math.max(8, Math.round((row.score / maxScore) * 100));
      return `
        <div class="hr-metric-row">
          <div class="hr-metric-title"><span>${idx + 1}. ${escapeHtml(row.name || "-")}</span><em>${row.sales}/${row.leads} (${row.conversion}%)</em></div>
          <div class="hr-metric-track"><span style="width:${width}%"></span></div>
        </div>
      `;
    }).join("")
    : `<p class="muted">-</p>`;
}

function extractEventTimestamp(row) {
  const raw = String(row?.createdAt || row?.created_at || row?.date || row?.orderDate || "");
  const ts = Date.parse(raw);
  if (Number.isFinite(ts) && ts > 0) return ts;
  if (row?.date) {
    const approx = Date.parse(`${String(row.date).slice(0, 10)}T09:30:00`);
    if (Number.isFinite(approx)) return approx;
  }
  return 0;
}

function toDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildAttendanceAnalytics() {
  const range = getAttendanceWindow();
  const managers = (state.db.users || []).filter((u) => u.role === "manager");
  const byManager = new Map(managers.map((m) => [m.id, { id: m.id, name: fullName(m), onTime: 0, late: 0 }]));
  const dayFirstActivity = new Map();

  const allEvents = [];
  (state.db.clients || []).forEach((row) => allEvents.push({ managerId: row.managerId, ts: extractEventTimestamp(row) }));
  (state.db.salesChecks || []).forEach((row) => allEvents.push({ managerId: row.managerId, ts: extractEventTimestamp(row) }));

  allEvents.forEach((event) => {
    if (!event.managerId || !event.ts) return;
    if (event.ts < range.fromTs || event.ts > range.toTs) return;
    const key = `${event.managerId}|${toDayKey(event.ts)}`;
    const managerName = byManager.get(event.managerId)?.name || "-";
    const prev = dayFirstActivity.get(key);
    if (!prev || event.ts < prev.ts) dayFirstActivity.set(key, { ts: event.ts, managerName });
  });

  const punctualMinutes = (9 * 60) + 10;
  const byDay = {};
  dayFirstActivity.forEach((entry, key) => {
    const [managerId, day] = key.split("|");
    const managerRow = byManager.get(managerId);
    if (!managerRow) return;
    const date = new Date(entry.ts);
    const minutes = date.getHours() * 60 + date.getMinutes();
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const onTime = minutes <= punctualMinutes;
    if (onTime) managerRow.onTime += 1;
    else managerRow.late += 1;
    if (!byDay[day]) byDay[day] = { onTime: 0, late: 0, onTimeRows: [], lateRows: [] };
    if (onTime) {
      byDay[day].onTime += 1;
      byDay[day].onTimeRows.push({ name: entry.managerName, time });
    } else {
      byDay[day].late += 1;
      byDay[day].lateRows.push({ name: entry.managerName, time });
    }
  });

  const managerRows = Array.from(byManager.values()).map((row) => {
    const total = row.onTime + row.late;
    return { ...row, punctuality: total ? Math.round((row.onTime / total) * 100) : 0, totalDays: total };
  });

  const trend = [];
  const dayCount = Math.max(1, Math.floor((range.toTs - range.fromTs) / 86400000) + 1);
  for (let i = 0; i < dayCount; i += 1) {
    const d = new Date(range.fromTs);
    d.setDate(d.getDate() + i);
    const key = toDayKey(d.getTime());
    trend.push({
      day: `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`,
      onTime: byDay[key]?.onTime || 0,
      late: byDay[key]?.late || 0,
      onTimeRows: byDay[key]?.onTimeRows || [],
      lateRows: byDay[key]?.lateRows || [],
    });
  }

  const totalOnTime = managerRows.reduce((sum, row) => sum + row.onTime, 0);
  const totalLate = managerRows.reduce((sum, row) => sum + row.late, 0);
  return { managerRows, trend, totalOnTime, totalLate };
}

function getAttendanceWindow() {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  if (hrAttendancePreset === "custom") {
    const fromValue = String(state.hrDateRange?.from || "").trim();
    const toValue = String(state.hrDateRange?.to || "").trim();
    const fromDate = fromValue ? new Date(`${fromValue}T00:00:00`) : new Date(to.getTime() - (6 * 86400000));
    const toDate = toValue ? new Date(`${toValue}T23:59:59.999`) : to;
    return { fromTs: fromDate.getTime(), toTs: toDate.getTime() };
  }
  const spanDays = hrAttendancePreset === "last30" ? 29 : 6;
  const from = new Date(to);
  from.setDate(from.getDate() - spanDays);
  from.setHours(0, 0, 0, 0);
  return { fromTs: from.getTime(), toTs: to.getTime() };
}

function renderHrAttendance(analytics) {
  const rowTable = (rows, tone) => {
    if (!rows.length) return `<p class="muted">-</p>`;
    return `<div class="hr-bar-tooltip-table ${tone}">${rows.map((r, idx) => `<div class="hr-tip-row"><span>${idx + 1}. ${escapeHtml(r.name || "-")}</span><em>${escapeHtml(r.time || "-")}</em></div>`).join("")}</div>`;
  };
  if (refs.hrAttendanceChart) {
    const max = Math.max(1, ...analytics.trend.flatMap((x) => [x.onTime, x.late]));
    refs.hrAttendanceChart.innerHTML = analytics.trend.map((row) => {
      const onPct = Math.max(4, Math.round((row.onTime / max) * 100));
      const latePct = Math.max(4, Math.round((row.late / max) * 100));
      return `
        <div class="hr-bar-col">
          <div class="hr-bar-stack">
            <span class="hr-bar-on" style="height:${onPct}%"><i>${row.onTime}</i>${rowTable(row.onTimeRows, "green")}</span>
            <span class="hr-bar-late" style="height:${latePct}%"><i>${row.late}</i>${rowTable(row.lateRows, "red")}</span>
          </div>
          <small>${row.day}</small>
        </div>
      `;
    }).join("");
  }

  if (refs.hrPunctualityRing) {
    const rows = analytics.managerRows
      .filter((row) => row.totalDays > 0)
      .sort((a, b) => b.late - a.late)
      .slice(0, 7);
    const maxLate = Math.max(1, ...rows.map((row) => row.late));
    refs.hrPunctualityRing.innerHTML = rows.length
      ? rows.map((row, idx) => `
        <div class="hr-metric-row">
          <div class="hr-metric-title"><span>${idx + 1}. ${escapeHtml(row.name || "-")}</span><em>${row.late} marta</em></div>
          <div class="hr-metric-track hr-metric-track-late"><span style="width:${Math.max(8, Math.round((row.late / maxLate) * 100))}%"></span></div>
        </div>
      `).join("")
      : `<p class="muted">-</p>`;
  }
}

function renderHrLateLeaders(analytics) {
  if (!refs.hrLateLeaders) return;
  const rows = analytics.managerRows
    .filter((row) => row.totalDays > 0)
    .sort((a, b) => b.late - a.late)
    .slice(0, 6);
  const max = Math.max(1, ...rows.map((row) => row.late));
  refs.hrLateLeaders.innerHTML = rows.length
    ? rows.map((row, idx) => {
      const width = Math.max(8, Math.round((row.late / max) * 100));
      return `
        <div class="hr-metric-row">
          <div class="hr-metric-title"><span>${idx + 1}. ${escapeHtml(row.name || "-")}</span><em>${row.late} / ${row.totalDays}</em></div>
          <div class="hr-metric-track hr-metric-track-late"><span style="width:${width}%"></span></div>
        </div>
      `;
    }).join("")
    : `<p class="muted">-</p>`;
}

function renderHrVacancies(vacancies) {
  const rows = Array.isArray(vacancies) ? vacancies : [];
  const countInfo = document.getElementById("hrVacancyCountInfo");
  const searchInput = document.getElementById("hrVacancySearchInput");
  const positionFilter = document.getElementById("hrVacancyPositionFilter");
  if (searchInput) {
    searchInput.placeholder = t("hrVacancySearch");
    if (searchInput.value !== hrVacancyFilters.search) searchInput.value = hrVacancyFilters.search;
  }
  if (positionFilter) {
    const positions = Array.from(new Set(rows.map((row) => String(row.position || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    positionFilter.innerHTML = [option("", t("allPositions")), ...positions.map((name) => option(name, name))].join("");
    positionFilter.value = hrVacancyFilters.position;
  }
  const filtered = rows.filter((row) => {
    const byPosition = hrVacancyFilters.position ? String(row.position || "") === hrVacancyFilters.position : true;
    if (!byPosition) return false;
    if (!hrVacancyFilters.search) return true;
    return [row.fullName, row.position].join(" ").toLowerCase().includes(hrVacancyFilters.search);
  });
  if (countInfo) countInfo.textContent = `Jami: ${filtered.length}`;
  if (!refs.hrVacancyTbody) return;
  const sorted = filtered
    .slice()
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
  const pageCount = Math.max(1, Math.ceil(sorted.length / HR_VACANCY_PAGE_SIZE));
  if (hrVacancyPageIndex > pageCount) hrVacancyPageIndex = pageCount;
  const start = (hrVacancyPageIndex - 1) * HR_VACANCY_PAGE_SIZE;
  const current = sorted.slice(start, start + HR_VACANCY_PAGE_SIZE);
  if (!filtered.length) {
    refs.hrVacancyTbody.innerHTML = `<tr><td colspan="7">${escapeHtml(t("hrNoVacancies"))}</td></tr>`;
    renderHrVacancyPagination(1);
    return;
  }
  refs.hrVacancyTbody.innerHTML = current
    .map((row, idx) => {
      const avatar = row.avatarUrl || defaultAvatar();
      const contactCell = typeof clientContactCellHtml === "function"
        ? clientContactCellHtml(row.phone || "")
        : `<span class="cell-text cell-contact">${escapeHtml(row.phone || "-")}</span>`;
      const resumeHref = row.resumeUrl || row.resumeDataUrl || "";
      const resumeCell = resumeHref
        ? `<a class="action-btn sales-upload-btn" href="${escapeHtml(resumeHref)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(t("hrResumeFile"))}"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-16v10.16l-3.08-3.08-1.42 1.42L12 18l5.5-5.5-1.42-1.42L13 14.16V4h-2Z"/></svg></a>`
        : `<button class="action-btn sales-upload-btn" type="button" data-hr-resume-generate="${escapeHtml(String(row.id || ""))}" title="${escapeHtml(t("hrResumeFile"))}"><svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2Zm7-16v10.16l-3.08-3.08-1.42 1.42L12 18l5.5-5.5-1.42-1.42L13 14.16V4h-2Z"/></svg></button>`;
      return `
        <tr data-hr-vacancy-id="${escapeHtml(String(row.id || ""))}">
          <td data-label="${escapeHtml(t("number"))}">${start + idx + 1}</td>
          <td data-label="${escapeHtml(t("furnitureImage"))}"><img class="incoming-thumb" src="${escapeHtml(avatar)}" alt="" /></td>
          <td data-label="${escapeHtml(t("hrCandidate"))}">${escapeHtml(row.fullName || "-")}</td>
          <td data-label="${escapeHtml(t("contact"))}">${contactCell}</td>
          <td data-label="${escapeHtml(t("hrPosition"))}">${escapeHtml(row.position || "-")}</td>
          <td data-label="${escapeHtml(t("hrResumeFile"))}" class="sales-upload-cell">${resumeCell}</td>
          <td data-label="${escapeHtml(t("action"))}"><span class="chip-actions"><button class="action-btn" type="button" data-hr-vacancy-delete="${escapeHtml(String(row.id || ""))}" title="${escapeHtml(t("deleteAction"))}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span></td>
        </tr>
      `;
    }).join("");

  bindHrVacancyImagePreview();
  bindHrVacancyContactMenus();

  refs.hrVacancyTbody.querySelectorAll("button[data-hr-vacancy-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteHrVacancy(btn.dataset.hrVacancyDelete));
  });
  refs.hrVacancyTbody.querySelectorAll("button[data-hr-resume-generate]").forEach((btn) => {
    btn.addEventListener("click", () => generateHrVacancyResume(btn.dataset.hrResumeGenerate, btn));
  });

  if (hrVacancyOpenContactId) {
    const row = Array.from(refs.hrVacancyTbody.querySelectorAll("tr")).find(
      (tr) => String(tr.dataset.hrVacancyId || "") === hrVacancyOpenContactId,
    );
    const btn = row?.querySelector("button[data-contact-menu-toggle]");
    const wrap = btn?.closest(".client-contact-wrap");
    if (btn && wrap) {
      wrap.classList.add("open");
      wrap.dataset.keepOpen = "1";
      if (typeof positionClientContactMenu === "function") positionClientContactMenu(btn, wrap);
    } else {
      hrVacancyOpenContactId = "";
    }
  }

  renderHrVacancyPagination(pageCount);
}

function bindHrVacancyContactMenus() {
  if (!refs.hrVacancyTbody) return;
  refs.hrVacancyTbody.querySelectorAll("button[data-contact-menu-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const wrap = btn.closest(".client-contact-wrap");
      if (!wrap) return;
      const row = btn.closest("tr");
      const rowId = String(row?.dataset.hrVacancyId || "");
      const willOpen = !wrap.classList.contains("open");
      if (typeof closeClientContactMenus === "function") closeClientContactMenus(true);
      if (willOpen) {
        wrap.classList.add("open");
        wrap.dataset.keepOpen = "1";
        if (typeof positionClientContactMenu === "function") positionClientContactMenu(btn, wrap);
        hrVacancyOpenContactId = rowId;
      } else {
        delete wrap.dataset.keepOpen;
        hrVacancyOpenContactId = "";
      }
    });
  });

  refs.hrVacancyTbody.querySelectorAll("button[data-contact-copy]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const encoded = String(btn.dataset.contactCopy || "");
      const value = encoded ? decodeURIComponent(encoded) : "";
      if (!value) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(value);
          if (typeof closeClientContactMenus === "function") closeClientContactMenus(true);
          hrVacancyOpenContactId = "";
          showToast(t("copied"), "error");
          return;
        }
      } catch {
        // fallback below
      }
      const input = document.createElement("input");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      if (typeof closeClientContactMenus === "function") closeClientContactMenus(true);
      hrVacancyOpenContactId = "";
      showToast(t("copied"), "error");
    });
  });

  refs.hrVacancyTbody.querySelectorAll(".client-contact-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      if (typeof closeClientContactMenus === "function") closeClientContactMenus(true);
      hrVacancyOpenContactId = "";
    });
  });
}

function bindHrVacancyImagePreview() {
  refs.hrVacancyTbody?.querySelectorAll(".incoming-thumb").forEach((img) => {
    if (img.dataset.hrLightboxBound === "1") return;
    img.dataset.hrLightboxBound = "1";
    img.addEventListener("click", () => {
      const src = img.getAttribute("src") || "";
      if (!src) return;
      if (typeof openImageLightbox === "function") {
        openImageLightbox(src);
        return;
      }
      img.classList.toggle("hr-thumb-expanded");
    });
  });
}

async function generateHrVacancyResume(id, triggerBtn) {
  const row = (state.db.vacancies || []).find((x) => String(x.id || "") === String(id || ""));
  if (!row) return;
  if (triggerBtn) triggerBtn.disabled = true;
  try {
    const dataUrl = await generateHrResumePdfDataUrl(row);
    if (!dataUrl) {
      showToast(t("saveFailed"), "error");
      return;
    }
    const fileName = String(row.resumeFileName || `resume_${String(row.id || uid("vac")).replace(/[^A-Za-z0-9_.-]+/g, "_")}.pdf`);
    const remoteUrl = await saveHrResumePdfToServer(fileName, dataUrl);
    row.resumeFileName = fileName;
    row.resumeUrl = remoteUrl || "";
    row.resumeDataUrl = remoteUrl ? "" : dataUrl;
    if (typeof updateVacancyApplicationResumeViaApi === "function") {
      await updateVacancyApplicationResumeViaApi({
        id: row.id,
        resumeUrl: row.resumeUrl,
        resumeFileName: fileName,
      });
    }
    saveDB();
    const href = row.resumeUrl || row.resumeDataUrl;
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    renderHrVacancies(state.db.vacancies || []);
  } catch {
    showToast(t("saveFailed"), "error");
  } finally {
    if (triggerBtn) triggerBtn.disabled = false;
  }
}

function renderHrVacancyPagination(pageCount) {
  const wrap = document.getElementById("hrVacancyPagination");
  if (!wrap) return;
  wrap.innerHTML = "";
  const chunkSize = 10;
  const showChunkNav = pageCount > chunkSize;
  const currentChunk = Math.floor((hrVacancyPageIndex - 1) / chunkSize);
  const chunkStart = currentChunk * chunkSize + 1;
  const chunkEnd = Math.min(chunkStart + chunkSize - 1, pageCount);

  if (showChunkNav) {
    const prev = document.createElement("button");
    prev.className = "page-btn";
    prev.type = "button";
    prev.textContent = "<";
    prev.disabled = chunkStart === 1;
    prev.addEventListener("click", () => {
      const target = Math.max(1, chunkStart - chunkSize);
      if (target === hrVacancyPageIndex) return;
      hrVacancyPageIndex = target;
      renderHrVacancies(state.db.vacancies || []);
    });
    wrap.appendChild(prev);
  }

  for (let i = chunkStart; i <= chunkEnd; i += 1) {
    const b = document.createElement("button");
    b.className = `page-btn ${hrVacancyPageIndex === i ? "active" : ""}`;
    b.type = "button";
    b.textContent = String(i);
    b.addEventListener("click", () => {
      hrVacancyPageIndex = i;
      renderHrVacancies(state.db.vacancies || []);
    });
    wrap.appendChild(b);
  }

  if (showChunkNav) {
    const next = document.createElement("button");
    next.className = "page-btn";
    next.type = "button";
    next.textContent = ">";
    next.disabled = chunkEnd >= pageCount;
    next.addEventListener("click", () => {
      const target = Math.min(pageCount, chunkStart + chunkSize);
      if (target === hrVacancyPageIndex) return;
      hrVacancyPageIndex = target;
      renderHrVacancies(state.db.vacancies || []);
    });
    wrap.appendChild(next);
  }
}

function exportHrVacanciesExcel() {
  const rows = (state.db.vacancies || []).filter((row) => {
    const byPosition = hrVacancyFilters.position ? String(row.position || "") === hrVacancyFilters.position : true;
    if (!byPosition) return false;
    if (!hrVacancyFilters.search) return true;
    return [row.fullName, row.position].join(" ").toLowerCase().includes(hrVacancyFilters.search);
  });
  const headers = [t("number"), t("hrCandidate"), t("contact"), t("hrPosition"), t("hrResumeFile")];
  const body = rows.map((row, idx) => [idx + 1, row.fullName || "", row.phone || "", row.position || "", row.resumeUrl || row.resumeDataUrl || ""]);
  const ws = buildStyledExportSheet(t("hrVacancyInbox"), headers, body);
  writeStyledWorkbook(ws, t("menuHR"), `hr_vacancies_${state.lang}.xlsx`);
}

async function deleteHrVacancy(id) {
  if (!id) return;
  if (!(await confirmPermanentDelete())) return;
  const row = (state.db.vacancies || []).find((x) => String(x.id) === String(id));
  await deleteHrResumePdfFromServer(row?.resumeUrl || "");
  const removed = typeof deleteVacancyViaApi === "function" ? await deleteVacancyViaApi(id) : false;
  if (!removed) {
    state.db.vacancies = (state.db.vacancies || []).filter((row) => String(row.id) !== String(id));
    saveDB();
  }
  await renderHRDashboard();
}

function renderHrOpenings(openings) {
  const body = document.getElementById("hrOpeningsTbody");
  const countInfo = document.getElementById("hrOpeningsCountInfo");
  if (!body) return;
  const rows = (Array.isArray(openings) ? openings : [])
    .slice()
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
  if (countInfo) countInfo.textContent = `Jami: ${rows.length}`;
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="5">${escapeHtml(t("hrNoVacancies"))}</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((row, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(row.position || "-")}</td>
      <td>${escapeHtml(row.regulation || "-")}</td>
      <td>${escapeHtml(fmtDate(row.createdAt || ""))}</td>
      <td><span class="chip-actions"><button class="action-btn" type="button" data-hr-opening-edit="${escapeHtml(String(row.id || ""))}"><svg viewBox="0 0 24 24"><path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-8.04-2.92-2.92 1.42-1.42a1 1 0 0 1 1.42 0l1.5 1.5a1 1 0 0 1 0 1.42l-1.42 1.42Z"/></svg></button><button class="action-btn" type="button" data-hr-opening-delete="${escapeHtml(String(row.id || ""))}"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7Zm4-4h4l1 2h4v2H5V5h4l1-2Z"/></svg></button></span></td>
    </tr>
  `).join("");
  body.querySelectorAll("button[data-hr-opening-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openHrOpeningForEdit(btn.dataset.hrOpeningEdit));
  });
  body.querySelectorAll("button[data-hr-opening-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!(await confirmPermanentDelete())) return;
      const id = String(btn.dataset.hrOpeningDelete || "");
      const removed = typeof deleteVacancyViaApi === "function" ? await deleteVacancyViaApi(id) : false;
      if (!removed) {
        state.db.vacancyOpenings = (state.db.vacancyOpenings || []).filter((x) => String(x.id) !== id);
        saveDB();
      }
      await renderHRDashboard();
    });
  });
}

function openHrOpeningForEdit(id) {
  const row = (state.db.vacancyOpenings || []).find((x) => String(x.id) === String(id));
  if (!row) return;
  hrEditingOpeningId = String(row.id || "");
  if (refs.hrVacancyPositionInput) refs.hrVacancyPositionInput.value = row.position || "";
  if (refs.hrVacancyRegulationInput) refs.hrVacancyRegulationInput.value = row.regulation || "";
  const dateInput = document.getElementById("hrVacancyDateInput");
  if (dateInput) {
    const dt = String(row.createdAt || "").slice(0, 10);
    dateInput.value = dt || new Date().toISOString().slice(0, 10);
  }
  const modal = document.getElementById("hrVacancyModal");
  if (modal) toggleModal(modal, true);
}

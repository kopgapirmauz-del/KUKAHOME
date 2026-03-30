let hrRenderToken = 0;

async function renderHRDashboard() {
  if (!refs.hrPage || refs.hrPage.classList.contains("hidden")) return;
  const token = ++hrRenderToken;
  const vacancies = await loadHrVacancies();
  if (token !== hrRenderToken) return;

  const managerStats = buildManagerPerformance();
  const attendance = buildAttendanceAnalytics();
  renderHrKpis(managerStats);
  renderHrAttendance(attendance);
  renderHrTopManagers(managerStats);
  renderHrLateLeaders(attendance);
  renderHrVacancies(vacancies);
}

async function loadHrVacancies() {
  state.db.vacancies = Array.isArray(state.db.vacancies) ? state.db.vacancies : [];
  if (typeof fetchVacanciesViaApi === "function") {
    const rows = await fetchVacanciesViaApi();
    if (Array.isArray(rows) && rows.length) return rows;
  }
  return state.db.vacancies;
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
  const activeManagers = managerStats.filter((m) => m.leads || m.sales).length;
  const leads = (state.db.clients || []).length;
  const checks = (state.db.salesChecks || []).length;
  const avgConversion = managerStats.length
    ? Math.round(managerStats.reduce((sum, row) => sum + row.conversion, 0) / managerStats.length)
    : 0;
  const cards = [
    { label: t("hrKpiManagers"), value: activeManagers },
    { label: t("hrKpiClients"), value: leads },
    { label: t("hrKpiChecks"), value: checks },
    { label: t("hrKpiConversion"), value: `${avgConversion}%` },
  ];
  refs.hrSummaryGrid.innerHTML = cards.map((card) => `
    <div class="hr-kpi-card">
      <small>${escapeHtml(card.label)}</small>
      <strong>${escapeHtml(String(card.value))}</strong>
    </div>
  `).join("");
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
  const managers = (state.db.users || []).filter((u) => u.role === "manager");
  const byManager = new Map(managers.map((m) => [m.id, { id: m.id, name: fullName(m), onTime: 0, late: 0 }]));
  const dayFirstActivity = new Map();

  const allEvents = [];
  (state.db.clients || []).forEach((row) => allEvents.push({ managerId: row.managerId, ts: extractEventTimestamp(row) }));
  (state.db.salesChecks || []).forEach((row) => allEvents.push({ managerId: row.managerId, ts: extractEventTimestamp(row) }));

  allEvents.forEach((event) => {
    if (!event.managerId || !event.ts) return;
    const key = `${event.managerId}|${toDayKey(event.ts)}`;
    const prev = dayFirstActivity.get(key);
    if (!prev || event.ts < prev) dayFirstActivity.set(key, event.ts);
  });

  const punctualMinutes = 9 * 60 + 15;
  const byDay = {};
  dayFirstActivity.forEach((ts, key) => {
    const [managerId, day] = key.split("|");
    const managerRow = byManager.get(managerId);
    if (!managerRow) return;
    const date = new Date(ts);
    const minutes = date.getHours() * 60 + date.getMinutes();
    const onTime = minutes <= punctualMinutes;
    if (onTime) managerRow.onTime += 1;
    else managerRow.late += 1;
    if (!byDay[day]) byDay[day] = { onTime: 0, late: 0 };
    if (onTime) byDay[day].onTime += 1;
    else byDay[day].late += 1;
  });

  const managerRows = Array.from(byManager.values()).map((row) => {
    const total = row.onTime + row.late;
    return { ...row, punctuality: total ? Math.round((row.onTime / total) * 100) : 0, totalDays: total };
  });

  const today = new Date();
  const trend = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDayKey(d.getTime());
    trend.push({
      day: `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`,
      onTime: byDay[key]?.onTime || 0,
      late: byDay[key]?.late || 0,
    });
  }

  const totalOnTime = managerRows.reduce((sum, row) => sum + row.onTime, 0);
  const totalLate = managerRows.reduce((sum, row) => sum + row.late, 0);
  return { managerRows, trend, totalOnTime, totalLate };
}

function renderHrAttendance(analytics) {
  if (refs.hrAttendanceChart) {
    const max = Math.max(1, ...analytics.trend.flatMap((x) => [x.onTime, x.late]));
    refs.hrAttendanceChart.innerHTML = analytics.trend.map((row) => {
      const onPct = Math.max(4, Math.round((row.onTime / max) * 100));
      const latePct = Math.max(4, Math.round((row.late / max) * 100));
      return `
        <div class="hr-bar-col">
          <div class="hr-bar-stack">
            <span class="hr-bar-on" style="height:${onPct}%" title="${escapeHtml(t("green"))}: ${row.onTime}"></span>
            <span class="hr-bar-late" style="height:${latePct}%" title="${escapeHtml(t("red"))}: ${row.late}"></span>
          </div>
          <small>${row.day}</small>
        </div>
      `;
    }).join("");
  }

  if (refs.hrPunctualityRing) {
    const total = Math.max(1, analytics.totalOnTime + analytics.totalLate);
    const onPct = Math.round((analytics.totalOnTime / total) * 100);
    const latePct = 100 - onPct;
    refs.hrPunctualityRing.innerHTML = `
      <div class="hr-ring" style="--on:${onPct};--late:${latePct}"></div>
      <div class="hr-ring-legend">
        <span><i class="on"></i>${escapeHtml(t("green"))}: ${analytics.totalOnTime}</span>
        <span><i class="late"></i>${escapeHtml(t("red"))}: ${analytics.totalLate}</span>
      </div>
    `;
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

function vacancyStatusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("done") || value.includes("approved") || value.includes("hired")) return "green";
  if (value.includes("new") || value.includes("pending")) return "yellow";
  if (value.includes("reject")) return "red";
  return "yellow";
}

function renderHrVacancies(vacancies) {
  const rows = Array.isArray(vacancies) ? vacancies : [];
  if (refs.hrVacancyCount) refs.hrVacancyCount.textContent = String(rows.length);
  if (!refs.hrVacancyTbody) return;
  if (!rows.length) {
    refs.hrVacancyTbody.innerHTML = `<tr><td colspan="7">${escapeHtml(t("hrNoVacancies"))}</td></tr>`;
    return;
  }
  refs.hrVacancyTbody.innerHTML = rows
    .slice()
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0))
    .map((row, idx) => {
      const statusClass = vacancyStatusClass(row.status);
      const statusText = row.status || "new";
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(row.fullName || "-")}</td>
          <td>${escapeHtml(row.phone || "-")}</td>
          <td>${escapeHtml(row.position || "-")}</td>
          <td>${escapeHtml(row.source || "website")}</td>
          <td>${escapeHtml(fmtDate(row.createdAt || ""))}</td>
          <td><span class="tag ${statusClass}">${escapeHtml(statusText)}</span></td>
        </tr>
      `;
    }).join("");
}

import { restRequest } from "./_supabase.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeVacancyRow(row, idx) {
  return {
    id: String(row.id || `vac_${idx}`),
    title: String(row.title || row.position || row.vacancy || row.role || "").trim(),
    description: String(row.description || row.details || row.requirements || row.note || "").trim(),
    published_at: String(row.published_at || row.created_at || row.createdAt || ""),
    order_no: Number(row.order_no || row.sort_order || row.order || (idx + 1)),
  };
}

async function listPublicVacancies(env) {
  const tableCandidates = [
    { name: "vacancy_openings", select: "id,title,description,published_at,order_no,created_at" },
    { name: "job_openings", select: "id,title,description,published_at,order_no,created_at" },
    { name: "vacancies", select: "id,position,note,created_at,status,source" },
  ];

  for (const candidate of tableCandidates) {
    try {
      const rows = await restRequest(env, candidate.name, {
        query: {
          select: candidate.select,
          ...(candidate.name === "vacancies" ? { source: "eq.vacancy_opening" } : {}),
          order: "created_at.desc",
        },
      });
      const mapped = asArray(rows)
        .map((row, idx) => normalizeVacancyRow(row, idx))
        .filter((row) => row.title);
      if (mapped.length) return mapped;
    } catch {
      // try next table candidate
    }
  }
  const now = new Date().toISOString();
  return [
    { id: "demo-sales-manager", title: "Sotuv menedjeri kerak", description: "Savdo rejasini bajarish, mijozlar bilan ishlash va CRM hisobotlarini yuritish.", published_at: now, order_no: 1 },
    { id: "demo-warehouse", title: "Omborchi kerak", description: "Kirim-chiqim nazorati, mahsulot qabul qilish va inventarizatsiya jarayonini yuritish.", published_at: now, order_no: 2 },
  ];
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const type = String(url.searchParams.get("type") || "openings").trim().toLowerCase();
    if (type === "applications") {
      const rows = await restRequest(env, "vacancies", {
        query: {
          select: "id,full_name,phone,position,note,source,status,created_at",
          source: "neq.vacancy_opening",
          order: "created_at.desc",
        },
      });
      return Response.json({ success: true, items: asArray(rows) });
    }
    const items = await listPublicVacancies(env);
    return Response.json({ success: true, items });
  } catch {
    return Response.json({ success: true, items: [] });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const type = String(data?.type || data?.mode || "application").trim().toLowerCase();

    if (type === "opening" || type === "openings") {
      const position = String(data?.position || "").trim();
      const regulation = String(data?.regulation || "").trim();
      if (!position || !regulation) {
        return Response.json({ success: false, error: "Missing position or regulation" }, { status: 400 });
      }

      await restRequest(env, "vacancies", {
        method: "POST",
        body: {
          full_name: "",
          phone: "",
          position,
          note: regulation,
          source: "vacancy_opening",
          status: "published",
        },
      });
      return Response.json({ success: true });
    }

    const fullName = String(data?.fullName || `${data?.firstName || ""} ${data?.lastName || ""}`).trim();
    const position = String(data?.vacancyTitle || data?.position || "").trim();
    const phone = String(data?.phone || "-").trim() || "-";
    if (!fullName || !position) {
      return Response.json({ success: false, error: "Missing fullName or vacancyTitle" }, { status: 400 });
    }

    await restRequest(env, "vacancies", {
      method: "POST",
      body: {
        full_name: fullName,
        phone,
        position,
        source: "website_vacancy",
        status: "new",
      },
    });

    try {
      await restRequest(env, "vacancy_applications", {
        method: "POST",
        body: {
          full_name: fullName,
          vacancy_title: position,
          languages: Array.isArray(data?.languages) ? data.languages.join(", ") : "",
          other_language: String(data?.otherLanguage || ""),
          jobs_json: JSON.stringify(Array.isArray(data?.jobs) ? data.jobs : []),
          expected_salary: String(data?.expectedSalary || ""),
          salary_currency: String(data?.salaryCurrency || "UZS"),
          additional_info: String(data?.additionalInfo || ""),
          photo_name: String(data?.photoName || ""),
          source: "website_vacancy",
        },
      });
    } catch {
      // optional table may not exist
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

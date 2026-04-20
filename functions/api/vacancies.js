import { restRequest, storageRemove } from "./_supabase.js";

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
    {
      id: "demo-loader-installer",
      title: "Yuk tashuvchi - o'rnatuvchi",
      description: "Ishga taklif qilinadi\n\nYuk tashuvchi - o'rnatuvchi\n(Gruzchik-ustanovshik)\n\nTalablar:\n- Erkak kishi\n- Jismonan baquvvat\n- Mebel sohasida tajriba\n\nIsh vaqti:\n- 09:00 dan 18:00 gacha\n\nOylik maosh:\n- 4 000 000 - 5 000 000 so'm\n\nTaklif qilamiz:\n- Qulay ish joyi va barqaror ish\n- Doimiy ish va rivojlanish imkoniyati\n\nBatafsil ma'lumot uchun:\n📞 95 885 22 33",
      published_at: now,
      order_no: 1,
    },
    { id: "demo-sales-manager", title: "Sotuv menedjeri kerak", description: "Savdo rejasini bajarish, mijozlar bilan ishlash va CRM hisobotlarini yuritish.", published_at: now, order_no: 2 },
    { id: "demo-warehouse", title: "Omborchi kerak", description: "Kirim-chiqim nazorati, mahsulot qabul qilish va inventarizatsiya jarayonini yuritish.", published_at: now, order_no: 3 },
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

function extractFileNameFromUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://example.local");
    return String(parsed.searchParams.get("file_name") || "").trim();
  } catch {
    return "";
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
    const birthDate = String(data?.birthDate || data?.birth_date || "").trim();
    const lang = String(data?.lang || data?.language || "uz").trim().toLowerCase();
    const additionalInfo = String(data?.additionalInfo || "").trim();
    const payloadMeta = {
      lang,
      birthDate,
      phone,
      vacancyTitle: position,
      desiredPosition: String(data?.desiredPosition || "").trim(),
      desiredPositionCode: String(data?.desiredPositionCode || "").trim(),
      languages: Array.isArray(data?.languages) ? data.languages : [],
      otherLanguage: String(data?.otherLanguage || ""),
      jobs: Array.isArray(data?.jobs) ? data.jobs : [],
      expectedSalary: String(data?.expectedSalary || ""),
      salaryCurrency: String(data?.salaryCurrency || "UZS"),
      additionalInfo,
      photoDataUrl: String(data?.photoDataUrl || ""),
      photoName: String(data?.photoName || ""),
    };
    const note = `__VACMETA__${JSON.stringify(payloadMeta)}`;
    if (!fullName || !position) {
      return Response.json({ success: false, error: "Missing fullName or vacancyTitle" }, { status: 400 });
    }

    await restRequest(env, "vacancies", {
      method: "POST",
      body: {
        full_name: fullName,
        phone,
        position,
        note,
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
          additional_info: `${birthDate ? `birth_date: ${birthDate}\n` : ""}${phone ? `phone: ${phone}\n` : ""}${String(data?.desiredPosition || "").trim() ? `position: ${String(data.desiredPosition || "").trim()}\n` : ""}${additionalInfo}`.trim(),
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

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false, error: "missing_id" }, { status: 400 });

    const existing = await restRequest(env, "vacancies", {
      query: {
        select: "id,resume_file_name,resume_url",
        id: `eq.${id}`,
        limit: "1",
      },
    });
    const row = Array.isArray(existing) && existing.length ? existing[0] : null;
    const fileName = String(row?.resume_file_name || extractFileNameFromUrl(row?.resume_url || "")).trim();
    if (fileName) {
      const objectPath = fileName.includes("/") ? fileName.replace(/^\/+/, "") : `sales-checks/${fileName}`;
      try {
        await storageRemove(env, "crm-private", [objectPath]);
      } catch {
        // do not block vacancy delete when file does not exist
      }
    }

    await restRequest(env, "vacancies", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false, error: "missing_id" }, { status: 400 });

    const type = String(data?.type || "").trim().toLowerCase();
    let body = null;
    if (type === "opening" || type === "openings") {
      const position = String(data?.position || "").trim();
      const regulation = String(data?.regulation || "").trim();
      const createdAt = String(data?.created_at || data?.createdAt || "").trim();
      if (!position || !regulation) {
        return Response.json({ success: false, error: "missing_position_or_regulation" }, { status: 400 });
      }
      body = {
        position,
        note: regulation,
        ...(createdAt ? { created_at: createdAt } : {}),
      };
    } else {
      const resumeUrl = String(data?.resume_url || data?.resumeUrl || "").trim();
      const resumeFileName = String(data?.resume_file_name || data?.resumeFileName || "").trim();
      body = {
        ...(data?.fullName ? { full_name: String(data.fullName || "").trim() } : {}),
        ...(data?.phone ? { phone: String(data.phone || "").trim() } : {}),
        ...(data?.position ? { position: String(data.position || "").trim() } : {}),
        ...(data?.note ? { note: String(data.note || "").trim() } : {}),
        ...(resumeUrl ? { resume_url: resumeUrl } : {}),
        ...(resumeFileName ? { resume_file_name: resumeFileName } : {}),
      };
      if (!Object.keys(body).length) {
        return Response.json({ success: false, error: "empty_body" }, { status: 400 });
      }
    }

    let updated;
    try {
      updated = await restRequest(env, "vacancies", {
        method: "PATCH",
        query: { id: `eq.${id}` },
        body,
        prefer: "return=representation",
      });
    } catch {
      if (Object.prototype.hasOwnProperty.call(body, "resume_file_name")) {
        const fallbackBody = { ...body };
        delete fallbackBody.resume_file_name;
        updated = await restRequest(env, "vacancies", {
          method: "PATCH",
          query: { id: `eq.${id}` },
          body: fallbackBody,
          prefer: "return=representation",
        });
      } else {
        throw new Error("vacancy_update_failed");
      }
    }

    const row = Array.isArray(updated) ? updated[0] : updated;
    return Response.json({ success: true, item: row || null });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

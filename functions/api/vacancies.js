import { restRequest, storageRemove } from "./_supabase.js";
import { requireAuth } from "./_auth.js";

const BUCKET = "crm-private";
const HR_ROLES = ["admin", "hr", "director"];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const OPENING_TABLE_CANDIDATES = [
  { name: "vacancy_openings", select: "id,title,description,published_at,order_no,created_at" },
  { name: "job_openings", select: "id,title,description,published_at,order_no,created_at" },
  { name: "vacancies", select: "id,position,note,created_at,status,source" },
];

function normalizeVacancyRow(row, idx, sourceTable = "") {
  const publishedAt = String(row.published_at || row.created_at || row.createdAt || "");
  return {
    id: String(row.id || `vac_${idx}`),
    title: String(row.title || row.position || row.vacancy || row.role || "").trim(),
    description: String(row.description || row.details || row.requirements || row.note || "").trim(),
    published_at: publishedAt,
    created_at: publishedAt,
    order_no: Number(row.order_no || row.sort_order || row.order || (idx + 1)),
    source_table: sourceTable,
  };
}

async function findOpeningSource(env, openingId = "") {
  let firstAvailable = null;
  for (const candidate of OPENING_TABLE_CANDIDATES) {
    try {
      const rows = await restRequest(env, candidate.name, {
        query: {
          select: candidate.select,
          ...(candidate.name === "vacancies" ? { source: "eq.vacancy_opening" } : {}),
          ...(openingId ? { id: `eq.${openingId}`, limit: "1" } : {}),
          order: "created_at.desc",
        },
      });
      if (!firstAvailable) firstAvailable = { candidate, rows: [] };
      if (asArray(rows).length) return { candidate, rows: asArray(rows) };
    } catch {
      // try next table candidate
    }
  }
  return firstAvailable;
}

function openingMutationBody(candidate, data) {
  const position = String(data?.position || "").trim();
  const regulation = String(data?.regulation || "").trim();
  const publishedAt = String(data?.created_at || data?.createdAt || "").trim();
  if (candidate.name === "vacancies") {
    return {
      full_name: "",
      phone: "",
      position,
      note: regulation,
      source: "vacancy_opening",
      status: "published",
      ...(publishedAt ? { created_at: publishedAt } : {}),
    };
  }
  return {
    title: position,
    description: regulation,
    ...(publishedAt ? { published_at: publishedAt } : {}),
  };
}

async function listPublicVacancies(env) {
  const source = await findOpeningSource(env);
  if (source?.rows?.length) {
    return source.rows
      .map((row, idx) => normalizeVacancyRow(row, idx, source.candidate.name))
      .filter((row) => row.title);
  }
  return [];
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const type = String(url.searchParams.get("type") || "applications").trim().toLowerCase();
    const isOpenings = type === "opening" || type === "openings";

    // Published openings are public because the customer-facing site reads
    // this endpoint. Applicant records remain restricted to HR/admin users.
    if (isOpenings) {
      const items = await listPublicVacancies(env);
      return Response.json({ success: true, items });
    }

    const session = await requireAuth(request, env, HR_ROLES);
    if (session instanceof Response) return session;

    let rows;
    try {
      rows = await restRequest(env, "vacancies", {
        query: {
          select: "id,full_name,phone,position,note,resume_url,resume_file_name,photo_url,source,status,created_at",
          source: "neq.vacancy_opening",
          order: "created_at.desc",
        },
      });
    } catch {
      rows = await restRequest(env, "vacancies", {
        query: {
          select: "id,full_name,phone,position,note,source,status,created_at",
          source: "neq.vacancy_opening",
          order: "created_at.desc",
        },
      });
    }
    return Response.json({ success: true, items: Array.isArray(rows) ? rows : [] });
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
      // Publishing a vacancy opening is an internal HR/admin action.
      const session = await requireAuth(request, env, HR_ROLES);
      if (session instanceof Response) return session;
      const position = String(data?.position || "").trim();
      const regulation = String(data?.regulation || "").trim();
      const createdAtRaw = String(data?.created_at || data?.createdAt || "").trim();
      const createdAtTs = createdAtRaw ? Date.parse(createdAtRaw) : 0;
      const createdAt = Number.isFinite(createdAtTs) && createdAtTs > 0
        ? new Date(createdAtTs).toISOString()
        : new Date().toISOString();
      if (!position || !regulation) return Response.json({ success: false }, { status: 400 });

      const source = await findOpeningSource(env);
      if (!source?.candidate) {
        return Response.json({ success: false, error: "opening_table_not_found" }, { status: 500 });
      }
      const inserted = await restRequest(env, source.candidate.name, {
        method: "POST",
        body: openingMutationBody(source.candidate, { ...data, created_at: createdAt }),
        prefer: "return=representation",
      });
      const row = asArray(inserted)[0] || inserted || null;
      return Response.json({
        success: true,
        item: row ? normalizeVacancyRow(row, 0, source.candidate.name) : null,
      });
    }

    const first = String(data?.firstName || data?.first_name || "").trim();
    const last = String(data?.lastName || data?.last_name || "").trim();
    const fullName = String(
      data?.fullName
      || data?.full_name
      || data?.name
      || data?.fio
      || `${first} ${last}`
    ).trim();
    const position = String(
      data?.vacancyTitle
      || data?.vacancy_title
      || data?.position
      || data?.vacancy
      || data?.role
      || data?.lavozim
      || ""
    ).trim();
    const phone = String(data?.phone || data?.phone_number || data?.contact || data?.telegram || "-").trim() || "-";
    const birthDate = String(data?.birthDate || data?.birth_date || "").trim();
    const lang = String(data?.lang || data?.language || "uz").trim().toLowerCase();
    const additionalInfo = String(data?.additionalInfo || data?.note || data?.message || data?.comment || "").trim();
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
    if (!fullName || !position) return Response.json({ success: false }, { status: 400 });

    await restRequest(env, "vacancies", {
      method: "POST",
      body: {
        full_name: fullName,
        phone,
        position,
        note,
        resume_url: "",
        resume_file_name: "",
        photo_url: String(data?.photoDataUrl || ""),
        source: "website_vacancy",
        status: "new",
        created_at: new Date().toISOString(),
      },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env, HR_ROLES);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });

    const type = String(data?.type || "").trim().toLowerCase();
    if (type === "opening" || type === "openings") {
      const source = await findOpeningSource(env, id);
      if (!source?.candidate || !source.rows.length) {
        return Response.json({ success: false, error: "opening_not_found" }, { status: 404 });
      }
      await restRequest(env, source.candidate.name, {
        method: "DELETE",
        query: { id: `eq.${id}` },
      });
      return Response.json({ success: true });
    }

    let existing;
    try {
      existing = await restRequest(env, "vacancies", {
        query: {
          select: "id,resume_file_name,resume_url",
          id: `eq.${id}`,
          limit: "1",
        },
      });
    } catch {
      existing = await restRequest(env, "vacancies", {
        query: {
          select: "id,resume_url",
          id: `eq.${id}`,
          limit: "1",
        },
      });
    }
    const row = Array.isArray(existing) && existing.length ? existing[0] : null;
    const fileNameRaw = String(row?.resume_file_name || "").trim();
    let fileName = fileNameRaw;
    if (!fileName) {
      const resumeUrl = String(row?.resume_url || "").trim();
      try {
        const url = new URL(resumeUrl, "https://example.local");
        fileName = String(url.searchParams.get("file_name") || "").trim();
      } catch {
        fileName = "";
      }
    }
    // Only ever a flat name under sales-checks/. A separator or relative
    // segment here would let a stored value address an arbitrary object.
    const isSafeName = /^[A-Za-z0-9_.-]+$/.test(fileName)
      && !fileName.includes("..")
      && fileName.length <= 200;
    if (fileName && isSafeName) {
      const objectPath = `sales-checks/${fileName}`;
      try {
        await storageRemove(env, BUCKET, [objectPath]);
      } catch {
        // keep deleting DB row even if file is already missing
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
  const session = await requireAuth(request, env, HR_ROLES);
  if (session instanceof Response) return session;
  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });
    const type = String(data?.type || "").trim().toLowerCase();
    let body = null;
    if (type === "opening" || type === "openings") {
      const position = String(data?.position || "").trim();
      const regulation = String(data?.regulation || "").trim();
      if (!position || !regulation) {
        return Response.json({ success: false, error: "missing_position_or_regulation" }, { status: 400 });
      }
      const source = await findOpeningSource(env, id);
      if (!source?.candidate || !source.rows.length) {
        return Response.json({ success: false, error: "opening_not_found" }, { status: 404 });
      }
      const updated = await restRequest(env, source.candidate.name, {
        method: "PATCH",
        query: { id: `eq.${id}` },
        body: openingMutationBody(source.candidate, data),
        prefer: "return=representation",
      });
      const row = asArray(updated)[0] || updated || null;
      if (!row) {
        return Response.json({ success: false, error: "opening_update_failed" }, { status: 500 });
      }
      return Response.json({
        success: true,
        item: normalizeVacancyRow(row, 0, source.candidate.name),
      });
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
      if (!Object.keys(body).length) return Response.json({ success: false }, { status: 400 });
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

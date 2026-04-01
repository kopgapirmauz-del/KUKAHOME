import { restRequest, storageRemove } from "./_supabase.js";

const BUCKET = "crm-private";

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const type = String(url.searchParams.get("type") || "applications").trim().toLowerCase();
    const isOpenings = type === "opening" || type === "openings";
    let rows;
    try {
      rows = await restRequest(env, "vacancies", {
        query: {
          select: "id,full_name,phone,position,note,resume_url,resume_file_name,photo_url,source,status,created_at",
          ...(isOpenings ? { source: "eq.vacancy_opening" } : { source: "neq.vacancy_opening" }),
          order: "created_at.desc",
        },
      });
    } catch {
      rows = await restRequest(env, "vacancies", {
        query: {
          select: "id,full_name,phone,position,note,source,status,created_at",
          ...(isOpenings ? { source: "eq.vacancy_opening" } : { source: "neq.vacancy_opening" }),
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
      const position = String(data?.position || "").trim();
      const regulation = String(data?.regulation || "").trim();
      const createdAtRaw = String(data?.created_at || data?.createdAt || "").trim();
      const createdAtTs = createdAtRaw ? Date.parse(createdAtRaw) : 0;
      const createdAt = Number.isFinite(createdAtTs) && createdAtTs > 0
        ? new Date(createdAtTs).toISOString()
        : new Date().toISOString();
      if (!position || !regulation) return Response.json({ success: false }, { status: 400 });

      const inserted = await restRequest(env, "vacancies", {
        method: "POST",
        body: {
          full_name: "",
          phone: "",
          position,
          note: regulation,
          source: "vacancy_opening",
          status: "new",
          created_at: createdAt,
        },
        prefer: "return=representation",
      });
      const row = Array.isArray(inserted) ? inserted[0] : inserted;
      return Response.json({ success: true, item: row || null });
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
    const note = String(data?.note || data?.message || data?.comment || "").trim();
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
        photo_url: "",
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
  try {
    const data = await request.json();
    const id = String(data?.id || "").trim();
    if (!id) return Response.json({ success: false }, { status: 400 });

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
    if (fileName) {
      const objectPath = fileName.includes("/") ? fileName.replace(/^\/+/, "") : `sales-checks/${fileName}`;
      await storageRemove(env, BUCKET, [objectPath]);
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
    if (!id) return Response.json({ success: false }, { status: 400 });
    const type = String(data?.type || "").trim().toLowerCase();
    let body = null;
    if (type === "opening" || type === "openings") {
      const position = String(data?.position || "").trim();
      const regulation = String(data?.regulation || "").trim();
      const createdAt = String(data?.created_at || data?.createdAt || "").trim();
      if (!position || !regulation) return Response.json({ success: false }, { status: 400 });
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

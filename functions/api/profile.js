import { createSessionToken, requireAuth } from "./_auth.js";
import { first, listStores, restRequest } from "./_supabase.js";

function cleanText(value, max = 160) {
  return String(value || "").trim().slice(0, max);
}

function validLogin(value) {
  const login = cleanText(value, 80);
  return login.length >= 2 && !/\s/.test(login) ? login : "";
}

async function getCurrentUser(env, userId) {
  return restRequest(env, "users", {
    query: {
      select: "id,full_name,login,role,store_id,phone,telegram_id,created_at",
      id: `eq.${userId}`,
      limit: "1",
    },
  }).then(first).catch(async () => restRequest(env, "users", {
    query: {
      select: "id,full_name,login,role,store_id,created_at",
      id: `eq.${userId}`,
      limit: "1",
    },
  }).then(first));
}

async function presentUser(env, row) {
  if (!row) return null;
  const stores = await listStores(env);
  const storeName = stores.find((store) => String(store.id) === String(row.store_id || ""))?.name || "";
  return {
    id: row.id,
    full_name: cleanText(row.full_name),
    login: cleanText(row.login, 80),
    role: cleanText(row.role, 30) || "manager",
    phone: cleanText(row.phone, 40),
    telegram_id: cleanText(row.telegram_id, 40),
    showroom: storeName,
    store_id: row.store_id || null,
    created_at: row.created_at || null,
  };
}

async function verifyCurrentPassword(env, login, password) {
  if (!password) return false;
  try {
    const rows = await restRequest(env, "rpc/verify_login", {
      method: "POST",
      body: { p_login: login, p_password: password },
    });
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const row = await getCurrentUser(env, session.uid);
    if (!row) return Response.json({ success: false, error: "user_not_found" }, { status: 404 });
    return Response.json({ success: true, user: await presentUser(env, row) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ success: false, error: "profile_load_failed" }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const session = await requireAuth(request, env);
  if (session instanceof Response) return session;

  try {
    const data = await request.json();
    const current = await getCurrentUser(env, session.uid);
    if (!current) return Response.json({ success: false, error: "user_not_found" }, { status: 404 });

    const fullName = cleanText(data?.full_name);
    const login = validLogin(data?.login);
    const phone = cleanText(data?.phone, 40);
    const telegramId = cleanText(data?.telegram_id, 40);
    if (!fullName || !login) {
      return Response.json({ success: false, error: "invalid_profile" }, { status: 400 });
    }

    const newPassword = String(data?.new_password || "");
    if (newPassword) {
      if (newPassword.length < 6 || newPassword.length > 128) {
        return Response.json({ success: false, error: "invalid_new_password" }, { status: 400 });
      }
      const currentPassword = String(data?.current_password || "");
      if (!(await verifyCurrentPassword(env, current.login, currentPassword))) {
        return Response.json({ success: false, error: "current_password_wrong" }, { status: 403 });
      }
    }

    const patch = { full_name: fullName, login, phone, telegram_id: telegramId || null };
    try {
      await restRequest(env, "users", {
        method: "PATCH",
        query: { id: `eq.${session.uid}` },
        body: patch,
      });
    } catch (error) {
      // Older deployments may not have the optional phone/telegram_id columns.
      delete patch.phone;
      delete patch.telegram_id;
      try {
        await restRequest(env, "users", {
          method: "PATCH",
          query: { id: `eq.${session.uid}` },
          body: patch,
        });
      } catch {
        return Response.json({ success: false, error: "profile_update_failed" }, { status: 409 });
      }
    }

    if (newPassword) {
      await restRequest(env, "rpc/set_user_password", {
        method: "POST",
        body: { p_user_id: session.uid, p_new_password: newPassword },
      });
    }

    const updated = await getCurrentUser(env, session.uid);
    const user = await presentUser(env, updated);
    const token = await createSessionToken(env, user);
    return Response.json({ success: true, user, token });
  } catch {
    return Response.json({ success: false, error: "profile_update_failed" }, { status: 500 });
  }
}

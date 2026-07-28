import { first, restRequest } from "./_supabase.js";

export function canUseInbox(session) {
  return session?.role === "admin" || session?.role === "manager";
}

export function canAccessConversation(session, conversation) {
  if (!session || !conversation) return false;
  if (session.role === "admin") return true;
  if (session.role !== "manager") return false;
  const assignedId = String(conversation.assigned_manager_id || "");
  return !assignedId || assignedId === String(session.uid || "");
}

export async function getConversation(env, id) {
  return restRequest(env, "conversations", {
    query: { select: "*", id: `eq.${id}`, limit: "1" },
  }).then(first);
}

export async function getAccessibleConversation(env, id, session) {
  const conversation = await getConversation(env, id);
  return canAccessConversation(session, conversation) ? conversation : null;
}

// A manager writing to an unassigned conversation claims it. The conditional
// PATCH prevents two managers from claiming the same conversation at once.
// `extraQuery` adds further conditions the row must still satisfy, so a caller
// can make a state transition atomic (for example client_id: "is.null" to let
// exactly one request convert a conversation into a lead).
export async function patchAccessibleConversation(env, conversation, session, patch, extraQuery) {
  const id = String(conversation?.id || "");
  if (!id || !canAccessConversation(session, conversation)) return null;

  const body = { ...(patch || {}) };
  const query = { id: `eq.${id}`, ...(extraQuery || {}) };
  if (session.role === "manager") {
    body.assigned_manager_id = String(session.uid);
    query.or = `(assigned_manager_id.is.null,assigned_manager_id.eq.${session.uid})`;
  }

  const rows = await restRequest(env, "conversations", {
    method: "PATCH",
    query,
    body,
    prefer: "return=representation",
  });
  return first(rows);
}

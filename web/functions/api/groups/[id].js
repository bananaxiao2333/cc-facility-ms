import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireAuth, requireAdmin } from "../../lib/auth.js";
import { getGroupById, updateGroup, deleteGroup } from "../../lib/database.js";

// GET /api/groups/:id
export async function onRequestGet(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const group = await getGroupById(context.params.id);
    if (!group) return json({ message: "Group not found" }, 404);
    return json({ group });
  } catch (e) {
    return handleError(e);
  }
}

// PATCH /api/groups/:id (admin)
export async function onRequestPatch(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    requireAdmin(ctx);
    const body = await context.request.json();
    const group = await updateGroup(context.params.id, body);
    return json({ group });
  } catch (e) {
    return handleError(e);
  }
}

// DELETE /api/groups/:id (admin)
export async function onRequestDelete(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    requireAdmin(ctx);
    const ok = await deleteGroup(context.params.id);
    if (!ok) return json({ message: "Group not found" }, 404);
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

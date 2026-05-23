import { json, handleError, onRequestOptions } from "../lib/response.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { loadGroups, createGroup } from "../lib/database.js";

// GET /api/groups — list all
export async function onRequestGet(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const groups = await loadGroups();
    return json({ groups });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/groups — create (admin)
export async function onRequestPost(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    requireAdmin(ctx);
    const body = await context.request.json();
    const group = await createGroup(body);
    return json({ group }, 201);
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

import { json, handleError, onRequestOptions } from "../lib/response.js";
import { requireAuth } from "../lib/auth.js";
import {
  loadActions,
  createAction,
  getAction,
  updateAction,
  deleteAction,
} from "../lib/database.js";

// ALL requests hit /api/actions (no sub-paths).
// GET → list, POST → create, POST {_method:"PATCH",_id} → update, POST {_method:"DELETE",_id} → delete

export async function onRequestGet() {
  try {
    return json({ actions: await loadActions() });
  } catch (e) {
    return handleError(e);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    // dispatch by _method
    if (body._method === "PATCH") {
      const ctx = {};
      await requireAuth(context.request, ctx);
      const a = await updateAction(body._id, body);
      return a ? json({ action: a }) : json({ message: "Not found" }, 404);
    }
    if (body._method === "DELETE") {
      const ctx = {};
      await requireAuth(context.request, ctx);
      await deleteAction(body._id);
      return json({ ok: true });
    }
    // plain POST = create
    const ctx = {};
    await requireAuth(context.request, ctx);
    return json({ action: await createAction(body) }, 201);
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

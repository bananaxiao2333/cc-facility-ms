import { json, handleError, onRequestOptions } from "../../../lib/response.js";
import { requireAuth, requireAdmin } from "../../../lib/auth.js";
import { getNode, deleteNode, updateNodeHeartbeat } from "../../../lib/database.js";

// GET /api/cluster/nodes/:id
export async function onRequestGet(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const id = context.params.id;
    const node = await getNode(id);
    if (!node) return json({ message: "Node not found" }, 404);
    return json({ node });
  } catch (e) {
    return handleError(e);
  }
}

// DELETE /api/cluster/nodes/:id (admin)
export async function onRequestDelete(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    requireAdmin(ctx);
    const id = context.params.id;
    const ok = await deleteNode(id);
    if (!ok) return json({ message: "Node not found" }, 404);
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

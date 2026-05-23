import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireAuth, requireAdmin } from "../../lib/auth.js";
import { loadNodes, registerNode } from "../../lib/database.js";

// GET /api/cluster/nodes — list all
export async function onRequestGet(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const nodes = await loadNodes();
    return json({ nodes });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/cluster/nodes — register a new node (admin)
export async function onRequestPost(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    requireAdmin(ctx);
    const body = await context.request.json();
    const node = await registerNode(body);
    return json({ node }, 201);
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireAuth } from "../../lib/auth.js";
import { getEvents } from "../../lib/database.js";

// GET /api/cluster/events?node=<nodeId>
export async function onRequestGet(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const url = new URL(context.request.url);
    const nodeId = url.searchParams.get("node") || null;
    const events = await getEvents(nodeId);
    return json({ events });
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

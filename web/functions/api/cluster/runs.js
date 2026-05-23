import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireAuth } from "../../lib/auth.js";
import { getActiveRuns } from "../../lib/database.js";

// GET /api/cluster/runs — active workflow runs
export async function onRequestGet(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const runs = await getActiveRuns();
    return json({ runs });
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireNodeAuth } from "../../lib/auth.js";
import { pollCommand } from "../../lib/database.js";

// GET /api/cluster/poll?node=<nodeId>
export async function onRequestGet(context) {
  try {
    const node = await requireNodeAuth(context.request);
    const cmd = await pollCommand(node.id);
    if (!cmd) return new Response(null, { status: 204 });
    return json({ command: cmd });
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

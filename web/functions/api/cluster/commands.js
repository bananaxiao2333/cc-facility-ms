import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireAuth } from "../../lib/auth.js";
import { queueCommand, listCommands, getEvents, runClusterHeartbeat } from "../../lib/database.js";

// GET /api/cluster/commands?node=<nodeId> — list commands
export async function onRequestGet(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    await runClusterHeartbeat();

    const url = new URL(context.request.url);
    const nodeId = url.searchParams.get("node");
    const items = await listCommands(nodeId);
    return json({ commands: items });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/cluster/commands — queue a new command
export async function onRequestPost(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const body = await context.request.json();
    const { nodeId, type, priority, payload } = body;
    if (!nodeId || !type) return json({ message: "Missing nodeId or type" }, 400);

    const cmd = await queueCommand(nodeId, {
      type,
      priority,
      payload,
      createdBy: ctx.user?.id,
    });
    return json({ command: cmd }, 201);
  } catch (e) {
    return handleError(e);
  }
}

// GET /api/cluster/events?node=<nodeId> — system events
export async function onRequestEvents(context) {
  try {
    const ctx = {};
    await requireAuth(context.request, ctx);
    const url = new URL(context.request.url);
    const nodeId = url.searchParams.get("node");
    const events = await getEvents(nodeId || null);
    return json({ events });
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

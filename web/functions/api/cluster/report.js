import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireNodeAuth } from "../../lib/auth.js";
import { updateNodeHeartbeat, completeCommand, recordEvent, storeWorkflowResult } from "../../lib/database.js";

// POST /api/cluster/report
export async function onRequestPost(context) {
  try {
    const node = await requireNodeAuth(context.request);
    const body = await context.request.json();
    const { command_id, status, result, battery, position } = body;

    await updateNodeHeartbeat(node.id, { battery, position });

    if (command_id && status) {
      await completeCommand(node.id, command_id, status, result);
      await recordEvent(node.id, status === "done" ? "task_done" : "task_failed",
        `Command ${command_id}: ${status}`);

      // Feed result back into workflow engine for condition evaluation
      if (command_id.startsWith("wf_")) {
        await storeWorkflowResult(command_id, node.id, result);
      }
    }

    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export { onRequestOptions };

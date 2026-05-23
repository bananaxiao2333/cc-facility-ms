import { json, handleError, onRequestOptions } from "../../lib/response.js";
import { requireNodeAuth } from "../../lib/auth.js";
import { pollCommand, getNextWorkflowAction, recordEvent } from "../../lib/database.js";

// GET /api/cluster/poll?node=<nodeId>
// POST /api/cluster/poll — manually trigger a workflow
import { startWorkflowRun } from "../../lib/database.js";

export async function onRequestPost(context) {
  try {
    const node = await requireNodeAuth(context.request);
    const body = await context.request.json();
    if (body.workflowId) {
      await startWorkflowRun(node.id, body.workflowId);
      return json({ ok: true, message: "Workflow triggered" });
    }
    return json({ message: "Missing workflowId" }, 400);
  } catch (e) { return handleError(e); }
}

export async function onRequestGet(context) {
  try {
    const node = await requireNodeAuth(context.request);

    // 1. Check workflow engine first
    const wfAction = await getNextWorkflowAction(node.id, node.groupId);
    if (wfAction) {
      const { action, params, workflowId, workflowName } = wfAction;
      const code = resolveCode(action.code, params, node);

      await recordEvent(node.id, "wf_dispatch",
        `Workflow "${workflowName}": dispatching ${action.name}`);

      return json({
        command: {
          id: "wf_" + workflowId + "_" + Date.now(),
          type: "exec",
          payload: { code },
          workflow: { id: workflowId, name: workflowName },
        },
      });
    }

    // 2. Fall back to manual command queue
    const cmd = await pollCommand(node.id);
    if (!cmd) return new Response(null, { status: 204 });
    return json({ command: cmd });
  } catch (e) {
    return handleError(e);
  }
}

// Replace ${param} placeholders in action code with actual values
function resolveCode(code, params, node) {
  let resolved = code || 'return true';
  for (const [key, val] of Object.entries(params || {})) {
    resolved = resolved.replaceAll('${' + key + '}', String(val));
  }
  // Built-in variables
  resolved = resolved.replaceAll('${node_id}', node.id);
  resolved = resolved.replaceAll('${node_name}', node.name);
  resolved = resolved.replaceAll('${group_id}', node.groupId || '');
  return resolved;
}

export { onRequestOptions };

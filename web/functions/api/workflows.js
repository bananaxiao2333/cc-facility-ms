import { json, handleError, onRequestOptions } from "../lib/response.js";
import { requireAuth } from "../lib/auth.js";
import { loadWorkflows, createWorkflow, getWorkflow, updateWorkflow, deleteWorkflow } from "../lib/database.js";

// ALL requests hit /api/workflows (no sub-paths).
// GET → list, POST → create, POST {_method:"PATCH",_id} → update, POST {_method:"DELETE",_id} → delete

export async function onRequestGet() {
  try { return json({ workflows: await loadWorkflows() }); }
  catch (e) { return handleError(e); }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    if (body._method === "PATCH") {
      const ctx = {}; await requireAuth(context.request, ctx);
      const w = await updateWorkflow(body._id, body);
      return w ? json({ workflow: w }) : json({ message: "Not found" }, 404);
    }
    if (body._method === "DELETE") {
      const ctx = {}; await requireAuth(context.request, ctx);
      await deleteWorkflow(body._id);
      return json({ ok: true });
    }
    const ctx = {}; await requireAuth(context.request, ctx);
    return json({ workflow: await createWorkflow(body) }, 201);
  } catch (e) { return handleError(e); }
}

export { onRequestOptions };

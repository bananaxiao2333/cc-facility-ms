import { json, handleError, onRequestOptions } from "../lib/response.js";
import { withOptionalAuth } from "../lib/auth.js";
import { seedDefaultData } from "../lib/database.js";

export async function onRequestGet(context) {
  try {
    await seedDefaultData();
    const ctx = {};
    await withOptionalAuth(context.request, ctx);
    const user = ctx.user
      ? (({ passwordHash, ...rest }) => rest)(ctx.user)
      : null;
    return json({ user });
  } catch (error) {
    return handleError(error);
  }
}

export { onRequestOptions };

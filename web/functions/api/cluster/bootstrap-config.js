// GET /api/cluster/bootstrap-config?token=<token>
// Returns config.lua using the node's stored deployment settings.

import { getNodeByToken } from "../../lib/database.js";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("-- missing token", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  const node = await getNodeByToken(token);
  if (!node) {
    return new Response("-- invalid token", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  const base = node.base || url.origin;
  const config = [
    "-- /etc/facility/config.lua",
    "return {",
    `  node_id = "${node.id}",`,
    `  token = "${node.token}",`,
    `  api_base = "${base}",`,
    "  heartbeat_interval = 10,",
    "}",
  ].join("\n");

  return new Response(config, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

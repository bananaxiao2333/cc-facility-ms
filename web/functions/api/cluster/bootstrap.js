// GET /api/cluster/bootstrap?token=<>
// Returns a self-extracting Lua setup script using the node's stored deployment config.

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

  const base        = node.base        || url.origin;
  const configPath  = node.configPath  || "/etc/facility/config.lua";
  const clientPath  = node.clientPath  || "/facility/client.lua";
  const clientUrl   = node.clientUrl   || "/cc/turtle-client.lua";
  const startupPath = node.startupPath || "/startup.lua";

  const configDir = configPath.substring(0, configPath.lastIndexOf("/"));
  const clientDir = clientPath.substring(0, clientPath.lastIndexOf("/"));

  const script = [
    "-- CCFMS Node Bootstrap",
    "-- One-command deployment for CC:Tweaked turtles",
    "",
    `local base        = "${base}"`,
    `local token       = "${token}"`,
    `local configPath  = "${configPath}"`,
    `local clientPath  = "${clientPath}"`,
    `local clientUrl   = "${clientUrl}"`,
    `local startupPath = "${startupPath}"`,
    "",
    'print("CCFMS Bootstrap starting...")',
    "",
    "-- Create directories",
    `if not fs.exists("${configDir}") then fs.makeDir("${configDir}") end`,
    `if not fs.exists("${clientDir}") then fs.makeDir("${clientDir}") end`,
    "",
    "-- Download config",
    'print("Downloading config...")',
    'local h = http.get(base .. "/api/cluster/bootstrap-config?token=" .. token)',
    'if not h then error("Failed to download config") end',
    'local f = fs.open(configPath, "w")',
    "f.write(h.readAll())",
    "f.close()",
    "h.close()",
    "",
    "-- Download client",
    'print("Downloading client...")',
    "local h2 = http.get(base .. clientUrl)",
    'if not h2 then error("Failed to download client") end',
    'local f2 = fs.open(clientPath, "w")',
    "f2.write(h2.readAll())",
    "f2.close()",
    "h2.close()",
    "",
    "-- Write startup",
    'local startup = fs.open(startupPath, "w")',
    `startup.write("shell.run('${clientPath}')\\n")`,
    "startup.close()",
    "",
    'print("Bootstrap complete. Starting client...")',
    `shell.run("${clientPath}")`,
  ].join("\n");

  return new Response(script, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

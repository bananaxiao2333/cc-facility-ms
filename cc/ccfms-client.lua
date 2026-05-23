-- CCFMS Node Client
-- Place config at /etc/facility/config.lua

local config = nil
local configPath = "/etc/facility/config.lua"

local function loadConfig()
  if not fs.exists(configPath) then
    print("[FATAL] " .. configPath .. " not found")
    return false
  end
  local ok, cfg = pcall(function() return dofile(configPath) end)
  if not ok or not cfg then
    print("[FATAL] Failed to parse " .. configPath)
    return false
  end
  if not cfg.node_id or not cfg.token or cfg.token == "CHANGE_ME" then
    print("[FATAL] " .. configPath .. " missing node_id or token")
    return false
  end
  config = cfg
  config.heartbeat_interval = config.heartbeat_interval or 10
  return true
end

-- ---- logging ----

local function ts()
  return os.date("%Y-%m-%d %H:%M:%S")
end

local function log(level, msg)
  print("[" .. ts() .. "] [" .. level .. "] " .. msg)
end

-- ---- HTTP ----

local function request(method, path, body)
  local url = config.api_base .. path
  local hdrs = {
    ["Content-Type"] = "application/json",
    ["Authorization"] = "Bearer " .. config.token,
  }
  local resp
  if method == "POST" then
    resp = http.post(url, body and textutils.serializeJSON(body) or "", hdrs)
  else
    resp = http.get(url, hdrs)
  end
  if not resp then return nil, "no_response" end
  local raw = resp.readAll()
  local code = resp.getResponseCode()
  resp.close()
  if code == 204 then return nil, "empty" end
  if code >= 400 then return nil, "HTTP " .. code .. ": " .. raw:sub(1, 80) end
  local ok, data = pcall(textutils.unserializeJSON, raw)
  if not ok then return nil, "parse_error" end
  return data
end

-- ---- banner ----

local function banner()
  term.clear()
  term.setCursorPos(1, 1)
  print("CCFMS Node Client")
  print("Hostname : " .. (os.getComputerLabel() or "(none)"))
  print("Node ID  : " .. config.node_id)
  print("API Base : " .. config.api_base)
  print()
end

-- ---- heartbeat ----

local function sendHeartbeat()
  local data, err = request("POST", "/api/cluster/report", {
    node = config.node_id,
  })
  if data then
    log("DEBUG", "Heartbeat OK")
  else
    log("WARN", "Heartbeat failed: " .. (err or "unknown"))
  end
end

-- ---- command dispatch ----

local function execCommand(cmd)
  local t = cmd.type
  local p = cmd.payload or {}

  if t == "ping" then
    return true, { pong = true, node = config.node_id }
  elseif t == "sleep" then
    local ms = p.ms or 1000
    os.sleep(ms / 1000)
    return true, { slept_ms = ms }
  elseif t == "report" then
    return true, { node = config.node_id, hostname = os.getComputerLabel() }
  elseif t == "exec" then
    local code = p.code
    if not code then return false, "no_code" end
    local fn, errMsg = load(code)
    if not fn then return false, errMsg end
    local ok, res = pcall(fn)
    return ok, res
  else
    return false, "unknown_command: " .. t
  end
end

-- ---- main loop ----

local function main()
  if not loadConfig() then return end
  banner()

  log("INFO", "Testing connectivity...")
  local data, err = request("GET", "/api/health")
  if data then
    log("INFO", "Server reachable")
  else
    log("WARN", "Cannot reach server: " .. (err or "unknown"))
  end

  log("INFO", "Starting main loop (" .. config.heartbeat_interval .. "s interval)")

  while true do
    pcall(sendHeartbeat)

    local data, err = request("GET", "/api/cluster/poll?node=" .. config.node_id)
    if data and data.command then
      local cmd = data.command
      log("INFO", "CMD " .. cmd.id .. " type=" .. cmd.type)
      local ok, result = execCommand(cmd)
      local status = ok and "done" or "failed"
      log("INFO", "CMD " .. cmd.id .. " -> " .. status:upper())
      if not ok then log("WARN", "  reason: " .. tostring(result)) end
      pcall(request, "POST", "/api/cluster/report", {
        node = config.node_id,
        command_id = cmd.id,
        status = status,
        result = result,
      })
    elseif not data and err ~= "empty" and err ~= "no_response" then
      log("WARN", "Poll failed: " .. (err or "unknown"))
    end

    os.sleep(config.heartbeat_interval)
  end
end

local ok, err = pcall(main)
if not ok then
  log("FATAL", tostring(err))
end

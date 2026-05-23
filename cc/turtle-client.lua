-- CCFMS Turtle Client — minimal, no peripherals required.
-- Place config at /etc/facility/config.lua

local config
local ok, cfg = pcall(require, "/etc/facility/config.lua")
if ok then config = cfg else
  config = { node_id = "turtle_1", token = "CHANGE_ME", api_base = "http://127.0.0.1:8788", heartbeat_interval = 2 }
end

local function headers()
  return { ["Content-Type"] = "application/json", ["Authorization"] = "Bearer " .. config.token }
end

local function api(path, method, body)
  local url = config.api_base .. path
  local h = headers()
  local resp
  if method == "POST" then
    resp = http.post(url, body and textutils.serializeJSON(body) or "", h)
  else
    resp = http.get(url, h)
  end
  if not resp then return nil end
  local raw = resp.readAll()
  resp.close()
  if resp.getResponseCode() == 204 then return nil end
  return textutils.unserializeJSON(raw)
end

local isTurtle = turtle ~= nil

local function heartbeat()
  api("/api/cluster/report", "POST", {
    node = config.node_id,
    battery = isTurtle and turtle.getFuelLevel() or nil,
  })
end

local function runCommand(cmd)
  local t = cmd.type
  if t == "refuel" then
    if not isTurtle then return false, "not_a_turtle" end
    for s = 1, 16 do turtle.select(s)
      if turtle.refuel(0) then turtle.refuel(); return true, { refueled = true, fuel = turtle.getFuelLevel() } end
    end
    return false, "no_fuel"
  elseif t == "sleep" then os.sleep(((cmd.payload or {}).ms or 1000) / 1000); return true, {}
  elseif t == "report" then return true, { fuel = isTurtle and turtle.getFuelLevel() or nil, slot = isTurtle and turtle.getSelectedSlot() or nil }
  elseif t == "exec" then
    local code = (cmd.payload or {}).code
    if not code then return false, "no_code" end
    local fn, err = load(code)
    if not fn then return false, err end
    local ok, res = pcall(fn)
    return ok, res
  elseif t == "ping" then return true, { pong = true }
  end
  if not isTurtle then return false, "not_a_turtle" end
  if t == "dig" then
    local d = (cmd.payload or {}).direction or "forward"
    local ok
    if d == "up" then ok = turtle.digUp() elseif d == "down" then ok = turtle.digDown() else ok = turtle.dig() end
    return ok, { dug = ok }
  elseif t == "forward" then return turtle.forward(), {}
  elseif t == "back" then return turtle.back(), {}
  elseif t == "up" then return turtle.up(), {}
  elseif t == "down" then return turtle.down(), {}
  elseif t == "turnLeft" then turtle.turnLeft(); return true, {}
  elseif t == "turnRight" then turtle.turnRight(); return true, {}
  elseif t == "place" then
    turtle.select((cmd.payload or {}).slot or turtle.getSelectedSlot())
    return turtle.place(), {}
  elseif t == "suck" then return turtle.suck(), {}
  elseif t == "drop" then return turtle.drop(), {}
  elseif t == "inspect" then return turtle.inspect(), {}
  else return false, "unknown_command"
  end
end

local function main()
  print("CCFMS Client " .. config.node_id .. " starting" .. (isTurtle and " (turtle)" or " (computer)") .. "...")
  print("API: " .. config.api_base)

  -- Test connectivity
  local test = api("/api/health")
  if test then
    print("Server reachable: " .. textutils.serialize(test))
  else
    print("WARNING: Cannot reach server at " .. config.api_base)
  end

  while true do
    local ok, err = pcall(heartbeat)
    if not ok then print("ERR heartbeat: " .. tostring(err)) end

    local data = api("/api/cluster/poll?node=" .. config.node_id)
    if data and data.command then
      local cmd = data.command
      print("CMD " .. cmd.id .. " " .. cmd.type)
      local success, result = runCommand(cmd)
      local status = success and "done" or "failed"
      print(status:upper() .. " " .. cmd.id)
      pcall(api, "/api/cluster/report", "POST", {
        node = config.node_id,
        command_id = cmd.id,
        status = status,
        result = result,
      })
    elseif data == nil and not ok then
      -- both heartbeat and poll failed silently
    end

    os.sleep(config.heartbeat_interval)
  end
end

local ok, err = pcall(main)
if not ok then print("FATAL: " .. tostring(err)) end

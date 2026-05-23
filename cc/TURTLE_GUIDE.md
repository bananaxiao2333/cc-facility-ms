# CC Facility — Turtle Setup Guide

This guide covers setting up a ComputerCraft turtle to join the facility cluster.

---

## Prerequisites

- **ComputerCraft: Tweaked** (1.20.1+) or standard ComputerCraft
- A **wireless modem** attached to the turtle
- The turtle placed within range of the facility's Rednet mesh

---

## Step 1: Provision the Turtle

Each turtle needs a unique ID and an API token. Generate these from the facility web console (Cluster → Add Node) or via the API:

```http
POST /api/admin/nodes
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "name": "SCAN-03", "group": "奇点" }
```

Save the returned `id` and `token` — you'll paste them into the turtle's config.

---

## Step 2: Install the Client Script

On the turtle's terminal, create the config file:

```lua
-- /etc/facility/config.lua
return {
  node_id = "turtle_1",
  token = "eyJhbGciOiJIUzI1NiIs...",
  api_base = "https://cc-facility.example.com",
  heartbeat_interval = 2,   -- seconds between heartbeats
  rednet_channel = "cluster_mesh",
}
```

Then paste the client script (see `turtle-client.lua` in this folder) as `/facility/client.lua`.

---

## Step 3: Run

```lua
shell.run("/facility/client.lua")
```

Add to `startup.lua` for auto-start on chunk load:

```lua
-- /startup.lua
shell.run("/facility/client.lua")
```

---

## Step 4: Verify

Check the facility web console — the turtle should appear in the Node Registry with status `online` within one polling cycle (2 seconds).

---

## Client Script Behaviour

1. **Boot** — reads config, performs self-test (fuel level, modem check)
2. **Register** — sends initial heartbeat to `/api/cluster/report`
3. **Poll loop** — polls `/api/cluster/poll` for commands
4. **Execute** — dispatches command to the appropriate handler
5. **Report** — sends result back to facility

### Command Handlers

| Command | Handler |
|---------|---------|
| `move` | GPS navigation + `turtle.go()` |
| `scan` | `turtle.scan()` radius sweep |
| `harvest` | Move to position + `turtle.dig()` |
| `dig` | `turtle.dig()` in specified direction |
| `place` | Select slot + `turtle.place()` |
| `refuel` | `turtle.refuel()` from inventory |
| `report` | Full status dump |

---

## Error Recovery

- **No fuel** → report `status: failed, reason: no_fuel`, await human intervention
- **Path blocked** → report failure, wait for new orders
- **API unreachable** → exponential backoff (2s, 4s, 8s, max 30s)
- **Token invalid** → halt and log error; requires re-provisioning

---

## Security Notes

- Tokens are stored in plaintext on the turtle filesystem. Treat the turtle's OS as compromised.
- The facility API should rate-limit per-node to prevent runaway turtles from flooding the server.
- Consider rotating tokens periodically via a `rotate_token` command.

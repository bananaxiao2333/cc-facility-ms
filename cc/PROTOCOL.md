# CC Facility — Cluster Protocol

Turtle nodes communicate with the facility management system via HTTP polling. All endpoints are relative to the deployment base URL (e.g. `https://cc-facility.example.com`). In local dev, use `http://127.0.0.1:5173` or the EdgeOne dev server port.

---

## 1. Authentication

Every request must include the facility token as a Bearer header:

```
Authorization: Bearer <facility-token>
```

The facility token is provisioned once per turtle and stored in its local config.

---

## 2. Endpoints

### `GET /api/cluster/poll?node=<turtle_id>`

Fetch the next pending command for this turtle. Returns `204 No Content` if the queue is empty.

**Response 200:**
```json
{
  "command": {
    "id": "cmd_a1b2c3",
    "type": "move",
    "priority": 3,
    "payload": { "x": 12, "y": 64, "z": 0 }
  }
}
```

**Response 204:** queue empty — sleep and poll again.

**Command types:**

| Type | Payload | Description |
|------|---------|-------------|
| `move` | `{ x, y, z }` | Move to coordinates |
| `scan` | `{ radius }` | Scan blocks in radius, report back |
| `harvest` | `{ x, y, z }` | Move and harvest at position |
| `place` | `{ slot, x, y, z }` | Place block from inventory slot |
| `dig` | `{ direction }` | Dig in direction (up/down/forward) |
| `refuel` | `{}` | Consume fuel from inventory |
| `report` | `{}` | Send full status report now |
| `sleep` | `{ ms }` | Idle for given milliseconds |

---

### `POST /api/cluster/report`

Send execution result or heartbeat back to the facility.

**Request:**
```json
{
  "node": "turtle_1",
  "command_id": "cmd_a1b2c3",
  "status": "done",
  "result": { "blocks_scanned": 142 },
  "battery": 87,
  "position": { "x": 12, "y": 64, "z": 0 },
  "facing": "north",
  "inventory": [
    { "name": "minecraft:cobblestone", "count": 64, "slot": 1 }
  ]
}
```

`status`: `"done"` | `"failed"` | `"heartbeat"`
`command_id`: omit for heartbeats.

---

### `GET /api/cluster/status?node=<turtle_id>`

Retrieve the facility's view of this turtle's current state.

**Response:**
```json
{
  "node": {
    "id": "turtle_1",
    "name": "SCAN-01",
    "group": "奇点",
    "status": "online",
    "battery": 87,
    "position": { "x": 12, "y": 64, "z": 0 }
  }
}
```

---

## 3. Polling Loop (recommended rhythm)

```
LOOP:
  1. POST /api/cluster/report  (heartbeat with position + battery)
  2. GET  /api/cluster/poll?node=<id>
  3. if 204: sleep(2000), goto LOOP
  4. execute command
  5. POST /api/cluster/report  (result of command)
  6. goto LOOP
```

Heartbeat interval: **2 seconds** when idle.
After command execution: report immediately, then resume heartbeat.

---

## 4. Rednet Integration

Turtles can form a mesh network using Rednet for local coordination:

```lua
-- Broadcast position to nearby turtles
rednet.broadcast({
  type = "position_share",
  node = "turtle_1",
  position = { x, y, z }
}, "cluster_mesh")
```

Protocol messages over Rednet:
- `position_share` — tell neighbours where you are
- `task_offer` — offer to take over a task from a busy neighbour
- `alert` — fuel low / inventory full / blocked path

The gateway turtle (the one with the modem connected to the HTTP world) bridges Rednet ↔ Facility API.

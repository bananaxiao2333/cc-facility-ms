import { get, getSilent, post, del, patch } from './client';

export function fetchNodes() {
  return get('/api/cluster/nodes');
}

export function fetchNodesSilent() {
  return getSilent('/api/cluster/nodes');
}

export function registerNode(body) {
  return post('/api/cluster/nodes', body);
}

export function deleteNode(nodeId) {
  return del(`/api/cluster/nodes/${encodeURIComponent(nodeId)}`);
}

export function updateNode(nodeId, body) {
  return patch(`/api/cluster/nodes/${encodeURIComponent(nodeId)}`, body);
}

export function triggerWorkflow(nodeId, workflowId) {
  return post(`/api/cluster/poll?node=${encodeURIComponent(nodeId)}`, { workflowId });
}

export function fetchActiveRuns() {
  return get('/api/cluster/runs');
}

export function fetchActiveRunsSilent() {
  return getSilent('/api/cluster/runs');
}

export function sendCommand(nodeId, type, payload, priority) {
  return post('/api/cluster/commands', { nodeId, type, payload, priority });
}

export function fetchCommands(nodeId) {
  return get(`/api/cluster/commands?node=${encodeURIComponent(nodeId)}`);
}

export function fetchEvents(nodeId) {
  const qs = nodeId ? `?node=${encodeURIComponent(nodeId)}` : '';
  return get(`/api/cluster/events${qs}`);
}

import { get, getSilent, post } from './client';

export function fetchWorkflows() { return get('/api/workflows'); }
export function fetchWorkflowsSilent() { return getSilent('/api/workflows'); }
export function createWorkflow(body) { return post('/api/workflows', body); }
export function updateWorkflow(id, body) { return post('/api/workflows', { ...body, _method: 'PATCH', _id: id }); }
export function deleteWorkflow(id) { return post('/api/workflows', { _method: 'DELETE', _id: id }); }

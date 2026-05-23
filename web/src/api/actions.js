import { get, post } from './client';

export function fetchActions() { return get('/api/actions'); }
export function createAction(body) { return post('/api/actions', body); }
export function updateAction(id, body) { return post('/api/actions', { ...body, _method: 'PATCH', _id: id }); }
export function deleteAction(id) { return post('/api/actions', { _method: 'DELETE', _id: id }); }

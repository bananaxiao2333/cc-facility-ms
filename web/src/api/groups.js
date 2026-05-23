import { get, post, patch, del } from './client';

export function fetchGroups() {
  return get('/api/groups');
}

export function createGroup(body) {
  return post('/api/groups', body);
}

export function updateGroup(id, body) {
  return patch(`/api/groups/${encodeURIComponent(id)}`, body);
}

export function deleteGroup(id) {
  return del(`/api/groups/${encodeURIComponent(id)}`);
}

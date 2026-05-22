import { post, get, patch } from './client';

export function login(username, password) {
  return post('/api/auth/login', { username, password });
}

export function fetchMe() {
  return get('/api/auth/me');
}

export function updateProfile(body) {
  return patch('/api/auth/profile', body);
}

export function changePassword(currentPassword, nextPassword) {
  return post('/api/auth/password', { currentPassword, nextPassword });
}

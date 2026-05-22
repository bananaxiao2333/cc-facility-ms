import { post, get } from './client';

export function login(username, password) {
  return post('/api/auth/login', { username, password });
}

export function fetchMe() {
  return get('/api/auth/me');
}

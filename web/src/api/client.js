const BASE = import.meta.env.VITE_API_BASE ?? '';

let _start = null;
let _finish = null;

export function setLoadingNotifier(start, finish) {
  _start = start;
  _finish = finish;
}

function getToken() {
  return localStorage.getItem('cc-facility-token');
}

async function request(path, options = {}) {
  const { body, method = 'GET', silent } = options;
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const rid = silent ? null : _start?.(path);

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }

    return data;
  } finally {
    if (rid !== null) _finish?.(rid);
  }
}

export function post(path, body) {
  return request(path, { method: 'POST', body });
}

export function postSilent(path, body) {
  return request(path, { method: 'POST', body, silent: true });
}

export function get(path) {
  return request(path);
}

export function getSilent(path) {
  return request(path, { silent: true });
}

export function patch(path, body) {
  return request(path, { method: 'PATCH', body });
}

export function del(path) {
  return request(path, { method: 'DELETE' });
}

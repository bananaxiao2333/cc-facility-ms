const BASE = import.meta.env.VITE_API_BASE ?? '';

function getToken() {
  return localStorage.getItem('cc-facility-token');
}

async function request(path, options = {}) {
  const { body, method = 'GET' } = options;
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

export function post(path, body) {
  return request(path, { method: 'POST', body });
}

export function get(path) {
  return request(path);
}

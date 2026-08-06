const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const jsonHeaders = { 'Content-Type': 'application/json' };

function getStoredToken() {
  return window.localStorage.getItem('token');
}

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    return { error: 'Invalid JSON response from server' };
  }
}

export async function apiGet(path) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { ...jsonHeaders, ...authHeaders() }
    });
    const data = await parseResponse(res);
    if (!res.ok) return { error: data.error || `Request failed with status ${res.status}` };
    return data;
  } catch (err) {
    return { error: err.message || 'Network error' };
  }
}

export async function apiPost(path, body) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { ...jsonHeaders, ...authHeaders() },
      body: JSON.stringify(body)
    });
    const data = await parseResponse(res);
    if (!res.ok) return { error: data.error || `Request failed with status ${res.status}` };
    return data;
  } catch (err) {
    return { error: err.message || 'Network error' };
  }
}

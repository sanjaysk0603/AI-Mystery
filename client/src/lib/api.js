const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }

  return payload;
}

export function registerUser(data) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
}

export function loginUser(data) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
}

export function logoutUser() {
  return request('/auth/logout', { method: 'POST' });
}

export function fetchCases() {
  return request('/cases');
}

export function createCase(data) {
  return request('/cases', { method: 'POST', body: JSON.stringify(data) });
}

export function fetchCaseById(id) {
  return request(`/cases/${id}`);
}

export function fetchAttempt(id) {
  return request(`/cases/${id}/attempt`);
}

export function saveAttempt(id, payload) {
  return request(`/cases/${id}/attempt`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function requestHint(id) {
  return request(`/cases/${id}/hint`, { method: 'POST' });
}

export function accuseCase(id, payload) {
  return request(`/cases/${id}/accuse`, { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchResult(id) {
  return request(`/cases/${id}/result`);
}

export function retryCase(id) {
  return request(`/cases/${id}/retry`, { method: 'POST' });
}

export function deleteCase(id) {
  return request(`/cases/${id}`, { method: 'DELETE' });
}

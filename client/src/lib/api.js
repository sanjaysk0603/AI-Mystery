const API_URL = import.meta.env.VITE_API_URL || '/api';
const tanglishErrors = {
  UNAUTHORIZED: 'Session mudinjudhu. Thirumba login pannunga.', INVALID_CREDENTIALS: 'Email illa password correct illa. Check panni try pannunga.', USER_EXISTS: 'Indha email-la account already irukku.', SERVER_ERROR: 'Server-la unexpected issue vandhirukku. Server logs-la details check pannunga.',
  VALIDATION_ERROR: 'Details sariyaa irukka-nu check pannitu thirumba try pannunga.', CASE_NOT_READY: 'Case innum ready aagala. Konjam nerathula try pannunga.', CASE_LIMIT_REACHED: 'Active cases romba irukku. Oru case mudichitu pudhu case create pannunga.',
  MODERATION_UNAVAILABLE: 'Safety check ippo work aagala. Konjam nerathula thirumba try pannunga.', MODERATION_REJECTED: 'Indha scenario-ai use panna mudiyadhu. Vera fictional mystery try pannunga.',
  NOT_FOUND: 'Indha file kidaikkala. Refresh panni paarunga.', FORBIDDEN: 'Indha case access panna permission illa.', NO_HINTS_LEFT: 'Moonu hints-um use panniteenga.', ALREADY_ACCUSING: 'Indha case-la accusation already submit panniteenga.',
  RESULT_NOT_READY: 'Case result innum ready illa.', CASE_NOT_FAILED: 'Retry panna indha case fail aagirukkanum.', REQUEST_FAILED: 'Request complete aagala. Thirumba try pannunga.',
};

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch (cause) {
    let message = 'Cannot reach the case server. Check your connection and try again.';
    try { if (window.localStorage.getItem('mystery-language-v2') === 'tanglish') message = 'Server-ai reach panna mudiyala. Internet connection check pannitu thirumba try pannunga.'; } catch { /* Use the default message if storage is unavailable. */ }
    const error = new Error(message);
    error.code = 'NETWORK_ERROR';
    error.cause = cause;
    throw error;
  }

  const responseText = await response.text();
  let payload = {};
  try { payload = responseText ? JSON.parse(responseText) : {}; } catch { /* Non-JSON responses are reported with their HTTP status below. */ }
  if (!response.ok) {
    const code = payload?.error?.code || 'REQUEST_FAILED';
    let message = payload?.error?.message || `The server returned HTTP ${response.status}${response.statusText ? ` (${response.statusText})` : ''}.`;
    if (response.status >= 500 && payload?.error?.message) message = `${message} (HTTP ${response.status})`;
    try {
      if (window.localStorage.getItem('mystery-language-v2') === 'tanglish') {
        message = code === 'REQUEST_FAILED'
          ? `Server-la irundhu HTTP ${response.status} error vandhirukku. Konjam nerathula thirumba try pannunga.`
          : response.status >= 500 && code === 'SERVER_ERROR'
            ? `${tanglishErrors[code]} (HTTP ${response.status})`
            : tanglishErrors[code] || 'Edho problem vandhirukku. Konjam nerathula thirumba try pannunga.';
      }
    } catch { /* Keep the server message when browser storage is unavailable. */ }
    const error = new Error(message);
    error.code = code;
    throw error;
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

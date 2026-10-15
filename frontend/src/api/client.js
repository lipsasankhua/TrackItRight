const BASE_URL = 'https://trackitright.onrender.com';

const TOKEN_KEY = 'trackitright_token';
const BUSINESS_KEY = 'trackitright_business';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export function getBusinessName() {
  return localStorage.getItem(BUSINESS_KEY);
}

function storeSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(BUSINESS_KEY, data.business_name || data.email);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(BUSINESS_KEY);
}

// Attaches the signed-in business's token to every request, and — if the
// backend ever says the session is invalid or expired — clears it and
// bounces back to the login screen instead of leaving the app stuck on a
// silently failing fetch.
async function authFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    logout();
    window.location.href = '/';
    throw new Error('Session expired');
  }

  return res;
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  storeSession(data);
  return data;
}

export async function register(email, password, business_name) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, business_name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  storeSession(data);
  return data;
}

export async function getClients() {
  const res = await authFetch('/clients');
  if (!res.ok) throw new Error('Failed to fetch clients');
  return res.json();
}

export async function addClient(client) {
  const res = await authFetch('/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error('Failed to add client');
  return res.json();
}

export async function getDashboard() {
  const res = await authFetch('/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function getEntries(clientId) {
  const res = await authFetch(`/entries/${clientId}`);
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

export async function addEntry(entry) {
  const res = await authFetch('/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to add entry');
  return res.json();
}

export async function getUnbilled() {
  const res = await authFetch('/unbilled');
  if (!res.ok) throw new Error('Failed to fetch unbilled work');
  return res.json();
}

export async function markBilled(id) {
  const res = await authFetch(`/unbilled/${id}/bill`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function toggleEntryComplete(id) {
  const res = await authFetch(`/entries/${id}/complete`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function resolveReview(id, correct_label) {
  const res = await authFetch(`/entries/${id}/resolve-review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correct_label }),
  });
  if (!res.ok) throw new Error('Failed to resolve review');
  return res.json();
}

export async function getModelStatus() {
  const res = await authFetch('/model/status');
  if (!res.ok) throw new Error('Failed to fetch model status');
  return res.json();
}

export async function retrainModel() {
  const res = await authFetch('/model/retrain', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Retrain failed');
  return data;
}

export async function searchAll(query) {
  const res = await authFetch(`/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function askDataQuestion(question) {
  const res = await authFetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to answer the question');
  return data;
}

export async function getInsights() {
  const res = await authFetch('/insights');
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
}

export async function getReport(clientId) {
  const res = await authFetch(`/reports/${clientId}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export async function addVoiceEntry(clientId, audioFile) {
  const formData = new FormData();
  formData.append('client_id', clientId);
  formData.append('audio', audioFile);

  const res = await authFetch('/entries/voice', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to process voice note');
  return res.json();
}

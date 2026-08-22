const BASE_URL = 'http://localhost:5000';

export async function getClients() {
  const res = await fetch(`${BASE_URL}/clients`);
  if (!res.ok) throw new Error('Failed to fetch clients');
  return res.json();
}

export async function addClient(client) {
  const res = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  if (!res.ok) throw new Error('Failed to add client');
  return res.json();
}

export async function getDashboard() {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function getEntries(clientId) {
  const res = await fetch(`${BASE_URL}/entries/${clientId}`);
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

export async function addEntry(entry) {
  const res = await fetch(`${BASE_URL}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to add entry');
  return res.json();
}

export async function getUnbilled() {
  const res = await fetch(`${BASE_URL}/unbilled`);
  if (!res.ok) throw new Error('Failed to fetch unbilled work');
  return res.json();
}

export async function markBilled(id) {
  const res = await fetch(`${BASE_URL}/unbilled/${id}/bill`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function getReport(clientId) {
  const res = await fetch(`${BASE_URL}/reports/${clientId}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export async function addVoiceEntry(clientId, audioFile) {
  const formData = new FormData();
  formData.append('client_id', clientId);
  formData.append('audio', audioFile);

  const res = await fetch(`${BASE_URL}/entries/voice`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to process voice note');
  return res.json();
}
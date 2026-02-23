/**
 * DocSeek API Abstraction Layer
 * All backend communication funnels through here.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const start = performance.now();

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const latency = Math.round(performance.now() - start);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  return { data, latency, status: res.status };
}

/* ── Health / System ─────────────────────────────────── */

export async function getStats() {
  return request('/stats');
}

export async function getDocuments() {
  return request('/documents');
}

export async function getIngestStatus() {
  return request('/ingest/status');
}

/* ── Document Ingestion ──────────────────────────────── */

export async function uploadFile(file, onProgress) {
  const form = new FormData();
  form.append('file', file);

  const url = `${BASE}/upload`;
  const start = performance.now();

  const res = await fetch(url, { method: 'POST', body: form });
  const latency = Math.round(performance.now() - start);

  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  const data = await res.json();
  return { data, latency };
}

export async function uploadMultiple(files) {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));

  const url = `${BASE}/upload-multiple`;
  const start = performance.now();

  const res = await fetch(url, { method: 'POST', body: form });
  const latency = Math.round(performance.now() - start);

  if (!res.ok) throw new Error(`Multi-upload failed: HTTP ${res.status}`);
  const data = await res.json();
  return { data, latency };
}

export async function ingestText(text, metadata = null) {
  return request('/ingest', {
    method: 'POST',
    body: JSON.stringify({ text, metadata }),
  });
}

export async function ingestGithub(repoUrl, subpath = null) {
  return request('/ingest/github', {
    method: 'POST',
    body: JSON.stringify({ repo_url: repoUrl, subpath }),
  });
}

/* ── Search / Query ──────────────────────────────────── */

export async function search(query, k = 5) {
  return request('/search', {
    method: 'POST',
    body: JSON.stringify({ query, k }),
  });
}

/* ── Index Management ────────────────────────────────── */

export async function rebuildIndex() {
  return request('/rebuild', { method: 'POST' });
}

export async function resetSystem() {
  return request('/reset', { method: 'DELETE' });
}

/* ── Document View ───────────────────────────────────── */

export function getDocumentViewUrl(docId) {
  return `${BASE}/document/view?id=${docId}`;
}

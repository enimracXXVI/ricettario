import { REPO_OWNER, REPO_NAME, REPO_BRANCH, DATA_PATH } from '../config';

const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(escape(atob(str)));
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };
}

async function describeError(res) {
  let detail = '';
  try {
    const j = await res.json();
    detail = j.message || '';
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Token non valido o scaduto.';
  if (res.status === 403) return 'Il token non ha i permessi necessari su questo repository.';
  if (res.status === 404) return 'Repository o file non trovato.';
  return `Errore GitHub (HTTP ${res.status})${detail ? ': ' + detail : ''}`;
}

// Public, unauthenticated, cache-busted read — used for normal viewing.
export async function fetchRecipesRaw() {
  const res = await fetch(`${RAW_BASE}/${DATA_PATH}?_=${Date.now()}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Impossibile caricare le ricette (HTTP ${res.status})`);
  return res.json();
}

// Authenticated read via the Contents API — needed to get the file's sha before writing.
export async function fetchRecipesWithSha(token) {
  const res = await fetch(`${API_BASE}/contents/${DATA_PATH}?ref=${REPO_BRANCH}&_=${Date.now()}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (res.status === 404) return { data: null, sha: null };
  if (!res.ok) throw new Error(await describeError(res));
  const json = await res.json();
  const data = JSON.parse(b64DecodeUnicode(json.content.replace(/\n/g, '')));
  return { data, sha: json.sha };
}

// Confirms the token is valid and has write access to this repo.
export async function verifyToken(token) {
  const res = await fetch(API_BASE, { headers: authHeaders(token) });
  if (res.status === 401 || res.status === 403) return false;
  if (!res.ok) throw new Error(await describeError(res));
  const json = await res.json();
  return json.permissions ? !!json.permissions.push : true;
}

// Commits new recipe data. Throws { code: 'CONFLICT' } if the file changed
// server-side since knownSha was loaded, unless force is true.
export async function saveRecipes({ token, data, knownSha, message, force = false }) {
  const current = await fetchRecipesWithSha(token);
  if (!force && knownSha && current.sha && current.sha !== knownSha) {
    const err = new Error('Qualcun altro ha salvato modifiche nel frattempo.');
    err.code = 'CONFLICT';
    err.latestSha = current.sha;
    err.latestData = current.data;
    throw err;
  }
  const body = {
    message: message || `Aggiorna ricette — ${new Date().toISOString()}`,
    content: b64EncodeUnicode(JSON.stringify(data, null, 2)),
    branch: REPO_BRANCH,
  };
  if (current.sha) body.sha = current.sha;
  const res = await fetch(`${API_BASE}/contents/${DATA_PATH}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await describeError(res));
  const json = await res.json();
  return { sha: json.content.sha };
}

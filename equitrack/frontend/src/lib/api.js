/**
 * lib/api.js
 * The ONLY place that talks to the PHP backend.
 *  - always sends the session cookie (credentials: 'include')
 *  - adds the CSRF token header on POST / PUT / PATCH / DELETE
 *  - unwraps the {success, message, data} envelope and throws ApiError on failure
 */
const BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || '/api';

let csrfToken = null;
export const setCsrfToken = (t) => { if (t) csrfToken = t; };

/** Error with the HTTP status and per-field messages (from a 422 response). */
export class ApiError extends Error {
  constructor(message, status = 0, errors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors; // { fieldName: 'message' }
  }
}

function buildUrl(path, params) {
  const url = BASE + path;
  if (!params) return url;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

async function request(method, path, { params, json, form } = {}, retried = false) {
  const headers = { Accept: 'application/json' };
  const opts = { method, credentials: 'include', headers };
  if (method !== 'GET') {
    if (!csrfToken) await refreshCsrf();
    headers['X-CSRF-Token'] = csrfToken;
  }
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(json);
  } else if (form) {
    opts.body = form; // FormData: the browser sets the multipart boundary itself
  }

  let res;
  try {
    res = await fetch(buildUrl(path, params), opts);
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and that the API is running.', 0);
  }

  let payload = null;
  try { payload = await res.json(); } catch { /* not JSON */ }

  if (payload && payload.data && payload.data.csrf_token) setCsrfToken(payload.data.csrf_token);

  // CSRF token expired (e.g. session restarted): fetch a fresh one and retry ONCE.
  if (res.status === 419 && !retried) {
    await refreshCsrf();
    return request(method, path, { params, json, form }, true);
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    window.dispatchEvent(new Event('equitrack:unauthorized')); // AuthContext logs the user out in the UI
  }
  if (!res.ok || !payload || payload.success === false) {
    const message = (payload && payload.message) || `Request failed (${res.status}).`;
    throw new ApiError(message, res.status, (payload && payload.data && payload.data.errors) || {});
  }
  return payload; // { success, message, data }
}

async function refreshCsrf() {
  const res = await fetch(BASE + '/auth/csrf', { credentials: 'include' });
  const json = await res.json();
  setCsrfToken(json.data.csrf_token);
}

export const api = {
  /** Each helper resolves to the `data` part of the envelope. */
  get: async (path, params) => (await request('GET', path, { params })).data,
  post: async (path, json) => (await request('POST', path, { json })).data,
  put: async (path, json) => (await request('PUT', path, { json })).data,
  patch: async (path, json) => (await request('PATCH', path, { json })).data,
  del: async (path, json) => (await request('DELETE', path, { json })).data,
  /** multipart upload (report form with photo) */
  postForm: async (path, form) => (await request('POST', path, { form })).data,
  /** like post() but also returns the server message (for toasts) */
  withMessage: {
    post: (path, json) => request('POST', path, { json }),
    put: (path, json) => request('PUT', path, { json }),
    patch: (path, json) => request('PATCH', path, { json }),
    del: (path, json) => request('DELETE', path, { json }),
    postForm: (path, form) => request('POST', path, { form }),
  },
};

/** URL of a protected report photo (the cookie is sent automatically by <img>). */
export const imageUrl = (imageId) => `${BASE}/report-images/${imageId}`;

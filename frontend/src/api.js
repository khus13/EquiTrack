// Thin fetch wrapper. Throws ApiError carrying field errors from the PHP API.
export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', json, form } = {}) {
  const opts = { method, credentials: 'include', headers: {} };
  if (json) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(json); }
  if (form) opts.body = form;
  let res;
  try { res = await fetch('/api' + path, opts); }
  catch { throw new ApiError('Cannot reach the server.', 0); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.', res.status, data.errors || {});
  return data;
}

export const api = {
  me: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', json: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', json: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  meta: () => request('/meta'),
  reports: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request('/reports' + (qs ? '?' + qs : ''));
  },
  report: (id) => request(`/reports/${id}`),
  createReport: (form) => request('/reports', { method: 'POST', form }),
  setStatus: (id, status) => request(`/reports/${id}/status`, { method: 'PATCH', json: { status } }),
};

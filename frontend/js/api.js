/**
 * RAVI GALLERY — API CLIENT
 * Central module for all backend HTTP communication.
 */

// const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
//   ? `${window.location.protocol}//${window.location.hostname}:5000/api`
//   : '/api';

const API_BASE =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : 'https://gallery-wvv0.onrender.com/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (err) {
    throw new ApiError('Network error. Please check your connection.', 0);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Invalid response from server.', response.status);
  }

  if (!response.ok) {
    throw new ApiError(data.message || `Error ${response.status}`, response.status, data);
  }

  return data;
}

// ─── Image API ─────────────────────────────────────────────────────────────

const ImagesAPI = {
  /**
   * GET /api/images
   * @param {Object} params - { page, limit, sort, search, tag }
   */
  getAll(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request('GET', `/images${qs ? `?${qs}` : ''}`);
  },

  /**
   * GET /api/images/:id
   */
  getById(id) {
    return request('GET', `/images/${id}`);
  },

  /**
   * POST /api/images/upload
   * @param {FormData} formData
   * @param {Function} onProgress - optional progress callback (not standard fetch, handled separately)
   */
  upload(formData) {
    return request('POST', '/images/upload', formData, true);
  },

  /**
   * PUT /api/images/like/:id
   */
  like(id) {
    return request('PUT', `/images/like/${id}`);
  },

  /**
   * POST /api/images/comment/:id
   */
  comment(id, text, author = '') {
    return request('POST', `/images/comment/${id}`, { text, author });
  },

  /**
   * PUT /api/images/download/:id
   */
  recordDownload(id) {
    return request('PUT', `/images/download/${id}`);
  },

  /**
   * DELETE /api/images/:id
   */
  delete(id) {
    return request('DELETE', `/images/${id}`);
  },
};

// ─── Profile API ────────────────────────────────────────────────────────────

const ProfileAPI = {
  /**
   * GET /api/profile
   */
  get() {
    return request('GET', '/profile');
  },

  /**
   * PUT /api/profile
   * @param {FormData|Object} data
   */
  update(data) {
    if (data instanceof FormData) {
      return request('PUT', '/profile', data, true);
    }
    return request('PUT', '/profile', data, false);
  },
};

// ─── Offline cache utilities ────────────────────────────────────────────────

const Cache = {
  prefix: 'rg_',

  set(key, value, ttlSeconds = 60) {
    try {
      sessionStorage.setItem(
        this.prefix + key,
        JSON.stringify({ value, exp: Date.now() + ttlSeconds * 1000 })
      );
    } catch {}
  },

  get(key) {
    try {
      const raw = sessionStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const { value, exp } = JSON.parse(raw);
      if (Date.now() > exp) {
        sessionStorage.removeItem(this.prefix + key);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  },

  clear(key) {
    try { sessionStorage.removeItem(this.prefix + key); } catch {}
  },
};

window.API_BASE = API_BASE;
window.ImagesAPI = ImagesAPI;
window.ProfileAPI = ProfileAPI;
window.Cache = Cache;
window.ApiError = ApiError;

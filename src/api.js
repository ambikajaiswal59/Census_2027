// ─────────────────────────────────────────────────────────────
// Every backend call lives in this one file. Pages and hooks import the functions
// below and never call fetch themselves.
//
// The backend address comes from VITE_API_BASE_URL in .env, e.g.
//   VITE_API_BASE_URL=http://192.168.1.16:8000
// (restart `npm run dev` after changing it)
// ─────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// Builds ?a=1&b=2 from an object, leaving out empty values.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, value);
    }
  });
  const text = qs.toString();
  return text ? `?${text}` : "";
}

// One place for the request, the error message and the JSON reading.
async function request(path, { params, signal, headers, ...options } = {}) {
  const res = await fetch(`${BASE_URL}${path}${toQuery(params)}`, {
    ...options,
    signal,
    // Only requests with a body need Content-Type (keeps GET requests simple).
    headers: options.body
      ? { "Content-Type": "application/json", ...headers }
      : headers,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* the response was not JSON */
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }

  return res.json();
}

// Kept so older code that calls apiGet(path, params, signal) keeps working.
export const apiGet = (path, params = {}, signal) =>
  request(path, { params, signal });

// ───────────── Stats ─────────────

// GET /api/stats/latest
// -> { states_uts, districts, sub_districts, development_blocks, villages, created_at }
export const getLatestStats = (signal) => request("/api/stats/latest", { signal });

// ───────────── Directory ─────────────

// Frontend level name -> backend list endpoint
const LEVEL_ENDPOINT = {
  State: "/api/directory/states",
  District: "/api/directory/districts",
  "Sub-District": "/api/directory/sub-districts",
  "Development Block": "/api/directory/blocks",
  Village: "/api/directory/villages",
};

// These levels are big, so the backend paginates them (limit/offset)
export const PAGED_LEVELS = new Set([
  "District",
  "Sub-District",
  "Development Block",
  "Village",
]);
export const PAGE_SIZE = 100;

// params: { limit, offset, q, code }
export const fetchDirectory = (level, params, signal) =>
  request(LEVEL_ENDPOINT[level], { params, signal });

// params: { level, query, sort }
export const searchDirectory = ({ level, query, sort } = {}, signal) =>
  request("/api/directory/search", {
    params: { level, q: query, sort },
    signal,
  });

// ───────────── Announcements ─────────────

// GET /censusapi/api/announcements
// -> { count, data: [{ id, serial_number, title, link, created_at }] }
export const getAnnouncements = (signal) =>
  request("/censusapi/api/announcements", { signal });

// True when a backend address is configured (used to fall back to dummy data).
export const hasBackend = Boolean(BASE_URL);



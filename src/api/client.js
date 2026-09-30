// Single place that knows the backend URL.
// VITE_API_BASE_URL comes from .env (see .env.example)
const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function apiGet(path, params = {}, signal) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.append(key, value);
  });
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* response was not JSON */
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json();
}

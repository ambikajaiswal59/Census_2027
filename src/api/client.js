// Single place that knows how to reach the FastAPI backend.
// Base URL comes from Vite env (.env -> VITE_API_BASE_URL).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${message}`)
  }

  return res.json()
}

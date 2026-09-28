

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
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

export function getLatestStats() {
  return request('/api/stats/latest')
}


export function searchDirectory({ level, query, sort }) {
  const params = new URLSearchParams()
  if (level) params.set('level', level)
  if (query) params.set('q', query)
  if (sort) params.set('sort', sort)
  return request(`/api/directory/search?${params.toString()}`)
}

import { apiRequest } from './client.js'

// NOT wired yet - backend endpoint doesn't exist until the normalized
// states / districts / sub_districts / villages tables are added.
// Once ready, this will back the Directory Explorer's search + level filter.
export function searchDirectory({ level, query, sort }) {
  const params = new URLSearchParams()
  if (level) params.set('level', level)
  if (query) params.set('q', query)
  if (sort) params.set('sort', sort)
  return apiRequest(`/api/directory/search?${params.toString()}`)
}

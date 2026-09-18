import { apiRequest } from './client.js'

// Matches GET /api/stats/latest on the FastAPI backend
// (app/routers/stats.py -> lgddata.statistical_data)
export function getLatestStats() {
  return apiRequest('/api/stats/latest')
}

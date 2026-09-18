import { useEffect, useState } from 'react'
import { getLatestStats } from '../api/statsApi.js'

// Fetches the latest national snapshot once, on mount.
// Returns { data, loading, error } so components can show fallback
// content while loading or if the API call fails.
export function useStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    getLatestStats()
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}

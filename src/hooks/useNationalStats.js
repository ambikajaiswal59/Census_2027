import { useEffect, useState } from "react";
import { getLatestStats } from "../api/census.js";

// Remembered for the session, so pages that show the stats again get them
// instantly instead of waiting for another request.
let cachedStats = null;

export default function useNationalStats() {
  const [stats, setStats] = useState(cachedStats);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getLatestStats(controller.signal)
      .then((res) => {
        cachedStats = res;
        setStats(res);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, []);

  return { stats, error, loading: !stats && !error };
}

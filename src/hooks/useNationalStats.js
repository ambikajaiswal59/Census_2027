import { useEffect, useState } from "react";
import { getLatestStats } from "../api/census.js";

export default function useNationalStats() {
  debugger;
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getLatestStats(controller.signal)
      .then(setStats)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, []);

  return { stats, error, loading: !stats && !error };
}

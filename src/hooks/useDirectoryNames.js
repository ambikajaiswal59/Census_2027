import { useEffect, useState } from "react";
import { fetchDirectory, PAGE_SIZE } from "../api/census.js";

// Loads every State / UT (or every District with its State) once per level,
// so the dashboard table can list all of them, like the upload template does.
// Returns { rows, loading, error }, rows = [{ state }] or [{ state, district }].
const cache = {};

async function loadAll(level) {
  if (level === "District") {
    const all = [];
    for (let page = 0; page < 100; page += 1) {
      const res = await fetchDirectory("District", {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      all.push(...(res.rows || []));
      if (!res.has_more) break;
    }
    return all
      .filter((d) => d.name)
      .map((d) => ({ state: d.state || "", district: d.name }))
      .sort(
        (a, b) =>
          a.state.localeCompare(b.state) || a.district.localeCompare(b.district),
      );
  }

  const res = await fetchDirectory("State", {});
  return (res.rows || [])
    .filter((s) => s.name)
    .map((s) => ({ state: s.name }))
    .sort((a, b) => a.state.localeCompare(b.state));
}

export default function useDirectoryNames(level) {
  // Results are stored per level and read for the CURRENT level on every
  // render, so switching State / UT <-> District can never show the other
  // level's rows while the new list is loading.
  const [byLevel, setByLevel] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cache[level] || errors[level]) return undefined;
    let cancelled = false;
    loadAll(level)
      .then((list) => {
        cache[level] = list;
        if (!cancelled) setByLevel((prev) => ({ ...prev, [level]: list }));
      })
      .catch((err) => {
        if (!cancelled)
          setErrors((prev) => ({ ...prev, [level]: err.message || "Failed" }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const rows = cache[level] || byLevel[level] || null;
  const error = errors[level] || null;
  return { rows, loading: !rows && !error, error };
}
import { useEffect, useMemo, useRef, useState } from "react";
import TreeList from "./TreeList.jsx";
import { levelLabels } from "../data/sampleData.js";
import { fetchDirectory, PAGED_LEVELS, PAGE_SIZE } from "../api/census.js";
import useDebounce from "../hooks/useDebounce.js";
import { fmt } from "../utils.js";

const HIERARCHY = [
  { label: "States / UTs", level: "State", key: "states_uts" },
  { label: "Districts", level: "District", key: "districts" },
  { label: "Sub-Districts", level: "Sub-District", key: "sub_districts" },
  { label: "Development Blocks", level: "Development Block", key: "development_blocks" },
  { label: "Villages", level: "Village", key: "villages" },
];

const COLUMNS_BY_LEVEL = {
  State: [
    { key: "name", label: "State Name", bold: true },
    { key: "type", label: "State / UT" },
    { key: "code", label: "LGD Code", mono: true },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
  District: [
    { key: "name", label: "District Name", bold: true },
    { key: "state", label: "State Name" },
    { key: "code", label: "District LGD Code", mono: true },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
  "Sub-District": [
    { key: "name", label: "Sub-District Name", bold: true },
    { key: "district", label: "District Name" },
    { key: "state", label: "State Name" },
    { key: "code", label: "Sub-District LGD Code", mono: true },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
  "Development Block": [
    { key: "name", label: "Block Name", bold: true },
    { key: "district", label: "District Name" },
    { key: "state", label: "State Name" },
    { key: "code", label: "Block LGD Code", mono: true },
  ],
  Village: [
    { key: "name", label: "Village Name", bold: true },
    { key: "sub_district", label: "Sub-District Name" },
    { key: "district", label: "District Name" },
    { key: "state", label: "State Name" },
    { key: "code", label: "Village LGD Code", mono: true },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
};

const EMPTY = { rows: [], total: 0, hasMore: false };

export default function DirectoryExplorer({ stats }) {
  const [level, setLevel] = useState("State");

  // ── Single global search ──
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const [page, setPage] = useState(0);

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reqRef = useRef(0);

  const paged = PAGED_LEVELS.has(level);
  const columns = COLUMNS_BY_LEVEL[level] || COLUMNS_BY_LEVEL.State;

  const treeItems = useMemo(
    () =>
      HIERARCHY.map((h) => ({
        label: h.label,
        level: h.level,
        value: stats ? fmt(stats[h.key]) : "…",
      })),
    [stats]
  );

  // Reset page when level or query changes
  useEffect(() => {
    setPage(0);
  }, [level, debouncedQuery]);

  // Fetch data — search goes to backend
  useEffect(() => {
    const controller = new AbortController();
    const id = ++reqRef.current;
    setLoading(true);
    setError(null);

    fetchDirectory(
      level,
      {
        limit: paged ? PAGE_SIZE : undefined,
        offset: paged ? page * PAGE_SIZE : undefined,
        q: debouncedQuery.trim(), // ← Global search sent to backend
      },
      controller.signal
    )
      .then((res) => {
        if (id !== reqRef.current) return;
        setData({
          rows: res.rows || [],
          total: res.total ?? res.rows?.length ?? 0,
          hasMore: !!res.has_more,
        });
      })
      .catch((err) => {
        if (err.name === "AbortError" || id !== reqRef.current) return;
        setData(EMPTY);
        setError(err.message);
      })
      .finally(() => {
        if (id === reqRef.current) setLoading(false);
      });

    return () => controller.abort();
  }, [level, paged, debouncedQuery, page, reloadKey]);

  function goToPrevPage() {
    setPage((p) => Math.max(0, p - 1));
  }
  function goToNextPage() {
    if (data.hasMore) setPage((p) => p + 1);
  }

  function handleSetLevel(newLevel) {
    if (newLevel === level) return;
    setData(EMPTY);
    setLevel(newLevel);
    setQuery("");
  }

  const formatCode = (code) =>
    level === "State" ? String(code).padStart(2, "0") : String(code);

  function renderCell(col, r) {
    if (col.key === "code") {
      return <span className="font-mono text-[#033972]">{formatCode(r.code)}</span>;
    }
    if (col.key === "census_2011_code") {
      const v = r.census_2011_code;
      return v && v !== "0" ? (
        <span className="font-mono text-[#033972]">{v}</span>
      ) : (
        <span className="text-muted">—</span>
      );
    }
    if (col.key === "name") {
      return <span className="font-semibold text-navy">{r.name}</span>;
    }
    return r[col.key] ?? <span className="text-muted">—</span>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      {/* ─── Card Title ─── */}
      <h3 className="rounded-t-2xl bg-navy shadow-[0_3px_18px_rgba(0,0,0,.13)] px-5 py-4 font-sans text-lg font-semibold tracking-wide text-white sm:px-6 sm:text-xl md:text-2xl">
        Administrative Hierarchy
      </h3>

      {/* ─── Tree / Tabs ─── */}
      <div className="border-b border-line bg-white px-5 py-4 sm:px-6">
        <TreeList
          items={treeItems}
          activeLevel={level}
          onSelect={handleSetLevel}
          orientation="horizontal"
        />
      </div>

      {/* ─── Toolbar: Title + Global Search ─── */}
      <div className="flex flex-col gap-3 border-b border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex items-baseline gap-2">
          <h4 className="font-sans text-base font-bold text-navy sm:text-lg md:text-xl">
            {levelLabels[level] || level}
          </h4>
          {/* {!loading && !error && (
            <span className="text-xs text-muted sm:text-sm">
              {fmt(data.total)} records
              {debouncedQuery && ` matching "${debouncedQuery}"`}
            </span>
          )} */}
        </div>

        {/* Global Search */}
        <div className="relative w-full sm:w-72 md:w-80">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search across all ${levelLabels[level] || level}…`}
            className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-bgApp hover:text-navy"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="overflow-x-auto">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-bgApp">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap border-b border-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#596577] sm:text-xs"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="text-sm sm:text-[14px]">
              {error ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="border-b border-line px-4 py-6 text-center text-sm text-red-600"
                  >
                    Could not load data ({error}){" "}
                    <button
                      type="button"
                      onClick={() => setReloadKey((k) => k + 1)}
                      className="ml-2 font-semibold text-blue underline hover:no-underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : loading && data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="border-b border-line px-4 py-6 text-center text-sm text-muted"
                  >
                    Loading…
                  </td>
                </tr>
              ) : data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="border-b border-line px-4 py-6 text-center text-sm text-muted"
                  >
                    No matching records.
                  </td>
                </tr>
              ) : (
                data.rows.map((r) => (
                  <tr
                    key={`${level}-${r.code}`}
                    className="h-12 transition-colors hover:bg-[#F7FAFC]"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="whitespace-nowrap border-b border-line px-4 py-3 text-[13px] text-text sm:text-sm"
                      >
                        {renderCell(col, r)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Pagination — SIMPLE (Previous / Next only) ─── */}
      {paged && !error && (
        <div className="flex items-center justify-between border-t border-line px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={page === 0 || loading}
            className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-navy transition-colors hover:bg-bgApp disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
          >
            ‹ Previous
          </button>
          <span className="text-xs text-muted sm:text-sm">Page {page + 1}</span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={!data.hasMore || loading}
            className="rounded-full border border-navy px-4 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:opacity-40 disabled:hover:bg-transparent sm:text-sm"
          >
            {loading ? "Loading…" : "Next ›"}
          </button>
        </div>
      )}

      {/* ─── Footer ─── */}
      <div className="border-l-[3px] border-saffron bg-[#FFF8EC] px-4 py-3 text-xs leading-relaxed text-[#765020]">
        Source: <b>Local Government Directory</b>
      </div>
    </div>
  );
}
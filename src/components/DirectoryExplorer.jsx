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
    { key: "code", label: "LGD Code", mono: true, searchable: "code" },
    { key: "name", label: "State Name", searchable: "name" },
    { key: "type", label: "State / UT" },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
  District: [
    { key: "state", label: "State Name" },
    { key: "code", label: "District LGD Code", mono: true, searchable: "code" },
    { key: "name", label: "District Name", searchable: "name" },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
  "Sub-District": [
    { key: "state", label: "State Name" },
    { key: "district", label: "District Name" },
    { key: "code", label: "Sub-District LGD Code", mono: true, searchable: "code" },
    { key: "name", label: "Sub-District Name", searchable: "name" },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
  "Development Block": [
    { key: "state", label: "State Name" },
    { key: "district", label: "District Name" },
    { key: "code", label: "Block LGD Code", mono: true, searchable: "code" },
    { key: "name", label: "Block Name", searchable: "name" },
   
  ],
  Village: [
    { key: "state", label: "State Name" },
    { key: "district", label: "District Name" },
    { key: "sub_district", label: "Sub-District Name" },
    { key: "code", label: "Village LGD Code", mono: true, searchable: "code" },
    { key: "name", label: "Village Name", searchable: "name" },
    { key: "census_2011_code", label: "Census 2011 Code", mono: true },
  ],
};

const EMPTY = { rows: [], total: 0, hasMore: false };

export default function DirectoryExplorer({ stats }) {
  const [level, setLevel] = useState("State");
  const [nameQuery, setNameQuery] = useState("");
  const [codeQuery, setCodeQuery] = useState("");
  const dName = useDebounce(nameQuery, 400);
  const dCode = useDebounce(codeQuery, 400);

  const [page, setPage] = useState(0);

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reqRef = useRef(0);

  const paged = PAGED_LEVELS.has(level);
  const serverName = paged ? dName.trim() : "";
  const serverCode = paged ? dCode.trim() : "";
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

  useEffect(() => {
    setPage(0);
  }, [level, serverName, serverCode]);

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
        q: serverName,
        code: serverCode,
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
  }, [level, paged, serverName, serverCode, page, reloadKey]);

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
    setNameQuery("");
    setCodeQuery("");
  }

  const rows = useMemo(() => {
    const n = nameQuery.trim().toLowerCase();
    const c = codeQuery.trim();
    return data.rows.filter(
      (r) =>
        (!n || r.name.toLowerCase().includes(n)) &&
        (!c || String(r.code).includes(c))
    );
  }, [data.rows, nameQuery, codeQuery]);

  const formatCode = (code) =>
    level === "State" ? String(code).padStart(2, "0") : String(code);

  // CHANGE: renders whichever value a column needs, with special handling
  // for the two searchable columns (code/name) and the census code (shows
  // "—" for NULL/0 so it reads as "not mapped" rather than a stray zero).
  function renderCell(col, r) {
    if (col.key === "code") return formatCode(r.code);
    if (col.key === "census_2011_code") {
      const v = r.census_2011_code;
      return v && v !== "0" ? v : <span className="text-muted">—</span>;
    }
    if (col.key === "name") return <b>{r.name}</b>;
    return r[col.key] ?? <span className="text-muted">—</span>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line p-[19px]">
        <h3 className="-mx-[19px] -mt-[19px] mb-3 block rounded-t-2xl bg-gradient-to-br from-navy to-navy2 px-[19px] py-3 font-sans text-[20px] text-white">
          Administrative hierarchy
        </h3>

        <TreeList
          items={treeItems}
          activeLevel={level}
          onSelect={handleSetLevel}
          orientation="horizontal"
        />
      </div>

      <div className="min-w-0 overflow-hidden p-[19px]">
        <h3 className="mb-3 flex items-baseline gap-2 font-sans text-[20px]">
          <span className="font-bold">{levelLabels[level] || level}</span>
          {!loading && !error && (
            <span className="text-[12px] font-normal text-muted">
              Showing {fmt(rows.length)} results
            </span>
          )}
        </h3>

        <div className="h-[484px] overflow-x-auto overflow-y-auto rounded-lg">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="h-11">
                {/* CHANGE: columns now render from COLUMNS_BY_LEVEL - the
                    search boxes attach themselves to whichever column is
                    marked searchable "name" / "code" for this level */}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="bg-bgApp p-2.5 text-left align-top text-[10px] uppercase tracking-[.04em] text-[#596577]"
                  >
                    {col.searchable ? (
                      <div className="flex flex-col items-start gap-2">
                        <span className="ml-1">{col.label}</span>
                        <input
                          value={col.searchable === "name" ? nameQuery : codeQuery}
                          onChange={(e) =>
                            col.searchable === "name"
                              ? setNameQuery(e.target.value)
                              : setCodeQuery(e.target.value)
                          }
                          placeholder="Search…"
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-24 min-w-0 rounded-md border border-line bg-white px-2 text-[10px] normal-case tracking-normal text-text focus:border-blue focus:outline-none"
                        />
                      </div>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                {/* <th className="bg-bgApp p-2.5 text-left align-top text-[10px] uppercase tracking-[.04em] text-[#596577]">
                  Status
                </th> */}
              </tr>
            </thead>

            <tbody>
              {error ? (
                <tr className="h-11">
                  <td colSpan={columns.length + 1} className="border-b border-[#EDF0F4] p-2.5 text-[#b20000]">
                    Could not load data ({error}){" "}
                    <button
                      type="button"
                      onClick={() => setReloadKey((k) => k + 1)}
                      className="ml-2 font-bold text-blue underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : loading && rows.length === 0 ? (
                <tr className="h-11">
                  <td colSpan={columns.length + 1} className="border-b border-[#EDF0F4] p-2.5 text-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr className="h-11">
                  <td colSpan={columns.length + 1} className="border-b border-[#EDF0F4] p-2.5">
                    No matching record.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${level}-${r.code}`} className="h-11">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`border-b border-[#EDF0F4] p-2.5 ${col.mono ? "font-mono text-blue" : ""}`}
                      >
                        {renderCell(col, r)}
                      </td>
                    ))}
                    {/* <td className="border-b border-[#EDF0F4] p-2.5">
                      <span className="rounded-xl bg-green2 px-[7px] py-1 text-[10px] text-green">
                        {r.status || "Active"}
                      </span>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paged && !error && (
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPrevPage}
              disabled={page === 0 || loading}
              className="rounded-full border border-line px-4 py-1.5 text-[11px] font-bold text-navy transition-colors hover:bg-bgApp disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹ Previous
            </button>
            <span className="text-[11px] text-muted">Page {page + 1}</span>
            <button
              type="button"
              onClick={goToNextPage}
              disabled={!data.hasMore || loading}
              className="rounded-full border border-blue px-4 py-1.5 text-[11px] font-bold text-blue transition-colors hover:bg-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
            >
              {loading ? "Loading…" : "Next ›"}
            </button>
          </div>
        )}
      </div>

      <div className="border-l-[3px] border-saffron bg-[#FFF8EC] px-[11px] py-2.5 text-[10px] leading-tight text-[#765020]">
        <p className="m-0">
          Source: <b>Local Government Directory</b>
        </p>
      </div>
    </div>
  );
}
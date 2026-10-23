import { useState, useMemo, useEffect } from "react";
import { formatIN } from "../../data/dashboardConfig.js";

function normalizeName(name = "") {
  return String(name).trim().toLowerCase();
}

export default function DataTableCard({
  data = [],
  level = "State / UT",
  loading = false, // true while the full State / District list is being fetched
  onRowClick, // called with the clicked row: { state, district?, ... }
  selectedKey, // key of the row currently shown on the map (highlighted here)
  activeParamKey, // key of the selected built-in Parameter, e.g. "total_population"
  activeParamLabel, // its display label, e.g. "Total Population"
  uploadedColumn, // { heading, rows: [{ name, value }] } or null — the Customer
  // Input dataset currently picked in the sidebar, matched here by State / UT name.
}) {
  const [query, setQuery] = useState("");

  const isDistrict = level === "District";

  // The page only passes an uploaded column that belongs to the level being
  // shown, so it can be displayed in both State / UT and District views.
  const showUploadedColumn = Boolean(uploadedColumn);

  // State / UT view matches rows by state name; District view by
  // state + district (district names repeat across states).
  function uploadedKey(state, district) {
    return isDistrict
      ? `${normalizeName(state)}|${normalizeName(district)}`
      : normalizeName(state);
  }

  const uploadedValueByKey = useMemo(() => {
    if (!showUploadedColumn) return {};

    const map = {};
    uploadedColumn.rows.forEach(({ state, district, value }) => {
      const key = uploadedKey(state, district);
      if (normalizeName(state)) map[key] = value;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUploadedColumn, uploadedColumn, isDistrict]);

  // Clear the previous search when changing levels.
  useEffect(() => {
    setQuery("");
  }, [level]);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return data;

    return data.filter((row) => {
      const primaryName = isDistrict ? row.district : row.state;

      return (
        String(primaryName || "")
          .toLowerCase()
          .includes(search) ||
        (isDistrict &&
          String(row.state || "")
            .toLowerCase()
            .includes(search))
      );
    });
  }, [data, query, isDistrict]);

  // Only one field is active at a time: either a built-in Parameter or an
  // uploaded Customer Input dataset. Show just that one data column.
  const showParamColumn = !uploadedColumn && Boolean(activeParamKey);

  // Each row's share of the selected parameter's total across every state / district
  // (the full list, not just the rows left after a search).
  const paramTotal = useMemo(() => {
    if (!showParamColumn) return 0;

    return data.reduce((sum, row) => {
      const v = Number(row?.[activeParamKey]);
      return Number.isFinite(v) ? sum + v : sum;
    }, 0);
  }, [data, activeParamKey, showParamColumn]);

  function percentOf(value) {
    const v = Number(value);

    if (value === null || value === "" || !Number.isFinite(v) || !paramTotal)
      return "—";

    return `${((v / paramTotal) * 100).toFixed(2)}%`;
  }

  const columns = [
    "#",
    ...(isDistrict ? ["District", "State / UT"] : ["State / UT"]),
    ...(showParamColumn ? [activeParamLabel || "Parameter", "% of Total"] : []),
    ...(showUploadedColumn ? [uploadedColumn.heading] : []),
    "",
  ];

  // Header and body are separate tables, so they share fixed column widths (%).
  const hasDataColumn = showParamColumn || showUploadedColumn;
  const widths = isDistrict
    ? showParamColumn
      ? [5, 20, 20, 30, 18, 7]
      : hasDataColumn
        ? [5, 24, 24, 40, 7]
        : [5, 44, 44, 7]
    : showParamColumn
      ? [5, 33, 32, 23, 7]
      : hasDataColumn
        ? [5, 44, 44, 7]
        : [5, 88, 7];

  const colGroup = (
    <colgroup>
      {widths.map((width, index) => (
        <col key={index} style={{ width: `${width}%` }} />
      ))}
    </colgroup>
  );

  return (
    <div className="flex h-full border-t-4 border-t-navy max-h-[420px] min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow duration-300 hover:shadow-[0_12px_28px_rgba(2,2,68,.10)] motion-reduce:transition-none lg:max-h-none">
      {/* Header */}
      {/* <div className="relative z-20 flex flex-col gap-1.5 border-b border-white/10 bg-navy px-3 py-1.5 shadow-[0_3px_18px_rgba(0,0,0,.13)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4 sm:py-1.5">
        <div className="flex items-baseline justify-between gap-2 sm:block">
          <h3 className="flex items-center gap-1.5 text-[14px] font-extrabold leading-tight text-white sm:gap-2 sm:text-[15px]">
            <i className="ti ti-table text-white" />
            {isDistrict ? "District-wise Data" : "State / UT-wise Data"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-white/70" />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isDistrict
                  ? "Search district or state..."
                  : "Search state/UT..."
              }
              aria-label={
                isDistrict
                  ? "Search district or state"
                  : "Search state or union territory"
              }
              className="h-7 w-full rounded-[9px] border border-white/20 bg-white/10 pl-9 pr-3 text-[12px] text-white placeholder:text-white/60 transition-all duration-200 focus:-translate-y-px focus:border-white/50 focus:bg-white/15 focus:shadow-[0_6px_14px_rgba(0,0,0,.25)] focus:outline-none motion-reduce:transform-none motion-reduce:transition-none sm:w-[220px]"
            />
          </div>
        </div>
      </div> */}

      {/* Column headers sit outside the scrolling area, so the scrollbar starts below them. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
        <div className="flex min-h-0 flex-1 flex-col min-w-[560px]">
          {/* Header strip: reserves the same scrollbar gutter as the body so columns align */}
          <div className="relative z-10 shrink-0  overflow-y-hidden [scrollbar-gutter:stable]">
            <table className="w-full table-fixed border-collapse text-xs">
              {colGroup}
              <thead>
                <tr>
                  {columns.map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="whitespace-nowrap border-t border-white/10 px-2.5 py-1 text-left text-[10px] uppercase tracking-[.04em] text-navy"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          {/* Body: only this part scrolls vertically */}
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            <table className="w-full table-fixed border-collapse text-xs">
              {colGroup}
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="border-b border-[#EDF0F4] p-4 text-muted"
                    >
                      {loading
                        ? `Loading ${isDistrict ? "districts" : "states / UTs"}…`
                        : `No matching ${isDistrict ? "district" : "state/UT"} found.`}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const name = isDistrict ? row.district : row.state;
                    const rowKey = isDistrict
                      ? `${row.state}-${row.district}`
                      : row.state;
                    const isSelected = selectedKey === rowKey;

                    return (
                      <tr
                        key={rowKey}
                        tabIndex={0}
                        aria-selected={isSelected}
                        onClick={() => onRowClick?.(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick?.(row);
                          }
                        }}
                        className={`group relative cursor-pointer transition-all duration-200 ease-out hover:z-[1] hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(2,2,68,.10)] focus-visible:bg-[#EEEEF8] focus-visible:outline-none active:translate-y-0 active:scale-[0.995] motion-reduce:transform-none motion-reduce:transition-none ${
                          isSelected ? "bg-[#DEDEF0]" : "hover:bg-soft"
                        }`}
                      >
                        <td className="whitespace-nowrap border-b border-[#EDF0F4] p-2.5">
                          {index + 1}
                        </td>

                        {isDistrict && (
                          <td
                            className="truncate whitespace-nowrap border-b border-[#EDF0F4] p-2.5"
                            title={name || undefined}
                          >
                            <b>{name || "—"}</b>
                          </td>
                        )}

                        <td
                          className="truncate whitespace-nowrap border-b border-[#EDF0F4] p-2.5"
                          title={(isDistrict ? row.state : name) || undefined}
                        >
                          {isDistrict ? row.state || "—" : <b>{name || "—"}</b>}
                        </td>

                        {showParamColumn && (
                          <>
                            <td className="whitespace-nowrap border-b border-[#EDF0F4] p-2.5 font-mono text-blue">
                              {formatIN(row[activeParamKey])}
                            </td>
                            <td className="whitespace-nowrap border-b border-[#EDF0F4] p-2.5 font-mono text-navy">
                              {percentOf(row[activeParamKey])}
                            </td>
                          </>
                        )}

                        {showUploadedColumn && (
                          <td className="whitespace-nowrap border-b border-[#EDF0F4] p-2.5 font-mono text-blue">
                            {uploadedValueByKey[
                              uploadedKey(row.state, row.district)
                            ] || "—"}
                          </td>
                        )}

                        <td className="border-b border-[#EDF0F4] p-2.5 text-muted">
                          <i className="ti ti-chevron-right inline-block transition-all duration-200 group-hover:translate-x-1 group-hover:text-navy motion-reduce:transform-none motion-reduce:transition-none" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

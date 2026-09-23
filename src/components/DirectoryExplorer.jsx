import { useMemo, useState } from "react";
import TreeList from "./TreeList.jsx";
import {
  sample,
  hierarchyTree,
  localBodyTree,
  levelLabels,
} from "../data/sampleData.js";

export default function DirectoryExplorer() {
  const [level, setLevel] = useState("State");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return (sample[level] || []).filter(
      (r) =>
        !query ||
        r[0].toLowerCase().includes(query.toLowerCase()) ||
        r[2].includes(query),
    );
  }, [level, query]);

  function handleSetLevel(newLevel) {
    setLevel(newLevel);
    setQuery("");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="grid grid-cols-1 md:grid-cols-[.72fr_1.28fr]">
        <div className="border-b border-line p-[19px] md:border-b-0 md:border-r">
          <h3 className="-mx-[19px] -mt-[19px] mb-3 block rounded-t-2xl bg-gradient-to-br from-navy to-navy2 px-[19px] py-3 font-sans text-[20px] text-white md:rounded-tr-none">
            Administrative hierarchy
          </h3>

          <TreeList
            items={hierarchyTree}
            activeLevel={level}
            onSelect={handleSetLevel}
          />

          {/* <div className="-mx-[19px] mb-[11px] mt-3.5 block bg-gradient-to-br from-navy to-navy2 px-[19px] py-3 text-[20px] text-white ">
            Local body classification
          </div>
          <TreeList
            items={localBodyTree}
            activeLevel={level}
            onSelect={handleSetLevel}
          /> */}
        </div>

        <div className="overflow-auto p-[19px]">
          <h3 className="mb-3 font-sans text-[20px]">
            <span className="font-bold ">
              {levelLabels[level] || level}
            </span>
          </h3>

          <div className="relative mb-[15px]">
            <i className="ti ti-search pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-[15px] text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search within ${levelLabels[level] || level}…`}
              className="h-[42px] w-full rounded-[9px] border border-line bg-soft pl-[37px] pr-3 text-[13px] text-text transition-colors duration-150 focus:border-blue focus:bg-white focus:shadow-[0_0_0_3px_rgba(29,95,167,.15)] focus:outline-none"
            />
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {["Name", "Level", "LGD code", "Status"].map((h) => (
                  <th
                    key={h}
                    className="bg-bgApp p-2.5 text-left text-[10px] uppercase tracking-[.04em] text-[#596577]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border-b border-[#EDF0F4] p-2.5">
                    No matching demonstration record.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r[0]}-${r[2]}`}>
                    <td className="border-b border-[#EDF0F4] p-2.5">
                      <b>{r[0]}</b>
                    </td>
                    <td className="border-b border-[#EDF0F4] p-2.5">{r[1]}</td>
                    <td className="border-b border-[#EDF0F4] p-2.5 font-mono text-blue">
                      {r[2]}
                    </td>
                    <td className="border-b border-[#EDF0F4] p-2.5">
                      <span className="rounded-xl bg-green2 px-[7px] py-1 text-[10px] text-green">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-l-[3px] border-saffron bg-[#FFF8EC] px-[11px] py-2.5 text-[10px] leading-tight text-[#765020]">
        <p className="m-0">
          Source: <b>Local Government Directory</b>
        </p>
      </div>
    </div>
  );
}

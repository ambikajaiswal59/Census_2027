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
  const [nameQuery, setNameQuery] = useState("");
  const [codeQuery, setCodeQuery] = useState("");

  const rows = useMemo(() => {
    return (sample[level] || []).filter((r) => {
      const matchesName =
        !nameQuery || r[0].toLowerCase().includes(nameQuery.toLowerCase());
      const matchesCode = !codeQuery || r[2].includes(codeQuery);
      return matchesName && matchesCode;
    });
  }, [level, nameQuery, codeQuery]);

  function handleSetLevel(newLevel) {
    setLevel(newLevel);
    setNameQuery("");
    setCodeQuery("");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line p-[19px]">
        <h3 className="-mx-[19px] -mt-[19px] mb-3 block rounded-t-2xl bg-gradient-to-br from-navy to-navy2 px-[19px] py-3 font-sans text-[20px] text-white">
          Administrative hierarchy
        </h3>

        <TreeList
          items={hierarchyTree}
          activeLevel={level}
          onSelect={handleSetLevel}
          orientation="horizontal"
        />
      </div>

      <div className="min-w-0 overflow-hidden p-[19px]">
        <h3 className="mb-3 font-sans text-[20px]">
          <span className="font-bold">{levelLabels[level] || level}</span>
        </h3>

        {/* CHANGE: standalone search row removed — inputs now live inside
            the table header cells below */}

        <div className="h-[484px] overflow-x-auto overflow-y-auto rounded-lg">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="h-11">
                {/* CHANGE: Name header now has an inline search input to its right */}
                <th className="bg-bgApp p-2.5 text-left align-top text-[10px] uppercase tracking-[.04em] text-[#596577]">
                  <div className="flex flex-col items-start gap-2">
                    <span className="ml-1">Name</span>
                    <input
                      value={nameQuery}
                      onChange={(e) => setNameQuery(e.target.value)}
                      placeholder="Search…"
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-24 min-w-0 rounded-md border border-line bg-white px-2 text-[10px] normal-case tracking-normal text-text focus:border-blue focus:outline-none"
                    />
                  </div>
                </th>

                <th className="bg-bgApp p-2.5 text-left align-top text-[10px] uppercase tracking-[.04em] text-[#596577]">
                  Level
                </th>

                {/* CHANGE: LGD code header now has an inline search input to its right */}
                <th className="bg-bgApp p-2.5 text-left align-top text-[10px] uppercase tracking-[.04em] text-[#596577]">
                  <div className="flex flex-col items-start  gap-2">
                    <span className="ml-1">LGD code</span>
                    <input
                      value={codeQuery}
                      onChange={(e) => setCodeQuery(e.target.value)}
                      placeholder="Search…"
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-20 min-w-0 rounded-md border border-line bg-white px-2 text-[10px] normal-case tracking-normal text-text focus:border-blue focus:outline-none"
                    />
                  </div>
                </th>

                <th className="bg-bgApp p-2.5 text-left align-top text-[10px] uppercase tracking-[.04em] text-[#596577]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr className="h-11">
                  <td colSpan={4} className="border-b border-[#EDF0F4] p-2.5">
                    No matching demonstration record.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r[0]}-${r[2]}`} className="h-11 ">
                    <td className="border-b border-[#EDF0F4] p-2.5">
                      <b>{r[0]}</b>
                    </td>
                    <td className="border-b border-[#EDF0F4] p-2.5">{r[1]}</td>
                    <td className="border-b border-[#EDF0F4] p-2.5  font-mono text-blue">
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

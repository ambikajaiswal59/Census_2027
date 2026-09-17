import { useMemo, useState } from 'react'
import TreeList from './TreeList.jsx'
import { sample, levels, hierarchyTree, localBodyTree, quickLevels } from '../data/sampleData.js'

export default function DirectoryExplorer() {
  const [level, setLevel] = useState('State')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('Relevance')

  const rows = useMemo(() => {
    let data = (sample[level] || sample.State).filter(
      (r) =>
        !query ||
        r[0].toLowerCase().includes(query.toLowerCase()) ||
        r[2].includes(query),
    )
    if (sort === 'Name A–Z') data = [...data].sort((a, b) => a[0].localeCompare(b[0]))
    if (sort === 'Code') data = [...data].sort((a, b) => a[2].localeCompare(b[2], undefined, { numeric: true }))
    return data
  }, [level, query, sort])

  function runSearch() {
    setQuery(searchInput)
  }

  function pickQuickLevel(l) {
    setLevel(l)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line bg-gradient-to-b from-[#F9FBFE] to-[#FBFCFE] p-4 sm:p-[19px_20px]">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[165px_1fr_125px]">
          <select
            value={levels.includes(level) ? level : 'State'}
            onChange={(e) => setLevel(e.target.value)}
            className="h-[42px] rounded-[7px] border border-line bg-white px-2.5 text-[13px] text-text"
          >
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>

          <div className="relative flex">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch()
              }}
              placeholder="Search by name or LGD code…"
              className="h-[42px] w-full rounded-[7px] border border-line bg-white py-0 pl-2.5 pr-[70px] text-[13px] text-text"
            />
            <button
              type="button"
              onClick={runSearch}
              className="absolute right-1 top-1 h-[34px] rounded-[5px] border-0 bg-navy px-3 text-xs text-white"
            >
              Search
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-[42px] rounded-[7px] border border-line bg-white px-2.5 text-[13px] text-text"
          >
            <option>Relevance</option>
            <option>Name A–Z</option>
            <option>Code</option>
          </select>
        </div>

        <div className="mt-[11px] flex flex-wrap gap-[7px]">
          {quickLevels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pickQuickLevel(l)}
              className="rounded-[18px] border border-line bg-white px-2.5 py-1.5 text-[11px] text-muted hover:border-blue hover:text-blue"
            >
              {l === 'State' ? 'States & UTs' : l === 'Development Block' ? 'Development Blocks' : `${l}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[.72fr_1.28fr]">
        <div className="border-b border-line p-[19px] md:border-b-0 md:border-r">
          <h3 className="mb-3 font-sans text-[13px]">Administrative hierarchy</h3>
          <div className="mb-[11px] text-[11px] text-muted">
            India / States / Districts / Sub-Districts / Development Blocks / Villages
          </div>
          <TreeList items={hierarchyTree} />

          <div className="mt-3.5 text-[11px] text-muted">Local body classification</div>
          <TreeList items={localBodyTree} />
        </div>

        <div className="overflow-auto p-[19px]">
          <h3 className="mb-3 font-sans text-[13px]">
            Directory results{' '}
            <span className="font-normal text-muted">
              ({(levels.includes(level) ? level : 'State')} · demonstration data)
            </span>
          </h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {['Name', 'Level', 'LGD code', 'Status'].map((h) => (
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
                    <td className="border-b border-[#EDF0F4] p-2.5 font-mono text-blue">{r[2]}</td>
                    <td className="border-b border-[#EDF0F4] p-2.5">
                      <span className="rounded-xl bg-green2 px-[7px] py-1 text-[10px] text-green">Active</span>
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
  )
}

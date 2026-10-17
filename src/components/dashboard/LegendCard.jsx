import { useState } from "react";

export default function LegendCard({ ranges, visibleRangeIds, onToggleRange }) {
  const [rampOpen, setRampOpen] = useState(true);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-navy bg-white p-4 shadow-card">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-navy">
        <i className="ti ti-palette text-blue" />
        Legend
      </h3>

      <button
        type="button"
        onClick={() => setRampOpen((o) => !o)}
        className="mb-2 flex w-full items-center justify-between text-[12px] font-bold text-navy"
      >
        Change Color Range
        <i className={`ti ti-chevron-down transition-transform duration-150 ${rampOpen ? "rotate-180" : ""}`} />
      </button>

      {rampOpen && (
        <div className="flex flex-col gap-2">
          {ranges.map((r) => (
            <label key={r.id} className="flex cursor-pointer items-center gap-2.5 text-[12px] text-text">
              <input
                type="checkbox"
                checked={visibleRangeIds.includes(r.id)}
                onChange={() => onToggleRange(r.id)}
                className="h-4 w-4 rounded accent-blue"
              />
              <span className="h-3.5 w-3.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: r.color }} />
              {r.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
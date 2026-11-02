import {
  CLASSIFICATION_OPTIONS,
  COLOR_RAMPS,
  DEFAULT_RAMP_ID,
} from "../../data/dashboardConfig.js";
import BarsIcon from "../BarsIcon.jsx";

const rampGradient = (colors) =>
  `linear-gradient(to right, ${colors.join(", ")})`;

// Right-hand panel:
//  1. Classification: choose 5 or 3 classes (5 by default)
//  2. The colour list for the chosen classification, which the map also uses
export default function LegendCard({
  ranges = [],
  classCount,
  onClassCountChange,
  rampId = DEFAULT_RAMP_ID,
  onRampChange,
  activeParamLabel = "Population",
  showNoData = false, // true when some areas have no value: adds the grey "No data available" entry
}) {
  const ramp = COLOR_RAMPS.find((r) => r.id === rampId) || COLOR_RAMPS[0];

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4 lg:h-full">
      {/* Classification */}
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[13px] font-extrabold text-navy">
        <BarsIcon size="1.1em" className="shrink-0 text-blue" />
        Classes
      </h3>

      <div
        role="radiogroup"
        aria-label="Classification"
        className="mb-3 grid grid-cols-2 gap-x-2 rounded-xl border border-line bg-white p-3 shadow-sm lg:grid-cols-1 lg:gap-x-0"
      >
        {CLASSIFICATION_OPTIONS.map((count) => {
          const isSelected = classCount === count;

          return (
            <label
              key={count}
              className={`group mb-1.5 flex cursor-pointer items-center rounded-full py-2 pl-2 pr-3 text-[13px] font-medium text-navy transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(2,2,68,.12)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${
                isSelected
                  ? "-translate-y-px bg-[#DEDEF0] shadow-[0_6px_16px_rgba(2,2,68,.16),inset_0_1px_0_rgba(255,255,255,.7)]"
                  : "bg-transparent hover:bg-[#EEEEF8]"
              }`}
            >
              <input
                type="radio"
                name="legend-classification"
                value={count}
                checked={isSelected}
                onChange={() => onClassCountChange?.(count)}
                className="sr-only"
              />
              <span
                className={`mr-3 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-4 bg-white transition-all duration-200 motion-reduce:transition-none ${
                  isSelected
                    ? "scale-110 border-[#020244] shadow-[0_4px_12px_rgba(2,2,68,.35)]"
                    : "border-[#777777] group-hover:scale-110 group-hover:border-[#020244]"
                }`}
              >
                <span
                  className={`h-[8px] w-[8px] rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none ${
                    isSelected ? "scale-100" : "scale-0"
                  }`}
                />
              </span>
              <span>{count} Classes</span>
            </label>
          );
        })}
      </div>

      {/* Colour list for the selected classification */}
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[13px] font-extrabold text-navy">
        <i className="ti ti-filter shrink-0 text-blue" />
        Legend
      </h3>

      <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
        <h4 className="mb-2 min-w-0 break-words text-[12px] font-extrabold text-blue">
          {activeParamLabel}
        </h4>

        <div className="grid grid-cols-1 gap-1.5 min-[480px]:grid-cols-2 lg:grid-cols-1">
          {ranges.map((range) => (
            <div
              key={range.id}
              className="flex min-w-0 items-center gap-2 text-[11px] text-text"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: range.color }}
              />
              <span className="min-w-0 break-words">{range.label}</span>
            </div>
          ))}

          {/* Only when some areas have no value for the selected field */}
          {showNoData && (
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-text">
              <span
                className="h-3 w-3 shrink-0 rounded-full bg-[#E7EBF0]"
                style={{ boxShadow: "inset 0 0 0 1px #C7CEDA" }}
              />
              <span className="min-w-0 break-words">No data available</span>
            </div>
          )}
        </div>
      </div>

      {/* Colour ramps: always visible, so one click picks a ramp */}
      <h3 className="mb-1 mt-3 flex items-center gap-1 text-[13px] font-extrabold text-navy">
        <i className="ti ti-palette text-blue" />
        Classes Gradation
      </h3>

      <div>
        <ul
          role="listbox"
          aria-label="Colour ramp"
          className="rounded-xl border border-line bg-white p-1"
        >
          {COLOR_RAMPS.map((r) => {
            const isSelected = r.id === rampId;
            return (
              <li key={r.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onRampChange?.(r.id);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-navy transition-colors hover:bg-[#EEEEF8] ${
                    isSelected ? "bg-[#DEDEF0] font-bold" : "font-medium"
                  }`}
                >
                  <span
                    className="h-3 w-12 shrink-0 rounded-full"
                    style={{ background: rampGradient(r.colors) }}
                  />
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  {isSelected && <i className="ti ti-check text-[13px]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

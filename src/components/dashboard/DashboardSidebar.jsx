import {
  Fragment,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  startTransition,
} from "react";
import { useUpload } from "../../context/UploadContext.jsx";
import useLevelCount from "../../hooks/useLevelCount.js";
import CountCard from "./CountCard.jsx";

// Parameters shown before the list starts scrolling (Total ... ST Population).
const VISIBLE_PARAMS = 6; // a group heading + 5 rows

export default function DashboardSidebar({
  level,
  onLevelChange,
  parameters = [],
  activeParam,
  onParamChange,
}) {
  const levelOptions = [
    { value: "State / UT", icon: "ti-map" },
    { value: "District", icon: "ti-map-pin" },
  ];

  const { uploadsByLevel, selectedUpload, setSelectedUpload } = useUpload();

  // UI state: updates instantly on click, independent of map loading
  const [uiLevel, setUiLevel] = useState(level);

  // Card count: has its own loading, separate from the table / map data.
  const levelCount = useLevelCount(uiLevel);

  // Keep in sync if the parent changes level from elsewhere
  useEffect(() => {
    setUiLevel(level);
  }, [level]);

  // Each level has its own upload (State / UT sheet, District sheet).
  const uploadedData = uploadsByLevel[uiLevel] ?? null;

  // The leading key columns (State / UT, or State / UT + District) are only
  // backend references used to match rows to the map/table — never shown as
  // dataset options. Every column after them (Dataset 1/2/3) shows up as an
  // option, but only when that column actually has a value somewhere (per
  // the TL's note: empty columns stay hidden).
  const uploadedParameterColumns = uploadedData
    ? uploadedData.columns
        .map((heading, index) => ({ heading, index }))
        .filter(
          ({ index }) =>
            index >= uploadedData.keyColumns &&
            uploadedData.rows.some((row) => String(row[index] ?? "").trim()),
        )
    : [];

  // Height the list is capped at so exactly VISIBLE_PARAMS rows are visible.
  // Measured from the real rows, so wrapped labels don't break it.
  const listRef = useRef(null);
  const [listMaxHeight, setListMaxHeight] = useState(null);

  useLayoutEffect(() => {
    const list = listRef.current;

    if (!list) return undefined;

    const measure = () => {
      const items = list.children;

      if (items.length <= VISIBLE_PARAMS) {
        setListMaxHeight(null);
        return;
      }

      const last = items[VISIBLE_PARAMS - 1];
      setListMaxHeight(last.offsetTop + last.offsetHeight + 2);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(list);

    return () => observer.disconnect();
  }, [parameters]);

  const activeIndex = Math.max(
    0,
    levelOptions.findIndex((o) => o.value === uiLevel),
  );

  const handleLevelChange = (value) => {
    setUiLevel(value); // urgent: toggle paints immediately

    // non-urgent: the heavy map re-render in the parent no longer blocks the toggle
    startTransition(() => {
      onLevelChange?.(value);
    });
  };

  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-navy bg-white p-3 shadow-card sm:p-4 lg:h-full">
      <div className="relative mb-3 h-12 shrink-0 overflow-hidden rounded-full border border-line bg-white">
        <div
          className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-navy shadow-[0_6px_14px_rgba(2,2,68,.35),inset_0_1px_0_rgba(255,255,255,.25)] transition-transform duration-300 ease-[cubic-bezier(.68,-0.55,.265,1.55)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />

        <div className="relative flex h-full">
          {levelOptions.map((opt) => {
            const isActive = uiLevel === opt.value;
            return (
              <label
                key={opt.value}
                className="group relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 text-[12px] font-bold"
              >
                <input
                  type="radio"
                  name="dashboard-level"
                  value={opt.value}
                  checked={isActive}
                  onChange={() => handleLevelChange(opt.value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-1.5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105 group-active:translate-y-0 group-active:scale-95 motion-reduce:transform-none motion-reduce:transition-none">
                  <i
                    className={`ti ${opt.icon} text-[15px] transition-colors duration-150 ${
                      isActive ? "text-white" : "text-navy"
                    }`}
                  />
                  <span
                    className={`transition-colors duration-150 ${isActive ? "text-white" : "text-navy"}`}
                  >
                    {opt.value}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-col lg:flex-1">
        <h3 className="mb-1 flex shrink-0 items-center gap-1.5 text-[13px] font-extrabold text-navy">
          <i className="ti ti-adjustments-horizontal text-blue" />
          Parameters
        </h3>

        <div
          ref={listRef}
          style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}
          className="relative min-h-0 overflow-y-auto overscroll-contain px-1 py-1 [scrollbar-color:#C7CEDA_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C7CEDA] [&::-webkit-scrollbar-thumb:hover]:bg-[#9AA6B8] [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {parameters.map((p, index) => {
            const isSelected = activeParam === p.key;
            // Parameters come in groups (Total / Rural / Urban): show the
            // group name once, above its first row.
            const showGroup =
              p.group && p.group !== parameters[index - 1]?.group;

            return (
              <Fragment key={p.key}>
                {showGroup && (
                  <div className="sticky top-0 z-10 -mx-1 mb-1 bg-white px-3 pb-0.5 pt-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-blue">
                    {p.group}
                  </div>
                )}
                <label
                  className={`group mb-1.5 flex cursor-pointer items-center rounded-full py-2 pl-2 pr-3 text-[13px] font-medium text-navy transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(2,2,68,.12)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${
                    isSelected
                      ? "-translate-y-px bg-[#DEDEF0] shadow-[0_6px_16px_rgba(2,2,68,.16),inset_0_1px_0_rgba(255,255,255,.7)]"
                      : "bg-transparent hover:bg-[#EEEEF8]"
                  }`}
                >
                  <input
                    type="radio"
                    name="dashboard-parameter"
                    value={p.key}
                    checked={isSelected}
                    onChange={() => {
                      // Only one field can be active at a time across both
                      // lists: picking a Parameter clears the Customer Input pick.
                      setSelectedUpload(null);
                      onParamChange(p.key);
                    }}
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

                  <span
                    className="min-w-0 flex-1 whitespace-nowrap text-[12px]"
                    title={p.shortLabel || p.label}
                  >
                    {p.shortLabel || p.label}
                  </span>
                </label>
              </Fragment>
            );
          })}
        </div>

        <div className="mt-0 flex min-h-0 flex-col border-t border-line pt-1 lg:flex-1">
          <h3 className="mb-0 flex shrink-0 items-center gap-0 text-[13px] font-extrabold text-navy">
            <i className="ti ti-adjustments-horizontal text-blue" />
            Customer Input
          </h3>

          {/* Uploaded sheet: shown as selectable parameters, not a raw table.
              Only the data columns (not the location column) appear, and
              only when that column actually has data filled in. */}
          {uploadedData ? (
            uploadedParameterColumns.length > 0 ? (
              <div className="mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pr-1 [scrollbar-color:#C7CEDA_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C7CEDA] [&::-webkit-scrollbar-thumb:hover]:bg-[#9AA6B8] [&::-webkit-scrollbar-track]:bg-transparent">
                {uploadedParameterColumns.map(({ heading, index }) => {
                  const isSelected =
                    selectedUpload?.level === uiLevel &&
                    selectedUpload.index === index;

                  return (
                    <label
                      key={index}
                      className={`group mb-1.5 flex cursor-pointer items-center rounded-full py-2 pl-2 pr-3 text-[13px] font-medium text-navy transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(2,2,68,.12)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${
                        isSelected
                          ? "-translate-y-px bg-[#DEDEF0] shadow-[0_6px_16px_rgba(2,2,68,.16),inset_0_1px_0_rgba(255,255,255,.7)]"
                          : "bg-transparent hover:bg-[#EEEEF8]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="dashboard-parameter"
                        value={`upload-${index}`}
                        checked={isSelected}
                        onChange={() => {
                          // Picking a Customer Input dataset clears the
                          // Parameters pick (single selection overall).
                          onParamChange(null);
                          setSelectedUpload({ level: uiLevel, index });
                        }}
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

                      <span className="min-w-0 break-words" title={heading}>
                        {heading}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-[11px] leading-snug text-muted">
                The uploaded sheet has no data in its other columns.
              </p>
            )
          ) : (
            <p className="mt-3 text-[11px] leading-snug text-muted">
              Use <b>Upload</b> in the header to add an Excel sheet
            </p>
          )}

          {/* Count for the level currently shown (State / UT or District) */}
          <div className="shrink-0 border-t border-line pb-1 pt-1">
            <CountCard
              value={levelCount}
              label={uiLevel === "District" ? "Districts" : "States / UTs"}
              icon={uiLevel === "District" ? "ti-map-pin" : "ti-map"}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

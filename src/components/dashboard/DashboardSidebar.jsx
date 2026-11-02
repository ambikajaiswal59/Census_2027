import {
  Fragment,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  startTransition,
} from "react";
import { useUpload } from "../../context/UploadContext.jsx";
import CountCard from "./CountCard.jsx";
import MapPinBaseIcon from "../MapPinBaseIcon.jsx";

// Parameters shown before the list starts scrolling.
const VISIBLE_PARAMS = 5;

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

  const {
    uploadsByLevel,
    selectedUpload,
    setSelectedUpload,
    openModal,
    clearUploadedData,
  } = useUpload();

  // UI state: updates instantly on click, independent of map loading
  const [uiLevel, setUiLevel] = useState(level);

  // Card count: has its own loading, separate from the table / map data.

  // Keep in sync if the parent changes level from elsewhere
  useEffect(() => {
    setUiLevel(level);
  }, [level]);

  // Parameters come in groups (Total / Rural / Urban), shown as three tabs: only
  // the parameters of the chosen tab are listed.
  const groups = [...new Set(parameters.map((p) => p.group).filter(Boolean))];
  const [pickedGroup, setPickedGroup] = useState(null);
  const activeGroup = groups.includes(pickedGroup) ? pickedGroup : groups[0];

  // Switching tab keeps the same parameter selected: "Total Households" in Total
  // becomes "Rural - Total Households" in Rural (matched by its short label).
  function switchGroup(group) {
    setPickedGroup(group);

    const current = parameters.find((p) => p.key === activeParam);
    if (!current || current.group === group) return;

    const match = parameters.find(
      (p) => p.group === group && p.shortLabel === current.shortLabel,
    );
    if (match) onParamChange(match.key);
  }
  const visibleParameters = groups.length
    ? parameters.filter((p) => p.group === activeGroup)
    : parameters;

  // When the selected parameter changes elsewhere (e.g. the map reset button),
  // open the tab it belongs to.
  useEffect(() => {
    const group = parameters.find((p) => p.key === activeParam)?.group;
    if (group) setPickedGroup(group);
  }, [activeParam, parameters]);

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

  // When a Customer Input dataset is picked, the card counts only the
  // states / districts that have a value in that dataset column.
  const uploadedCount =
    uploadedData &&
    selectedUpload?.level === uiLevel &&
    selectedUpload.index >= uploadedData.keyColumns
      ? new Set(
          uploadedData.rows
            .filter((row) => String(row[selectedUpload.index] ?? "").trim())
            .map((row) =>
              row
                .slice(0, uploadedData.keyColumns)
                .map((cell) =>
                  String(cell ?? "")
                    .trim()
                    .toLowerCase(),
                )
                .join("|"),
            )
            .filter((key) => key.replaceAll("|", "")),
        ).size
      : null;

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
  }, [visibleParameters.length, activeGroup]);

  // A new tab scrolls to the selected parameter (or starts at the top if none).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    const frame = requestAnimationFrame(() => {
      const input = list.querySelector(`input[value="${activeParam}"]`);
      const row = input?.closest("label");
      list.scrollTop = row ? Math.max(0, row.offsetTop - 4) : 0;
    });

    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup]);

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
    <aside className="flex min-h-0 flex-col rounded-2xl border border-line bg-white p-3 shadow-card sm:p-4 lg:h-full">
      <div className="relative mb-2 h-10 shrink-0 overflow-hidden rounded-full border border-line bg-white">
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

      <div className="flex flex-col">
        <h3 className="mb-1 mt-2 flex shrink-0 items-center gap-1 text-[13px] font-extrabold text-navy">
          <i className="ti ti-adjustments-horizontal text-blue" />
          Demographic: Key Parameters
        </h3>

        {groups.length > 1 && (
          <div
            role="tablist"
            aria-label="Parameter group"
            className="mb-4 mt-2 grid shrink-0 grid-cols-3 gap-0 overflow-hidden rounded-full border border-line bg-soft p-0"
          >
            {groups.map((group) => {
              const isActive = group === activeGroup;

              return (
                <button
                  key={group}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => switchGroup(group)}
                  className={`rounded-full px-2 py-1 text-[11px] font-bold transition-colors duration-150 ${
                    isActive
                      ? "bg-[#8fc4e7a2] text-navy"
                      : "text-navy hover:bg-white"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        )}

        <div
          ref={listRef}
          style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}
          className="relative shrink-0 overflow-y-auto overscroll-contain px-1 py-1 [scrollbar-color:#C7CEDA_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C7CEDA] [&::-webkit-scrollbar-thumb:hover]:bg-[#9AA6B8] [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {visibleParameters.map((p) => {
            const isSelected = activeParam === p.key;

            return (
              <Fragment key={p.key}>
                <label
                  className={`group mb-1 flex cursor-pointer items-center rounded-full py-1.5 pl-2 pr-3 text-[13px] font-medium text-navy transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(2,2,68,.12)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${
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

        <div className="mt-0 flex flex-col border-t border-line pt-1">
          <h3 className="mb-0 mt-3 flex shrink-0 items-center gap-1.5 text-[13px] font-extrabold text-navy">
            <MapPinBaseIcon size="1.15em" className="shrink-0 text-blue mt-0" />
            Custom Map Builder
          </h3>

          {/* Sub-heading: always shown, before and after a file is uploaded */}
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Upload your own dataset and visualize it geographically
          </p>

          {/* Uploaded sheet: shown as selectable parameters, not a raw table.
              Only the data columns (not the location column) appear, and
              only when that column actually has data filled in. */}
          {uploadedData ? (
            uploadedParameterColumns.length > 0 ? (
              <div className="mt-1 flex max-h-[150px] shrink-0 flex-col overflow-y-auto overscroll-contain pr-1 [scrollbar-color:#C7CEDA_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C7CEDA] [&::-webkit-scrollbar-thumb:hover]:bg-[#9AA6B8] [&::-webkit-scrollbar-track]:bg-transparent">
                {uploadedParameterColumns.map(({ heading, index }) => {
                  const isSelected =
                    selectedUpload?.level === uiLevel &&
                    selectedUpload.index === index;

                  return (
                    <label
                      key={index}
                      className={`group mb-1 flex cursor-pointer items-center rounded-full py-1.5 pl-2 pr-3 text-[13px] font-medium text-navy transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(2,2,68,.12)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${
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
              <p className="mt-1.5 text-[11px] leading-snug text-muted">
                The uploaded sheet has no data in its other columns.
              </p>
            )
          ) : null}

          {/* Upload button: opens the same upload dialog the header used to open */}
          <button
            type="button"
            onClick={openModal}
            disabled={Boolean(uploadedData)}
            aria-label="Upload Excel sheet"
            title={
              uploadedData
                ? `A file is already uploaded for ${uiLevel}`
                : undefined
            }
            className="mt-3 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-[9px] border border-navy/30 bg-white px-3 py-1.5 text-[12px] font-semibold text-navy transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EEEEF8] hover:shadow-[0_6px_14px_rgba(2,2,68,.12)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-line disabled:bg-[#F1F3F7] disabled:text-[#9AA6B8] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-[#F1F3F7] disabled:active:scale-100 motion-reduce:transform-none sm:text-[13px]"
          >
            <i className="ti ti-upload" />
            Upload Excel
          </button>

          {/* Uploaded file: its name and a Remove button, which also re-enables Upload */}
          {uploadedData && (
            <div className="mt-1.5 flex shrink-0 items-center justify-between gap-2 rounded-[9px] bg-[#F4F7FB] px-2.5 py-1.5 text-[11px] sm:text-[12px]">
              <span
                className="flex min-w-0 items-center gap-1.5 text-navy"
                title={uploadedData.fileName}
              >
                <i className="ti ti-file-spreadsheet shrink-0 text-blue" />
                <span className="truncate">{uploadedData.fileName}</span>
              </span>

              <button
                type="button"
                onClick={() => clearUploadedData(uiLevel)}
                aria-label={`Remove uploaded file ${uploadedData.fileName}`}
                className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-[#B42318] transition-colors duration-150 hover:bg-[#FDECEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]/40"
              >
                <i className="ti ti-trash" />
                Remove
              </button>
            </div>
          )}

          {/* Count card: hidden until a Customer Input dataset is picked, then it
              shows how many States / UTs (or Districts) have data in that column */}
          {uploadedCount !== null && (
            <div className="shrink-0 [&>div]:!mt-1 [&>div]:!aspect-auto [&>div]:!h-[88px] [&>div]:!w-[120px]">
              <CountCard
                value={uploadedCount}
                label={uiLevel === "District" ? "Districts" : "States / UTs"}
                icon={uiLevel === "District" ? "ti-map-pin" : "ti-map"}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

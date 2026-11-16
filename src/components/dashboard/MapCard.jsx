import { useRef, useState, useEffect, useMemo } from "react";
import OlMap from "./OlMap.jsx";
import {
  getRangeForValue,
  formatIN,
  COLOR_RAMPS,
  getParentKey,
  getParameters,
} from "../../data/dashboardConfig.js";

const STATE_GEOJSON_URL = "/data/census/states.geojson";
const DISTRICT_GEOJSON_URL = "/data/census/districts.geojson";

function normalizeName(name = "") {
  return String(name)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeStateName(name = "") {
  const normalized = normalizeName(name);

  const aliases = {
    nctofdelhi: "delhi",
    nationalcapitalterritoryofdelhi: "delhi",
    orissa: "odisha",
    pondicherry: "puducherry",
    uttaranchal: "uttarakhand",
    jammukashmir: "jammuandkashmir",
    andamanandnicobar: "andamanandnicobarislands",
    dadraandnagarhaveli: "dadranagarhaveli",
    damananddiu: "damananddiu",
  };

  return aliases[normalized] || normalized;
}

// Picks the selected area's outline colour from the chosen ramp: the ramp's
// light colour on dark shades and its dark colour on light shades, so the
// boundary always stands out and each ramp has its own.
function getOutlineColors(fillHex, ramp) {
  const onDark = ramp?.outline?.onDark || "#FFD84D";
  const onLight = ramp?.outline?.onLight || "#020244";
  // The film uses the ramp's own colours, so it reads as part of the ramp
  const lightShade = ramp?.colors?.[0] || "#FFFFFF";
  const darkShade = ramp?.colors?.[ramp.colors.length - 1] || "#020244";

  const hex = String(fillHex || "").replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;

  if (full.length !== 6)
    return {
      stroke: onLight,
      glow: "rgba(255,255,255,.9)",
      film: darkShade,
      filmOpacity: 0.16,
    };

  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.3
    ? {
        stroke: onLight,
        glow: "rgba(255,255,255,.9)",
        film: darkShade,
        filmOpacity: 0.16,
      } // light fill: thin film in the ramp's darkest shade
    : {
        stroke: onDark,
        glow: "rgba(2,2,68,.9)",
        film: lightShade,
        filmOpacity: 0.22,
      }; // dark fill: thin film in the ramp's lightest shade
}

// Whole numbers in the Indian format; uploaded decimals keep up to 2 places.
function formatValue(value) {
  return Number.isInteger(value)
    ? formatIN(value)
    : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function getGeoName(geo, level) {
  const p = geo?.properties || {};

  if (level === "District") {
    return (
      p.district ||
      p.District ||
      p.DISTRICT ||
      p.district_name ||
      p.DISTRICT_NAME ||
      p.dtname ||
      p.DTNAME ||
      p.NAME_2 ||
      p.name_2 ||
      p.shapeName_2 ||
      p.shapeName ||
      p.name ||
      p.NAME ||
      ""
    );
  }

  return (
    p.st_nm ||
    p.ST_NM ||
    p.STATE_NAME ||
    p.state_name ||
    p.State_Name ||
    p.STATE ||
    p.State ||
    p.NAME_1 ||
    p.name_1 ||
    p.shapeName ||
    p.name ||
    p.NAME ||
    ""
  );
}

function getGeoStateName(geo) {
  const p = geo?.properties || {};

  return (
    p.st_nm ||
    p.ST_NM ||
    p.state_name ||
    p.STATE_NAME ||
    p.State_Name ||
    p.STATE ||
    p.State ||
    p.NAME_1 ||
    p.name_1 ||
    p.state ||
    ""
  );
}

function makeDistrictKey(state, district) {
  return `${normalizeStateName(state)}-${normalizeName(district)}`;
}

function isValidNumber(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

// Spinner shown over the map while its shapes are loading.
function MapLoader({ text = "Loading map…", solid = false }) {
  return (
    <div
      className={`absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 ${
        solid ? "bg-[#F4F7FB]" : "bg-white/60 backdrop-blur-[1px]"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#CFE4FA] border-t-navy" />
      <span className="text-[12px] font-bold text-navy">{text}</span>
    </div>
  );
}

export default function MapCard({
  activeParamKey,
  activeParamLabel,
  stateData = [],
  districtData = [],
  ranges = [],
  rampId,
  visibleRangeIds = [],
  level = "State / UT",
  onLevelChange,
  selectedRow = null, // row clicked in the table; the map zooms to it
  onReset, // called by the refresh button, to go back to the default parameter
  onSelect, // called with the area clicked on the map, so the table can follow
}) {
  const containerRef = useRef(null);
  const controlsRef = useRef(null); // zoom / reset functions of the OpenLayers map

  const [tooltip, setTooltip] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(false); // names of all states / districts
  const [labelBusy, setLabelBusy] = useState(false); // spinner while names are drawn
  const [flatLoading, setFlatLoading] = useState(true); // flat map: new shapes are on their way
  const [tabBusy, setTabBusy] = useState(false); // spinner while a Total / Rural / Urban tab switch is applied
  // Area to zoom to and outline: set by a table-row click (selectedRow) or by
  // clicking a state / district directly on the map.
  const [focusRow, setFocusRow] = useState(selectedRow);

  useEffect(() => {
    setFocusRow(selectedRow);
  }, [selectedRow]);

  const isDistrict = level === "District";
  const geographyUrl = isDistrict ? DISTRICT_GEOJSON_URL : STATE_GEOJSON_URL;

  // Names on / off: show the spinner first, then switch, so it can be seen before
  // the (heavy) names are drawn; hide it once they are on screen.
  function toggleLabels() {
    setLabelBusy(true);
    requestAnimationFrame(() => setTimeout(() => setShowLabels((v) => !v), 30));
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setLabelBusy(false));
    return () => cancelAnimationFrame(id);
  }, [showLabels]);

  // The sidebar announces a State / UT <-> District switch the moment it is clicked,
  // before the (slow) new map is ready, so the old map is covered at once.
  useEffect(() => {
    const onSwitching = () => setFlatLoading(true);
    window.addEventListener("map-level-switching", onSwitching);
    return () => window.removeEventListener("map-level-switching", onSwitching);
  }, []);

  // The sidebar announces a Total / Rural / Urban tab switch: brief spinner while
  // the map is recoloured for the new parameter.
  useEffect(() => {
    let timer;
    const onTab = () => {
      setTabBusy(true);
      clearTimeout(timer);
      timer = setTimeout(() => setTabBusy(false), 900);
    };
    window.addEventListener("map-param-switching", onTab);
    return () => {
      window.removeEventListener("map-param-switching", onTab);
      clearTimeout(timer);
    };
  }, []);

  // Switching State / UT <-> District loads a new boundary file: show the spinner.
  useEffect(() => {
    setFlatLoading(true);
  }, [geographyUrl]);

  const currentData = isDistrict ? districtData : stateData;

  useEffect(() => {
    setTooltip(null);
    setFocusRow(null);
  }, [level]);

  useEffect(() => {
    if (!isFullscreen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const { byName, byDistrictKey, districtNameCounts } = useMemo(() => {
    const nameLookup = {};
    const districtLookup = {};
    const districtCounts = {};

    currentData.forEach((row) => {
      if (!row) return;

      if (isDistrict) {
        const districtName = normalizeName(row.district);

        if (!districtName) return;

        districtCounts[districtName] = (districtCounts[districtName] || 0) + 1;

        if (row.state) {
          districtLookup[makeDistrictKey(row.state, row.district)] = row;
        }

        nameLookup[districtName] = row;
      } else {
        const stateName = normalizeStateName(row.state);

        if (stateName) {
          nameLookup[stateName] = row;
        }
      }
    });

    return {
      byName: nameLookup,
      byDistrictKey: districtLookup,
      districtNameCounts: districtCounts,
    };
  }, [currentData, isDistrict]);

  // Figures for the top-right card: the picked area, or the whole country when
  // nothing is picked. The percentage is the share of the parent parameter.
  const summary = useMemo(() => {
    let row = null;

    if (focusRow) {
      row = isDistrict
        ? byDistrictKey[makeDistrictKey(focusRow.state, focusRow.district)] ||
          byName[normalizeName(focusRow.district)] ||
          null
        : byName[normalizeStateName(focusRow.state)] || null;
    }

    const pick = (key) => {
      if (!key) return null;

      if (row) {
        const v = row[key];
        return isValidNumber(v) ? Number(v) : null;
      }

      let total = 0;
      let found = false;
      currentData.forEach((r) => {
        const v = r?.[key];
        if (isValidNumber(v)) {
          total += Number(v);
          found = true;
        }
      });
      return found ? total : null;
    };

    const parentKey = getParentKey(activeParamKey);
    const value = pick(activeParamKey);
    const parentValue = pick(parentKey);
    const parentLabel =
      getParameters().find((p) => p.key === parentKey)?.label || "";

    return {
      areaName: focusRow
        ? (isDistrict ? focusRow.district : focusRow.state) || ""
        : isDistrict
          ? "All districts"
          : "All States / UTs",
      value,
      percent:
        value !== null && parentValue ? (value / parentValue) * 100 : null,
      parentLabel,
    };
  }, [
    focusRow,
    currentData,
    byName,
    byDistrictKey,
    isDistrict,
    activeParamKey,
  ]);

  function getRow(geo, name) {
    if (isDistrict) {
      const geoState = getGeoStateName(geo);

      if (geoState) {
        const key = makeDistrictKey(geoState, name);
        const matchedDistrict = byDistrictKey[key];

        if (matchedDistrict) return matchedDistrict;
      }

      const districtKey = normalizeName(name);

      if (districtNameCounts[districtKey] === 1) {
        return byName[districtKey] || null;
      }

      return null;
    }

    return byName[normalizeStateName(name)] || null;
  }

  // True when the shape is the one picked (table row or map click).
  function isSelectedGeo(geo, name, row) {
    if (!focusRow) return false;

    if (isDistrict) {
      const target = makeDistrictKey(focusRow.state, focusRow.district);
      return (
        (row && makeDistrictKey(row.state, row.district) === target) ||
        makeDistrictKey(getGeoStateName(geo), name) === target
      );
    }

    const target = normalizeStateName(focusRow.state);
    return (
      (row && normalizeStateName(row.state) === target) ||
      normalizeStateName(name) === target
    );
  }

  // A click on the map picks that shape: it gets outlined and zoomed to.
  function handleGeoClick(geo, name) {
    // Use the census row when there is one, so the table recognises the same area.
    const row = getRow(geo, name);
    const picked = isDistrict
      ? {
          ...row,
          state: row?.state ?? getGeoStateName(geo),
          district: row?.district ?? name,
        }
      : { ...row, state: row?.state ?? name };

    // With onSelect the page owns the selection (map and table stay linked) and
    // hands it back through selectedRow; otherwise the map keeps it itself.
    if (onSelect) onSelect(picked);
    else setFocusRow(picked);
  }

  // The map zoomed to the picked area (table row or map click): open the same tooltip
  // you would get by hovering over it.
  function handleMapFocus(geo, name, x, y) {
    setTooltip({
      name,
      state: isDistrict ? getGeoStateName(geo) : "",
      value: getRow(geo, name)?.[activeParamKey] ?? null,
      x,
      y,
    });
  }

  function colorFor(value) {
    if (!isValidNumber(value)) return "#E7EBF0";

    const range = getRangeForValue(Number(value), ranges);

    return range ? range.color : "#E7EBF0";
  }

  function updateTooltip(event, geo, name) {
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) return;

    const row = getRow(geo, name);

    setTooltip({
      name,
      state: isDistrict ? getGeoStateName(geo) : "",
      value: row?.[activeParamKey] ?? null,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  function resetMap() {
    setTooltip(null);
    setFocusRow(null);
    controlsRef.current?.reset?.();
    onReset?.();
  }

  function toggleFullscreen() {
    setTooltip(null);
    setIsFullscreen((previous) => !previous);
  }

  function zoomIn() {
    controlsRef.current?.zoomIn?.();
  }

  function zoomOut() {
    controlsRef.current?.zoomOut?.();
  }

  return (
    <div
      className={`box-border flex min-h-0 min-w-0 flex-col ${
        isFullscreen
          ? "fixed inset-0 z-[100] h-[100dvh] w-screen rounded-none bg-white p-3 sm:p-4"
          : "h-full w-full"
      }`}
    >
      {/* Header */}
      {/* <div className="mb-3 flex shrink-0 min-w-0 items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[13px] font-extrabold text-navy sm:gap-2 sm:text-[15px]">
          <i className="ti ti-map-2 shrink-0 text-blue" />
          <span className="truncate">
            {level}-wise {activeParamLabel} Map
          </span>
        </h3>

        <select
          aria-label="Select map level"
          value={level}
          onChange={(event) => onLevelChange?.(event.target.value)}
          className="h-9 shrink-0 rounded-[9px] border border-line bg-white px-2 text-[12px] font-semibold text-navy focus:border-blue focus:outline-none sm:px-3 sm:text-[13px]"
        >
          <option value="State / UT">State / UT</option>
          <option value="District">District</option>
        </select>
      </div> */}

      {/* Map fills the remaining height of the card */}
      <div
        ref={containerRef}
        className="map-no-focus relative box-border min-h-[320px] min-w-0 w-full flex-1 cursor-grab overflow-hidden rounded-2xl border border-[#DDE4EE] bg-gradient-to-b from-[#F8FAFD] to-[#E9EFF8] shadow-[inset_0_1px_0_#fff,0_5px_0_#D3DAE6,0_16px_26px_-8px_rgba(2,2,68,.25)] active:cursor-grabbing"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* No browser focus box around a clicked state; its boundary is drawn instead */}
        <style>{`.map-no-focus svg *:focus, .map-no-focus svg *:focus-visible, .map-no-focus svg:focus { outline: none !important; } @keyframes mapFilmIn { from { opacity: 0; } to { opacity: 1; } } .map-film { animation: mapFilmIn .35s ease-out; }`}</style>

        {/* Spinner while a new boundary file is loading (State / UT <-> District) */}
        {flatLoading ? (
          <MapLoader solid text="Loading map…" />
        ) : (
          (tabBusy && <MapLoader text="Updating map…" />) ||
          (labelBusy && <MapLoader text="Updating names…" />)
        )}

        <OlMap
          level={level}
          geographyUrl={geographyUrl}
          activeParamKey={activeParamKey}
          ranges={ranges}
          rampId={rampId}
          currentData={currentData}
          showLabels={showLabels}
          selectedRow={focusRow}
          getGeoName={getGeoName}
          getRow={getRow}
          isSelectedGeo={isSelectedGeo}
          colorFor={colorFor}
          getOutlineColors={getOutlineColors}
          colorRamps={COLOR_RAMPS}
          onGeoClick={handleGeoClick}
          onHover={updateTooltip}
          onLeave={() => setTooltip(null)}
          onFocus={handleMapFocus}
          onControlsReady={(controls) => {
            controlsRef.current = controls;
          }}
          onLoaded={() => setFlatLoading(false)}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 min-w-[140px] max-w-[220px] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-xl border border-line bg-white p-2.5 text-[12px] shadow-[0_0_16px_4px_rgba(255,255,255,.30)]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
            }}
          >
            <div className="break-words font-bold text-navy">
              {tooltip.name || "Unknown area"}
            </div>

            {isDistrict && tooltip.state && (
              <div className="break-words text-muted">{tooltip.state}</div>
            )}

            <div className="text-muted">{activeParamLabel}</div>

            <div className="font-bold text-blue">
              {isValidNumber(tooltip.value)
                ? formatValue(Number(tooltip.value))
                : "Data unavailable"}
            </div>
          </div>
        )}

        {/* Selected parameter card: figure, and its share of the parent parameter */}
        {(() => {
          const accent =
            COLOR_RAMPS.find((r) => r.id === rampId)?.colors?.[3] || "#153E90";

          return (
            <div className="pointer-events-none absolute bottom-2 right-2 z-10 w-[168px] max-w-[52%] rounded-xl border border-line bg-gradient-to-b from-white to-[#F1F5FA] p-2 text-[11px] shadow-[0_3px_0_#C9D1DD,0_12px_20px_-4px_rgba(2,2,68,.25),inset_0_1px_0_#fff] backdrop-blur-sm sm:bottom-3 sm:right-3 sm:w-[210px] sm:p-3 sm:text-[12px]">
              <div className="flex items-center gap-1.5 font-bold text-navy">
                <span className="truncate">{summary.areaName}</span>
              </div>

              <div className="mt-1 break-words leading-snug text-muted">
                {activeParamLabel}
              </div>

              <div className="mt-0.5 text-[16px] font-extrabold leading-tight text-navy sm:text-[20px]">
                {summary.value !== null
                  ? formatValue(summary.value)
                  : "Data unavailable"}
              </div>

              {/* Only parameters that are part of another one show a percentage */}
              {summary.percent !== null && (
                <div className="mt-1.5">
                  <div className="flex items-baseline justify-between gap-2 font-semibold text-navy">
                    <span>{summary.percent.toFixed(1)}%</span>
                    <span className="truncate text-[10px] font-normal text-muted sm:text-[11px]">
                      of {summary.parentLabel}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E7EBF0]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, summary.percent))}%`,
                        background: accent,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Map controls: one column, bottom left */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col items-center gap-1">
          {/* Map type and names: same raised style as the buttons below */}
          <div className="mb-1 flex flex-col items-center gap-1.5">
            <button
              type="button"
              role="switch"
              aria-checked={showLabels}
              aria-label="Labels"
              onClick={toggleLabels}
              title={showLabels ? "Hide names" : "Show names"}
              className={`flex h-6 w-6 select-none items-center justify-center rounded-lg border p-0 text-[8px] font-bold leading-[8px] text-navy transition-all duration-150 ease-out active:translate-y-[2px] motion-reduce:transition-none ${showLabels ? "translate-y-[2px] border-[#A9CBEF] bg-gradient-to-b from-[#CFE4FA] to-[#B5D3F2] shadow-[0_1px_0_#A9CBEF,inset_0_2px_5px_rgba(2,2,68,.20)]" : "border-line bg-gradient-to-b from-white to-[#EEF2F8] shadow-[0_2px_0_#C9D1DD,0_5px_8px_rgba(2,2,68,.14),inset_0_1px_0_#fff] hover:-translate-y-px"}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                {/* "abc" text icon */}
                <text
                  x="12"
                  y="16.5"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="Inter, system-ui, sans-serif"
                  fill="currentColor"
                >
                  abc
                </text>
              </svg>
              <span className="sr-only">Label</span>
            </button>
          </div>

          {/* Zoom */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-gradient-to-b from-white to-[#EEF2F8] shadow-[0_2px_0_#C9D1DD,0_5px_8px_rgba(2,2,68,.14),inset_0_1px_0_#fff]">
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-6 w-6 items-center justify-center border-b border-line text-navy hover:bg-soft"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <i className="ti ti-plus text-[10px]" />
            </button>

            <button
              type="button"
              onClick={zoomOut}
              className="flex h-6 w-6 items-center justify-center text-navy hover:bg-soft"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <i className="ti ti-minus text-[10px]" />
            </button>
          </div>

          {/* Reset map view */}
          <button
            type="button"
            onClick={resetMap}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-gradient-to-b from-white to-[#EEF2F8] text-navy shadow-[0_2px_0_#C9D1DD,0_5px_8px_rgba(2,2,68,.14),inset_0_1px_0_#fff] transition-all duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-[0_0_0_#C9D1DD,inset_0_2px_3px_rgba(2,2,68,.18)]"
            aria-label="Reset map view"
            title="Reset map view"
          >
            <i className="ti ti-refresh text-[11px]" />
          </button>

          {/* Full screen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-gradient-to-b from-white to-[#EEF2F8] text-navy shadow-[0_2px_0_#C9D1DD,0_5px_8px_rgba(2,2,68,.14),inset_0_1px_0_#fff] transition-all duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-[0_0_0_#C9D1DD,inset_0_2px_3px_rgba(2,2,68,.18)]"
            aria-label={
              isFullscreen ? "Exit full screen" : "Enlarge map to full screen"
            }
            title={isFullscreen ? "Exit full screen (Esc)" : "Full screen"}
          >
            <i
              className={`ti ${
                isFullscreen ? "ti-arrows-minimize" : "ti-arrows-maximize"
              } text-[11px]`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

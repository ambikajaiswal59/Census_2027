import { useRef, useState, useEffect, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { getRangeForValue, formatIN } from "../../data/dashboardConfig.js";

const STATE_GEOJSON_URL = "/india-states-full.geojson";
const DISTRICT_GEOJSON_URL = "/india-districts-2019-734.json";

const DEFAULT_POSITION = {
  coordinates: [82, 22],
  zoom: 1,
};

const MAP_SCALE = 1000;
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 12;

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

/* ---------- Helpers to zoom the map onto one shape ---------- */

// Same projection react-simple-maps uses here: geoMercator, scale 1000,
// translated to the middle of the 1000 x 700 view box.
function projectMercator([lon, lat]) {
  const lambda = (lon * Math.PI) / 180;
  const phi = (Math.max(Math.min(lat, 85), -85) * Math.PI) / 180;

  return [
    MAP_WIDTH / 2 + MAP_SCALE * lambda,
    MAP_HEIGHT / 2 - MAP_SCALE * Math.log(Math.tan(Math.PI / 4 + phi / 2)),
  ];
}

function unprojectMercator([x, y]) {
  const lon = (((x - MAP_WIDTH / 2) / MAP_SCALE) * 180) / Math.PI;
  const lat =
    ((2 * Math.atan(Math.exp((MAP_HEIGHT / 2 - y) / MAP_SCALE)) - Math.PI / 2) *
      180) /
    Math.PI;

  return [lon, lat];
}

function getGeometryBounds(geometry) {
  if (!geometry?.coordinates) return null;

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  function walk(coords) {
    if (typeof coords[0] === "number") {
      const [lon, lat] = coords;

      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;

      return;
    }

    coords.forEach(walk);
  }

  walk(geometry.coordinates);

  if (!Number.isFinite(minLon)) return null;

  return { minLon, maxLon, minLat, maxLat };
}

function getFocusPosition(geometry) {
  const bounds = getGeometryBounds(geometry);

  if (!bounds) return null;

  const [x1, y1] = projectMercator([bounds.minLon, bounds.maxLat]);
  const [x2, y2] = projectMercator([bounds.maxLon, bounds.minLat]);

  const width = Math.max(x2 - x1, 1);
  const height = Math.max(y2 - y1, 1);

  // Leave some breathing room around the selected shape.
  const fitZoom = 0.8 * Math.min(MAP_WIDTH / width, MAP_HEIGHT / height);

  return {
    coordinates: unprojectMercator([(x1 + x2) / 2, (y1 + y2) / 2]),
    zoom: Math.min(Math.max(fitZoom, 1), MAX_ZOOM),
  };
}

// Pin location: centroid of the largest polygon, which sits inside most shapes.
function getPinPoint(geometry) {
  if (!geometry?.coordinates) return null;

  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];

  let best = null;
  let bestArea = 0;

  polygons.forEach((polygon) => {
    const ring = polygon[0];

    if (!ring || ring.length < 3) return;

    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < ring.length - 1; i += 1) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const cross = x0 * y1 - x1 * y0;

      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }

    area /= 2;

    if (Math.abs(area) > Math.abs(bestArea)) {
      bestArea = area;
      best = [cx / (6 * area), cy / (6 * area)];
    }
  });

  return best;
}

export default function MapCard({
  activeParamKey,
  activeParamLabel,
  stateData = [],
  districtData = [],
  ranges = [],
  visibleRangeIds = [],
  level = "State / UT",
  onLevelChange,
  selectedRow = null, // row clicked in the table; the map zooms to it
}) {
  const containerRef = useRef(null);
  const geographiesRef = useRef([]);

  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null); // pin on the selected area
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isDistrict = level === "District";
  const geographyUrl = isDistrict ? DISTRICT_GEOJSON_URL : STATE_GEOJSON_URL;

  const currentData = isDistrict ? districtData : stateData;

  useEffect(() => {
    setTooltip(null);
    setFocusPoint(null);
    setPosition(DEFAULT_POSITION);
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

  // True when a data row is the one that was clicked in the table.
  function isSelectedRow(row) {
    if (!row || !selectedRow) return false;

    if (isDistrict) {
      return (
        makeDistrictKey(row.state, row.district) ===
        makeDistrictKey(selectedRow.state, selectedRow.district)
      );
    }

    return (
      normalizeStateName(row.state) === normalizeStateName(selectedRow.state)
    );
  }

  // Zoom to the shape whenever a table row is clicked.
  useEffect(() => {
    if (!selectedRow) {
      setFocusPoint(null);
      return;
    }

    const match = geographiesRef.current.find((geo) => {
      const name = getGeoName(geo, isDistrict ? "District" : "State / UT");
      return isSelectedRow(getRow(geo, name));
    });

    if (!match) return;

    const focus = getFocusPosition(match.geometry);

    if (focus) {
      const pinCoordinates = getPinPoint(match.geometry) || focus.coordinates;
      const geoName = getGeoName(match, isDistrict ? "District" : "State / UT");
      const matchedRow = getRow(match, geoName);

      setPosition(focus);
      setFocusPoint({
        id: Date.now(), // remounts the pin so its animation replays on every click
        coordinates: pinCoordinates,
        name: geoName,
      });

      // Open the same tooltip you would get by hovering over the area.
      const rect = containerRef.current?.getBoundingClientRect();

      if (rect) {
        const scale = Math.min(
          rect.width / MAP_WIDTH,
          rect.height / MAP_HEIGHT,
        );
        const [px, py] = projectMercator(pinCoordinates);
        const [cx, cy] = projectMercator(focus.coordinates);

        const viewX = MAP_WIDTH / 2 + focus.zoom * (px - cx);
        const viewY = MAP_HEIGHT / 2 + focus.zoom * (py - cy);

        setTooltip({
          name: geoName,
          state: isDistrict ? getGeoStateName(match) : "",
          value: matchedRow?.[activeParamKey] ?? null,
          x: (rect.width - MAP_WIDTH * scale) / 2 + viewX * scale,
          // sit above the pin head (the pin is about 30px tall)
          y: (rect.height - MAP_HEIGHT * scale) / 2 + viewY * scale - 32,
        });
      } else {
        setTooltip(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow]);

  function colorFor(value) {
    if (!isValidNumber(value)) return "#E7EBF0";

    const range = getRangeForValue(Number(value));

    if (!range || !visibleRangeIds.includes(range.id)) {
      return "#E7EBF0";
    }

    return range.color;
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

  function handleMoveEnd(newPosition) {
    setPosition(newPosition);
  }

  function resetMap() {
    setTooltip(null);
    setFocusPoint(null);
    setPosition(DEFAULT_POSITION);
  }

  function toggleFullscreen() {
    setTooltip(null);
    setIsFullscreen((previous) => !previous);
  }

  function zoomIn() {
    setPosition((previous) => ({
      ...previous,
      zoom: Math.min(Number((previous.zoom * 1.25).toFixed(2)), MAX_ZOOM),
    }));
  }

  function zoomOut() {
    setPosition((previous) => ({
      ...previous,
      zoom: Math.max(Number((previous.zoom / 1.25).toFixed(2)), MIN_ZOOM),
    }));
  }

  return (
    <div
      className={`box-border flex min-h-0 min-w-0 flex-col border border-line bg-white p-3 shadow-card sm:p-4 ${
        isFullscreen
          ? "fixed inset-0 z-[100] h-[100dvh] w-screen rounded-none"
          : "h-full w-full rounded-2xl"
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
        className="relative box-border min-h-[320px] min-w-0 w-full flex-1 cursor-grab overflow-hidden rounded-xl border border-line bg-[#F4F7FB] active:cursor-grabbing"
        onMouseLeave={() => setTooltip(null)}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: MAP_SCALE }}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            maxWidth: "100%",
          }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            maxZoom={MAX_ZOOM}
            minZoom={MIN_ZOOM}
          >
            <Geographies geography={geographyUrl}>
              {({ geographies }) => {
                // Keep the loaded shapes so a table click can find and zoom to one.
                geographiesRef.current = geographies;

                const items = geographies.map((geo) => {
                  const name = getGeoName(
                    geo,
                    isDistrict ? "District" : "State / UT",
                  );
                  const row = getRow(geo, name);

                  return { geo, name, row, selected: isSelectedRow(row) };
                });

                // Draw the selected shape last so its outline is on top.
                items.sort((a, b) => Number(a.selected) - Number(b.selected));

                return items.map(({ geo, name, row, selected }) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={colorFor(row?.[activeParamKey])}
                    stroke={selected ? "#020244" : "#FFFFFF"}
                    strokeWidth={selected ? 2 : isDistrict ? 0.35 : 0.55}
                    vectorEffect={selected ? "non-scaling-stroke" : undefined}
                    onMouseEnter={(event) => updateTooltip(event, geo, name)}
                    onMouseMove={(event) => updateTooltip(event, geo, name)}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        filter: "brightness(0.9)",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                ));
              }}
            </Geographies>

            {/* Pin on the selected state / district (kept the same size at any zoom) */}
            {focusPoint && (
              <Marker key={focusPoint.id} coordinates={focusPoint.coordinates}>
                <g
                  transform={`scale(${1 / position.zoom})`}
                  pointerEvents="none"
                >
                  <circle cx="0" cy="0" r="4" fill="#E5484D" opacity="0.6">
                    <animate
                      attributeName="r"
                      from="4"
                      to="18"
                      dur="1.2s"
                      repeatCount="3"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.2s"
                      repeatCount="3"
                    />
                  </circle>

                  <path
                    d="M0 0 C -6 -9, -10 -13, -10 -19 a10 10 0 1 1 20 0 C 10 -13, 6 -9, 0 0 Z"
                    fill="#E5484D"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <circle cx="0" cy="-19" r="3.5" fill="#FFFFFF" />

                  {/* Mouse-pointer arrow that glides onto the spot */}
                  <g transform="translate(6 -2)">
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="60 40"
                      to="6 -2"
                      dur="0.7s"
                      fill="freeze"
                    />
                    <path
                      d="M0 0 L0 17 L4.5 13 L7.5 20 L10 19 L7 12 L13 12 Z"
                      fill="#FFFFFF"
                      stroke="#111111"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
              </Marker>
            )}
          </ZoomableGroup>
        </ComposableMap>

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
                ? formatIN(Number(tooltip.value))
                : "Data unavailable"}
            </div>
          </div>
        )}

        {/* Population legend — collapsible on mobile, always expanded from sm up */}
        <div className="pointer-events-auto absolute right-2 top-2 z-10 w-36 max-w-[calc(100%-16px)] rounded-xl border border-line bg-white/95 shadow-sm backdrop-blur-sm sm:right-3 sm:top-3 sm:w-52">
          <button
            type="button"
            onClick={() => setIsLegendOpen((open) => !open)}
            aria-expanded={isLegendOpen}
            className="flex w-full items-center justify-between gap-2 p-2 text-left sm:cursor-default sm:p-3"
          >
            <h4 className="text-[12px] font-extrabold text-navy">
              {activeParamLabel} Range
            </h4>

            <i
              className={`ti ti-chevron-down shrink-0 text-[13px] text-navy transition-transform duration-200 sm:hidden ${
                isLegendOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`${isLegendOpen ? "block" : "hidden"} px-2 pb-2 sm:block sm:px-3 sm:pb-3`}
          >
            <div className="flex flex-col gap-1.5">
              {ranges.map((range) => {
                const isVisible = visibleRangeIds.includes(range.id);

                return (
                  <div
                    key={range.id}
                    className="flex min-w-0 items-center gap-2 text-[11px] text-text"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: range.color,
                        opacity: isVisible ? 1 : 0.35,
                      }}
                    />

                    <span
                      className={`min-w-0 break-words ${
                        isVisible ? "" : "text-muted opacity-60"
                      }`}
                    >
                      {range.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 border-t border-line pt-2 text-[10px] text-muted">
              Grey areas indicate unavailable or hidden data.
            </div>
          </div>
        </div>

        {/* Map controls: one column, bottom left */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col items-center gap-1">
          {/* Zoom */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-white ">
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
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-white text-navy  hover:bg-soft"
            aria-label="Reset map view"
            title="Reset map view"
          >
            <i className="ti ti-refresh text-[11px]" />
          </button>

          {/* Full screen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-white text-navy  hover:bg-soft"
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

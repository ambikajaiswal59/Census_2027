import { useRef, useState, useEffect, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import {
  getRangeForValue,
  formatIN,
  COLOR_RAMPS,
  getParentKey,
  getParameters,
} from "../../data/dashboardConfig.js";

const STATE_GEOJSON_URL = "/data/census/states.geojson";
const DISTRICT_GEOJSON_URL = "/data/census/districts.geojson";

const DEFAULT_POSITION = {
  coordinates: [82, 22],
  zoom: 1,
};

const MAP_SCALE = 1000;
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 700;

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 12;

// Map borders: state lines are thicker and mid grey (State / UT map and on top of
// the District map), district lines
// thinner and light grey (widths in screen pixels).
const STATE_BORDER_COLOR = "#808080";
const STATE_BORDER_WIDTH = 1.5;
const DISTRICT_BORDER_COLOR = "#D3D3D3";
const DISTRICT_BORDER_WIDTH = 1;

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

// Label position for a shape: the centre of mass of its largest polygon.
function getLabelPoint(geometry) {
  if (!geometry) return null;
  const polys =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  let best = null;
  let bestArea = -1;
  polys.forEach((poly) => {
    const ring = poly[0] || [];
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring.length - 1; i += 1) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const f = x0 * y1 - x1 * y0;
      a += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }
    const area = Math.abs(a) / 2;
    if (area > bestArea && a !== 0) {
      bestArea = area;
      best = [cx / (3 * a), cy / (3 * a)];
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
  rampId,
  visibleRangeIds = [],
  level = "State / UT",
  onLevelChange,
  selectedRow = null, // row clicked in the table; the map zooms to it
  onReset, // called by the refresh button, to go back to the default parameter
  onSelect, // called with the area clicked on the map, so the table can follow
}) {
  const containerRef = useRef(null);
  const geographiesRef = useRef([]);

  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [focusPoint, setFocusPoint] = useState(null); // pin on the selected area
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(false); // names of all states / districts
  // Area to zoom to and outline: set by a table-row click (selectedRow) or by
  // clicking a state / district directly on the map.
  const [focusRow, setFocusRow] = useState(selectedRow);

  useEffect(() => {
    setFocusRow(selectedRow);
  }, [selectedRow]);

  const isDistrict = level === "District";
  const geographyUrl = isDistrict ? DISTRICT_GEOJSON_URL : STATE_GEOJSON_URL;

  const currentData = isDistrict ? districtData : stateData;

  useEffect(() => {
    setTooltip(null);
    setFocusPoint(null);
    setFocusRow(null);
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

  // Zoom to the shape whenever a table row or a map shape is clicked.
  useEffect(() => {
    if (!focusRow) {
      setFocusPoint(null);
      return;
    }

    const match = geographiesRef.current.find((geo) => {
      const name = getGeoName(geo, isDistrict ? "District" : "State / UT");
      return isSelectedGeo(geo, name, getRow(geo, name));
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
          y: (rect.height - MAP_HEIGHT * scale) / 2 + viewY * scale - 6,
        });
      } else {
        setTooltip(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRow]);

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

  function handleMoveEnd(newPosition) {
    setPosition(newPosition);
  }

  function resetMap() {
    setTooltip(null);
    setFocusPoint(null);
    setFocusRow(null);
    setPosition(DEFAULT_POSITION);
    onReset?.();
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
        className="map-no-focus relative box-border min-h-[320px] min-w-0 w-full flex-1 cursor-grab overflow-hidden rounded-2xl border border-line bg-[#F4F7FB] shadow-card active:cursor-grabbing"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* No browser focus box around a clicked state; its boundary is drawn instead */}
        <style>{`.map-no-focus svg *:focus, .map-no-focus svg *:focus-visible, .map-no-focus svg:focus { outline: none !important; } @keyframes mapFilmIn { from { opacity: 0; } to { opacity: 1; } } .map-film { animation: mapFilmIn .35s ease-out; }`}</style>

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

                  return {
                    geo,
                    name,
                    row,
                    selected: isSelectedGeo(geo, name, row),
                  };
                });

                // Draw the selected shape last so its outline is on top.
                items.sort((a, b) => Number(a.selected) - Number(b.selected));

                const ramp = COLOR_RAMPS.find((r) => r.id === rampId);

                return items.map(({ geo, name, row, selected }) => {
                  const fill = colorFor(row?.[activeParamKey]);
                  const outline = selected
                    ? getOutlineColors(fill, ramp)
                    : null;

                  return (
                    <g key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        fill={fill}
                        stroke={
                          selected
                            ? outline.stroke
                            : isDistrict
                              ? DISTRICT_BORDER_COLOR
                              : STATE_BORDER_COLOR
                        }
                        strokeWidth={
                          selected
                            ? 2.5
                            : isDistrict
                              ? DISTRICT_BORDER_WIDTH
                              : STATE_BORDER_WIDTH
                        }
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                        tabIndex={-1}
                        focusable="false"
                        onClick={() => handleGeoClick(geo, name)}
                        onMouseEnter={(event) =>
                          updateTooltip(event, geo, name)
                        }
                        onMouseMove={(event) => updateTooltip(event, geo, name)}
                        style={{
                          default: {
                            outline: "none",
                            // soft halo in the opposite tone keeps the edge crisp
                            filter: selected
                              ? `drop-shadow(0 0 2px ${outline.glow})`
                              : undefined,
                          },
                          hover: {
                            outline: "none",
                            filter: "brightness(0.9)",
                            cursor: "pointer",
                          },
                          pressed: { outline: "none" },
                        }}
                      />

                      {/* Faint see-through film over the selected area: the map colour still shows through */}
                      {selected && (
                        <Geography
                          geography={geo}
                          fill={outline.film}
                          fillOpacity={outline.filmOpacity}
                          stroke="none"
                          pointerEvents="none"
                          tabIndex={-1}
                          focusable="false"
                          className="map-film"
                          style={{
                            default: { outline: "none", pointerEvents: "none" },
                            hover: { outline: "none", pointerEvents: "none" },
                            pressed: { outline: "none", pointerEvents: "none" },
                          }}
                        />
                      )}
                    </g>
                  );
                });
              }}
            </Geographies>

            {/* District view: draw the state borders on top so each district can be traced to its state */}
            {isDistrict && (
              <Geographies geography={STATE_GEOJSON_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="none"
                      stroke={STATE_BORDER_COLOR}
                      strokeWidth={STATE_BORDER_WIDTH}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      tabIndex={-1}
                      focusable="false"
                      style={{
                        default: { outline: "none", pointerEvents: "none" },
                        hover: { outline: "none", pointerEvents: "none" },
                        pressed: { outline: "none", pointerEvents: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>
            )}

            {/* District view: the picked district's outline and film go on top of the
                state borders, so a shared edge shows the picked colour, not grey */}
            {isDistrict && focusRow && (
              <Geographies geography={geographyUrl}>
                {({ geographies }) => {
                  const ramp = COLOR_RAMPS.find((r) => r.id === rampId);

                  return geographies
                    .map((geo) => {
                      const name = getGeoName(geo, "District");
                      const row = getRow(geo, name);

                      return {
                        geo,
                        row,
                        selected: isSelectedGeo(geo, name, row),
                      };
                    })
                    .filter((item) => item.selected)
                    .map(({ geo, row }) => {
                      const outline = getOutlineColors(
                        colorFor(row?.[activeParamKey]),
                        ramp,
                      );

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="none"
                          stroke={outline.stroke}
                          strokeWidth={2.5}
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                          tabIndex={-1}
                          focusable="false"
                          style={{
                            default: {
                              outline: "none",
                              pointerEvents: "none",
                              filter: `drop-shadow(0 0 2px ${outline.glow})`,
                            },
                            hover: { outline: "none", pointerEvents: "none" },
                            pressed: { outline: "none", pointerEvents: "none" },
                          }}
                        />
                      );
                    });
                }}
              </Geographies>
            )}
            {/* Name labels: shown for every state / district when the Labels switch is on */}
            {showLabels && (
              <Geographies geography={geographyUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const point = getLabelPoint(geo.geometry);
                    const name = getGeoName(
                      geo,
                      isDistrict ? "District" : "State / UT",
                    );
                    if (!point || !name) return null;

                    return (
                      <Marker key={geo.rsmKey} coordinates={point}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          pointerEvents="none"
                          fontSize={
                            (isDistrict ? 6 : 11) / Math.sqrt(position.zoom)
                          }
                          fontWeight={700}
                          fill="#020244"
                          stroke="#fff"
                          strokeWidth={2.5 / Math.sqrt(position.zoom)}
                          paintOrder="stroke"
                          strokeLinejoin="round"
                          style={{ userSelect: "none" }}
                        >
                          {name}
                        </text>
                      </Marker>
                    );
                  })
                }
              </Geographies>
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
            <div className="pointer-events-none absolute bottom-2 right-2 z-10 w-[168px] max-w-[52%] rounded-xl border border-line bg-white/95 p-2 text-[11px] shadow-card backdrop-blur-sm sm:bottom-3 sm:right-3 sm:w-[210px] sm:p-3 sm:text-[12px]">
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

        {/* Labels on / off: top right */}
        <button
          type="button"
          role="switch"
          aria-checked={showLabels}
          onClick={() => setShowLabels((v) => !v)}
          title={showLabels ? "Hide names" : "Show names"}
          className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-navy shadow-card hover:bg-soft"
        >
          Label
          <span
            className={`relative h-4 w-7 rounded-full transition-colors ${showLabels ? "bg-navy" : "bg-[#C7CEDA]"}`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${showLabels ? "left-[14px]" : "left-0.5"}`}
            />
          </span>
        </button>

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

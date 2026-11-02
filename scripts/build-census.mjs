// Builds the census files the dashboard uses from the shapefiles listed in
// census/census.config.mjs.   Run:  npm run build:census
//
// Writes (same file names every time, so nothing else needs editing):
//   public/data/census/states.geojson      state boundaries  (+ st_nm, st_code)
//   public/data/census/districts.geojson   district boundaries (+ district, st_nm, dist_id)
//   src/data/census/states.json            state figures (sum of its districts)
//   src/data/census/districts.json         district figures
//   src/data/census/meta.json              year, label and the Parameters list
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mapshaper from "mapshaper";
import config from "../census/census.config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const abs = (p) => path.resolve(root, p);

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function readSimplified(shpPath, percent) {
  const file = abs(shpPath);
  if (!fs.existsSync(file)) {
    fail(`Shapefile not found: ${shpPath}\n  Put the files in census/source/ and fix the path in census/census.config.mjs`);
  }
  const out = await mapshaper.applyCommands(
    `-i "${file}" encoding=utf8 -simplify ${percent} keep-shapes ` +
      `-o format=geojson precision=0.001 out.json`,
  );
  return JSON.parse(out["out.json"]);
}

// The map library (d3-geo) needs polygon outer rings drawn CLOCKWISE and holes
// counter-clockwise; most GIS tools write the opposite (GeoJSON standard).
// With the wrong direction every shape fills the whole map, so fix it here.
const isClockwise = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    sum += (ring[i + 1][0] - ring[i][0]) * (ring[i + 1][1] + ring[i][1]);
  }
  return sum > 0;
};

function rewindPolygon(rings) {
  return rings.map((ring, i) => {
    const wantClockwise = i === 0; // first ring = outer boundary
    return isClockwise(ring) === wantClockwise ? ring : [...ring].reverse();
  });
}

function rewindFeatures(collection) {
  collection.features.forEach((f) => {
    const g = f.geometry;
    if (g?.type === "Polygon") g.coordinates = rewindPolygon(g.coordinates);
    if (g?.type === "MultiPolygon") g.coordinates = g.coordinates.map(rewindPolygon);
  });
}

// The map library (d3-geo) needs every polygon's outer ring to run CLOCKWISE
// and its holes counter-clockwise. If the rings run the other way, the polygon
// is treated as "everything except this area" and the map shows one flat
// colour. Different mapshaper versions write different directions, so the
// direction is fixed here instead of trusting the tool.
function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2; // negative = clockwise
}

function orientPolygon(rings) {
  return rings.map((ring, index) => {
    const clockwise = ringArea(ring) < 0;
    const wantClockwise = index === 0; // outer ring clockwise, holes the other way
    return clockwise === wantClockwise ? ring : [...ring].reverse();
  });
}

function fixOrientation(collection) {
  collection.features.forEach((feature) => {
    const g = feature.geometry;
    if (!g) return;
    if (g.type === "Polygon") g.coordinates = orientPolygon(g.coordinates);
    if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map(orientPolygon);
  });
}

function requireColumns(features, columns, what) {
  const have = Object.keys(features[0]?.properties || {});
  const missing = columns.filter((c) => !have.includes(c));
  if (missing.length) {
    fail(
      `The ${what} file has no column(s): ${missing.join(", ")}\n` +
        `  Columns found: ${have.join(", ")}\n  Fix the names in census/census.config.mjs`,
    );
  }
}

const fixName = (kind, value) => {
  const name = String(value ?? "").trim();
  return config[`nameFixes`]?.[kind]?.[name] ?? name;
};

const stateCode = (code, length) => String(code ?? "").slice(0, length);

// ---------- read ----------
console.log(`Building ${config.label} ...`);
const states = await readSimplified(config.source.state, config.simplify.state);
const districts = await readSimplified(config.source.district, config.simplify.district);

const S = config.state;
fixOrientation(states);
fixOrientation(districts);

const D = config.district;
const P = config.parameters;

requireColumns(states.features, [S.name, S.code], "State");
requireColumns(
  districts.features,
  [D.id, D.name, D.state, D.code, ...P.map((p) => p.column)],
  "District",
);

// ---------- state code -> state name ----------
const codeToState = {};
states.features.forEach((f) => {
  codeToState[stateCode(f.properties[S.code], S.codeLength)] = fixName("state", f.properties[S.name]);
});
const knownStates = new Set(Object.values(codeToState));

// ---------- districts ----------
const districtRows = [];
const totals = {};
const problems = [];

districts.features.forEach((f) => {
  const p = f.properties;
  const byCode = codeToState[stateCode(p[D.code], S.codeLength)];
  const byName = fixName("state", p[D.state]);
  const state = byCode || (knownStates.has(byName) ? byName : null);

  if (!state) {
    problems.push(`${p[D.name]} (state "${p[D.state]}", code "${p[D.code]}")`);
    return;
  }

  const name = fixName("district", p[D.name]);
  const row = { state, district: name, id: p[D.id] };
  P.forEach(({ key, column }) => {
    const value = Number(p[column]);
    row[key] = Number.isFinite(value) ? value : null;
  });
  districtRows.push(row);

  const t = (totals[state] ||= Object.fromEntries(P.map(({ key }) => [key, 0])));
  P.forEach(({ key }) => {
    t[key] += row[key] ?? 0;
  });

  f.properties = { district: name, st_nm: state, dist_id: p[D.id] };
});

if (problems.length) {
  fail(
    `Could not find the state of ${problems.length} district(s):\n  ` +
      problems.slice(0, 10).join("\n  ") +
      `\n  Add a fix under nameFixes.state in census/census.config.mjs`,
  );
}

// ---------- states ----------
const stateRows = [];
states.features.forEach((f) => {
  const name = fixName("state", f.properties[S.name]);
  const code = stateCode(f.properties[S.code], S.codeLength);
  f.properties = { st_nm: name, st_code: code };
  stateRows.push({
    state: name,
    code,
    ...(totals[name] || Object.fromEntries(P.map(({ key }) => [key, null]))),
  });
});

const withoutFigures = stateRows.filter((r) => !totals[r.state]).map((r) => r.state);

rewindFeatures(states);
rewindFeatures(districts);

// ---------- write ----------
const write = (file, data) => {
  fs.mkdirSync(path.dirname(abs(file)), { recursive: true });
  fs.writeFileSync(abs(file), JSON.stringify(data), "utf8");
  const kb = (fs.statSync(abs(file)).size / 1024).toFixed(0);
  console.log(`  ${file}  (${kb} KB)`);
};

write("public/data/census/states.geojson", states);
write("public/data/census/districts.geojson", districts);
// Stored as { keys, rows: [[...]] } (no repeated field names) to keep the
// files small; src/data/dashboardConfig.js turns them back into objects.
const toTable = (rows) => {
  const keys = Object.keys(rows[0] || {});
  return { keys, rows: rows.map((r) => keys.map((k) => r[k])) };
};
write("src/data/census/states.json", toTable(stateRows));
write("src/data/census/districts.json", toTable(districtRows));
write("src/data/census/meta.json", {
  year: config.year,
  label: config.label,
  parameters: P.map(({ key, label, shortLabel, group }) => ({
    key,
    label,
    shortLabel: shortLabel ?? label,
    group: group ?? null,
  })),
});

// ---------- summary ----------
const pop = P.find((p) => p.key === "total_population")?.key;
console.log(`\n✔ ${stateRows.length} states / UTs, ${districtRows.length} districts`);
if (pop) {
  const sum = districtRows.reduce((s, r) => s + (r[pop] ?? 0), 0);
  console.log(`  Total population: ${sum.toLocaleString("en-IN")}`);
}
if (withoutFigures.length) {
  console.log(`  ⚠ No districts found for: ${withoutFigures.join(", ")}`);
}

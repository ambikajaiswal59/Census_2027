// =============================================================================
//  CENSUS DATA CONFIG  —  the ONE place to edit when the census data changes.
//
//  How it is used:
//    npm run build:census
//  reads the two shapefiles below, shrinks the boundaries, adds up the figures
//  and writes the small files the dashboard loads (see census/README.md).
// =============================================================================

// ---- Parameters: one entry per figure in the district file -----------------
// column = the district-file column for the whole area; the Rural and Urban
// versions of each column start with "R_" and "U_".
const METRICS = [
  { key: "households", label: "Total Households", column: "TOT_HH" },

  { key: "total_population", label: "Total Population", column: "TOT_POP" },
  { key: "male_population", label: "Male Population", column: "M_POP" },
  { key: "female_population", label: "Female Population", column: "F_POP" },

  { key: "child_population", label: "Total Child Population (0-6)", column: "TOT_L6" },
  { key: "child_male", label: "Male Child Population (0-6)", column: "M_L6" },
  { key: "child_female", label: "Female Child Population (0-6)", column: "F_L6" },

  { key: "sc_population", label: "Total SC Population", column: "TOT_SC" },
  { key: "sc_male", label: "Male SC Population", column: "M_SC" },
  { key: "sc_female", label: "Female SC Population", column: "F_SC" },

  { key: "st_population", label: "Total ST Population", column: "TOT_ST" },
  { key: "st_male", label: "Male ST Population", column: "M_ST" },
  { key: "st_female", label: "Female ST Population", column: "F_ST" },

  { key: "literates", label: "Total Literates", column: "TOT_LIT" },
  { key: "literate_male", label: "Male Literates", column: "M_LIT" },
  { key: "literate_female", label: "Female Literates", column: "F_LIT" },

  { key: "illiterates", label: "Total Illiterates", column: "TOT_ILLT" },
  { key: "illiterate_male", label: "Male Illiterates", column: "M_ILLT" },
  { key: "illiterate_female", label: "Female Illiterates", column: "F_ILLT" },

  { key: "workers", label: "Total Workers", column: "TOT_W" },
  { key: "workers_male", label: "Male Workers", column: "M_W" },
  { key: "workers_female", label: "Female Workers", column: "F_W" },
];

// group = heading shown above that block in the sidebar.
const AREAS = [
  { group: "Total", columnPrefix: "", keyPrefix: "", labelPrefix: "" },
  { group: "Rural", columnPrefix: "R_", keyPrefix: "rural_", labelPrefix: "Rural - " },
  { group: "Urban", columnPrefix: "U_", keyPrefix: "urban_", labelPrefix: "Urban - " },
];

const PARAMETERS = AREAS.flatMap((area) =>
  METRICS.map((m) => ({
    key: area.keyPrefix + m.key,
    label: area.labelPrefix + m.label, // full name (table header, legend, tooltip)
    shortLabel: m.label, // name inside its sidebar group
    group: area.group,
    column: area.columnPrefix + m.column,
  })),
);

export default {
  // Shown by the app (and written into the generated files).
  year: 2011,
  label: "Census 2011",

  // The shapefiles (.shp with its .dbf next to it). Drop new ones into
  // census/source/ and change these two paths.
  source: {
    state: "census/source/State/Map Data/STATE_2011.shp",
    district: "census/source/District/DISTRICT_2011.shp",
  },

  // Boundary detail: smaller % = smaller files, rougher borders.
  simplify: { state: "2%", district: "3%" },

  // Column names inside the shapefiles. Change these if a new file names them
  // differently (the build lists the available columns if one is not found).
  state: {
    name: "NAME", // state / UT name
    code: "C_CODE11", // census code; its first `codeLength` characters = state code
    codeLength: 2,
  },
  district: {
    id: "DIST11_ID", // unique district id
    name: "NAME", // district name
    state: "STATE_UT", // state name written on each district (fallback join)
    code: "C_CODE11", // census code; first `codeLength` characters = state code
  },

  // The Parameters shown in the sidebar.  key = field used by the app,
  // label = text shown, column = column in the DISTRICT file.
  // State / UT figures are the SUM of their districts.
  // This list is built from the tables below: every column of the district
  // file appears as a Parameter (Total, then Rural, then Urban).
  // To add / remove one, edit METRICS (or AREAS) and run the build.
  parameters: PARAMETERS,

  // Spelling fixes applied to names before they are used (optional).
  // "name in the file": "name you want"
  nameFixes: {
    state: {
      "Andaman & Nicobar Island": "Andaman & Nicobar Islands",
    },
    district: {},
  },
};

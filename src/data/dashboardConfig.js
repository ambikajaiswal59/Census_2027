// =====================================================
// DASHBOARD CONFIGURATION
// =====================================================

export const levelOptions = ["State / UT", "District"];

const parameterOptions = [
  { key: "total_population", label: "Total Population" },
  { key: "male_population", label: "Male Population" },
  { key: "female_population", label: "Female Population" },
  { key: "sc_population", label: "SC Population" },
  { key: "st_population", label: "ST Population" },
  { key: "literates", label: "Literates" },
  { key: "literate_male", label: "Literate - Male" },
  { key: "literate_female", label: "Literate - Female" },
];

const populationRanges = [
  {
    id: "r1",
    label: "< 10,00,000",
    min: 0,
    max: 1000000,
    color: "#E7EFA3",
  },
  {
    id: "r2",
    label: "10,00,000 – 50,00,000",
    min: 1000000,
    max: 5000000,
    color: "#A9D18E",
  },
  {
    id: "r3",
    label: "50,00,000 – 1,00,00,000",
    min: 5000000,
    max: 10000000,
    color: "#5FBF9F",
  },
  {
    id: "r4",
    label: "1,00,00,000 – 2,00,00,000",
    min: 10000000,
    max: 20000000,
    color: "#3FA7C9",
  },
  {
    id: "r5",
    label: "2,00,00,000 – 5,00,00,000",
    min: 20000000,
    max: 50000000,
    color: "#2E73C9",
  },
  {
    id: "r6",
    label: "> 5,00,00,000",
    min: 50000000,
    max: Infinity,
    color: "#153E90",
  },
];

// =====================================================
// STATE / UT DATA
// Retained from your existing configuration.
// Verify before using for official reporting.
// =====================================================

const stateData = [
  {
    state: "Uttar Pradesh",
    total_population: 241400000,
    male_population: 124800000,
    female_population: 116600000,
    literacy_rate: 67.7,
  },
  {
    state: "Maharashtra",
    total_population: 112374333,
    male_population: 57658421,
    female_population: 54715912,
    literacy_rate: 82.3,
  },
  {
    state: "Bihar",
    total_population: 104107000,
    male_population: 53694774,
    female_population: 50412226,
    literacy_rate: 61.8,
  },
  {
    state: "West Bengal",
    total_population: 91347736,
    male_population: 46632720,
    female_population: 44715016,
    literacy_rate: 77.1,
  },
  {
    state: "Madhya Pradesh",
    total_population: 88670384,
    male_population: 45205509,
    female_population: 43464875,
    literacy_rate: 69.3,
  },
  {
    state: "Tamil Nadu",
    total_population: 72147030,
    male_population: 35107577,
    female_population: 37039453,
    literacy_rate: 80.1,
  },
  {
    state: "Rajasthan",
    total_population: 68621906,
    male_population: 35249232,
    female_population: 33372674,
    literacy_rate: 66.1,
  },
  {
    state: "Karnataka",
    total_population: 67413168,
    male_population: 32977533,
    female_population: 34435635,
    literacy_rate: 75.6,
  },
  {
    state: "Gujarat",
    total_population: 63872399,
    male_population: 33386864,
    female_population: 30485535,
    literacy_rate: 79.3,
  },
  {
    state: "Andhra Pradesh",
    total_population: 53903393,
    male_population: 26997858,
    female_population: 26905535,
    literacy_rate: 67.4,
  },
  {
    state: "Odisha",
    total_population: 46356334,
    male_population: 23618655,
    female_population: 22737679,
    literacy_rate: 73.5,
  },
  {
    state: "Telangana",
    total_population: 39640222,
    male_population: 19937100,
    female_population: 19703122,
    literacy_rate: 72.8,
  },
  {
    state: "Kerala",
    total_population: 35699443,
    male_population: 17315821,
    female_population: 18383622,
    literacy_rate: 96.2,
  },
  {
    state: "Jharkhand",
    total_population: 38593948,
    male_population: 19726085,
    female_population: 18867863,
    literacy_rate: 66.4,
  },
  {
    state: "Assam",
    total_population: 35607039,
    male_population: 18226047,
    female_population: 17380992,
    literacy_rate: 72.2,
  },
  {
    state: "Punjab",
    total_population: 30141373,
    male_population: 15987110,
    female_population: 14154263,
    literacy_rate: 75.8,
  },
  {
    state: "Haryana",
    total_population: 25351462,
    male_population: 13494734,
    female_population: 11856728,
    literacy_rate: 75.6,
  },
  {
    state: "Himachal Pradesh",
    total_population: 6864602,
    male_population: 3481873,
    female_population: 3382729,
    literacy_rate: 82.8,
  },
  {
    state: "Jammu and Kashmir",
    total_population: 12267032,
    male_population: 6640662,
    female_population: 5626370,
    literacy_rate: 67.2,
  },
  {
    state: "Ladakh",
    total_population: 274000,
    male_population: 147000,
    female_population: 127000,
    literacy_rate: 77.2,
  },
  {
    state: "Chhattisgarh",
    total_population: 25545198,
    male_population: 12832895,
    female_population: 12712303,
    literacy_rate: 70.3,
  },
  {
    state: "Uttarakhand",
    total_population: 10086292,
    male_population: 5137773,
    female_population: 4948519,
    literacy_rate: 78.8,
  },
  {
    state: "Tripura",
    total_population: 3673917,
    male_population: 1874376,
    female_population: 1799541,
    literacy_rate: 87.2,
  },
  {
    state: "Meghalaya",
    total_population: 2966889,
    male_population: 1491832,
    female_population: 1475057,
    literacy_rate: 74.4,
  },
  {
    state: "Manipur",
    total_population: 2855794,
    male_population: 1438586,
    female_population: 1417208,
    literacy_rate: 76.9,
  },
  {
    state: "Nagaland",
    total_population: 1978502,
    male_population: 1024649,
    female_population: 953853,
    literacy_rate: 79.6,
  },
  {
    state: "Goa",
    total_population: 1458545,
    male_population: 739140,
    female_population: 719405,
    literacy_rate: 88.7,
  },
  {
    state: "Arunachal Pradesh",
    total_population: 1383727,
    male_population: 713912,
    female_population: 669815,
    literacy_rate: 65.4,
  },
  {
    state: "Mizoram",
    total_population: 1097206,
    male_population: 555339,
    female_population: 541867,
    literacy_rate: 91.3,
  },
  {
    state: "Sikkim",
    total_population: 610577,
    male_population: 323070,
    female_population: 287507,
    literacy_rate: 81.4,
  },
  {
    state: "Delhi",
    total_population: 16787941,
    male_population: 8987326,
    female_population: 7800615,
    literacy_rate: 86.2,
  },
  {
    state: "Puducherry",
    total_population: 1247953,
    male_population: 612511,
    female_population: 635442,
    literacy_rate: 85.8,
  },
  {
    state: "Chandigarh",
    total_population: 1055450,
    male_population: 580663,
    female_population: 474787,
    literacy_rate: 86.0,
  },
  {
    state: "Andaman and Nicobar Islands",
    total_population: 380581,
    male_population: 202871,
    female_population: 177710,
    literacy_rate: 86.6,
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    total_population: 585764,
    male_population: 344061,
    female_population: 241703,
    literacy_rate: 76.2,
  },
  {
    state: "Lakshadweep",
    total_population: 64473,
    male_population: 33123,
    female_population: 31350,
    literacy_rate: 91.8,
  },
];

// =====================================================
// DISTRICT DATA
// Illustrative records for testing the district UI.
// These are not official Census figures.
// =====================================================

const districtData = [
  {
    state: "Uttar Pradesh",
    district: "Lucknow",
    total_population: 3500000,
    male_population: 1830000,
    female_population: 1670000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 77.3,
  },
  {
    state: "Uttar Pradesh",
    district: "Kanpur Nagar",
    total_population: 4600000,
    male_population: 2450000,
    female_population: 2150000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 79.7,
  },
  {
    state: "Uttar Pradesh",
    district: "Varanasi",
    total_population: 3700000,
    male_population: 1920000,
    female_population: 1780000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 75.6,
  },
  {
    state: "Maharashtra",
    district: "Pune",
    total_population: 9400000,
    male_population: 4900000,
    female_population: 4500000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 86.1,
  },
  {
    state: "Maharashtra",
    district: "Mumbai Suburban",
    total_population: 9300000,
    male_population: 4900000,
    female_population: 4400000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 89.9,
  },
  {
    state: "Bihar",
    district: "Patna",
    total_population: 5800000,
    male_population: 3050000,
    female_population: 2750000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 70.7,
  },
  {
    state: "Rajasthan",
    district: "Jaipur",
    total_population: 6600000,
    male_population: 3450000,
    female_population: 3150000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 75.5,
  },
  {
    state: "Delhi",
    district: "New Delhi",
    total_population: 1400000,
    male_population: 750000,
    female_population: 650000,
    sc_population: null,
    st_population: null,
    literates: null,
    literate_male: null,
    literate_female: null,
    literacy_rate: 89.0,
  },
];

// =====================================================
// DATA HELPERS
// =====================================================

function enrich(row) {
  return {
    ...row,
    sc_population: row.sc_population ?? null,
    st_population: row.st_population ?? null,
    literates: row.literates ?? null,
    literate_male: row.literate_male ?? null,
    literate_female: row.literate_female ?? null,
  };
}

// Return State / UT records.
export function getStateData() {
  return stateData.map(enrich);
}

// Return District records.
export function getDistrictData() {
  return districtData.map(enrich);
}

// Return dashboard parameter options.
export function getParameters() {
  return parameterOptions;
}

// Return population legend ranges.
export function getPopulationRanges() {
  return populationRanges;
}

// Find the matching population range.
export function getRangeForValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return null;
  }

  const numericValue = Number(value);

  if (numericValue < 0) {
    return null;
  }

  return (
    populationRanges.find(
      (range) => numericValue >= range.min && numericValue < range.max,
    ) ?? null
  );
}

// Format numbers using the Indian numbering system.
export function formatIN(num) {
  if (
    num === null ||
    num === undefined ||
    num === "" ||
    !Number.isFinite(Number(num))
  ) {
    return "—";
  }

  return Math.round(Number(num)).toLocaleString("en-IN");
}

import { useState, useEffect } from "react";
import { getStateCount, getDistrictCount } from "../data/dashboardConfig.js";

// Get Census 2011 counts directly from the local JSON files.
const CENSUS_2011_COUNTS = {
  states_uts: getStateCount(),
  districts: getDistrictCount(),
};

export default function useLevelCount(level) {
  const [count, setCount] = useState(() =>
    level === "District"
      ? CENSUS_2011_COUNTS.districts
      : CENSUS_2011_COUNTS.states_uts,
  );

  useEffect(() => {
    setCount(
      level === "District"
        ? CENSUS_2011_COUNTS.districts
        : CENSUS_2011_COUNTS.states_uts,
    );
  }, [level]);

  return count;
}

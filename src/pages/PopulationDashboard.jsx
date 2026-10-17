import { useState, useRef, useEffect } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import DashboardSidebar from "../components/dashboard/DashboardSidebar.jsx";
import MapCard from "../components/dashboard/MapCard.jsx";
import LegendCard from "../components/dashboard/LegendCard.jsx";
import DataTableCard from "../components/dashboard/DataTableCard.jsx";

import {
  levelOptions,
  getParameters,
  getPopulationRanges,
  getStateData,
  getDistrictData,
} from "../data/dashboardConfig.js";
import { useEnableUpload, useUpload } from "../context/UploadContext.jsx";

export default function PopulationDashboard() {
  // Shows the Upload button in the header while this page is open.
  useEnableUpload();

  const {
    uploadsByLevel,
    selectedUpload,
    setSelectedUpload,
    setDashboardLevel,
  } = useUpload();

  const [level, setLevel] = useState(levelOptions[0]);

  // Let the upload modal default to the level the dashboard is showing.
  useEffect(() => {
    setDashboardLevel(level);
  }, [level, setDashboardLevel]);
  const [activeParam, setActiveParam] = useState("total_population");

  // Row clicked in the table; the map zooms to it.
  const [selectedRow, setSelectedRow] = useState(null);
  const mapSectionRef = useRef(null);

  const parameters = getParameters();
  const ranges = getPopulationRanges();

  const stateData = getStateData();
  const districtData = getDistrictData();

  const currentData = level === "District" ? districtData : stateData;

  const [visibleRangeIds, setVisibleRangeIds] = useState(
    ranges.map((range) => range.id),
  );

  // A Customer Input pick belongs to one level. If the dashboard moves to the
  // other level, drop it so only one field is ever active.
  useEffect(() => {
    if (selectedUpload && selectedUpload.level !== level) {
      setSelectedUpload(null);
    }
  }, [level, selectedUpload, setSelectedUpload]);

  // activeParam is null while a Customer Input dataset is the active choice
  // (only one field is selected at a time across both sidebar lists).
  // If neither is selected any more (level switched, sheet replaced), go
  // back to the default Parameter.
  useEffect(() => {
    if (activeParam === null && !selectedUpload) {
      setActiveParam("total_population");
    }
  }, [activeParam, selectedUpload]);

  // Clear the selection when switching between State / UT and District.
  useEffect(() => {
    setSelectedRow(null);
  }, [level]);

  function handleRowClick(row) {
    // New object each click, so clicking the same row again zooms again.
    setSelectedRow({ ...row });

    // The table sits below the map, so bring the map into view.
    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  const selectedKey = !selectedRow
    ? null
    : level === "District"
      ? `${selectedRow.state}-${selectedRow.district}`
      : selectedRow.state;

  // The uploaded Customer Input dataset currently picked in the sidebar, for
  // the level being shown, reshaped as
  //   { heading, rows: [{ state, district?, value }] }
  // State / UT sheet:  column 0 = state.
  // District sheet:    column 0 = state, column 1 = district.
  // so the table (and the map later) can match it by name.
  const levelUpload = uploadsByLevel[level] ?? null;
  const uploadedColumn =
    levelUpload && selectedUpload?.level === level
      ? {
          heading: levelUpload.columns[selectedUpload.index],
          rows: levelUpload.rows.map((row) => ({
            state: row[0],
            district: level === "District" ? row[1] : undefined,
            value: row[selectedUpload.index],
          })),
        }
      : null;

  // Title/legend label follows whichever single field is active.
  const activeParamLabel = uploadedColumn
    ? uploadedColumn.heading
    : parameters.find((parameter) => parameter.key === activeParam)?.label ||
      "Population";

  return (
    <>
      <main className="mx-auto w-full max-w-wrap px-3 py-0 sm:px-6 sm:py-1.5">
        <div
          className="
            grid min-w-0 grid-cols-1 gap-3
            lg:grid-cols-[260px_minmax(0,1fr)_280px]
            lg:grid-rows-[minmax(0,480px)_320px]
            lg:gap-x-4 lg:gap-y-2
          "
        >
          {/* Sidebar */}
          <aside
            className="
              min-h-0 min-w-0
              max-h-[420px] overflow-y-auto
              lg:col-start-1 lg:row-start-1
              lg:h-full lg:max-h-none
            "
          >
            <DashboardSidebar
              level={level}
              onLevelChange={setLevel}
              parameters={parameters}
              activeParam={activeParam}
              onParamChange={setActiveParam}
            />
          </aside>

          {/* Map */}
          <section
            ref={mapSectionRef}
            className="
              min-h-0 min-w-0
              lg:col-start-2 lg:row-start-1
              lg:h-full
            "
          >
            <MapCard
              level={level}
              onLevelChange={setLevel}
              activeParamKey={activeParam}
              activeParamLabel={activeParamLabel}
              stateData={stateData}
              districtData={districtData}
              ranges={ranges}
              visibleRangeIds={visibleRangeIds}
              selectedRow={selectedRow}
            />
          </section>

          {/* Legend */}
          <aside
            className="
              min-h-0 min-w-0
              max-h-[320px] overflow-y-auto
              lg:col-start-3 lg:row-start-1
              lg:h-full lg:max-h-none
            "
          >
            <LegendCard
              ranges={ranges}
              visibleRangeIds={visibleRangeIds}
              setVisibleRangeIds={setVisibleRangeIds}
            />
          </aside>

          {/* Data table: full dashboard width */}
          <section
            className="
              min-h-[260px] min-w-0
              lg:col-span-3 lg:row-start-2
              lg:h-full lg:min-h-0
            "
          >
            <div className="h-full min-h-0 min-w-0 overflow-hidden rounded-2xl">
              <DataTableCard
                data={currentData}
                level={level}
                onRowClick={handleRowClick}
                selectedKey={selectedKey}
                activeParamKey={activeParam}
                activeParamLabel={activeParamLabel}
                uploadedColumn={uploadedColumn}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

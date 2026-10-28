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
  getDataRanges,
  getCustomRanges,
  DEFAULT_CLASSIFICATION,
  DEFAULT_RAMP_ID,
  DEFAULT_PARAM_KEY,
  getStateData,
  getDistrictData,
} from "../data/dashboardConfig.js";
import {
  useEnableUpload,
  useUpload,
  UPLOAD_LEVELS,
} from "../context/UploadContext.jsx";

const rowNameKey = (state, district) =>
  `${String(state ?? "")
    .trim()
    .toLowerCase()}|${String(district ?? "")
    .trim()
    .toLowerCase()}`;

// Loose name key for matching an uploaded name to a census / map name
// ("Andaman And Nicobar Islands" == "Andaman & Nicobar Islands").
const looseKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

// Field the map and legend read when an uploaded dataset is the active choice.
const UPLOAD_VALUE_KEY = "__upload";

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
  const [activeParam, setActiveParam] = useState(DEFAULT_PARAM_KEY);

  // Row clicked in the table; the map zooms to it.
  const [selectedRow, setSelectedRow] = useState(null);
  // Where the pick came from ("map" or "table") and a counter that changes on
  // every pick, so picking the same area again still scrolls to its row.
  const [selectSource, setSelectSource] = useState("table");
  const [selectNonce, setSelectNonce] = useState(0);
  const mapSectionRef = useRef(null);

  const parameters = getParameters();
  // Legend classification: 5 classes by default, or 3.
  const [classCount, setClassCount] = useState(DEFAULT_CLASSIFICATION);
  const [rampId, setRampId] = useState(DEFAULT_RAMP_ID);

  const stateData = getStateData();
  const districtData = getDistrictData();

  const currentData = level === "District" ? districtData : stateData;

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
      setActiveParam(DEFAULT_PARAM_KEY);
    }
  }, [activeParam, selectedUpload]);

  // Clear the selection when switching between State / UT and District.
  useEffect(() => {
    setSelectedRow(null);
  }, [level]);

  // Map refresh button: back to the default parameter with nothing picked.
  function handleMapReset() {
    setActiveParam(DEFAULT_PARAM_KEY);
    setSelectedUpload(null);
    setSelectedRow(null);
  }

  function handleRowClick(row) {
    // New object each click, so clicking the same row again zooms again.
    setSelectedRow({ ...row });
    setSelectSource("table");
    setSelectNonce((n) => n + 1);

    // The table sits below the map, so bring the map into view.
    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  // A click on the map picks the same area in the table. The table then scrolls
  // the whole page (not only itself) to that row, so it is brought on screen.
  function handleMapSelect(row) {
    setSelectedRow({ ...row });
    setSelectSource("map");
    setSelectNonce((n) => n + 1);
  }

  // The uploaded Customer Input dataset currently picked in the sidebar, for
  // the level being shown, reshaped as
  //   { heading, rows: [{ state, district?, value }] }
  // State / UT sheet:  column 0 = state.
  // District sheet:    column 0 = district, column 1 = state.
  // so the table (and the map later) can match it by name.
  const levelUpload = uploadsByLevel[level] ?? null;
  const uploadedColumn =
    levelUpload && selectedUpload?.level === level
      ? {
          heading: levelUpload.columns[selectedUpload.index],
          rows: levelUpload.rows.map((row) => ({
            state: row[UPLOAD_LEVELS[level].stateColumn],
            district:
              level === "District"
                ? row[UPLOAD_LEVELS[level].districtColumn]
                : undefined,
            value: row[selectedUpload.index],
          })),
        }
      : null;

  // Without an upload the table lists the census 2011 rows (the same areas the
  // map draws), so every row has figures. Once a sheet is uploaded for this
  // level, the names come from that template (its State / UT, or
  // District + State / UT, columns), same as the download.
  const sampleByKey = {};
  currentData.forEach((row) => {
    sampleByKey[rowNameKey(row.state, row.district)] = row;
  });

  const uploadedNames = levelUpload
    ? levelUpload.rows
        .map((row) => ({
          state: row[UPLOAD_LEVELS[level].stateColumn],
          ...(level === "District"
            ? { district: row[UPLOAD_LEVELS[level].districtColumn] }
            : {}),
        }))
        .filter((r) => String(r.state ?? "").trim())
    : null;

  const censusRows = [...currentData].sort(
    (a, b) =>
      String(a.state).localeCompare(String(b.state)) ||
      String(a.district ?? "").localeCompare(String(b.district ?? "")),
  );

  const tableData = uploadedNames?.length
    ? uploadedNames.map((row) => ({
        ...(sampleByKey[rowNameKey(row.state, row.district)] || {}),
        state: row.state,
        ...(level === "District" ? { district: row.district } : {}),
      }))
    : censusRows;

  // Uploaded dataset on the map: each census area (the shapes the map draws) gets
  // the uploaded number for the same name, so the map, legend and info card work
  // for it exactly as they do for the census parameters. Areas the sheet does
  // not list, or leaves empty, stay grey.
  const areaKey = (state, district) =>
    level === "District"
      ? `${looseKey(state)}|${looseKey(district)}`
      : looseKey(state);

  const uploadValueByArea = {};
  if (uploadedColumn) {
    uploadedColumn.rows.forEach(({ state, district, value }) => {
      const text = String(value ?? "")
        .replace(/,/g, "")
        .trim();
      const number = Number(text);

      if (text && Number.isFinite(number)) {
        uploadValueByArea[areaKey(state, district)] = number;
      }
    });
  }

  const mapRows = uploadedColumn
    ? currentData.map((row) => ({
        ...row,
        [UPLOAD_VALUE_KEY]: uploadValueByArea[areaKey(row.state, row.district)],
      }))
    : currentData;

  const mapParamKey = uploadedColumn ? UPLOAD_VALUE_KEY : activeParam;

  // Legend / map classes follow the values of the selected field, so colours
  // change with the Parameter and with State / UT vs District.
  const ranges = uploadedColumn
    ? getCustomRanges(
        mapRows.map((row) => row[UPLOAD_VALUE_KEY]),
        classCount,
        rampId,
      )
    : getDataRanges(
        activeParam ? currentData.map((row) => row[activeParam]) : [],
        classCount,
        rampId,
      );

  const visibleRangeIds = ranges.map((range) => range.id);

  // True when some areas have no usable value for the selected field, so the
  // legend adds its grey "No data available" entry (and only then).
  const hasNoData =
    Boolean(mapParamKey) &&
    mapRows.some((row) => {
      const value = row?.[mapParamKey];
      return (
        value === null ||
        value === undefined ||
        value === "" ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      );
    });

  // Row of the table that matches the picked area (by name, so it still lines
  // up when the table uses the uploaded sheet's names).
  const selectedTableRow = !selectedRow
    ? null
    : tableData.find(
        (row) =>
          rowNameKey(row.state, row.district) ===
          rowNameKey(selectedRow.state, selectedRow.district),
      ) || selectedRow;

  const selectedKey = !selectedTableRow
    ? null
    : level === "District"
      ? `${selectedTableRow.state}-${selectedTableRow.district}`
      : selectedTableRow.state;

  // Title/legend label follows whichever single field is active.
  const activeParamLabel = uploadedColumn
    ? uploadedColumn.heading
    : parameters.find((parameter) => parameter.key === activeParam)?.label ||
      "Population";

  return (
    <>
      <main className="mx-auto w-full max-w-wrap px-3 pb-2 pt-4 sm:px-6 sm:pb-4 sm:pt-4">
        <div
          className="
            grid min-w-0 grid-cols-1 gap-3
            lg:grid-cols-[260px_minmax(0,1fr)_280px]
            lg:grid-rows-[minmax(0,480px)_218px]
            lg:gap-x-4 lg:gap-y-2
          "
        >
          {/* Sidebar */}
          <aside
            className="
              min-h-0 min-w-0
              lg:col-start-1 lg:row-start-1 lg:row-span-2
              lg:h-full
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
              activeParamKey={mapParamKey}
              activeParamLabel={activeParamLabel}
              stateData={level === "District" ? stateData : mapRows}
              districtData={level === "District" ? mapRows : districtData}
              ranges={ranges}
              rampId={rampId}
              visibleRangeIds={visibleRangeIds}
              selectedRow={selectedRow}
              onReset={handleMapReset}
              onSelect={handleMapSelect}
            />
          </section>

          {/* Legend */}
          <aside
            className="
              min-h-0 min-w-0
              lg:col-start-3 lg:row-start-1 lg:row-span-2
              lg:h-full
            "
          >
            <LegendCard
              ranges={ranges}
              classCount={classCount}
              onClassCountChange={setClassCount}
              rampId={rampId}
              onRampChange={setRampId}
              activeParamLabel={activeParamLabel}
              showNoData={hasNoData}
            />
          </aside>

          {/* Data table: full dashboard width */}
          <section
            className="
              min-h-[218px] min-w-0 lg:col-start-2 lg:col-end-2
              lg:col-span-2 lg:row-start-2
              lg:h-full lg:min-h-0
            "
          >
            <div className="h-full min-h-0 min-w-0 overflow-hidden rounded-2xl">
              <DataTableCard
                data={tableData}
                level={level}
                onRowClick={handleRowClick}
                selectedKey={selectedKey}
                scrollPageToRow={selectSource === "map"}
                selectNonce={selectNonce}
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

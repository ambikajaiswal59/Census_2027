import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  useUpload,
  UPLOAD_LEVELS,
  STATE_LEVEL,
  DISTRICT_LEVEL,
} from "../context/UploadContext.jsx";
import { fetchDirectory, PAGE_SIZE } from "../api/census.js";

const MAX_SIZE_MB = 5;
const MAX_ROWS = 10000;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const LEVEL_TABS = [
  { value: STATE_LEVEL, icon: "ti-map" },
  { value: DISTRICT_LEVEL, icon: "ti-map-pin" },
];

// Loads every row of a directory level. District is paginated by the backend,
// so keep requesting pages until it says there are no more.
async function fetchAllRows(level, paged) {
  if (!paged) {
    const res = await fetchDirectory(level, {});
    return res.rows || [];
  }

  const all = [];
  for (let page = 0; page < 100; page += 1) {
    const res = await fetchDirectory(level, {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    all.push(...(res.rows || []));
    if (!res.has_more) break;
  }
  return all;
}

const byText = (a, b) => String(a).localeCompare(String(b));

// State / UT sheet: every State / UT in the first column + Dataset 1-3.
// District sheet:  District, then its State / UT, for every district + Dataset 1-3.
// The leading key columns are only backend references used to match rows to
// the map/table — they're never shown as selectable datasets in the UI.
async function downloadTemplate(level) {
  const config = UPLOAD_LEVELS[level];
  const blanks = config.templateColumns.slice(config.keyColumns).map(() => "");

  let bodyRows;
  if (level === DISTRICT_LEVEL) {
    const districts = await fetchAllRows("District", true);
    bodyRows = districts
      .filter((d) => d.name)
      .sort((a, b) => byText(a.state, b.state) || byText(a.name, b.name))
      .map((d) => [d.name, d.state || "", ...blanks]);
  } else {
    const states = await fetchAllRows("State", false);
    bodyRows = states
      .filter((s) => s.name)
      .sort((a, b) => byText(a.name, b.name))
      .map((s) => [s.name, ...blanks]);
  }

  if (bodyRows.length === 0) throw new Error("No names were returned.");

  const worksheet = XLSX.utils.aoa_to_sheet([
    config.templateColumns,
    ...bodyRows,
  ]);
  worksheet["!cols"] = config.templateColumns.map((_, i) => ({
    wch: i < config.keyColumns ? 34 : 16,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, config.templateFileName);
}

function lastFilledIndex(row) {
  for (let i = row.length - 1; i >= 0; i -= 1) {
    if (String(row[i] ?? "").trim() !== "") return i;
  }
  return -1;
}

// Reads the first sheet and returns { level, keyColumns, fileName, columns, rows }.
// Throws an Error with a friendly message when the file isn't valid.
async function parseSheet(file, level) {
  const config = UPLOAD_LEVELS[level];
  const REQUIRED_COLUMNS = config.templateColumns.length;

  const dot = file.name.lastIndexOf(".");
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";

  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error(
      "Please upload an Excel file (.xlsx or .xls) or a .csv file.",
    );
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(
      `The file is too large. Maximum size is ${MAX_SIZE_MB} MB.`,
    );
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) throw new Error("This file has no sheets.");

  // header: 1 -> array of rows; raw: false -> values formatted as shown in Excel
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  if (matrix.length === 0) throw new Error("The sheet is empty.");

  const columnCount = matrix.reduce(
    (widest, row) => Math.max(widest, lastFilledIndex(row) + 1),
    0,
  );

  if (columnCount !== REQUIRED_COLUMNS) {
    throw new Error(
      `The sheet must contain exactly ${REQUIRED_COLUMNS} columns, but ${columnCount} ${
        columnCount === 1 ? "was" : "were"
      } found.`,
    );
  }

  const columns = matrix[0]
    .slice(0, REQUIRED_COLUMNS)
    .map((heading) => String(heading ?? "").trim());

  if (columns.some((heading) => !heading)) {
    throw new Error(
      `The first row must contain a heading for each of the ${REQUIRED_COLUMNS} columns.`,
    );
  }

  const rows = matrix
    .slice(1)
    .map((row) =>
      Array.from({ length: REQUIRED_COLUMNS }, (_, i) =>
        String(row[i] ?? "").trim(),
      ),
    )
    .filter((row) => row.some(Boolean));

  if (rows.length === 0) {
    throw new Error("No data rows were found below the column headings.");
  }

  if (rows.length > MAX_ROWS) {
    throw new Error(
      `The sheet has ${rows.length.toLocaleString()} rows. The maximum is ${MAX_ROWS.toLocaleString()}.`,
    );
  }

  return {
    level,
    keyColumns: config.keyColumns,
    fileName: file.name,
    columns,
    rows,
  };
}

export default function UploadModal() {
  const { isModalOpen, closeModal, setUploadedData, dashboardLevel } =
    useUpload();

  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");
  const [uploadLevel, setUploadLevel] = useState(dashboardLevel);

  // Start clean every time the modal opens, on the level the dashboard is showing.
  useEffect(() => {
    if (isModalOpen) {
      setError("");
      setIsDragging(false);
      setIsParsing(false);
      setIsPreparing(false);
      setUploadLevel(dashboardLevel);
    }
  }, [isModalOpen, dashboardLevel]);

  // Esc closes the modal.
  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  async function handleTemplate() {
    setError("");
    setIsPreparing(true);
    try {
      await downloadTemplate(uploadLevel);
    } catch (err) {
      setError(
        `Could not prepare the template (${err?.message || "network error"}). Please try again.`,
      );
    } finally {
      setIsPreparing(false);
    }
  }

  async function handleFile(file) {
    if (!file) return;

    setError("");
    setIsParsing(true);

    try {
      const data = await parseSheet(file, uploadLevel);
      setUploadedData(data);
      closeModal();
    } catch (err) {
      setError(err?.message || "Could not read this file. Please try another.");
    } finally {
      setIsParsing(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function handleInputChange(event) {
    handleFile(event.target.files?.[0]);
    event.target.value = ""; // lets the same file be chosen again
  }

  if (!isModalOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,.30)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 bg-navy px-4 py-3">
          <div className="min-w-0">
            <h2
              id="upload-modal-title"
              className="flex items-center gap-2 text-[15px] font-extrabold text-white"
            >
              <i className="ti ti-file-spreadsheet" />
              Upload Excel Sheet
            </h2>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Which level this upload is for: decides the template + sheet shape */}
          <div
            role="radiogroup"
            aria-label="Upload level"
            className="mb-3 grid grid-cols-2 gap-1 rounded-full border border-line bg-soft p-1"
          >
            {LEVEL_TABS.map((tab) => {
              const isActive = uploadLevel === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => {
                    setUploadLevel(tab.value);
                    setError("");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors duration-150 ${
                    isActive ? "bg-navy text-white" : "text-navy hover:bg-white"
                  }`}
                >
                  <i className={`ti ${tab.icon}`} />
                  {tab.value}
                </button>
              );
            })}
          </div>

          {/* Step 1: download the template */}
          <div className="mb-3 flex items-start gap-3 rounded-xl border border-line bg-soft p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-bold text-white">
              1
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-navy">
                Download the template
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">
                {uploadLevel === DISTRICT_LEVEL
                  ? "All districts and their State / UT are already listed; fill in Dataset 1-3 next to them, then upload the completed file below."
                  : "All States / UTs are already listed; fill in Dataset 1-3 next to them, then upload the completed file below."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleTemplate}
              disabled={isPreparing}
              className="flex shrink-0 disabled:cursor-wait disabled:opacity-60 items-center gap-1.5 rounded-[9px] border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-soft"
            >
              <i
                className={`ti ${isPreparing ? "ti-loader-2 animate-spin" : "ti-download"}`}
              />
              {isPreparing ? "Preparing…" : "Template"}
            </button>
          </div>

          <p className="mb-1.5 flex items-center gap-2 text-[12px] font-bold text-navy">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-bold text-white">
              2
            </span>
            Upload the filled file
          </p>

          <div
            role="button"
            tabIndex={0}
            aria-label="Drag and drop an Excel file here, or press Enter to browse"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-9 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue ${
              isDragging
                ? "scale-[1.01] border-blue bg-[#EEF3FF]"
                : "border-[#C7CEDA] bg-soft hover:border-blue hover:bg-white"
            }`}
          >
            {isParsing ? (
              <>
                <i className="ti ti-loader-2 animate-spin text-[30px] text-blue" />
                <p className="text-[13px] font-semibold text-navy">
                  Reading file...
                </p>
              </>
            ) : (
              <>
                <i
                  className={`ti ti-cloud-upload text-[34px] transition-transform duration-200 ${
                    isDragging ? "-translate-y-1 text-blue" : "text-navy"
                  }`}
                />
                <p className="text-[13px] font-bold text-navy">
                  {isDragging
                    ? "Drop your file here"
                    : "Drag & drop your Excel file here"}
                </p>
                <p className="text-[12px] text-muted">
                  or <span className="font-semibold text-blue">browse</span> to
                  choose a file
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  .xlsx, .xls or .csv · up to {MAX_SIZE_MB} MB
                </p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleInputChange}
            className="hidden"
          />

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-[9px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
            >
              <i className="ti ti-alert-circle mt-px shrink-0 text-[14px]" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

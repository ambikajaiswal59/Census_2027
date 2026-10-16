import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { useUpload } from "../context/UploadContext.jsx";

const REQUIRED_COLUMNS = 4;
const MAX_SIZE_MB = 5;
const MAX_ROWS = 10000;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

// The 4 headings the downloadable template ships with. Column 1 (State / UT)
// is only a backend reference used later to match rows to the map — it is
// never shown as a selectable dataset in the UI. Columns 2-4 are the user's
// own data and show up as selectable parameters after upload.
const TEMPLATE_COLUMNS = ["State / UT", "Dataset 1", "Dataset 2", "Dataset 3"];
const TEMPLATE_SAMPLE_ROW = ["Uttar Pradesh", "", "", ""];

function downloadTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    TEMPLATE_COLUMNS,
    TEMPLATE_SAMPLE_ROW,
  ]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "upload-template.xlsx");
}

function lastFilledIndex(row) {
  for (let i = row.length - 1; i >= 0; i -= 1) {
    if (String(row[i] ?? "").trim() !== "") return i;
  }
  return -1;
}

// Reads the first sheet and returns { fileName, columns, rows }.
// Throws an Error with a friendly message when the file isn't valid.
async function parseSheet(file) {
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
      "The first row must contain a heading for each of the 3 columns.",
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

  return { fileName: file.name, columns, rows };
}

export default function UploadModal() {
  const { isModalOpen, closeModal, setUploadedData } = useUpload();

  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState("");

  // Start clean every time the modal opens.
  useEffect(() => {
    if (isModalOpen) {
      setError("");
      setIsDragging(false);
      setIsParsing(false);
    }
  }, [isModalOpen]);

  // Esc closes the modal.
  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  async function handleFile(file) {
    if (!file) return;

    setError("");
    setIsParsing(true);

    try {
      const data = await parseSheet(file);
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
                It has 3 columns — fill in your data under each heading, then
                upload the completed file below.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadTemplate}
              className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-soft"
            >
              <i className="ti ti-download" />
              Template
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

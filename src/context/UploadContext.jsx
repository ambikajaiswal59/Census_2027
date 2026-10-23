import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// The two dashboard levels an upload can belong to.
export const STATE_LEVEL = "State / UT";
export const DISTRICT_LEVEL = "District";

// How each level's sheet is laid out. The first `keyColumns` columns are
// backend references used to match rows to the map/table (never shown as
// selectable datasets); every column after them is a user dataset.
export const UPLOAD_LEVELS = {
  [STATE_LEVEL]: {
    keyColumns: 1,
    stateColumn: 0,
    districtColumn: null,
    templateColumns: ["State / UT", "Dataset 1", "Dataset 2", "Dataset 3"],
    templateSampleRow: ["Uttar Pradesh", "", "", ""],
    templateFileName: "state-upload-template.xlsx",
  },
  // District sheet: District comes first, then its State / UT.
  [DISTRICT_LEVEL]: {
    keyColumns: 2,
    stateColumn: 1,
    districtColumn: 0,
    templateColumns: [
      "District",
      "State / UT",
      "Dataset 1",
      "Dataset 2",
      "Dataset 3",
    ],
    templateSampleRow: ["Lucknow", "Uttar Pradesh", "", "", ""],
    templateFileName: "district-upload-template.xlsx",
  },
};

// Safe defaults, so components like Header still work if used outside the provider.
const UploadContext = createContext({
  uploadEnabled: false,
  setUploadEnabled: () => {},
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  dashboardLevel: STATE_LEVEL,
  setDashboardLevel: () => {},
  uploadsByLevel: { [STATE_LEVEL]: null, [DISTRICT_LEVEL]: null },
  setUploadedData: () => {},
  clearUploadedData: () => {},
  selectedUpload: null,
  setSelectedUpload: () => {},
});

/**
 * Holds everything the header button, the upload modal and the sidebar share:
 * - uploadEnabled:   whether the current page wants the Upload button in the header
 * - isModalOpen:     whether the upload modal is showing
 * - dashboardLevel:  the level the dashboard is currently on (kept in sync by the
 *                    page) so the modal can default to it
 * - uploadsByLevel:  one upload per level:
 *                    { "State / UT": data | null, "District": data | null } where
 *                    data = { level, keyColumns, fileName, columns, rows }
 * - selectedUpload:  { level, index } — the single uploaded dataset column that is
 *                    currently the active choice (or null). Only one field is ever
 *                    active across Parameters + Customer Input.
 */
export function UploadProvider({ children }) {
  const [uploadEnabled, setUploadEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardLevel, setDashboardLevel] = useState(STATE_LEVEL);
  const [uploadsByLevel, setUploadsByLevel] = useState({
    [STATE_LEVEL]: null,
    [DISTRICT_LEVEL]: null,
  });
  const [selectedUpload, setSelectedUpload] = useState(null);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Replacing a level's sheet resets the pick if it pointed at that level,
  // since the old column may not exist (or may now be empty) in the new sheet.
  const setUploadedData = useCallback((data) => {
    setUploadsByLevel((previous) => ({ ...previous, [data.level]: data }));
    setSelectedUpload((previous) =>
      previous?.level === data.level ? null : previous,
    );
  }, []);

  const clearUploadedData = useCallback((level) => {
    setUploadsByLevel((previous) => ({ ...previous, [level]: null }));
    setSelectedUpload((previous) =>
      previous?.level === level ? null : previous,
    );
  }, []);

  const value = useMemo(
    () => ({
      uploadEnabled,
      setUploadEnabled,
      isModalOpen,
      openModal,
      closeModal,
      dashboardLevel,
      setDashboardLevel,
      uploadsByLevel,
      setUploadedData,
      clearUploadedData,
      selectedUpload,
      setSelectedUpload,
    }),
    [
      uploadEnabled,
      isModalOpen,
      openModal,
      closeModal,
      dashboardLevel,
      uploadsByLevel,
      setUploadedData,
      clearUploadedData,
      selectedUpload,
    ],
  );

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}

export function useUpload() {
  return useContext(UploadContext);
}

/**
 * Call this inside a page to show the Upload button in the header
 * while that page is on screen (and hide it again when the page unmounts).
 */
export function useEnableUpload() {
  const { setUploadEnabled } = useUpload();

  useEffect(() => {
    setUploadEnabled(true);
    return () => setUploadEnabled(false);
  }, [setUploadEnabled]);
}
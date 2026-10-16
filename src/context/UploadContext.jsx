import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Safe defaults, so components like Header still work if used outside the provider.
const UploadContext = createContext({
  uploadEnabled: false,
  setUploadEnabled: () => {},
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  uploadedData: null,
  setUploadedData: () => {},
  clearUploadedData: () => {},
  selectedUploadColumn: null,
  setSelectedUploadColumn: () => {},
});

/**
 * Holds everything the header button, the upload modal and the sidebar share:
 * - uploadEnabled:         whether the current page wants the Upload button in the header
 * - isModalOpen:           whether the upload modal is showing
 * - uploadedData:          { fileName, columns: [3 headings], rows: [[a, b, c], ...] } or null
 *                          columns[0] is treated as the location name (State/UT or District)
 *                          used to match rows to the map; columns[1]/[2] are user data.
 * - selectedUploadColumn:  index (1 or 2) of the uploaded column currently picked as the
 *                          active parameter, so it can drive the map later.
 */
export function UploadProvider({ children }) {
  const [uploadEnabled, setUploadEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedData, setUploadedDataState] = useState(null);
  const [selectedUploadColumn, setSelectedUploadColumn] = useState(null);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Replacing the uploaded sheet resets which column is picked, since the
  // old selection may not exist (or may now be empty) in the new sheet.
  const setUploadedData = useCallback((data) => {
    setUploadedDataState(data);
    setSelectedUploadColumn(null);
  }, []);

  const clearUploadedData = useCallback(() => {
    setUploadedDataState(null);
    setSelectedUploadColumn(null);
  }, []);

  const value = useMemo(
    () => ({
      uploadEnabled,
      setUploadEnabled,
      isModalOpen,
      openModal,
      closeModal,
      uploadedData,
      setUploadedData,
      clearUploadedData,
      selectedUploadColumn,
      setSelectedUploadColumn,
    }),
    [
      uploadEnabled,
      isModalOpen,
      openModal,
      closeModal,
      uploadedData,
      setUploadedData,
      clearUploadedData,
      selectedUploadColumn,
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
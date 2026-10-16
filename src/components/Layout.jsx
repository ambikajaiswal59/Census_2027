import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import UploadModal from "./UploadModal.jsx";
import { UploadProvider } from "../context/UploadContext.jsx";

export default function Layout() {
  return (
    <UploadProvider>
      {/* The screen is split: header on top (full width), scrollable area below it. */}
      <div className="flex h-[100dvh] flex-col">
        <Header />

        {/* The page scrolls here, so the scrollbar starts below the header.
            data-scroll-root lets the header's mobile row react to this scrolling. */}
        <div
          data-scroll-root
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1">
            <Outlet />
          </div>

          <Footer />
        </div>
      </div>

      {/* Opened by the Upload button in the header */}
      <UploadModal />
    </UploadProvider>
  );
}
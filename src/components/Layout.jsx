import { Link, Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import UploadModal from "./UploadModal.jsx";
import { UploadProvider } from "../context/UploadContext.jsx";

export default function Layout() {
  // Every page except Home gets a Back button, just below the header.
  const showBack = useLocation().pathname !== "/";

  return (
    <UploadProvider>
      {/* The screen is split: header on top (full width), scrollable area below it. */}
      <div className="flex h-[100dvh] flex-col">
        <Header />

        {/* The page scrolls here, so the scrollbar starts below the header.
            data-scroll-root lets the header's mobile row react to this scrolling. */}
        <div
          data-scroll-root
          className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]"
        >
          <div className="flex-1">
            {showBack && (
              <div className="mx-auto -mb-2 w-full max-w-wrap px-3 pt-1.5 sm:px-6">
                <Link
                  to="/"
                  aria-label="Back to Home"
                  className="inline-flex select-none items-center gap-1.5 rounded-full border border-[#DDE4EE] bg-gradient-to-b from-white to-[#EEF2F8] px-3 py-1 text-[11px] font-bold text-navy shadow-[inset_0_1px_0_#fff,0_3px_0_#D3DAE6,0_8px_14px_-4px_rgba(2,2,68,.25)] transition-all duration-150 ease-out hover:-translate-y-px active:translate-y-[2px] active:shadow-[inset_0_1px_0_#fff,0_1px_0_#D3DAE6] motion-reduce:transition-none"
                >
                  <i className="ti ti-arrow-left text-[12px]" />
                  Back
                </Link>
              </div>
            )}
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

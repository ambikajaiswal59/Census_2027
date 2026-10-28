import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// Only the small meta file (not the full census tables), so the year follows the stored data.
import censusMeta from "../data/census/meta.json";
import { scrollToSection } from "../utils.js";

const navLinks = [
  { href: "#directory", label: "Directory", key: "directory" },
  { href: "#phases", label: "Census 2027", key: "census" },
  {
    href: "https://lgdirectory.gov.in/",
    label: "Sources",
    key: "sources",
    external: true,
  },
];

// The census year is shown on this page only.
const DASHBOARD_PATH = "/population-dashboard";

export default function Header({ onScrollToCensus, onScrollToDirectory }) {
  const [showMobileRow, setShowMobileRow] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef(null);
  const navigate = useNavigate();
  const showCensusYear = useLocation().pathname === DASHBOARD_PATH;

  useEffect(() => {
    let lastY = 0;

    // The page now scrolls inside the element marked data-scroll-root (see Layout),
    // not the window. Scroll events don't bubble, so listen in the capture phase.
    function onScroll(e) {
      const target = e.target;

      if (!target?.hasAttribute?.("data-scroll-root")) return;

      const y = target.scrollTop;

      if (y < 80) setShowMobileRow(true);
      else if (y > lastY) setShowMobileRow(false);
      else if (y < lastY) setShowMobileRow(true);

      lastY = y;
    }

    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });

    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);

  // Close the Admin dropdown on an outside click
  useEffect(() => {
    function onDocClick(e) {
      if (adminRef.current && !adminRef.current.contains(e.target))
        setAdminOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleClick(e, link) {
    e.preventDefault();

    if (link.external) {
      window.open(link.href, "_blank", "noreferrer");
      return;
    }

    const sectionId = link.key === "census" ? "phases" : "directory";
    const customScroll =
      link.key === "census" ? onScrollToCensus : onScrollToDirectory;

    if (customScroll) {
      customScroll();
      return;
    }

    const target = document.getElementById(sectionId);

    if (target) {
      // Already on the Home page: scroll straight to the section.
      scrollToSection(target);
    } else {
      // On another page: go to Home; it reads the hash and scrolls on load.
      navigate(`/#${sectionId}`);
    }
  }

  return (
    // Not sticky any more: Layout keeps the header on top and scrolls the area below it.
    <header className="relative z-20 w-full shrink-0 bg-navy shadow-[0_3px_18px_rgba(0,0,0,.13)]">
      <div className="mx-auto w-full max-w-wrap px-3 sm:px-6">
        <nav className="relative flex min-h-[62px] items-center justify-between gap-2 py-2 sm:min-h-[70px] sm:py-0">

          {/* Census year, centred in the header (large screens, dashboard page only) */}
          {showCensusYear && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <span className="whitespace-nowrap  text-[25px] font-bold tracking-wide text-[#e4c411]">
                Census <span className="font-extrabold">{censusMeta.year}</span>
              </span>
            </div>
          )}

          {/* Logo + name: shrinks (never pushes the buttons off-screen) on small phones */}
          <Link
            to="/"
            className="flex min-w-0 shrink items-center gap-2 sm:gap-3"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center sm:h-[60px] sm:w-[60px]">
              <img
                src="/images/ML_Info_Icon.png"
                alt="ML Infomap Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              {/* Letter spacing is tighter on phones so the name fits next to the buttons */}
              <div className="-mb-2 -mt-2 whitespace-nowrap text-[16px] font-extrabold tracking-wider text-[#e4c411] min-[400px]:text-[18px] sm:text-[22px] sm:tracking-widest">
                ML Infomap
              </div>
              <div className="whitespace-nowrap text-[10px] tracking-wide text-[#e4c411] min-[400px]:text-[12px] sm:text-[14px] sm:tracking-widest">
                Maps, Apps &amp; Data
              </div>
            </div>
          </Link>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-5">
            <div className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(e) => handleClick(e, link)}
                  className="text-sm text-[#C4D0DF] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <a
              className="
            whitespace-nowrap
            rounded-lg
            border border-[#e4c411]
            px-2 py-1.5
            text-[11px] font-semibold text-[#e4c411]
            transition-all duration-200 ease-in-out

            hover:bg-gradient-to-r
            hover:from-[#F2C078]
            hover:to-[#F5D84A]
            hover:text-[#071b36]
            hover:shadow-[0_0_14px_rgba(242,192,120,0.3)]

            active:scale-[0.97]

            min-[400px]:px-3 min-[400px]:text-[12px]
            sm:px-4 sm:py-2 sm:text-[14px]
            lg:px-5 lg:py-2.5 lg:text-[15px]
          "
              href="https://aajkabharatweb.com/"
              target="_blank"
              rel="noreferrer"
            >
              Aaj Ka Bharat
              <span className="hidden min-[400px]:inline">&nbsp;&#8599;</span>
            </a>

            {/* Admin dropdown — hardcoded placeholder menu for now */}
            {/* <div ref={adminRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAdminOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-2.5 text-white hover:bg-white/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <i className="ti ti-user-circle text-base" />
                </span>
                <span className="text-[13px] font-semibold">Admin</span>
                <i
                  className={`ti ti-chevron-down text-xs transition-transform duration-150 ${adminOpen ? "rotate-180" : ""}`}
                />
              </button>

              {adminOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[160px] overflow-hidden rounded-[9px] border border-line bg-white shadow-card">
                  {["Profile", "Settings", "Log out"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="block w-full px-3.5 py-2.5 text-left text-[13px] text-text hover:bg-soft"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div> */}
          </div>
        </nav>

        {/* Collapses its height (not just its opacity) so no empty space is left behind */}
        <div
          className="grid md:hidden"
          style={{
            gridTemplateRows: showMobileRow ? "1fr" : "0fr",
            opacity: showMobileRow ? 1 : 0,
            pointerEvents: showMobileRow ? "auto" : "none",
            transition:
              "grid-template-rows 300ms ease-in-out, opacity 300ms ease-in-out",
          }}
          aria-hidden={!showMobileRow}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex items-center justify-between border-t border-white/10 py-2.5">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(e) => handleClick(e, link)}
                  tabIndex={showMobileRow ? 0 : -1}
                  className="px-1 text-sm text-[#C4D0DF] hover:text-white"
                >
                  {link.label}
                </a>
              ))}

              {showCensusYear && (
                <span className="whitespace-nowrap  px-2.5 py-0.5 text-[11px] font-semibold text-[#e4c411]">
                  Census {censusMeta.year}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
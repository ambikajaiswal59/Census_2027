import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const navLinks = [
  { href: "#directory", label: "Directory", key: "directory" },
  { href: "#phases", label: "Census 2027", key: "census" },
  // "Sources" is a dropdown (see SOURCE_LINKS and <SourcesMenu />)
  { href: "#", label: "Sources", key: "sources", menu: true },
];

// The two options inside the Sources dropdown.
const SOURCE_LINKS = [
  {
    label: "Census of India",
    href: "https://censusindia.gov.in/census.website/en",
  },
  {
    label: "Local Government Directory",
    href: "https://lgdirectory.gov.in/",
  },
];

// "Sources" button with a dropdown of external links. The list is drawn in a portal
// (fixed position) so the header's own overflow never clips it, including the mobile
// lower row.
function SourcesMenu({ label, className }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const MENU_WIDTH = 250;

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Right edge lined up with the button, kept inside the screen.
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 8,
    );

    setPos({ top: rect.bottom + 8, left });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return undefined;

    const close = () => setOpen(false);

    const onDown = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        close();
      }
    };

    const onKey = (event) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 ${className}`}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="fixed z-[70] overflow-hidden rounded-xl border border-white/10 bg-navy p-1.5 shadow-[0_14px_30px_rgba(0,0,0,.35)]"
          >
            {SOURCE_LINKS.map((item) => (
              <a
                key={item.href}
                role="menuitem"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C4D0DF] transition-colors duration-150 hover:bg-white/10 hover:text-white"
              >
                {item.label}
                <span aria-hidden="true">&#8599;</span>
              </a>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

export default function Header({ onScrollToCensus, onScrollToDirectory }) {
  const [showMobileRow, setShowMobileRow] = useState(true);

  useEffect(() => {
    let lastY = 0;
    let accumulatedScroll = 0;

    const SCROLL_THRESHOLD = 50;

    // The page scrolls inside the area marked data-scroll-root (below the header),
    // or in the window on pages without it. Scroll events do not bubble, so listen
    // in the capture phase and pick the right scroller.
    function onScroll(e) {
      const target = e.target;
      const isRoot = target?.hasAttribute?.("data-scroll-root");

      if (target !== document && !isRoot) return;

      const y = isRoot ? target.scrollTop : window.scrollY;
      const delta = y - lastY;

      // Always show at the very top
      if (y <= 20) {
        setShowMobileRow(true);
        accumulatedScroll = 0;
        lastY = y;
        return;
      }

      // Add movement in the current direction
      accumulatedScroll += delta;

      // Scrolling DOWN enough → collapse
      if (accumulatedScroll >= SCROLL_THRESHOLD) {
        setShowMobileRow(false);
        accumulatedScroll = 0;
      }

      // Scrolling UP enough → expand
      else if (accumulatedScroll <= -SCROLL_THRESHOLD) {
        setShowMobileRow(true);
        accumulatedScroll = 0;
      }

      lastY = y;
    }

    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });

    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);

  function handleClick(e, link) {
    if (link.key === "census") {
      e.preventDefault();
      onScrollToCensus();
    } else if (link.key === "directory") {
      e.preventDefault();
      onScrollToDirectory();
    }
  }

  return (
    <header className="sticky top-0 z-20 w-full shrink-0 bg-navy shadow-[0_3px_18px_rgba(0,0,0,.13)]">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* ================= TOP ROW ================= */}
        <nav className="flex min-h-[72px] items-center justify-between gap-2 py-2 sm:min-h-[84px] lg:min-h-[100px] sm:py-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Logo */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center sm:h-14 sm:w-14 lg:h-[68px] lg:w-[68px]">
              <img
                src="/images/ML_Info_Icon.png"
                alt="ML Infomap Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 ">
              <div className="-mb-2 -mt-2 whitespace-nowrap text-[18px] font-extrabold tracking-[0.15rem] text-[#e4c411]  sm:text-[25px]">
                ML Infomap
              </div>

              <div className="whitespace-nowrap text-[13px] tracking-[0.12rem]  text-[#e4c411] sm:text-[14px]">
                Maps, Apps & Data
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-5">
            {/* Desktop navigation */}
            <div className="hidden items-center gap-6 md:flex lg:gap-8">
              {navLinks.map((link) =>
                link.menu ? (
                  <SourcesMenu
                    key={link.key}
                    label={link.label}
                    className="text-sm text-[#C4D0DF] transition-colors duration-150 hover:text-white sm:text-base lg:text-[17px]"
                  />
                ) : (
                  <a
                    key={link.key}
                    href={link.href}
                    onClick={(e) => handleClick(e, link)}
                    className="text-sm text-[#C4D0DF] transition-colors duration-150 hover:text-white sm:text-base lg:text-[17px]"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>

            {/* Aaj Ka Bharat */}
            <a
              className="
            whitespace-nowrap
            rounded-lg
            border border-[#F2C078]
            px-3 py-1.5
            text-[12px] font-semibold text-[#F2C078]
            transition-all duration-200 ease-in-out

            hover:bg-gradient-to-r
            hover:from-[#F2C078]
            hover:to-[#F5D84A]
            hover:text-[#071b36]
            hover:shadow-[0_0_14px_rgba(242,192,120,0.3)]

            active:scale-[0.97]

            sm:px-4 sm:py-2 sm:text-[14px]
            lg:px-5 lg:py-2.5 lg:text-[15px]
          "
              href="https://aajkabharatweb.com/"
              target="_blank"
              rel="noreferrer"
            >
              Aaj Ka Bharat &#8599;
            </a>
          </div>
        </nav>

        {/* ================= MOBILE LOWER ROW ================= */}
        <div
          className={`
        overflow-hidden
        border-t border-white/10
        transition-all duration-300 ease-in-out
        md:hidden
        ${
          showMobileRow
            ? "max-h-[56px] opacity-100"
            : "max-h-0 opacity-0 border-t-0"
        }
      `}
        >
          <div className="flex items-center justify-between py-3">
            {navLinks.map((link) =>
              link.menu ? (
                <SourcesMenu
                  key={link.key}
                  label={link.label}
                  className="px-1 text-sm text-[#C4D0DF] hover:text-white"
                />
              ) : (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(e) => handleClick(e, link)}
                  className="px-1 text-sm text-[#C4D0DF] hover:text-white"
                >
                  {link.label}
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

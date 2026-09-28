import { useState, useEffect } from "react";

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

export default function Header({ onScrollToCensus, onScrollToDirectory }) {
  const [showMobileRow, setShowMobileRow] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let accumulatedScroll = 0;

    const SCROLL_THRESHOLD = 50;

    function onScroll() {
      const y = window.scrollY;
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

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
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
    <header className="sticky top-0 z-20 bg-navy shadow-[0_3px_18px_rgba(0,0,0,.13)]">
      <div className="mx-auto w-full max-w-wrap px-4 sm:px-6">
        {/* ================= TOP ROW ================= */}
        <nav className="flex min-h-[62px] sm:min-h-[70px] items-center justify-between gap-2 py-2 sm:py-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center sm:h-[60px] sm:w-[60px]">
              <img
                src="/images/ML_Info_Icon.png"
                alt="ML Infomap Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="-mb-2 -mt-2 whitespace-nowrap text-[18px] font-extrabold text-[#e4c411] sm:text-[22px]">
                ML Infomap
              </div>

              <div className="whitespace-nowrap text-[13px] text-[#e4c411] sm:text-[14px]">
                2027 Map Data
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-5">
            {/* Desktop navigation */}
            <div className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  onClick={(e) => handleClick(e, link)}
                  className="text-sm text-[#C4D0DF] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Aaj Ka Bharat */}
            <a
              className="
    whitespace-nowrap
    rounded-[7px]
    border border-[#e4c411]
    px-2.5 py-1.5
    text-[12px] text-[#e4c411]
    transition-all duration-200 ease-in-out

    hover:bg-gradient-to-r
    hover:from-[#e4c411]
    hover:to-[#f5d84a]
    hover:text-[#071b36]
    hover:shadow-[0_0_14px_rgba(228,196,17,0.3)]

    active:scale-[0.97]

    sm:px-3.5 sm:py-2
    sm:text-[15px]
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
                ? "max-h-[50px] opacity-100"
                : "max-h-0 opacity-0 border-t-0"
            }
          `}
        >
          <div className="flex items-center justify-between py-2.5">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                onClick={(e) => handleClick(e, link)}
                className="px-1 text-sm text-[#C4D0DF] hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

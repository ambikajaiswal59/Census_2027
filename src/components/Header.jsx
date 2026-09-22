const navLinks = [
  { href: '#directory', label: 'Directory', key: 'directory' },
  { href: '#phases', label: 'Census 2027', key: 'census' },
  { href: 'https://lgdirectory.gov.in/', label: 'Sources', key: 'sources', external: true },
]

export default function Header({ onScrollToCensus, onScrollToDirectory }) {
  function handleClick(e, link) {
    if (link.key === 'census') {
      e.preventDefault()
      onScrollToCensus()
    } else if (link.key === 'directory') {
      e.preventDefault()
      onScrollToDirectory()
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-navy shadow-[0_3px_18px_rgba(0,0,0,.13)]">
      <div className="mx-auto w-full max-w-wrap px-4 sm:px-6">
        {/* Row 1: logo + title + Aaj Ka Bharat (+ desktop links) */}
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
            {/* Desktop links */}
            <div className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noreferrer' : undefined}
                  onClick={(e) => handleClick(e, link)}
                  className="text-sm text-[#C4D0DF] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <a
              className="whitespace-nowrap rounded-[7px] border border-[#e4c411] px-2.5 py-1.5 text-[12px] text-[#e4c411] sm:px-3.5 sm:py-2 sm:text-[15px]"
              href="https://aajkabharatweb.com/"
              target="_blank"
              rel="noreferrer"
            >
              Aaj Ka Bharat ↗
            </a>
          </div>
        </nav>

        {/* Row 2: mobile-only links, always visible (no hamburger) */}
        <div className="flex items-center justify-between border-t border-white/10 py-2.5 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer' : undefined}
              onClick={(e) => handleClick(e, link)}
              className="px-1 text-sm text-[#C4D0DF] hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
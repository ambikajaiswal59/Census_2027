import { useState } from 'react'

const navLinks = [
  { href: '#directory', label: 'Directory', key: 'directory' },
  { href: '#phases', label: 'Census 2027', key: 'census' },
  { href: 'https://lgdirectory.gov.in/ ', label: 'Sources', key: 'sources', external: true },
]

export default function Header({ onScrollToCensus, onScrollToDirectory }) {
  const [open, setOpen] = useState(false)

  function handleClick(e, link) {
    setOpen(false)
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
        <nav className="flex min-h-[62px] sm:min-h-[70px] flex-wrap items-center justify-between gap-5 py-2 sm:py-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-[45px] sm:w-[45px] items-center justify-center bg-white ">
              <img src="/images/ML_Info_Icon.jpeg" alt="ML Infomap Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="text-[15px] sm:text-[17px] font-extrabold text-[#e4c411]">ML Infomap</div>
              <div className="mt-0.5 text-[10px] sm:text-[11px] text-[#cdcb6a]">2027 Map Data</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-5">
            <div className="hidden md:flex items-center gap-6">
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
              className="whitespace-nowrap rounded-[7px] border border-[#e4c411] px-2.5 py-2 text-[13px] text-[#e4c411] sm:px-3.5 sm:text-[15px]"
              href="https://aajkabharatweb.com/"
              target="_blank"
              rel="noreferrer"
            >
              Aaj Ka Bharat ↗
            </a>

            <button
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[7px] border border-white/[.18] text-[19px] text-[#C4D0DF] hover:border-white/35 hover:text-white md:hidden"
            >
              <i className="ti ti-menu-2" />
            </button>
          </div>
        </nav>

        {open && (
          <div className="flex flex-col gap-0.5 border-t border-white/10 py-2 pb-4 md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                onClick={(e) => handleClick(e, link)}
                className="border-b border-white/[.06] px-1 py-[11px] text-sm text-[#C4D0DF] hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

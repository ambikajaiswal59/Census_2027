import { useEffect } from 'react'
import { phaseData } from '../data/phaseData.js'
import { sourceData } from '../data/sourceData.js'

export default function PhaseModal({ activeItem, onClose }) {
  const isOpen = !!activeItem
  const isSource = activeItem?.type === 'source'
  const item = isOpen ? (isSource ? sourceData[activeItem.index] : phaseData[activeItem.index]) : null

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !item) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/[.55] p-6 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-[620px] animate-modalIn overflow-y-auto rounded-2xl bg-white p-5 shadow-modal sm:p-[27px_29px] max-h-[82vh]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-[18px] top-[18px] grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-white text-[15px] text-muted hover:bg-bgApp hover:text-navy"
        >
          ✕
        </button>

        <div className="mb-[18px] pr-[30px]">
          {isSource ? (
            <div className="mb-1.5 text-[17px] font-extrabold tracking-[.11em] text-saffron">
              {item.source.toUpperCase()} · {item.date}
            </div>
          ) : (
            <div className="mb-1.5 text-[15px] font-extrabold tracking-[.11em] text-blue">
              CENSUS 2027 · PHASE {String(activeItem.index + 1).padStart(2, '0')}
            </div>
          )}
          <h2 className="font-serif text-[22px] text-navy sm:text-[25px]">{item.title}</h2>
          {!isSource && (
            <span className="mt-2.5 inline-block h-[25px] whitespace-nowrap rounded-2xl bg-green2 px-2 py-1 text-[10px] text-green">
              {item.tag}
            </span>
          )}
        </div>

        {!isSource && item.image && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <img src={item.image} alt={item.title} className="block w-full" />
          </div>
        )}

        <div>
          <p className="mt-4 text-[13px] leading-[1.7] text-muted">
            {isSource ? item.summary : item.detail}
          </p>
          <ul className="mt-3.5 list-disc pl-[18px]">
            {item.points.map((pt) => (
              <li key={pt} className="mb-[7px] text-[12.5px] leading-[1.65] text-muted">
                {pt}
              </li>
            ))}
          </ul>
        </div>

        {isSource && (
          <div className="mt-[18px] flex justify-end border-t border-line pt-4">
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[9px] bg-blue px-[15px] py-2.5 text-xs font-bold text-white hover:bg-navy2"
            >
              Read Full  <i className="ti ti-external-link" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
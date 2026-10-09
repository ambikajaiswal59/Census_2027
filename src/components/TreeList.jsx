import { useRef } from 'react'

export default function TreeList({ items, activeLevel, onSelect, orientation = 'vertical' }) {
  const isHorizontal = orientation === 'horizontal'
  const itemRefs = useRef({})

  function handleClick(level) {
    onSelect(level)
    const el = itemRefs.current[level]
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest',
      })
    }
  }

  // ─────────────────────────────────────────────────────────
  // HORIZONTAL — Separate bordered tabs
  // ─────────────────────────────────────────────────────────
  if (isHorizontal) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isActive = item.level === activeLevel
          return (
            <button
              key={item.level}
              ref={(el) => { itemRefs.current[item.level] = el }}
              onClick={() => handleClick(item.level)}
              type="button"
              className={`
                flex flex-shrink-0 cursor-pointer items-center gap-2.5
                whitespace-nowrap rounded-lg border-2 bg-white
                px-4 py-2 text-[13px] transition-all duration-150
                ${
                  isActive
                    ? 'border-[#0F2A4A] text-[#0F2A4A] font-semibold shadow-sm'
                    : 'border-[#E4E8EF] text-[#5A6473] font-medium hover:border-[#0F2A4A]/40 hover:text-[#0F2A4A]'
                }
              `}
            >
              <span>{item.label}</span>
              <span
                className={`
                  rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums
                  ${
                    isActive
                      ? 'bg-[#0F2A4A] text-white'
                      : 'bg-[#E1E6ED] text-[#5A6473]'
                  }
                `}
              >
                {item.value}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  // VERTICAL — Separate bordered rows
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const isActive = item.level === activeLevel
        return (
          <button
            key={item.level}
            ref={(el) => { itemRefs.current[item.level] = el }}
            onClick={() => handleClick(item.level)}
            type="button"
            className={`
              flex w-full cursor-pointer items-center justify-between gap-3
              rounded-lg border-2 bg-white px-3.5 py-2.5 text-[13px]
              transition-all duration-150
              ${
                isActive
                  ? 'border-[#0F2A4A] text-[#0F2A4A] font-semibold shadow-sm'
                  : 'border-[#E4E8EF] text-[#5A6473] font-medium hover:border-[#0F2A4A]/40 hover:text-[#0F2A4A]'
              }
            `}
          >
            <span>{item.label}</span>
            <span
              className={`
                rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums
                ${
                  isActive
                    ? 'bg-[#0F2A4A] text-white'
                    : 'bg-[#E1E6ED] text-[#5A6473]'
                }
              `}
            >
              {item.value}
            </span>
          </button>
        )
      })}
    </div>
  )
}
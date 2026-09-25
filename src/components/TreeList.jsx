import { useRef } from 'react'

export default function TreeList({ items, activeLevel, onSelect, orientation = 'vertical' }) {
  const isHorizontal = orientation === 'horizontal'
  // CHANGE: a ref object to hold a reference to each pill's actual DOM
  // element, keyed by its level — so we can call browser scroll methods
  // on the specific one that was clicked
  const itemRefs = useRef({})

  // CHANGE: wraps the existing onSelect call, then scrolls the clicked
  // item into view
  function handleClick(level) {
    onSelect(level)
    const el = itemRefs.current[level]
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',   // animate the scroll instead of snapping instantly
        inline: 'nearest',    // horizontal positioning — see explanation below
        block: 'nearest',     // vertical positioning — irrelevant here, kept safe
      })
    }
  }

  return (
    <div className={isHorizontal ? 'flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}>
      {items.map((item) => {
        const isActive = item.level === activeLevel
        return (
          <div
            key={item.level}
            // CHANGE: attaches this specific DOM node to itemRefs, so
            // itemRefs.current['District'] (for example) points at the
            // actual <div> for the Districts pill
            ref={(el) => { itemRefs.current[item.level] = el }}
            onClick={() => handleClick(item.level)}
            className={
              isHorizontal
                ? `flex flex-shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] transition-colors duration-150 hover:bg-[#F7F9FC] ${
                    isActive ? 'border-blue bg-blue2' : 'border-[#EEF1F5] bg-white'
                  }`
                : `flex cursor-pointer justify-between rounded-lg border-b border-[#EEF1F5] px-2.5 py-2.5 text-xs transition-colors duration-150 hover:bg-[#F7F9FC] ${
                    isActive ? 'bg-blue2' : ''
                  }`
            }
          >
            <strong className={`font-bold ${isActive ? 'text-blue' : ''}`}>{item.label}</strong>
            <span className={isActive ? 'text-blue' : 'text-[#8A95A5]'}>{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}
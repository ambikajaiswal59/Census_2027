export default function TreeList({ items, activeLevel, onSelect }) {
  return (
    <div>
      {items.map((item) => {
        const isActive = item.level === activeLevel
        return (
          <div
            key={item.level}
            onClick={() => onSelect(item.level)}
            className={`flex cursor-pointer justify-between rounded-lg border-b border-[#EEF1F5] px-2.5 py-2.5 text-xs transition-colors duration-150 hover:bg-[#F7F9FC] ${
              isActive ? 'bg-blue2' : ''
            }`}
          >
            <strong className={`font-bold ${isActive ? 'text-blue' : ''}`}>{item.label}</strong>
            <span className={isActive ? 'text-blue' : 'text-[#8A95A5]'}>{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}
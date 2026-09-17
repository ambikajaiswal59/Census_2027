export default function TreeList({ items }) {
  return (
    <div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex justify-between border-b border-[#EEF1F5] px-2.5 py-2.5 text-xs"
        >
          <strong className="font-bold">{item.label}</strong>
          <span className="text-[#8A95A5]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

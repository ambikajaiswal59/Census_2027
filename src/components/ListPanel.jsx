import ListRow from './ListRow.jsx'

export default function ListPanel({ icon, title, subtitle, items, variant = 'phase', countLabel, onOpenItem }) {
  const isSource = variant === 'source'

  return (
    <div
      className={`mb-[30px] rounded-2xl border border-line bg-white p-[21px] shadow-card border-t-[3px] ${
        isSource ? 'border-t-saffron' : 'border-t-blue'
      }`}
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h3 className="m-0 flex items-center gap-2 font-sans text-[15px] font-extrabold text-navy">
            <span
              className={`grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-lg text-sm ${
                isSource ? 'bg-[#FBEBD8] text-saffron' : 'bg-blue2 text-blue'
              }`}
            >
              <i className={`ti ${icon}`} />
            </span>
            {title}
          </h3>
          <span className="ml-[34px] mt-[3px] block text-[11px] font-medium text-muted">{subtitle}</span>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isSource ? 'bg-[#FBEBD8] text-saffron' : 'bg-soft text-muted'
          }`}
        >
          {countLabel}
        </span>
      </div>

      {/* CHANGE: grid-template-columns is now responsive. On mobile, a
          single flexible column (grid-cols-1) — no forced minimum width,
          so it can never be wider than the screen. From sm: up, restores
          the original auto-fill/minmax(300px,1fr) card-grid behavior */}
      <div className="grid max-h-[520px] grid-cols-1 gap-2.5 overflow-y-auto pr-2 sm:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {items.map((item, i) => (
          <ListRow
            key={item.title}
            icon={item.icon}
            variant={variant}
            title={item.title}
            subtitle={isSource ? `${item.source} · ${item.date}` : item.summary}
            tagLabel={isSource ? item.source : item.tag}
            onOpen={() => onOpenItem(i)}
          />
        ))}
      </div>
    </div>
  )
}
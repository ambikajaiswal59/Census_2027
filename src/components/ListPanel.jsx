import { useLayoutEffect, useRef, useState } from "react";
import ListRow from "./ListRow.jsx";

export default function ListPanel({
  icon,
  title,
  subtitle,
  items,
  variant = "phase",
  countLabel,
  onOpenItem,
  maxRows, // when set, the list is only this many rows tall and scrolls after that
}) {
  const isSource = variant === "source";

  // The "Official updates & sources" list shows two rows, then scrolls as news is added.
  const visibleRows = maxRows ?? (isSource ? 2 : null);

  const gridRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(null);

  // Measured from the real rows, so it stays right on phones (one column) and on
  // wide screens (several columns), whatever the row height is.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || !visibleRows) return undefined;

    const measure = () => {
      const rows = Array.from(grid.children);
      if (rows.length === 0) {
        setMaxHeight(null);
        return;
      }

      const gridTop = grid.getBoundingClientRect().top;
      // Group the cards into visual rows by their top edge.
      const rowTops = [];
      let lastBottom = 0;

      rows.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const top = Math.round(rect.top - gridTop + grid.scrollTop);
        if (!rowTops.some((t) => Math.abs(t - top) < 4)) rowTops.push(top);
        if (rowTops.length <= visibleRows) {
          lastBottom = Math.max(lastBottom, top + rect.height);
        }
      });

      // Fewer rows than the limit: no scrolling needed.
      setMaxHeight(
        rowTops.length > visibleRows ? Math.ceil(lastBottom) + 2 : null,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [items, visibleRows]);

  return (
    <div
      className={`mb-[30px] rounded-2xl border border-line bg-white p-[21px] shadow-card border-t-[3px] ${
        isSource ? "border-t-saffron" : "border-t-navy"
      }`}
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h3 className="m-0 flex items-center gap-2 font-sans text-[15px] font-extrabold text-navy">
            <span
              className={`grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-lg text-sm ${
                isSource ? "bg-[#FBEBD8] text-saffron" : "bg-blue2 text-navy"
              }`}
            >
              <i className={`ti ${icon}`} />
            </span>
            {title}
          </h3>

          <span className="ml-[34px] mt-[3px] block text-[11px] font-medium text-muted">
            {subtitle}
          </span>
        </div>

        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isSource ? "bg-[#FBEBD8] text-saffron" : "bg-soft text-muted"
          }`}
        >
          {countLabel}
        </span>
      </div>

      <div
        ref={gridRef}
        style={maxHeight ? { maxHeight } : undefined}
        className="grid max-h-[520px] grid-cols-1 gap-2.5 overflow-y-auto overscroll-contain pr-2 [scrollbar-color:#C7CEDA_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C7CEDA] [&::-webkit-scrollbar-track]:bg-transparent sm:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]"
      >
        {items.map((item, i) => (
          <ListRow
            key={item.id ?? `${item.title}-${i}`}
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
  );
}

export default function ListRow({
  icon,
  variant = "phase",
  title,
  subtitle,
  tagLabel,
  onOpen,
}) {
  const isSource = variant === "source";

  return (
    <div
      onClick={onOpen}
      className={`grid cursor-pointer grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-line bg-white p-3 transition-[box-shadow,transform,border-color] duration-150 hover:-translate-y-px sm:grid-cols-[40px_1fr_auto] sm:gap-3 ${
        isSource
          ? "hover:border-[#ECD3B0] hover:shadow-[0_8px_18px_rgba(212,122,22,.12)]"
          : "hover:border-[#CFD9E6] hover:shadow-[0_8px_18px_rgba(11,31,58,.1)]"
      }`}
    >
      <div
        className={`hidden h-[38px] w-[38px] flex-shrink-0 place-items-center text-base sm:grid ${
          isSource
            ? "rounded-full bg-[#FBEBD8] text-saffron"
            : "rounded-[11px] bg-soft text-navy2"
        }`}
      >
        <i className={`ti ${icon}`} />
      </div>

      <div className="min-w-0">
        <b className="mb-0.5 block truncate text-[13px] leading-[1.3] text-navy">
          {title}
        </b>
        <span className="block truncate text-[11px] text-muted">
          {subtitle}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`h-[20px] flex-shrink-0 whitespace-nowrap rounded-2xl px-1.5 py-0.5 text-[9px] sm:h-[25px] sm:px-2 sm:py-1 sm:text-[10px] ${
            isSource
              ? "bg-[#FBEBD8] font-bold text-saffron"
              : "bg-green2 text-green"
          }`}
        >
          {tagLabel}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label="Show more"
          className={`hidden h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-[9px] border border-line bg-soft transition-colors duration-150 sm:grid ${
            isSource
              ? "text-saffron hover:bg-saffron hover:text-white"
              : "text-blue hover:bg-blue hover:text-white"
          }`}
        >
          <i className="ti ti-chevron-right" />
        </button>
      </div>
    </div>
  );
}
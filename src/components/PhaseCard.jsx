export default function PhaseCard({ phase, index, isLast, onShowMore }) {
  return (
    <div className="relative grid grid-cols-[44px_1fr] gap-3.5 pb-6 sm:grid-cols-[60px_1fr] sm:gap-[22px] sm:pb-[26px] last:pb-0">
      <div className="relative flex justify-center">
        <div className="relative z-[2] grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy to-navy2 text-[18px] text-white shadow-featured sm:h-[52px] sm:w-[52px] sm:rounded-[15px] sm:text-[22px]">
          <i className={`ti ${phase.icon}`} />
        </div>
        {!isLast && (
          <span className="absolute left-1/2 top-10 -bottom-5 w-0.5 -translate-x-1/2 bg-line sm:top-[52px] sm:-bottom-[26px]" />
        )}
      </div>

      <div className="rounded-2xl border border-line bg-card p-4 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-cardHover sm:p-[22px_24px]">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-blue">
            Phase {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-[25px] whitespace-nowrap rounded-2xl bg-green2 px-2 py-1 text-[10px] text-green">
            {phase.tag}
          </span>
        </div>
        <h3 className="mb-[7px] font-sans text-[16px] font-extrabold text-navy">
          {phase.title}
        </h3>
        <p className="text-[12.5px] leading-[1.65] text-muted">
          {phase.summary}
        </p>
        <div className="mt-4 flex justify-end border-t border-line pt-3.5">
          <button
            type="button"
            onClick={onShowMore}
            className="group inline-flex items-center gap-1.5 border-0 bg-transparent p-0 font-sans text-xs font-bold text-blue hover:text-navy"
          >
            Show more
            <i className="ti ti-arrow-narrow-right text-[15px] transition-transform duration-200 group-hover:translate-x-[3px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

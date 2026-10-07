import Button from "./Button.jsx";
import StatCard from "./StatCard.jsx";
import { fmt } from "../utils.js";
import useCountUp from "../hooks/useCountUp.js";

const HERO_STATS = [
  { icon: "ti-flag", key: "states_uts", label: "States & UTs" },
  { icon: "ti-map", key: "districts", label: "Districts" },
  { icon: "ti-map-2", key: "sub_districts", label: "Sub-Districts" },
  {
    icon: "ti-building",
    key: "development_blocks",
    label: "Development Blocks",
  },
];

export default function Hero({ onScrollToCensus, onScrollToDirectory, stats }) {
  const villageCount = useCountUp(fmt(stats?.villages), { duration: 1400 });

  return (
    <section className="bg-gradient-to-b from-[#F8FAFD] to-bgApp py-4 lg:py-[30px]">
      <div className="mx-auto w-full max-w-wrap px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.06fr_.94fr] md:items-stretch md:gap-[54px]">
          {/* ─────────── LEFT: Text content ─────────── */}
          <div className="flex flex-col space-y-1 sm:space-y-2 lg:space-y-3 md:justify-center">
            {/* Eyebrow label — CHANGED: blue → navy */}
            <div className="sm:w-full lg:w-full mb-1 lg:mb-[15px] inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.1em] text-[#0F2A4A] before:h-0.5 before:w-[25px] before:bg-saffron before:content-['']">
              India Administrative Geography
            </div>

            <h1 className="max-w-[650px] font-serif text-[28px] font-semibold leading-[1.12] tracking-[-.025em] text-navy sm:text-[38px] lg:text-[60px]">
              <span className="block">Unified Portal for</span>
              <span className="block text-[#b20000]">Census 2027 Map Data</span>
            </h1>

            {/* Subheading — CHANGED: blue → navy (kept bold weight for emphasis) */}
            <div className="mt-[17px] w-full text-[18px] lg:text-[25px] font-bold leading-[1.45] text-[#0F2A4A]">
              Integrated geographic information from State to Village level
            </div>

            <p className="mt-2.5 max-w-[650px] text-[10px] lg:text-[16px] leading-[1.7] text-muted">
              Explore administrative hierarchy, location records and Census 2027
              information through a single, structured public-facing map data
              portal
            </p>

            {/* Explore Directory button — CHANGED: navy bg + saffron text */}
            <div className="mt-[25px] flex flex-wrap gap-2.5">
              <a
                href="#directory"
                onClick={(e) => {
                  e.preventDefault();
                  onScrollToDirectory();
                }}
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0F2A4A] px-8 py-3.5 text-sm font-bold text-[#F2C078] shadow-md shadow-[#0F2A4A]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#16385E] hover:shadow-lg hover:shadow-[#0F2A4A]/25 focus:outline-none focus:ring-2 focus:ring-[#F2C078]/50 focus:ring-offset-2 sm:w-auto sm:px-10 sm:text-base"
              >
                <i className="ti ti-compass text-medium" />
                <span>Explore Directory</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>

          {/* ─────────── RIGHT: Snapshot card ─────────── */}
          <div className="flex h-full flex-col rounded-2xl border border-line bg-card p-[22px] shadow-card">
            <div className="mb-3.5 flex items-start justify-between">
              <div>
                {/* CHANGED: blue → navy */}
                <div className="mt-1 text-[15px] font-bold tracking-[.11em] text-[#0F2A4A]">
                  ADMINISTRATIVE SNAPSHOT
                </div>
                <h3 className="font-sans text-[18px] font-extrabold text-navy">
                  India at a glance
                </h3>
              </div>

              {/* Data View pill — CHANGED: green → navy + saffron */}
              <div className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E8F5EE] px-2.5 py-1 text-[11px] font-bold text-green">
                <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-green shadow-[0_0_0_4px_#E8F5EE]" />
                Data View
              </div>
            </div>

            {/* Villages highlight card — kept navy gradient, saffron text */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-navy to-navy2 p-4 text-white">
              <div className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-[10px] bg-white/[.13] text-[30px] font-extrabold">
                <i className="ti ti-building-community" />
              </div>
              <div>
                <div className="font-serif text-[32px] leading-[.95] sm:text-[39px]">
                  {villageCount}
                </div>
                {/* CHANGED: kept saffron/gold — senior said this is good */}
                <div className="mt-[5px] text-[13px] font-extrabold text-[#F2C078]">
                  Villages
                </div>
                <div className="mt-[3px] text-[10px] text-[#C9D7E7]">
                  Primary location records for Census-ready navigation
                </div>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {HERO_STATS.map((s) => (
                <StatCard
                  key={s.label}
                  icon={s.icon}
                  value={fmt(stats?.[s.key])}
                  label={s.label}
                  animate
                />
              ))}
            </div>

            <div className="mt-auto flex flex-wrap justify-between gap-2.5 pt-2.5 text-[10px] text-[#7A8492]">
              <span>
                <strong className="text-[#475467]">Source</strong> Local
                Government Directory
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

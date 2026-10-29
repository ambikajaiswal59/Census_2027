import Button from "./Button.jsx";
import StatCard from "./StatCard.jsx";
import { fmt } from "../utils.js";
import useCountUp from "../hooks/useCountUp.js";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const villageCount = useCountUp(fmt(stats?.villages), {
    duration: 1400,
  });

  return (
    <section className="bg-gradient-to-b from-[#F8FAFD] to-bgApp py-4 lg:py-[30px]">
      <div className="mx-auto w-full max-w-wrap px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.06fr_.94fr] md:items-stretch md:gap-[54px]">
          {/* ─────────── LEFT: Text content ─────────── */}
          <div className="flex flex-col space-y-1 sm:space-y-2 lg:space-y-3 md:justify-center">
            {/* Eyebrow label */}
            <div className="mb-1 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.1em] text-[#0F2A4A] before:h-0.5 before:w-[25px] before:bg-saffron before:content-[''] sm:w-full lg:mb-[15px] lg:w-full">
              India Administrative Geography
            </div>

            <h1 className="max-w-[650px] font-serif text-[28px] font-semibold leading-[1.12] tracking-[-.025em] text-navy sm:text-[38px] lg:text-[60px]">
              <span className="block">Census India 2027</span>

              <span className="block text-[24px] text-[#06534d] sm:text-[32px] lg:text-[45px]">
                Maps, Apps &amp; Data
              </span>
            </h1>

            <div className="mt-[17px] w-full text-[18px] font-bold leading-[1.45] text-blue lg:text-[25px]">
              Integrated geographic information from State to Village level
            </div>

            <p className="mt-2.5 max-w-[650px] text-[10px] leading-[1.7] text-muted lg:text-[16px]">
              Explore administrative hierarchy, location records and Census 2027
              information through a single, structured public-facing map data
              portal
            </p>

            {/* Explore Directory button */}
            <div className="mt-[25px] flex flex-wrap gap-2.5">
              <Button
                href="/population-dashboard"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/population-dashboard");
                }}
              >
                Explore Directory
                <span className="ml-0.5 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Button>
            </div>
          </div>

          {/* ─────────── RIGHT: Snapshot card ─────────── */}
          <div className="flex h-full flex-col rounded-2xl border border-line bg-card p-[22px] shadow-card">
            {/* Snapshot heading and Census logo */}
            <div className="mb-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mt-1 text-[15px] font-bold tracking-[.11em] text-[#0F2A4A]">
                  ADMINISTRATIVE SNAPSHOT
                </div>

                <h3 className="font-sans text-[18px] font-extrabold text-navy">
                  India at a glance
                </h3>
              </div>

              {/* Census 2011 Forerunner Logo */}
              <div className="flex flex-shrink-0 items-center justify-center">
                {/* Clickable Census 2011 Forerunner Logo */}
                <button
                  type="button"
                  onClick={() => navigate("/population-dashboard")}
                  aria-label="Explore Census directory"
                  title="Explore Directory"
                  className="flex-shrink-0 cursor-pointer rounded-xl transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2A4A] focus-visible:ring-offset-2"
                >
                  <img
                    src="/images/census-2011.jpeg"
                    alt="Census 2011 Forerunner"
                    className="h-16 w-16 rounded-xl object-contain sm:h-[76px] sm:w-[76px]"
                  />
                </button>
              </div>
            </div>

            {/* Villages highlight card */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-navy to-navy2 p-4 text-white">
              <div className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-[10px] bg-white/[.13] text-[30px] font-extrabold">
                <i className="ti ti-building-community" />
              </div>

              <div className="min-w-0">
                <div className="font-serif text-[32px] leading-[.95] sm:text-[39px]">
                  {villageCount}
                </div>

                <div className="mt-[5px] text-[13px] font-extrabold text-[#F2C078]">
                  Villages
                </div>

                <div className="mt-[3px] text-[10px] text-[#C9D7E7]">
                  Primary location records for Census-ready navigation
                </div>
              </div>
            </div>

            {/* Administrative statistics */}
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

            {/* Source information */}
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

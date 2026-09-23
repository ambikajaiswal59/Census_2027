import Button from "./Button.jsx";
import StatCard from "./StatCard.jsx";
import { heroStats } from "../data/sampleData.js";
import useCountUp from "../hooks/useCountUp.js";

export default function Hero({ onScrollToCensus, onScrollToDirectory }) {
  const villageCount = useCountUp("6,77,523", { duration: 1400 });
  return (
    <section className="bg-gradient-to-b from-[#F8FAFD] to-bgApp py-9 sm:py-[30px]">
      <div className="mx-auto w-full max-w-wrap px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.06fr_.94fr] md:gap-[54px]">
          <div>
            <div className="mb-[15px] inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.1em] text-blue before:h-0.5 before:w-[25px] before:bg-saffron before:content-['']">
              India Administrative Geography
            </div>
            <h1 className="max-w-[650px] font-serif text-[28px] font-semibold leading-[1.12] tracking-[-.025em] text-navy sm:text-[38px] lg:text-[48px]">
              <span className="block">Unified Portal for</span>
              <span className="block text-[#b20000]">Census 2027 Map Data</span>
            </h1>
            <div className="mt-[17px] text-[19px] font-bold leading-[1.45] text-blue">
              Integrated geographic information from State to Village level
            </div>
            <p className="mt-2.5 max-w-[650px] text-[15px] leading-[1.7] text-muted">
              Explore administrative hierarchy, location records and Census 2027
              information through a single, structured public-facing map data
              portal
            </p>
            <div className="mt-[25px] flex flex-wrap gap-2.5">
              <Button
                href="#directory"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  onScrollToDirectory();
                }}
              >
                Explore Directory{" "}
                <span className="ml-0.5 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Button>
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  onScrollToCensus();
                }}
              >
                Census 2027 Update
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-[22px] shadow-card">
            <div className="mb-3.5 flex items-start justify-between">
              <div>
                <div className="mt-1  text-[15px] font-bold tracking-[.11em] text-blue">
                  ADMINISTRATIVE SNAPSHOT
                </div>
                <h3 className="font-sans text-[18px] font-extrabold text-navy">
                  India at a glance
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-green">
                <span className="h-[7px] w-[7px] rounded-full bg-green shadow-[0_0_0_4px_#E8F5EE]" />
                Data View
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-navy to-navy2 p-4 text-white">
              <div className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-[10px] bg-white/[.13] text-[30px] font-extrabold">
                <i className="ti ti-building-community" />
              </div>
              <div>
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

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {heroStats.map((s) => (
                <StatCard
                  key={s.label}
                  icon={s.icon}
                  value={s.value}
                  label={s.label}
                  animate
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap justify-between gap-2.5 border-t border-line pt-2.5 text-[10px] text-[#7A8492]">
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

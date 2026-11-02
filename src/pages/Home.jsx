import { useEffect, useRef, useState } from "react";

import Hero from "../components/Hero.jsx";
import ListPanel from "../components/ListPanel.jsx";
import { phaseData } from "../data/phaseData.js";
import { sourceData } from "../data/sourceData.js";
import PhaseModal from "../components/PhaseModal.jsx";
import DirectoryExplorer from "../components/DirectoryExplorer.jsx";

import useNationalStats from "../hooks/useNationalStats.js";
import { scrollToSection } from "../utils.js";

export default function Home() {
  const { stats } = useNationalStats();
  const lastSync = stats?.created_at
    ? new Date(stats.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const [activeItem, setActiveItem] = useState(null);
  const censusHeadRef = useRef(null);
  const directoryHeadRef = useRef(null);
  useEffect(() => {
    const hash = window.location.hash;
    const timer = setTimeout(() => {
      if (hash === "#phases") scrollToCensus();
      else if (hash === "#directory") scrollToDirectory();

      // Remove the hash once used, so a refresh doesn't jump to that section again.
      if (hash) {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  // ─────────────────────────────────────────────────────────
  // Smart scroll — centers short sections, top-aligns tall ones
  // ─────────────────────────────────────────────────────────
  function scrollToCensus() {
    scrollToSection(censusHeadRef.current);
  }

  function scrollToDirectory() {
    scrollToSection(directoryHeadRef.current);
  }

  return (
    <>
      <Hero
        onScrollToCensus={scrollToCensus}
        onScrollToDirectory={scrollToDirectory}
        stats={stats}
      />

      <main className="mx-auto w-full max-w-wrap px-4 sm:px-6">
        <section>
          {/* ─────── PHASES SECTION ─────── */}
          <section id="phases" ref={censusHeadRef} className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-5">
              <div>
                <div className="mb-1 text-[11px] font-extrabold tracking-[.11em] text-navy">
                  CENSUS 2027
                </div>
                <h2 className="font-serif text-[23px] font-semibold tracking-[-.015em] text-navy sm:text-[29px]">
                  Phases &amp; official updates
                </h2>
                <div className="mt-[5px] max-w-full text-[13px] leading-[1.6] text-muted">
                  Track where the 16th Census of India stands — from house
                  listing to population enumeration and result publication.
                </div>
              </div>
            </div>
            <ListPanel
              icon="ti-progress-check"
              title="Phase timeline"
              subtitle="Internal · the Census's own process stages"
              countLabel={`${phaseData.length} ${phaseData.length === 1 ? "phase" : "phases"}`}
              items={phaseData}
              variant="phase"
              onOpenItem={(i) => setActiveItem({ type: "phase", index: i })}
            />
            <ListPanel
              icon="ti-news"
              title="Official updates & sources"
              subtitle="External · press releases & news coverage"
              countLabel={`${sourceData.length} ${sourceData.length === 1 ? "update" : "updates"}`}
              items={sourceData}
              variant="source"
              onOpenItem={(i) => setActiveItem({ type: "source", index: i })}
            />
          </section>

          {/* ─────── DIRECTORY SECTION ─────── */}
          <section
            id="directory"
            ref={directoryHeadRef}
            className="scroll-mt-24 mb-4"
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="font-serif text-[23px] font-semibold tracking-[-.015em] text-navy sm:text-[29px]">
                  Administrative Directory Explorer
                </h2>
                <div className="mt-[5px] max-w-[700px] text-[13px] leading-[1.6] text-muted">
                  Search, explore and navigate India's administrative data from
                  State to Village level
                </div>
              </div>
              <p className="m-0 text-xs text-text">
                Last sync: <b>{lastSync}</b>
              </p>
            </div>
            <DirectoryExplorer stats={stats} />
          </section>
        </section>
      </main>

      <PhaseModal activeItem={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}

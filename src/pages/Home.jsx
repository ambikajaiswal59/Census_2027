import { useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import ListPanel from "../components/ListPanel.jsx";
import { useStats } from "../useStats.js";
import { phaseData } from "../data/phaseData.js";
import { sourceData } from "../data/sourceData.js";
import PhaseModal from "../components/PhaseModal.jsx";
import DirectoryExplorer from "../components/DirectoryExplorer.jsx";
import Footer from "../components/Footer.jsx";
import useNationalStats from "../hooks/useNationalStats.js";

export default function Home() {
  const { stats: nationalStats } = useNationalStats();
  const lastSync = nationalStats?.created_at
    ? new Date(nationalStats.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const [activeItem, setActiveItem] = useState(null);
  const censusHeadRef = useRef(null);
  const directoryHeadRef = useRef(null);
  const { data: stats, loading: statsLoading, error: statsError } = useStats();

  // ─────────────────────────────────────────────────────────
  // Smart scroll — centers short sections, top-aligns tall ones
  // ─────────────────────────────────────────────────────────
  function scrollToSection(target, offset = 20) {
    if (!target) return;
    const headerHeight = document.querySelector("header")?.offsetHeight || 0;
    const rect = target.getBoundingClientRect();
    const sectionHeight = rect.height;
    const viewportHeight = window.innerHeight - headerHeight;
    const absoluteTop = rect.top + window.pageYOffset;

    let scrollTop;
    if (sectionHeight < viewportHeight * 0.7) {
      // Short section — center it vertically in the visible area
      scrollTop =
        absoluteTop - headerHeight - (viewportHeight - sectionHeight) / 2;
    } else {
      // Tall section — align its top just below the sticky header
      scrollTop = absoluteTop - headerHeight - offset;
    }

    window.scrollTo({
      top: Math.max(scrollTop, 0),
      behavior: "smooth",
    });
  }

  function scrollToCensus() {
    scrollToSection(censusHeadRef.current);
    history.replaceState(null, "", "#phases");
  }

  function scrollToDirectory() {
    scrollToSection(directoryHeadRef.current);
    history.replaceState(null, "", "#directory");
  }

  return (
    <>
      <Header
        onScrollToCensus={scrollToCensus}
        onScrollToDirectory={scrollToDirectory}
      />

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
          <section id="directory" ref={directoryHeadRef} className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 className="font-serif text-[23px] font-semibold tracking-[-.015em] text-navy sm:text-[29px]">
                  Administrative Directory Explorer
                </h2>
                <div className="mt-[5px] max-w-[700px] text-[13px] leading-[1.6] text-muted">
                  Search, explore and navigate India's administrative data from State to Village level
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

      <Footer />

      <PhaseModal activeItem={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}
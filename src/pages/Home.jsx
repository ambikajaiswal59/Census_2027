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
  const scrollRootRef = useRef(null); // the scrolling area below the header
  const censusHeadRef = useRef(null);
  const directoryHeadRef = useRef(null);
  const { data: stats, loading: statsLoading, error: statsError } = useStats();

  // ─────────────────────────────────────────────────────────
  // Smart scroll — centers short sections, top-aligns tall ones.
  // The page scrolls inside the area below the header (not the window), so the
  // scrollbar starts under the header; positions are measured inside that area.
  // ─────────────────────────────────────────────────────────
  function scrollToSection(target, offset = 20) {
    const root = scrollRootRef.current;
    if (!target || !root) return;

    const sectionHeight = target.getBoundingClientRect().height;
    const viewportHeight = root.clientHeight;
    const absoluteTop =
      target.getBoundingClientRect().top -
      root.getBoundingClientRect().top +
      root.scrollTop;

    let scrollTop;
    if (sectionHeight < viewportHeight * 0.7) {
      // Short section — center it vertically in the visible area
      scrollTop = absoluteTop - (viewportHeight - sectionHeight) / 2;
    } else {
      // Tall section — align its top near the top of the visible area
      scrollTop = absoluteTop - offset;
    }

    root.scrollTo({
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
      {/* The screen is split: header on top (full width), scrollable area below it. */}
      <div className="flex h-[100dvh] flex-col">
        <Header
          onScrollToCensus={scrollToCensus}
          onScrollToDirectory={scrollToDirectory}
        />

        {/* The page scrolls here. data-scroll-root lets the header's mobile row react
            to this scrolling. */}
        <div
          ref={scrollRootRef}
          data-scroll-root
          className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]"
        >
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
        </div>
      </div>

      <PhaseModal activeItem={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}
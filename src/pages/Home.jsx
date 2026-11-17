import { useEffect, useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import ListPanel from "../components/ListPanel.jsx";
import { useStats } from "../useStats.js";
import { phaseData } from "../data/phaseData.js";
import { sourceData } from "../data/sourceData.js";
import PhaseModal from "../components/PhaseModal.jsx";
import DirectoryExplorer from "../components/DirectoryExplorer.jsx";
import Footer from "../components/Footer.jsx";
import AnnouncementTicker from "../components/AnnouncementTicker.jsx";
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
  // Smart scroll — centers short sections, top-aligns tall ones.
  // The page scrolls inside the area below the header (not the window), so the
  // scrollbar starts under the header; positions are measured inside that area.
  // ─────────────────────────────────────────────────────────
  // Finds whatever really scrolls the page: the closest scrollable parent of the
  // section (the area below the header), or the window when there is none.
  function getScroller(target) {
    for (let el = target?.parentElement; el; el = el.parentElement) {
      const { overflowY } = getComputedStyle(el);
      if (
        /(auto|scroll|overlay)/.test(overflowY) &&
        el.scrollHeight > el.clientHeight
      ) {
        return el;
      }
    }
    return null; // the window scrolls
  }

  function scrollToSection(target, offset = 20) {
    if (!target) return;

    const root = getScroller(target);
    const isWindow = !root || root === document.documentElement;

    const rootTop = isWindow ? 0 : root.getBoundingClientRect().top;
    const viewportHeight = isWindow ? window.innerHeight : root.clientHeight;
    const currentScroll = isWindow ? window.scrollY : root.scrollTop;
    // The sticky header covers the top of the window when the window scrolls.
    const headerHeight = isWindow
      ? document.querySelector("header")?.getBoundingClientRect().height || 0
      : 0;

    const sectionHeight = target.getBoundingClientRect().height;
    const absoluteTop =
      target.getBoundingClientRect().top - rootTop + currentScroll;
    const visibleHeight = viewportHeight - headerHeight;

    let scrollTop;
    if (sectionHeight < visibleHeight * 0.7) {
      scrollTop =
        absoluteTop - headerHeight - (visibleHeight - sectionHeight) / 2;
    } else {
      scrollTop = absoluteTop - headerHeight - offset;
    }

    const options = { top: Math.max(scrollTop, 0), behavior: "smooth" };
    if (isWindow) window.scrollTo(options);
    else root.scrollTo(options);
  }

  function scrollToCensus() {
    scrollToSection(censusHeadRef.current);
  }

  function scrollToDirectory() {
    scrollToSection(directoryHeadRef.current);
  }

  // Arriving from another page with #directory or #phases: scroll to that section.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return undefined;

    const timer = setTimeout(() => {
      if (hash === "#directory") scrollToSection(directoryHeadRef.current);
      if (hash === "#phases") scrollToSection(censusHeadRef.current);
      // Drop the hash so a later refresh opens the page at the top.
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header
        onScrollToCensus={scrollToCensus}
        onScrollToDirectory={scrollToDirectory}
      />
      {/* The layout around this page owns the header and the scrollbar. */}
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
              <div className="min-w-0 flex-1">
                <div className="mb-2 text-[11px] font-extrabold tracking-[.11em] text-navy">
                  CENSUS 2027
                </div>
                <AnnouncementTicker />
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
            className="scroll-mt-24"
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

      <Footer />

      <PhaseModal activeItem={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}

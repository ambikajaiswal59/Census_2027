import { useRef, useState } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import ListPanel from "../components/ListPanel.jsx";

import { phaseData } from "../data/phaseData.js";
import { sourceData } from "../data/sourceData.js";
import PhaseModal from "../components/PhaseModal.jsx";
import DirectoryExplorer from "../components/DirectoryExplorer.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  const [activeItem, setActiveItem] = useState(null); // { type: 'phase' | 'source', index }
  const censusHeadRef = useRef(null);
  const directoryHeadRef = useRef(null);

  function scrollHeaderToCenter(target) {
    if (!target) return;
    const headerHeight = document.querySelector("header")?.offsetHeight || 0;
    const visibleHeight = window.innerHeight - headerHeight;
    const rect = target.getBoundingClientRect();
    const targetTop =
      rect.top +
      window.pageYOffset -
      headerHeight -
      visibleHeight / 2 +
      rect.height / 2;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
  }

  function scrollToCensus() {
    scrollHeaderToCenter(censusHeadRef.current);
    history.replaceState(null, "", "#phases");
  }

  function scrollToDirectory() {
    scrollHeaderToCenter(directoryHeadRef.current);
    history.replaceState(null, "", "#directory");
  }

  return (
    <>
      <Header
        onScrollToCensus={scrollToCensus}
        onScrollToDirectory={scrollToDirectory}
      />

      <Hero onScrollToCensus={scrollToCensus} onScrollToDirectory={scrollToDirectory} />

      <main className="mx-auto w-full max-w-wrap px-4 sm:px-6">
        <section >
          <section id="phases">
            <div
              ref={censusHeadRef}
              className="mb-4 flex flex-wrap items-end justify-between gap-5"
            >
              <div>
                <div className="mb-1 text-[10px] font-extrabold tracking-[.11em] text-blue">
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
              // subtitle="Internal · the Census's own process stages"
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

          <div
            ref={directoryHeadRef}
            className="mb-4 flex flex-wrap items-end justify-between gap-5"
            id="directory"
          >
            <div>
              <h2 className="font-serif text-[23px] font-semibold tracking-[-.015em] text-navy sm:text-[29px]">
                Administrative Directory Explorer
              </h2>
              <div className="mt-[5px] max-w-full text-[13px] leading-[1.6] text-muted">
                Browse and search the administrative hierarchy from State and
                District through Sub-District, Block and Village-level
                information.
              </div>
            </div>
            <p className="m-0 text-xs text-text">
              Last sync: <b>11 Sep 2026</b>
            </p>
          </div>

          <DirectoryExplorer />
        </section>
      </main>

      <Footer />

      <PhaseModal activeItem={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}

import { useLayoutEffect, useRef, useState } from "react";
import useAnnouncements from "../hooks/useAnnouncements.js";

const SPEED = 70; // pixels per second

// Moving announcements line. Data comes from useAnnouncements (dummy now, backend
// later); this component only draws what it is given.
export default function AnnouncementTicker({ label = "Announcements" }) {
  const { items, loading, error } = useAnnouncements();
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [duration, setDuration] = useState(30);
  const trackRef = useRef(null);

  // Speed stays the same however long the list is: duration = distance / speed.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const measure = () =>
      setDuration(Math.max(10, track.scrollWidth / 2 / SPEED));

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);

    return () => observer.disconnect();
  }, [items]);

  // Nothing to show (loading, error or empty): the line is simply not drawn.
  if (loading || error || items.length === 0) return null;

  const running = !paused && !hovered;

  // The list is drawn twice, so the loop restarts without a visible jump.
  const renderList = (copy) =>
    items.map((item) => {
      const content = (
        <>
          {item.text}
          {item.isNew && (
            <sup className="ml-1 text-[11px] font-semibold text-[#E5484D]">
              New
            </sup>
          )}
        </>
      );

      return (
        <li
          key={`${copy}-${item.id}`}
          aria-hidden={copy === 1}
          className="mr-10 inline-flex shrink-0 items-center whitespace-nowrap text-[15px] font-bold text-black"
        >
          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={copy === 1 ? -1 : 0}
              className="hover:underline"
            >
              {content}
            </a>
          ) : (
            <span>{content}</span>
          )}
        </li>
      );
    });

  return (
    <section
      aria-label={label}
      className="mb-4 flex items-center gap-3 rounded-lg border border-[#C9CED6] bg-[#C4C4C4] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_4px_10px_-4px_rgba(2,2,68,.25)]"
    >
      <style>{`@keyframes tickerMove { from { transform: translateX(0); } to { transform: translateX(-50%); } } @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none !important; } }`}</style>

      <span className="shrink-0 rounded-md bg-[#0B4A9E] px-3 py-1.5 text-[13px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_3px_0_#083574]">
        {label}
      </span>

      <i className="ti ti-volume hidden shrink-0 text-[18px] text-[#0B4A9E] sm:block" />

      <div
        className="min-w-0 flex-1 overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <ul
          ref={trackRef}
          className="ticker-track m-0 flex w-max list-none p-0"
          style={{
            animation: `tickerMove ${duration}s linear infinite`,
            animationPlayState: running ? "running" : "paused",
          }}
        >
          {renderList(0)}
          {renderList(1)}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className="shrink-0 rounded-md bg-[#0B4A9E] px-3 py-1.5 text-[13px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_3px_0_#083574] transition-all duration-150 hover:brightness-110 active:translate-y-[2px] active:shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_1px_0_#083574]"
      >
        {paused ? "Play" : "Pause"}
      </button>
    </section>
  );
}
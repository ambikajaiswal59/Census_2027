import { useEffect, useState } from "react";
import { phaseData } from "../data/phaseData.js";
import { sourceData } from "../data/sourceData.js";

const isImageLink = (url = "") =>
  /\.(png|jpe?g|gif|webp|svg)$/i.test(url.split("?")[0]);

export default function PhaseModal({ activeItem, onClose }) {
  const [showImage, setShowImage] = useState(false);
  const [zoom, setZoom] = useState(1);

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.25;

  const zoomIn = () =>
    setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () =>
    setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const isOpen = !!activeItem;
  const isSource = activeItem?.type === "source";
  const item = isOpen
    ? isSource
      ? sourceData[activeItem.index]
      : phaseData[activeItem.index]
    : null;

  // Always start on the summary view when a different item is opened
  useEffect(() => {
    setShowImage(false);
  }, [activeItem]);

  useEffect(() => {
    setZoom(1);
  }, [showImage]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        if (showImage) setShowImage(false);
        else onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, showImage]);

  if (!isOpen || !item) return null;

  const linkIsImage = isSource && isImageLink(item.link);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/[.55] p-6 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[620px] animate-modalIn overflow-y-auto rounded-2xl bg-white p-5 shadow-modal sm:p-[27px_29px] max-h-[82vh]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-[18px] top-[18px] grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-white text-[15px] text-muted hover:bg-bgApp hover:text-navy"
        >
          ✕
        </button>

        <div className="mb-[18px] pr-[30px]">
          {isSource ? (
            <div className="mb-1.5 text-[17px] font-extrabold tracking-[.11em] text-saffron">
              {item.source.toUpperCase()} · {item.date}
            </div>
          ) : (
            <div className="mb-1.5 text-[15px] font-extrabold tracking-[.11em] text-navy">
              CENSUS 2027 · PHASE{" "}
              {String(activeItem.index + 1).padStart(2, "0")}
            </div>
          )}
          <h2 className="font-serif text-[22px] text-navy sm:text-[25px]">
            {item.title}
          </h2>
          {!isSource && (
            <span className="mt-2.5 inline-block h-[25px] whitespace-nowrap rounded-2xl bg-green2 px-2 py-1 text-[10px] text-green">
              {item.tag}
            </span>
          )}
        </div>

        {!isSource && item.image && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <img src={item.image} alt={item.title} className="block w-full" />
          </div>
        )}

        <div>
          <p className="mt-4 text-[13px] leading-[1.7] text-muted">
            {/* {isSource ? item.summary : item.detail} */}
          </p>
          <ul className="mt-3.5 list-disc pl-[18px]">
            {item.points.map((pt) => (
              <li
                key={pt}
                className="mb-[7px] text-[12.5px] leading-[1.65] text-muted"
              >
                {pt}
              </li>
            ))}
          </ul>
        </div>

        {isSource && (
          <div className="mt-[18px] flex justify-end border-t border-line pt-4">
            {linkIsImage ? (
              <button
                type="button"
                onClick={() => setShowImage(true)}
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-blue px-[15px] py-2.5 text-xs font-bold text-white hover:bg-navy2"
              >
                Read Full <i className="ti ti-external-link" />
              </button>
            ) : (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-blue px-[15px] py-2.5 text-xs font-bold text-white hover:bg-navy2"
              >
                Read Full <i className="ti ti-external-link" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Enlarged image popup (sibling of the card, not inside it) */}
      {isSource && showImage && (
        <div
          className="fixed inset-0 z-[300] flex animate-fadeIn items-center justify-center bg-black/80 p-4"
          onClick={() => setShowImage(false)}
        >
          {/* Close button */}
          <button
            type="button"
            aria-label="Close image"
            onClick={() => setShowImage(false)}
            className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-base text-navy hover:bg-white"
          >
            ✕
          </button>

          {/* Scrollable image area */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-[95vw] max-w-4xl origin-center animate-zoomIn overflow-auto rounded-lg shadow-2xl"
          >
            <img
              src={encodeURI(item.link)}
              alt={item.title}
              style={{ width: `${zoom * 100}%` }}
              className="mx-auto block max-w-none transition-[width] duration-200"
            />
          </div>

          {/* Zoom controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-2 py-1.5 shadow-lg"
          >
            <button
              type="button"
              aria-label="Zoom out"
              onClick={zoomOut}
              disabled={zoom <= ZOOM_MIN}
              className="grid h-9 w-9 place-items-center rounded-full text-xl font-bold text-navy hover:bg-bgApp disabled:opacity-30"
            >
              −
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={() => setZoom(1)}
              className="min-w-[56px] rounded-full px-2 py-1 text-xs font-bold text-navy hover:bg-bgApp"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={zoomIn}
              disabled={zoom >= ZOOM_MAX}
              className="grid h-9 w-9 place-items-center rounded-full text-xl font-bold text-navy hover:bg-bgApp disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

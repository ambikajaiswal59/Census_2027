// Indian digit grouping: 677523 -> 6,77,523
export const fmt = (n) => (n == null ? "0" : Number(n).toLocaleString("en-IN"));

// Smoothly scrolls to a section. The page scrolls inside the element marked
// data-scroll-root (see Layout), not the window. Short sections are centred in
// the visible area; tall ones are aligned near the top.
export function scrollToSection(target, offset = 20) {
  if (!target) return;

  const container = target.closest("[data-scroll-root]");

  if (!container) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const viewportHeight = container.clientHeight;
  const topInContainer = rect.top - containerRect.top + container.scrollTop;

  const top =
    rect.height < viewportHeight * 0.7
      ? topInContainer - (viewportHeight - rect.height) / 2
      : topInContainer - offset;

  container.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

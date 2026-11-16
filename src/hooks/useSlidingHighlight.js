import { useLayoutEffect, useRef, useState } from "react";

// Sliding highlight for a list of options.
//
// Put the returned `ref` on the (position: relative) list container, mark the
// selected option with `data-slide-active="true"`, and render <SlideHighlight />
// style from `style` inside the container. When the selection changes the
// highlight glides from the old option to the new one.
//
// `deps` are the values that change when the selection or the options change.
export default function useSlidingHighlight(deps) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  const hasMeasured = useRef(false);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return undefined;

    const measure = () => {
      const el = container.querySelector('[data-slide-active="true"]');

      if (!el) {
        setBox(null);
        return;
      }

      setBox({
        top: el.offsetTop,
        left: el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });

      // The very first placement must not slide in from the corner.
      if (hasMeasured.current) setAnimate(true);
      hasMeasured.current = true;
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const style = box
    ? {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        opacity: 1,
        transition: animate
          ? "top 320ms cubic-bezier(.68,-0.25,.265,1.25), left 320ms cubic-bezier(.68,-0.25,.265,1.25), width 320ms ease, height 320ms ease, opacity 150ms"
          : "none",
      }
    : { top: 0, left: 0, width: 0, height: 0, opacity: 0, transition: "none" };

  return [ref, style];
}
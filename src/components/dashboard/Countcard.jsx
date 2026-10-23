import { useRef } from "react";
import useCountUp from "../../hooks/useCountUp.js";
import { fmt } from "../../utils.js";

const MAX_TILT = 14;

export default function CountCard({ value, label, icon = "ti-map" }) {
  const cardRef = useRef(null);
  const count = useCountUp(fmt(value), { duration: 1400 });

  function handleMove(event) {
    if (event.pointerType === "touch") return;

    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    el.style.setProperty("--ry", `${(x - 0.5) * 2 * MAX_TILT}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 2 * MAX_TILT}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--shine", "1");
  }

  function handleLeave() {
    const el = cardRef.current;
    if (!el) return;

    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--shine", "0");
  }

  return (
    <div
      className="mx-auto mt-2 aspect-square w-[108px] [perspective:700px] sm:w-[120px] lg:w-[132px]"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <div
        ref={cardRef}
        style={{
          "--rx": "0deg",
          "--ry": "0deg",
          "--mx": "50%",
          "--my": "50%",
          "--shine": "0",
          transform:
            "rotateX(var(--rx)) rotateY(var(--ry)) scale(var(--scale, 1))",
          transformStyle: "preserve-3d",
        }}
        className="group relative flex h-full w-full cursor-default select-none flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#1a3a66] via-[#0d2447] to-[#020244] text-center shadow-[0_10px_22px_rgba(2,2,68,.35),0_2px_0_rgba(255,255,255,.12)_inset] transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_18px_34px_rgba(2,2,68,.45),0_2px_0_rgba(255,255,255,.18)_inset] active:[--scale:0.96] motion-reduce:!transform-none motion-reduce:transition-none"
      >
        <i
          aria-hidden="true"
          className={`ti ${icon} pointer-events-none absolute -bottom-3 -right-2 text-[64px] text-white/[.07] lg:text-[78px]`}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: "var(--shine)",
            background:
              "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.28), transparent 55%)",
          }}
        />

        <div
          className="relative flex flex-col items-center"
          style={{ transform: "translateZ(34px)" }}
        >
          <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[14px] text-white">
            <i className={`ti ${icon}`} />
          </span>

          <div className="text-[26px] font-extrabold leading-none tabular-nums text-white drop-shadow-[0_3px_6px_rgba(0,0,0,.45)] sm:text-[28px] lg:text-[30px]">
            {count}
          </div>

          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white/75">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

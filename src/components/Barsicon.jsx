// Three solid rounded bars (short, tall, medium): the classification icon.
// Fills with currentColor, so it takes its colour from the text colour
// (e.g. className="text-blue"). Size follows `size` (default 1em).
export default function BarsIcon({ size = "1em", className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.5" y="10" width="5" height="11" rx="1.4" />
      <rect x="9.5" y="3" width="5" height="18" rx="1.4" />
      <rect x="16.5" y="8" width="5" height="13" rx="1.4" />
    </svg>
  );
}

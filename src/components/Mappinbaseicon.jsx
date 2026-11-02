// Pin on a ground ring: a ball on a stick standing in an ellipse.
// Draws with currentColor, so it takes its colour from the text colour
// (e.g. className="text-blue"). Size follows `size` (default 1em).
export default function MapPinBaseIcon({ size = "1em", className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="5.5" r="2.7" />
      <path d="M12 8.2v8.3" />
      <path d="M7.6 15.2C4.9 15.8 3.2 16.9 3.2 18.2c0 2 4.1 3.6 8.8 3.6s8.8-1.6 8.8-3.6c0-1.3-1.7-2.4-4.4-3" />
    </svg>
  );
}

// Server component: static SVG, animated purely with CSS (see .pulse-mark-line).
export default function PulseMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <polyline
        points="1,9 8,9 11,3 15,14 18,6 20,9 27,9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pulse-mark-line"
      />
    </svg>
  );
}

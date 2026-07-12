// Inline, region-scoped error. One failed fetch shows this card in place of the
// region's content — the rest of the page stays alive.
export default function ErrorState({
  message,
  onRetry,
  className = "",
}: {
  message?: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neg/40 bg-surface px-6 py-8 text-center ${className}`}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="size-5 text-neg"
      >
        <path
          d="M8 1.5 15 14H1L8 1.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 6.5v3.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.8" r="0.8" fill="currentColor" />
      </svg>
      <div>
        <p className="text-sm font-medium">Couldn&apos;t load this data</p>
        <p className="mt-0.5 text-xs text-muted">
          {message ?? "The request failed."}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-line-strong hover:bg-surface-2"
      >
        Retry
      </button>
    </div>
  );
}

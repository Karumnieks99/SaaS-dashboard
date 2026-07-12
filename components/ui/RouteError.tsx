"use client";

// Shared body for the per-route error.tsx boundaries. Catches render errors
// (as opposed to fetch failures, which ErrorState handles inline per region).
export default function RouteError({
  routeName,
  reset,
}: {
  routeName: string;
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center"
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-neg">
        Something broke
      </p>
      <h2 className="font-display text-xl font-semibold tracking-tight">
        {routeName} couldn&apos;t render
      </h2>
      <p className="max-w-sm text-sm text-muted">
        An unexpected error interrupted this page. Your data is fine — try
        loading it again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}

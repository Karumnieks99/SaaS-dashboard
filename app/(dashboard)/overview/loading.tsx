import Skeleton from "@/components/ui/Skeleton";

// Route-level loading UI: a page-shaped skeleton that mirrors the overview
// grid, shown during route transitions before the page shell streams in.
export default function OverviewLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="grid gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
        <Skeleton className="h-44 rounded-lg md:col-span-3 lg:col-span-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg lg:h-44" />
        ))}
      </div>
      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-lg lg:col-span-2 md:h-96" />
        <Skeleton className="h-80 rounded-lg md:h-96" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

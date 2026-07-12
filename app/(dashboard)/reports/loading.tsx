import Skeleton from "@/components/ui/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

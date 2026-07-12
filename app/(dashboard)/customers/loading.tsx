import Skeleton from "@/components/ui/Skeleton";

export default function CustomersLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    </div>
  );
}

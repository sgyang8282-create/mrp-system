import { Skeleton } from "@/components/ui/skeleton";

export default function PlanVsActualLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-80" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[86px]" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-64" />
    </div>
  );
}

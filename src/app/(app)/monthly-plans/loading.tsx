import { Skeleton } from "@/components/ui/skeleton";

export default function MonthlyPlansLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64" />
      <Skeleton className="h-40" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function DailyPlansLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-80" />
    </div>
  );
}

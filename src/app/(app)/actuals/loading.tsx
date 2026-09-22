import { Skeleton } from "@/components/ui/skeleton";

export default function ActualsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16" />
      <Skeleton className="h-72" />
    </div>
  );
}

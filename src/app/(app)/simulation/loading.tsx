import { Skeleton } from "@/components/ui/skeleton";

export default function SimulationLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-96" />
      <Skeleton className="h-80" />
      <Skeleton className="h-64" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function CapaLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-80" />
      <Skeleton className="h-64" />
    </div>
  );
}

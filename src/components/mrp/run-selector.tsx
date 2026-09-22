"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { MrpRunSummary } from "@/types/mrp";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function RunSelector({
  runs,
  selectedRunId,
  basePath,
}: {
  runs: MrpRunSummary[];
  selectedRunId: string | null;
  basePath: string;
}) {
  const router = useRouter();

  if (runs.length === 0) {
    return <p className="text-sm text-fg-muted">실행된 MRP가 없습니다. 월간 생산계획에서 먼저 실행해 주세요.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-fg-muted">실행 이력</label>
      <Select
        value={selectedRunId ?? ""}
        onChange={(e) => router.push(`${basePath}?runId=${e.target.value}`)}
        className="w-64"
      >
        {runs.map((run) => (
          <option key={run.id} value={run.id}>
            {formatDateTime(run.executedAt)} ({run.planMonth.slice(0, 7)}) · {run.status}
          </option>
        ))}
      </Select>
    </div>
  );
}

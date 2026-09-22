"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateDailyPlans } from "@/app/daily-plans/actions";
import type { MrpRunSummary } from "@/types/mrp";
import type { GenerateDailyPlanResult } from "@/types/daily-plan";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function GenerateForm({ runs, defaultStartDate }: { runs: MrpRunSummary[]; defaultStartDate: string }) {
  const router = useRouter();
  const [runId, setRunId] = React.useState(runs[0]?.id ?? "");
  const [startDate, setStartDate] = React.useState(defaultStartDate);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<GenerateDailyPlanResult | null>(null);

  async function handleGenerate() {
    if (!runId) return;
    setRunning(true);
    setResult(null);
    const res = await generateDailyPlans(runId, startDate);
    setRunning(false);
    setResult(res);
    if (res.ok) {
      router.push(`/daily-plans?date=${startDate}`);
      router.refresh();
    }
  }

  if (runs.length === 0) {
    return (
      <p className="text-sm text-fg-muted">
        실행된 MRP가 없습니다. 먼저 월간 생산계획에서 MRP 전개를 실행해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">기준 MRP 실행</label>
          <Select value={runId} onChange={(e) => setRunId(e.target.value)} className="w-64">
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {formatDateTime(run.executedAt)} ({run.planMonth.slice(0, 7)})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">시작일</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
        </div>
        <Button onClick={handleGenerate} disabled={running}>
          <PlayCircle className="h-4 w-4" />
          {running ? "생성 중..." : "일일계획 자동 생성"}
        </Button>
      </div>

      {result && !result.ok && (
        <p className="rounded bg-signal-critical/10 px-2.5 py-1.5 text-xs text-signal-critical">{result.error}</p>
      )}

      {result?.ok && (
        <div className="space-y-1.5 rounded bg-signal-good/10 px-3 py-2 text-xs text-signal-good">
          <p>
            {result.createdCount}건의 일일계획이 생성되었습니다 (총 {result.daySpan}일 분량).
          </p>
          {(result.unassignableItems?.length ?? 0) > 0 && (
            <div className="text-signal-warning">
              <Badge variant="warning">배정 불가 {result.unassignableItems!.length}건</Badge>
              <ul className="mt-1 space-y-0.5">
                {result.unassignableItems!.map((u, idx) => (
                  <li key={idx}>
                    {u.itemName}({u.itemCode}) - 순소요량 {u.netRequirement} - {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

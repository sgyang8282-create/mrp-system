"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runMrpForMonth } from "@/app/monthly-plans/actions";
import type { RunMrpResult } from "@/lib/services/mrp";

export function RunMrpButton({ planMonth, disabled }: { planMonth: string; disabled: boolean }) {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunMrpResult | null>(null);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    const res = await runMrpForMonth(planMonth);
    setRunning(false);
    setResult(res);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleRun} disabled={disabled || running}>
        <PlayCircle className="h-4 w-4" />
        {running ? "MRP 전개 실행 중..." : "MRP 전개 실행"}
      </Button>

      {result && !result.ok && (
        <p className="rounded bg-signal-critical/10 px-2.5 py-1.5 text-xs text-signal-critical">
          {result.error}
        </p>
      )}

      {result?.ok && (
        <div className="flex flex-wrap items-center gap-2 rounded bg-signal-good/10 px-2.5 py-1.5 text-xs text-signal-good">
          <span>MRP 전개가 완료되었습니다.</span>
          {(result.shortageItemCount ?? 0) > 0 && (
            <Badge variant="warning">부족 품목 {result.shortageItemCount}건</Badge>
          )}
          {(result.capaOverGroupCount ?? 0) > 0 && (
            <Badge variant="critical">CAPA 초과 {result.capaOverGroupCount}개 그룹</Badge>
          )}
          <Link href="/mrp" className="underline">
            전개 결과 보기
          </Link>
          <Link href="/capa" className="underline">
            CAPA 분석 보기
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmDailyPlan, deleteDailyPlan, lockDailyPlan, updateDailyPlanQty } from "@/app/daily-plans/actions";
import { formatNumber } from "@/lib/utils";
import type { DailyPlanRow } from "@/types/daily-plan";

function StatusBadge({ status }: { status: DailyPlanRow["status"] }) {
  if (status === "LOCKED") return <Badge variant="accent">잠금</Badge>;
  if (status === "CONFIRMED") return <Badge variant="good">확정</Badge>;
  return <Badge variant="warning">임시저장</Badge>;
}

function PlanRow({ plan, readOnly }: { plan: DailyPlanRow; readOnly: boolean }) {
  const router = useRouter();
  const [qty, setQty] = React.useState(plan.plannedQty);
  const [busy, setBusy] = React.useState(false);
  const isDraft = plan.status === "DRAFT";
  const isConfirmed = plan.status === "CONFIRMED";

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) alert(result.error ?? "처리 중 오류가 발생했습니다.");
    else router.refresh();
  }

  async function handleSaveQty() {
    const formData = new FormData();
    formData.set("id", plan.id);
    formData.set("plannedQty", String(qty));
    await run(() => updateDailyPlanQty(formData));
  }

  return (
    <tr className="hover:bg-surface-raised/60">
      <td className="px-3 py-2">
        <p className="font-medium">{plan.itemName}</p>
        <p className="text-xs text-fg-muted">{plan.itemCode}</p>
      </td>
      <td className="px-3 py-2 text-fg-muted">{plan.groupName}</td>
      <td className="px-3 py-2 text-right">
        {isDraft && !readOnly ? (
          <div className="flex items-center justify-end gap-1.5">
            <Input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              className="h-8 w-24 text-right"
            />
            <Button size="sm" variant="outline" onClick={handleSaveQty} disabled={busy || qty === plan.plannedQty}>
              저장
            </Button>
          </div>
        ) : (
          <span className="font-gauge">{formatNumber(plan.plannedQty)}</span>
        )}
      </td>
      <td className="px-3 py-2 text-right font-gauge text-fg-muted">{formatNumber(plan.plannedMinutes)}분</td>
      <td className="px-3 py-2">
        {plan.inspectionEndDate ? (
          <span className="text-xs text-fg-muted">~{plan.inspectionEndDate} 검사</span>
        ) : (
          <span className="text-xs text-fg-muted">-</span>
        )}
      </td>
      <td className="px-3 py-2">
        <Badge variant={plan.source === "AUTO" ? "neutral" : "accent"}>
          {plan.source === "AUTO" ? "자동" : "수동"}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={plan.status} />
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-1">
          {isDraft && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => run(() => confirmDailyPlan(plan.id))}
              disabled={readOnly || busy}
              aria-label="확정"
            >
              <Check className="h-3.5 w-3.5 text-signal-good" />
            </Button>
          )}
          {isConfirmed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => run(() => lockDailyPlan(plan.id))}
              disabled={readOnly || busy}
              aria-label="잠금"
            >
              <Lock className="h-3.5 w-3.5 text-accent" />
            </Button>
          )}
          {isDraft && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => run(() => deleteDailyPlan(plan.id))}
              disabled={readOnly || busy}
              aria-label="삭제"
            >
              <Trash2 className="h-3.5 w-3.5 text-signal-critical" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function DailyPlanTable({ plans, readOnly }: { plans: DailyPlanRow[]; readOnly: boolean }) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
            <th className="px-3 py-2 font-medium">품목</th>
            <th className="px-3 py-2 font-medium">생산그룹</th>
            <th className="px-3 py-2 font-medium text-right">계획수량</th>
            <th className="px-3 py-2 font-medium text-right">소요시간</th>
            <th className="px-3 py-2 font-medium">검사 리드타임</th>
            <th className="px-3 py-2 font-medium">생성방식</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium text-right">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {plans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} readOnly={readOnly} />
          ))}
          {plans.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-fg-muted">
                이 날짜에 등록된 일일 생산계획이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

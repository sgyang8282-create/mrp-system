"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmMonthlyPlan, deleteMonthlyPlan, updateMonthlyPlanQty } from "@/app/monthly-plans/actions";
import { formatNumber } from "@/lib/utils";
import type { MonthlyPlanRow } from "@/types/mrp";

function StatusBadge({ status }: { status: MonthlyPlanRow["status"] }) {
  return status === "CONFIRMED" ? (
    <Badge variant="good">확정</Badge>
  ) : (
    <Badge variant="warning">임시저장</Badge>
  );
}

function PlanRow({ plan, readOnly }: { plan: MonthlyPlanRow; readOnly: boolean }) {
  const router = useRouter();
  const [qty, setQty] = React.useState(plan.planQty);
  const [busy, setBusy] = React.useState(false);
  const isDraft = plan.status === "DRAFT";

  async function handleSaveQty() {
    setBusy(true);
    const formData = new FormData();
    formData.set("id", plan.id);
    formData.set("planQty", String(qty));
    const result = await updateMonthlyPlanQty(formData);
    setBusy(false);
    if (!result.ok) alert(result.error ?? "저장 중 오류가 발생했습니다.");
    else router.refresh();
  }

  async function handleConfirm() {
    setBusy(true);
    const result = await confirmMonthlyPlan(plan.id);
    setBusy(false);
    if (!result.ok) alert(result.error ?? "확정 중 오류가 발생했습니다.");
    else router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`'${plan.itemName}' 계획을 삭제하시겠습니까?`)) return;
    setBusy(true);
    const result = await deleteMonthlyPlan(plan.id);
    setBusy(false);
    if (!result.ok) alert(result.error ?? "삭제 중 오류가 발생했습니다.");
    else router.refresh();
  }

  return (
    <tr className="hover:bg-surface-raised/60">
      <td className="px-3 py-2">
        <p className="font-medium">{plan.itemName}</p>
        <p className="text-xs text-fg-muted">{plan.itemCode}</p>
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={plan.status} />
      </td>
      <td className="px-3 py-2 text-right">
        {isDraft && !readOnly ? (
          <div className="flex items-center justify-end gap-1.5">
            <Input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              className="h-8 w-28 text-right"
            />
            <Button size="sm" variant="outline" onClick={handleSaveQty} disabled={busy || qty === plan.planQty}>
              저장
            </Button>
          </div>
        ) : (
          <span className="font-gauge">{formatNumber(plan.planQty)}</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-1">
          {isDraft && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleConfirm}
              disabled={readOnly || busy}
              aria-label="확정"
            >
              <Check className="h-3.5 w-3.5 text-signal-good" />
            </Button>
          )}
          {isDraft && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDelete}
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

export function MonthlyPlanTable({ plans, readOnly }: { plans: MonthlyPlanRow[]; readOnly: boolean }) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
            <th className="px-3 py-2 font-medium">완제품</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium text-right">계획수량</th>
            <th className="px-3 py-2 font-medium text-right">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {plans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} readOnly={readOnly} />
          ))}
          {plans.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-fg-muted">
                이 달에 등록된 월간 생산계획이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MonthPicker } from "@/components/monthly-plans/month-picker";
import { MonthlyPlanTable } from "@/components/monthly-plans/monthly-plan-table";
import { MonthlyPlanAddForm } from "@/components/monthly-plans/monthly-plan-add-form";
import { RunMrpButton } from "@/components/monthly-plans/run-mrp-button";
import type { MonthlyPlanData } from "@/types/mrp";

export function MonthlyPlansPageClient({ data }: { data: MonthlyPlanData }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const hasConfirmedPlans = data.plans.some((p) => p.status === "CONFIRMED");

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다. 추가/확정/실행은 비활성화됩니다.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker planMonth={data.planMonth} />
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={data.isDemoData}>
          <Plus className="h-3.5 w-3.5" />
          계획 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>월간 생산계획 ({data.plans.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyPlanTable plans={data.plans} readOnly={data.isDemoData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MRP 전개</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-fg-muted">
            확정(CONFIRMED)된 계획을 기준으로 다단계 BOM 전개 → 순소요량 계산 → 생산그룹별 CAPA
            부하율 산출까지 한 번에 실행합니다.
          </p>
          <RunMrpButton planMonth={data.planMonth} disabled={data.isDemoData || !hasConfirmedPlans} />
          {!hasConfirmedPlans && !data.isDemoData && (
            <p className="mt-2 text-xs text-fg-muted">확정된 계획이 없어 MRP를 실행할 수 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="월간 생산계획 추가">
        <MonthlyPlanAddForm
          planMonth={data.planMonth}
          finishedItems={data.finishedItems}
          onSuccess={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}

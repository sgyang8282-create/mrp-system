"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SimulationControls } from "@/components/simulation/simulation-controls";
import { SimulationChart } from "@/components/simulation/simulation-chart";
import { SimulationTable } from "@/components/simulation/simulation-table";
import { AdjustmentForm } from "@/components/simulation/adjustment-form";
import type { SimulationData } from "@/types/simulation";

export function SimulationPageClient({ data, days }: { data: SimulationData; days: number }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const criticalCount = data.days.filter((d) => d.alertLevel === "CRITICAL").length;
  const warningCount = data.days.filter((d) => d.alertLevel === "WARNING").length;

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다. 조정 입력은 비활성화됩니다.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <SimulationControls items={data.items} itemId={data.itemId} days={days} />
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={data.isDemoData}>
          <Plus className="h-3.5 w-3.5" />
          재고 조정 입력
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {data.itemName} ({data.itemCode}) — 현재고 {data.currentQty}
            {criticalCount > 0 && <span className="ml-2 text-signal-critical">부족 {criticalCount}일</span>}
            {warningCount > 0 && <span className="ml-2 text-signal-warning">품절임박 {warningCount}일</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimulationChart days={data.days} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>일별 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <SimulationTable days={data.days} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="재고 조정 입력">
        <AdjustmentForm
          items={data.items}
          defaultItemId={data.itemId}
          onSuccess={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}

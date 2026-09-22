"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ActualForm } from "@/components/actuals/actual-form";
import { ActualsTable } from "@/components/actuals/actuals-table";
import { ActualsImportExport } from "@/components/actuals/actuals-import-export";
import type { ActualsData } from "@/types/actual";

export function ActualsPageClient({ data }: { data: ActualsData }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다. 입력/업로드는 비활성화됩니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>엑셀 업로드 / 다운로드</CardTitle>
        </CardHeader>
        <CardContent>
          <ActualsImportExport actualDate={data.actualDate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{data.actualDate} 생산실적 ({data.actuals.length}건)</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={data.actualDate}
              onChange={(e) => e.target.value && router.push(`/actuals?date=${e.target.value}`)}
              className="w-40"
            />
            <Button size="sm" onClick={() => setDialogOpen(true)} disabled={data.isDemoData}>
              <Plus className="h-3.5 w-3.5" />
              실적 입력
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ActualsTable actuals={data.actuals} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="생산실적 입력">
        <ActualForm
          actualDate={data.actualDate}
          items={data.items}
          onSuccess={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}

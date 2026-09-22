"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { BomTree } from "@/components/bom/bom-tree";
import { BomLineForm } from "@/components/bom/bom-line-form";
import { BomImportExport } from "@/components/bom/bom-import-export";
import type { BomData } from "@/types/bom";

export function BomPageClient({ data }: { data: BomData }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다. 추가/업로드는 비활성화됩니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>엑셀 업로드 / 다운로드</CardTitle>
        </CardHeader>
        <CardContent>
          <BomImportExport />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BOM 트리 ({data.forest.length}개 완제품 기준)</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)} disabled={data.isDemoData}>
            <Plus className="h-3.5 w-3.5" />
            BOM 라인 추가
          </Button>
        </CardHeader>
        <CardContent>
          <BomTree forest={data.forest} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="BOM 라인 추가">
        <BomLineForm
          items={data.items}
          groups={data.groups}
          onSuccess={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { InventoryImportExport } from "@/components/inventory/inventory-import-export";
import type { InventoryData } from "@/types/inventory";

export function InventoryPageClient({ data }: { data: InventoryData }) {
  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다. 수정/업로드는 비활성화됩니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>엑셀 업로드 / 다운로드</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryImportExport />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>품목별 현재고 ({data.rows.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryTable rows={data.rows} readOnly={data.isDemoData} />
        </CardContent>
      </Card>
    </div>
  );
}

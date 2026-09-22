import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RunSelector } from "@/components/mrp/run-selector";
import { MrpResultTable } from "@/components/mrp/mrp-result-table";
import { getMrpPageData } from "@/lib/services/mrp";

export const revalidate = 0;

export default async function MrpPage({ searchParams }: { searchParams: { runId?: string } }) {
  const data = await getMrpPageData(searchParams.runId ?? null);

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>MRP 전개 결과</CardTitle>
          {data.selectedRunId && (
            <a href={data.isDemoData ? undefined : `/api/mrp/${data.selectedRunId}/export`}>
              <Button variant="outline" size="sm" disabled={data.isDemoData}>
                <Download className="h-3.5 w-3.5" />
                엑셀 다운로드
              </Button>
            </a>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <RunSelector runs={data.runs} selectedRunId={data.selectedRunId} basePath="/mrp" />
          <MrpResultTable results={data.results} />
        </CardContent>
      </Card>
    </div>
  );
}

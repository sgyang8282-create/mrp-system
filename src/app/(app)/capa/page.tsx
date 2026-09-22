import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunSelector } from "@/components/mrp/run-selector";
import { CapaLoadChart } from "@/components/dashboard/capa-load-chart";
import { CapaGroupTable } from "@/components/capa/capa-group-table";
import { getCapaLoadsForRun } from "@/lib/services/mrp";

export const revalidate = 0;

export default async function CapaPage({ searchParams }: { searchParams: { runId?: string } }) {
  const data = await getCapaLoadsForRun(searchParams.runId ?? null);
  const overCount = data.loads.filter((l) => l.loadPct > 100).length;

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            CAPA 부하율 {overCount > 0 && <span className="ml-1 text-signal-critical">(초과 {overCount}개 그룹)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RunSelector runs={data.runs} selectedRunId={data.selectedRunId} basePath="/capa" />
          <CapaLoadChart data={data.loads} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>생산그룹별 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <CapaGroupTable loads={data.loads} />
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DateRangePicker } from "@/components/plan-vs-actual/date-range-picker";
import { PvaTrendChart } from "@/components/plan-vs-actual/pva-trend-chart";
import { PvaTable } from "@/components/plan-vs-actual/pva-table";
import { defaultDateRange, getPvaData } from "@/lib/services/plan-vs-actual";
import { formatPercent } from "@/lib/utils";

export const revalidate = 0;

export default async function PlanVsActualPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const defaults = defaultDateRange();
  const dateFrom = searchParams.from ?? defaults.dateFrom;
  const dateTo = searchParams.to ?? defaults.dateTo;
  const data = await getPvaData(dateFrom, dateTo);

  const totalPlanned = data.rows.reduce((sum, r) => sum + r.plannedQty, 0);
  const totalActual = data.rows.reduce((sum, r) => sum + r.actualQty, 0);
  const totalDefect = data.rows.reduce((sum, r) => sum + r.actualDefectQty, 0);
  const overallPct = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 1000) / 10 : 0;

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다.
        </div>
      )}

      <DateRangePicker dateFrom={dateFrom} dateTo={dateTo} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="전체 달성률" value={formatPercent(overallPct)} tone={overallPct >= 95 ? "good" : overallPct >= 80 ? "accent" : "warning"} />
        <KpiCard label="계획수량 합계" value={String(totalPlanned)} unit="개" />
        <KpiCard label="실적수량 합계" value={String(totalActual)} unit="개" tone="accent" />
        <KpiCard label="불량수량 합계" value={String(totalDefect)} unit="개" tone={totalDefect > 0 ? "warning" : "good"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>일자별 계획 vs 실적</CardTitle>
        </CardHeader>
        <CardContent>
          <PvaTrendChart data={data.dailyTotals} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상세 내역 ({data.rows.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          <PvaTable rows={data.rows} />
        </CardContent>
      </Card>
    </div>
  );
}

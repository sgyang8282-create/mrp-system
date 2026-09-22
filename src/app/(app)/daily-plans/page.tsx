import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/daily-plans/date-picker";
import { GenerateForm } from "@/components/daily-plans/generate-form";
import { DailyPlanTable } from "@/components/daily-plans/daily-plan-table";
import { getDailyPlanData, todayIso } from "@/lib/services/daily-plans";
import { getMrpRuns } from "@/lib/services/mrp";

export const revalidate = 0;

export default async function DailyPlansPage({ searchParams }: { searchParams: { date?: string } }) {
  const planDate = searchParams.date ?? todayIso();
  const [data, runs] = await Promise.all([getDailyPlanData(planDate), getMrpRuns()]);

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다 (오늘부터 시작하는 데모
          일정). 생성/수정/확정은 비활성화됩니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>일일계획 자동 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <GenerateForm runs={data.isDemoData ? [] : runs} defaultStartDate={todayIso()} />
          {data.isDemoData && (
            <p className="text-xs text-fg-muted">
              데모 모드에서는 페이지 로드 시 이미 데모 MRP 결과로 계산된 일정이 표시됩니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{planDate} 생산계획 ({data.plans.length}건)</CardTitle>
          <DatePicker planDate={planDate} />
        </CardHeader>
        <CardContent>
          <DailyPlanTable plans={data.plans} readOnly={data.isDemoData} />
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupTable } from "@/components/groups/group-table";
import type { GroupsData } from "@/types/group";

export function GroupsPageClient({ data }: { data: GroupsData }) {
  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다. 추가/수정/삭제는 비활성화됩니다.
        </div>
      )}

      <div className="rounded border border-border bg-surface px-4 py-3 text-xs text-fg-muted">
        가용시간(CAPA) = 근무인원 × 월근무일수 × 450분 − 연차시간 − 기타손실시간. 이 값은 CAPA 분석에서
        생산그룹별 부하율(소요시간 ÷ 가용시간)을 계산하는 기준이 됩니다.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>생산그룹 ({data.rows.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupTable rows={data.rows} readOnly={data.isDemoData} />
        </CardContent>
      </Card>
    </div>
  );
}

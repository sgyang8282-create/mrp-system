import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import type { PvaRow } from "@/types/plan-vs-actual";

export function PvaTable({ rows }: { rows: PvaRow[] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-muted">해당 기간에 계획/실적 데이터가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
            <th className="px-3 py-2 font-medium">날짜</th>
            <th className="px-3 py-2 font-medium">품목</th>
            <th className="px-3 py-2 font-medium">생산그룹</th>
            <th className="px-3 py-2 font-medium text-right">계획수량</th>
            <th className="px-3 py-2 font-medium text-right">실적수량</th>
            <th className="px-3 py-2 font-medium text-right">달성률</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, idx) => {
            const pct = row.achievementPct;
            const tone: "good" | "warning" | "critical" = pct === null || pct >= 95 ? "good" : pct >= 80 ? "warning" : "critical";
            return (
              <tr key={idx} className="hover:bg-surface-raised/60">
                <td className="px-3 py-2 text-xs text-fg-muted">{row.planDate}</td>
                <td className="px-3 py-2">
                  <p className="font-medium">{row.itemName}</p>
                  <p className="text-xs text-fg-muted">{row.itemCode}</p>
                </td>
                <td className="px-3 py-2 text-fg-muted">{row.groupName}</td>
                <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.plannedQty)}</td>
                <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.actualQty)}</td>
                <td className="px-3 py-2 text-right">
                  {pct === null ? (
                    <span className="text-fg-muted">-</span>
                  ) : (
                    <Badge variant={tone}>{formatPercent(pct)}</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import type { CapaLoadItem } from "@/types/dashboard";

export function CapaGroupTable({ loads }: { loads: CapaLoadItem[] }) {
  if (loads.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-muted">CAPA 산출 결과가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
            <th className="px-3 py-2 font-medium">생산그룹</th>
            <th className="px-3 py-2 font-medium text-right">가용시간(분)</th>
            <th className="px-3 py-2 font-medium text-right">소요시간(분)</th>
            <th className="px-3 py-2 font-medium text-right">부하율</th>
            <th className="px-3 py-2 font-medium text-right">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loads
            .slice()
            .sort((a, b) => b.loadPct - a.loadPct)
            .map((row) => {
              const over = row.loadPct > 100;
              const warn = row.loadPct >= 85 && !over;
              return (
                <tr key={row.groupName} className="hover:bg-surface-raised/60">
                  <td className="px-3 py-2 font-medium">{row.groupName}</td>
                  <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.availableMinutes)}</td>
                  <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.requiredMinutes)}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-gauge font-semibold",
                      over && "text-signal-critical",
                      warn && "text-signal-warning",
                      !over && !warn && "text-signal-good"
                    )}
                  >
                    {formatPercent(row.loadPct)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge variant={over ? "critical" : warn ? "warning" : "good"}>
                      {over ? "초과" : warn ? "여유부족" : "정상"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

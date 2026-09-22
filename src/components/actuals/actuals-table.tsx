import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { ActualRow } from "@/types/actual";

export function ActualsTable({ actuals }: { actuals: ActualRow[] }) {
  if (actuals.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-muted">이 날짜에 입력된 생산실적이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
            <th className="px-3 py-2 font-medium">품목</th>
            <th className="px-3 py-2 font-medium text-right">생산수량</th>
            <th className="px-3 py-2 font-medium text-right">불량수량</th>
            <th className="px-3 py-2 font-medium">입력방식</th>
            <th className="px-3 py-2 font-medium text-right">입력시각</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {actuals.map((row) => (
            <tr key={row.id} className="hover:bg-surface-raised/60">
              <td className="px-3 py-2">
                <p className="font-medium">{row.itemName}</p>
                <p className="text-xs text-fg-muted">{row.itemCode}</p>
              </td>
              <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.qty)}</td>
              <td className="px-3 py-2 text-right font-gauge text-signal-warning">
                {row.defectQty > 0 ? formatNumber(row.defectQty) : "-"}
              </td>
              <td className="px-3 py-2">
                <Badge variant={row.inputType === "MANUAL" ? "neutral" : "accent"}>
                  {row.inputType === "MANUAL" ? "수동" : "엑셀"}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right text-xs text-fg-muted">
                {new Date(row.createdAt).toLocaleString("ko-KR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

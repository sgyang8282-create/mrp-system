import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";
import type { SimulationDayRow } from "@/types/simulation";

export function SimulationTable({ days }: { days: SimulationDayRow[] }) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
            <th className="px-3 py-2 font-medium">날짜</th>
            <th className="px-3 py-2 font-medium text-right">기초재고</th>
            <th className="px-3 py-2 font-medium text-right">생산량</th>
            <th className="px-3 py-2 font-medium text-right">소요량</th>
            <th className="px-3 py-2 font-medium text-right">출고</th>
            <th className="px-3 py-2 font-medium text-right">불량</th>
            <th className="px-3 py-2 font-medium text-right">예상재고</th>
            <th className="px-3 py-2 font-medium text-right">경고</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {days.map((row) => (
            <tr key={row.date} className="hover:bg-surface-raised/60">
              <td className="px-3 py-2 text-xs">{row.date}</td>
              <td className="px-3 py-2 text-right font-gauge text-fg-muted">{formatNumber(row.beginningQty)}</td>
              <td className="px-3 py-2 text-right font-gauge text-signal-good">
                {row.productionQty > 0 ? `+${formatNumber(row.productionQty)}` : "-"}
              </td>
              <td className="px-3 py-2 text-right font-gauge">
                {row.requirementQty > 0 ? `-${formatNumber(row.requirementQty)}` : "-"}
              </td>
              <td className="px-3 py-2 text-right font-gauge">
                {row.shipmentQty > 0 ? `-${formatNumber(row.shipmentQty)}` : "-"}
              </td>
              <td className="px-3 py-2 text-right font-gauge">
                {row.defectQty > 0 ? `-${formatNumber(row.defectQty)}` : "-"}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-gauge font-semibold",
                  row.alertLevel === "CRITICAL" && "text-signal-critical",
                  row.alertLevel === "WARNING" && "text-signal-warning"
                )}
              >
                {formatNumber(row.expectedQty)}
              </td>
              <td className="px-3 py-2 text-right">
                {row.alertLevel === "CRITICAL" && <Badge variant="critical">재고부족</Badge>}
                {row.alertLevel === "WARNING" && <Badge variant="warning">품절임박</Badge>}
                {row.alertLevel === "NONE" && <Badge variant="good">정상</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

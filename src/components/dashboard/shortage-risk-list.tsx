import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { ShortageRiskItem } from "@/types/dashboard";

export function ShortageRiskList({ items }: { items: ShortageRiskItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-fg-muted">
        결품 위험 품목이 없습니다.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.itemCode} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm">
              {item.itemName} <span className="text-xs text-fg-muted">{item.itemCode}</span>
            </p>
            <p className="text-xs text-fg-muted">
              {item.daysUntilShortage === 0
                ? "오늘 품절 예상"
                : `${item.daysUntilShortage}일 후 품절 예상`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={
                item.expectedQty < 0
                  ? "font-gauge text-sm font-medium text-signal-critical"
                  : "font-gauge text-sm font-medium text-signal-warning"
              }
            >
              {formatNumber(item.expectedQty)}
            </span>
            <Badge variant={item.alertLevel === "CRITICAL" ? "critical" : "warning"}>
              {item.alertLevel === "CRITICAL" ? "재고부족" : "품절임박"}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

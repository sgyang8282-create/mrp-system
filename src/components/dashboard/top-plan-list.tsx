import { formatNumber } from "@/lib/utils";
import type { TopPlanItem } from "@/types/dashboard";

export function TopPlanList({ items }: { items: TopPlanItem[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-fg-muted">등록된 월간 생산계획이 없습니다.</p>;
  }

  const max = Math.max(...items.map((i) => i.planQty));

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={item.itemCode} className="flex items-center gap-3">
          <span className="w-5 shrink-0 font-gauge text-xs text-fg-muted">{idx + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm">
                {item.itemName}
                <span className="ml-1.5 text-xs text-fg-muted">{item.itemCode}</span>
              </p>
              <span className="font-gauge shrink-0 text-sm font-medium">
                {formatNumber(item.planQty)}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-surface-raised">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(4, (item.planQty / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

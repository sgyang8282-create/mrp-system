"use client";

import * as React from "react";
import { getInventoryHistoryAction } from "@/app/inventory/actions";
import { formatNumber } from "@/lib/utils";
import type { InventoryHistoryRow } from "@/types/inventory";

function formatDateTime(iso: string) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function InventoryHistoryList({ itemId }: { itemId: string }) {
  const [history, setHistory] = React.useState<InventoryHistoryRow[] | null>(null);

  React.useEffect(() => {
    let active = true;
    getInventoryHistoryAction(itemId).then((data) => {
      if (active) setHistory(data);
    });
    return () => {
      active = false;
    };
  }, [itemId]);

  if (history === null) {
    return <p className="py-4 text-center text-sm text-fg-muted">불러오는 중...</p>;
  }

  if (history.length === 0) {
    return <p className="py-4 text-center text-sm text-fg-muted">변경 이력이 없습니다.</p>;
  }

  return (
    <ul className="max-h-80 space-y-2 overflow-y-auto">
      {history.map((h) => (
        <li key={h.id} className="rounded border border-border px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-gauge">
              {formatNumber(h.beforeQty)} → {formatNumber(h.afterQty)}
            </span>
            <span
              className={`font-gauge text-xs font-medium ${
                h.changeQty >= 0 ? "text-signal-good" : "text-signal-critical"
              }`}
            >
              {h.changeQty >= 0 ? "+" : ""}
              {formatNumber(h.changeQty)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
            <span>{h.reason ?? "-"}</span>
            <span>{formatDateTime(h.changedAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

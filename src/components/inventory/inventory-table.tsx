"use client";

import * as React from "react";
import { History, Pencil, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { InventoryEditForm } from "@/components/inventory/inventory-edit-form";
import { InventoryHistoryList } from "@/components/inventory/inventory-history-list";
import { formatNumber, cn } from "@/lib/utils";
import type { InventoryRow } from "@/types/inventory";
import type { ItemType } from "@/types/database";

const TYPE_BADGE: Record<ItemType, { label: string; variant: "accent" | "neutral" | "good" }> = {
  FINISHED: { label: "완제품", variant: "accent" },
  SEMI: { label: "반제품", variant: "good" },
  PART: { label: "부품", variant: "neutral" },
};

export function InventoryTable({ rows, readOnly }: { rows: InventoryRow[]; readOnly: boolean }) {
  const [query, setQuery] = React.useState("");
  const [editTarget, setEditTarget] = React.useState<InventoryRow | null>(null);
  const [historyTarget, setHistoryTarget] = React.useState<InventoryRow | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.itemCode.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="품목코드 또는 품목명 검색"
          className="pl-8"
        />
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
              <th className="px-3 py-2 font-medium">구분</th>
              <th className="px-3 py-2 font-medium">품목</th>
              <th className="px-3 py-2 font-medium text-right">현재고</th>
              <th className="px-3 py-2 font-medium">단위</th>
              <th className="px-3 py-2 font-medium">최근 변경</th>
              <th className="px-3 py-2 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => {
              const badge = TYPE_BADGE[row.itemType];
              return (
                <tr key={row.itemId} className="hover:bg-surface-raised/60">
                  <td className="px-3 py-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.itemName}</p>
                    <p className="text-xs text-fg-muted">{row.itemCode}</p>
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-gauge",
                      row.quantity <= 0 && "font-semibold text-signal-critical"
                    )}
                  >
                    {formatNumber(row.quantity)}
                  </td>
                  <td className="px-3 py-2 text-fg-muted">{row.unit}</td>
                  <td className="px-3 py-2 text-xs text-fg-muted">
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleString("ko-KR") : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setHistoryTarget(row)}
                        aria-label="변경 이력"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditTarget(row)}
                        disabled={readOnly}
                        aria-label="재고 수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-fg-muted">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)} title="재고 수정">
        {editTarget && (
          <InventoryEditForm row={editTarget} onSuccess={() => setEditTarget(null)} />
        )}
      </Dialog>

      <Dialog
        open={!!historyTarget}
        onOpenChange={(open) => !open && setHistoryTarget(null)}
        title={historyTarget ? `${historyTarget.itemName} 변경 이력` : "변경 이력"}
      >
        {historyTarget && <InventoryHistoryList itemId={historyTarget.itemId} />}
      </Dialog>
    </div>
  );
}

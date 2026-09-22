"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import type { MrpResultLineRow } from "@/types/mrp";
import type { ItemType } from "@/types/database";

const TYPE_BADGE: Record<ItemType, { label: string; variant: "accent" | "neutral" | "good" }> = {
  FINISHED: { label: "완제품", variant: "accent" },
  SEMI: { label: "반제품", variant: "good" },
  PART: { label: "부품", variant: "neutral" },
};

export function MrpResultTable({ results }: { results: MrpResultLineRow[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter(
      (r) => r.itemCode.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q)
    );
  }, [results, query]);

  if (results.length === 0) {
    return <p className="py-8 text-center text-sm text-fg-muted">전개 결과가 없습니다.</p>;
  }

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
              <th className="px-3 py-2 font-medium">레벨</th>
              <th className="px-3 py-2 font-medium">구분</th>
              <th className="px-3 py-2 font-medium">품목</th>
              <th className="px-3 py-2 font-medium text-right">총소요량</th>
              <th className="px-3 py-2 font-medium text-right">현재고</th>
              <th className="px-3 py-2 font-medium text-right">순소요량</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => {
              const badge = TYPE_BADGE[row.itemType];
              const shortage = row.netRequirement > 0;
              return (
                <tr key={row.id} className="hover:bg-surface-raised/60">
                  <td className="px-3 py-2 text-fg-muted">{row.bomLevel}</td>
                  <td className="px-3 py-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.itemName}</p>
                    <p className="text-xs text-fg-muted">{row.itemCode}</p>
                  </td>
                  <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.grossRequirement)}</td>
                  <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.onHandQty)}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-gauge",
                      shortage && "font-semibold text-signal-warning"
                    )}
                  >
                    {formatNumber(row.netRequirement)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

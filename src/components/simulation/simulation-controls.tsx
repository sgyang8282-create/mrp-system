"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { SimulationItemOption } from "@/types/simulation";

export function SimulationControls({
  items,
  itemId,
  days,
}: {
  items: SimulationItemOption[];
  itemId: string;
  days: number;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">품목</label>
        <Select
          value={itemId}
          onChange={(e) => router.push(`/simulation?itemId=${e.target.value}&days=${days}`)}
          className="w-56"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.itemName} ({item.itemCode})
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">조회 기간</label>
        <div className="flex overflow-hidden rounded border border-border">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => router.push(`/simulation?itemId=${itemId}&days=${d}`)}
              className={`px-3 py-1.5 text-sm ${
                d === days ? "bg-accent text-accent-fg" : "bg-surface text-fg-muted hover:bg-surface-raised"
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

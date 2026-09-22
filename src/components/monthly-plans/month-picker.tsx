"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function MonthPicker({ planMonth }: { planMonth: string }) {
  const router = useRouter();
  const value = planMonth.slice(0, 7); // YYYY-MM

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-fg-muted">대상 월</label>
      <Input
        type="month"
        value={value}
        onChange={(e) => {
          if (!e.target.value) return;
          router.push(`/monthly-plans?month=${e.target.value}-01`);
        }}
        className="w-40"
      />
    </div>
  );
}

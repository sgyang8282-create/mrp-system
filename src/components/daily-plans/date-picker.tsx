"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function DatePicker({ planDate }: { planDate: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-fg-muted">조회 날짜</label>
      <Input
        type="date"
        value={planDate}
        onChange={(e) => {
          if (!e.target.value) return;
          router.push(`/daily-plans?date=${e.target.value}`);
        }}
        className="w-44"
      />
    </div>
  );
}

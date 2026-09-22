"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DateRangePicker({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const router = useRouter();
  const [from, setFrom] = React.useState(dateFrom);
  const [to, setTo] = React.useState(dateTo);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">시작일</label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">종료일</label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
      </div>
      <Button size="sm" variant="outline" onClick={() => router.push(`/plan-vs-actual?from=${from}&to=${to}`)}>
        조회
      </Button>
    </div>
  );
}

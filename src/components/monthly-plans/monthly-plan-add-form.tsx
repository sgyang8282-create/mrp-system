"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createMonthlyPlan, type ActionResult } from "@/app/monthly-plans/actions";
import type { FinishedItemOption } from "@/types/mrp";

const initialState: ActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "저장 중..." : "계획 추가"}
    </Button>
  );
}

export function MonthlyPlanAddForm({
  planMonth,
  finishedItems,
  onSuccess,
}: {
  planMonth: string;
  finishedItems: FinishedItemOption[];
  onSuccess: () => void;
}) {
  const [state, formAction] = React.useActionState(
    async (_prev: ActionResult, formData: FormData) => createMonthlyPlan(formData),
    initialState
  );

  React.useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="planMonth" value={planMonth} />

      <div>
        <label className="mb-1 block text-xs text-fg-muted">완제품</label>
        <Select name="itemId" required defaultValue="">
          <option value="" disabled>
            선택해 주세요
          </option>
          {finishedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.itemName} ({item.itemCode})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">계획수량</label>
        <Input name="planQty" type="number" min="0" step="1" required placeholder="1000" />
      </div>

      {!state.ok && state.error && (
        <p className="rounded bg-signal-critical/10 px-2.5 py-1.5 text-xs text-signal-critical">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}


"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateInventoryQuantity, type ActionResult } from "@/app/inventory/actions";
import { formatNumber } from "@/lib/utils";
import type { InventoryRow } from "@/types/inventory";

const initialState: ActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "저장 중..." : "재고 저장"}
    </Button>
  );
}

export function InventoryEditForm({ row, onSuccess }: { row: InventoryRow; onSuccess: () => void }) {
  const [state, formAction] = React.useActionState(
    async (_prev: ActionResult, formData: FormData) => updateInventoryQuantity(formData),
    initialState
  );

  React.useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="itemId" value={row.itemId} />

      <div className="rounded bg-surface-raised px-3 py-2 text-sm">
        <p className="font-medium">
          {row.itemName} <span className="text-xs text-fg-muted">{row.itemCode}</span>
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          현재고{" "}
          <span className="font-gauge font-medium text-fg">{formatNumber(row.quantity)}</span> {row.unit}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">새 수량</label>
        <Input name="quantity" type="number" min="0" step="0.01" required defaultValue={row.quantity} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">변경 사유 (선택)</label>
        <Input name="reason" type="text" placeholder="예: 실사 반영, 오입력 수정 등" />
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


"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createInventoryAdjustment, type ActionResult } from "@/app/simulation/actions";
import type { SimulationItemOption } from "@/types/simulation";

const initialState: ActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "저장 중..." : "재고 조정 등록"}
    </Button>
  );
}

export function AdjustmentForm({
  items,
  defaultItemId,
  onSuccess,
}: {
  items: SimulationItemOption[];
  defaultItemId: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = React.useActionState(
    async (_prev: ActionResult, formData: FormData) => createInventoryAdjustment(formData),
    initialState
  );

  React.useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">품목</label>
        <Select name="itemId" required defaultValue={defaultItemId}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.itemName} ({item.itemCode})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">조정 유형</label>
        <Select name="adjustmentType" required defaultValue="SHIPMENT_OUT">
          <option value="SHIPMENT_OUT">생산 외 출고</option>
          <option value="DISPOSAL">폐기</option>
          <option value="CORRECTION">재고 보정 (+/-)</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">
          수량 (출고/폐기는 양수 입력, 보정은 +/- 모두 가능)
        </label>
        <Input name="qty" type="number" step="0.01" required placeholder="예: 10 또는 -5" />
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">사유 (선택)</label>
        <Input name="reason" type="text" placeholder="예: 샘플 출고, 파손 폐기 등" />
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


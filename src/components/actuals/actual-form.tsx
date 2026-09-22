"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { submitProductionActual, type ActionResult } from "@/app/actuals/actions";
import type { ActualItemOption } from "@/types/actual";

const initialState: ActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "저장 중..." : "실적 입력"}
    </Button>
  );
}

export function ActualForm({
  actualDate,
  items,
  onSuccess,
}: {
  actualDate: string;
  items: ActualItemOption[];
  onSuccess: () => void;
}) {
  const [state, formAction] = React.useActionState(
    async (_prev: ActionResult, formData: FormData) => submitProductionActual(formData),
    initialState
  );

  React.useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">날짜</label>
        <Input name="actualDate" type="date" required defaultValue={actualDate} />
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">품목</label>
        <Select name="itemId" required defaultValue="">
          <option value="" disabled>
            선택해 주세요
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.itemName} ({item.itemCode})
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">생산수량</label>
          <Input name="qty" type="number" min="0" step="1" required placeholder="0" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">불량수량</label>
          <Input name="defectQty" type="number" min="0" step="1" defaultValue={0} />
        </div>
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


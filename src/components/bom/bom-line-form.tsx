"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createBomLine, type ActionResult } from "@/app/bom/actions";
import type { ItemOption, ProductionGroupOption } from "@/types/bom";

const initialState: ActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "저장 중..." : "BOM 라인 추가"}
    </Button>
  );
}

export function BomLineForm({
  items,
  groups,
  onSuccess,
}: {
  items: ItemOption[];
  groups: ProductionGroupOption[];
  onSuccess: () => void;
}) {
  const [state, formAction] = React.useActionState(
    async (_prev: ActionResult, formData: FormData) => createBomLine(formData),
    initialState
  );

  React.useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">모품목 (상위 품목)</label>
        <Select name="parentItemId" required defaultValue="">
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

      <div>
        <label className="mb-1 block text-xs text-fg-muted">자품목 (하위 품목)</label>
        <Select name="childItemId" required defaultValue="">
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
          <label className="mb-1 block text-xs text-fg-muted">정미수량</label>
          <Input name="quantityPer" type="number" min="0.0001" step="0.0001" required placeholder="1" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">작업소요시간(분)</label>
          <Input name="workTimeMin" type="number" min="0" step="0.1" placeholder="0" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-fg-muted">생산그룹 (선택)</label>
        <Select name="productionGroupId" defaultValue="">
          <option value="">지정 안 함</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.groupName}
            </option>
          ))}
        </Select>
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


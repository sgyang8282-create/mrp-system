"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGroup, updateGroup, type ActionResult } from "@/app/groups/actions";
import { formatNumber } from "@/lib/utils";
import type { ProductionGroupRow } from "@/types/group";

const initialState: ActionResult = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "저장 중..." : label}
    </Button>
  );
}

export function GroupForm({
  group,
  onSuccess,
}: {
  group?: ProductionGroupRow;
  onSuccess: () => void;
}) {
  const isEdit = !!group;
  const action = isEdit ? updateGroup : createGroup;

  const [state, formAction] = React.useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    initialState
  );

  const [headcount, setHeadcount] = React.useState(group?.headcount ?? 0);
  const [days, setDays] = React.useState(group?.monthlyWorkDays ?? 22);
  const [leave, setLeave] = React.useState(group?.annualLeaveMinutes ?? 0);
  const [loss, setLoss] = React.useState(group?.otherLossMinutes ?? 0);

  const preview = headcount * days * 450 - leave - loss;

  React.useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      {isEdit && <input type="hidden" name="id" value={group!.id} />}

      <div>
        <label className="mb-1 block text-xs text-fg-muted">그룹명</label>
        <Input name="groupName" required defaultValue={group?.groupName} placeholder="예: 조립1조" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">근무인원수</label>
          <Input
            name="headcount"
            type="number"
            min="0"
            required
            defaultValue={group?.headcount ?? 0}
            onChange={(e) => setHeadcount(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">월근무일수</label>
          <Input
            name="monthlyWorkDays"
            type="number"
            min="0"
            required
            defaultValue={group?.monthlyWorkDays ?? 22}
            onChange={(e) => setDays(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">연차시간(분)</label>
          <Input
            name="annualLeaveMinutes"
            type="number"
            min="0"
            defaultValue={group?.annualLeaveMinutes ?? 0}
            onChange={(e) => setLeave(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">기타손실시간(분)</label>
          <Input
            name="otherLossMinutes"
            type="number"
            min="0"
            defaultValue={group?.otherLossMinutes ?? 0}
            onChange={(e) => setLoss(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded bg-surface-raised px-3 py-2 text-xs text-fg-muted">
        가용시간 미리보기 = {headcount} × {days} × 450 − {formatNumber(leave)} − {formatNumber(loss)} ={" "}
        <span className="font-gauge font-semibold text-fg">{formatNumber(preview)}</span>분
      </div>

      {!state.ok && state.error && (
        <p className="rounded bg-signal-critical/10 px-2.5 py-1.5 text-xs text-signal-critical">
          {state.error}
        </p>
      )}

      <SubmitButton label={isEdit ? "수정 사항 저장" : "생산그룹 추가"} />
    </form>
  );
}


"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { GroupForm } from "@/components/groups/group-form";
import { deleteGroup } from "@/app/groups/actions";
import { formatNumber } from "@/lib/utils";
import type { ProductionGroupRow } from "@/types/group";

export function GroupTable({ rows, readOnly }: { rows: ProductionGroupRow[]; readOnly: boolean }) {
  const router = useRouter();
  const [dialogMode, setDialogMode] = React.useState<"none" | "create" | "edit">("none");
  const [editTarget, setEditTarget] = React.useState<ProductionGroupRow | undefined>(undefined);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function openCreate() {
    setEditTarget(undefined);
    setDialogMode("create");
  }

  function openEdit(row: ProductionGroupRow) {
    setEditTarget(row);
    setDialogMode("edit");
  }

  async function handleDelete(row: ProductionGroupRow) {
    if (!confirm(`'${row.groupName}' 생산그룹을 삭제하시겠습니까? 연결된 품목/BOM이 있으면 실패할 수 있습니다.`)) {
      return;
    }
    setDeletingId(row.id);
    const result = await deleteGroup(row.id);
    setDeletingId(null);
    if (!result.ok) alert(result.error ?? "삭제 중 오류가 발생했습니다.");
    else router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} disabled={readOnly}>
          <Plus className="h-3.5 w-3.5" />
          생산그룹 추가
        </Button>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised text-left text-xs text-fg-muted">
              <th className="px-3 py-2 font-medium">그룹명</th>
              <th className="px-3 py-2 font-medium text-right">인원</th>
              <th className="px-3 py-2 font-medium text-right">월근무일</th>
              <th className="px-3 py-2 font-medium text-right">연차(분)</th>
              <th className="px-3 py-2 font-medium text-right">기타손실(분)</th>
              <th className="px-3 py-2 font-medium text-right">가용시간(분)</th>
              <th className="px-3 py-2 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-raised/60">
                <td className="px-3 py-2 font-medium">{row.groupName}</td>
                <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.headcount)}</td>
                <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.monthlyWorkDays)}</td>
                <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.annualLeaveMinutes)}</td>
                <td className="px-3 py-2 text-right font-gauge">{formatNumber(row.otherLossMinutes)}</td>
                <td className="px-3 py-2 text-right">
                  <Badge variant="accent">{formatNumber(row.availableMinutes)}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(row)}
                      disabled={readOnly}
                      aria-label="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(row)}
                      disabled={readOnly || deletingId === row.id}
                      aria-label="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-signal-critical" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-fg-muted">
                  등록된 생산그룹이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogMode !== "none"}
        onOpenChange={(open) => !open && setDialogMode("none")}
        title={dialogMode === "edit" ? "생산그룹 수정" : "생산그룹 추가"}
      >
        <GroupForm
          group={editTarget}
          onSuccess={() => {
            setDialogMode("none");
            router.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}

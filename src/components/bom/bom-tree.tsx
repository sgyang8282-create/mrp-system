"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, cn } from "@/lib/utils";
import type { BomTreeNode } from "@/types/bom";
import type { ItemType } from "@/types/database";
import { deleteBomLine } from "@/app/bom/actions";

const TYPE_BADGE: Record<ItemType, { label: string; variant: "accent" | "neutral" | "good" }> = {
  FINISHED: { label: "완제품", variant: "accent" },
  SEMI: { label: "반제품", variant: "good" },
  PART: { label: "부품", variant: "neutral" },
};

function TreeNode({ node, depth, path }: { node: BomTreeNode; depth: number; path: string }) {
  const [expanded, setExpanded] = React.useState(depth < 1);
  const [deleting, setDeleting] = React.useState(false);
  const hasChildren = node.children.length > 0;
  const badge = TYPE_BADGE[node.itemType];

  async function handleDelete() {
    if (!node.bomLineId) return;
    if (!confirm(`'${node.itemName}(${node.itemCode})' 연결을 BOM에서 제거하시겠습니까?`)) return;
    setDeleting(true);
    const result = await deleteBomLine(node.bomLineId);
    setDeleting(false);
    if (!result.ok) alert(result.error ?? "삭제 중 오류가 발생했습니다.");
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-raised",
          node.cycleDetected && "bg-signal-critical/10"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center text-fg-muted",
            !hasChildren && "invisible"
          )}
          aria-label={expanded ? "접기" : "펼치기"}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <Badge variant={badge.variant}>{badge.label}</Badge>

        <span className="truncate text-sm font-medium">{node.itemName}</span>
        <span className="shrink-0 text-xs text-fg-muted">{node.itemCode}</span>

        {node.cycleDetected && (
          <span className="flex items-center gap-1 text-xs font-medium text-signal-critical">
            <AlertTriangle className="h-3.5 w-3.5" /> 순환참조 감지됨
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-3 text-xs text-fg-muted">
          {depth > 0 && (
            <span>
              단위소요 <span className="font-gauge text-fg">{formatNumber(node.quantityPer)}</span>
            </span>
          )}
          <span>
            누적소요 <span className="font-gauge text-fg">{formatNumber(node.cumulativeQty)}</span>
          </span>
          {node.workTimeMin > 0 && (
            <span>
              <span className="font-gauge text-fg">{formatNumber(node.workTimeMin)}</span>분/개
            </span>
          )}
          {node.groupName && <Badge>{node.groupName}</Badge>}
          {node.bomLineId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="BOM 연결 삭제"
            >
              <Trash2 className="h-3.5 w-3.5 text-signal-critical" />
            </Button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode key={`${path}-${child.itemId}-${idx}`} node={child} depth={depth + 1} path={`${path}-${idx}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BomTree({ forest }: { forest: BomTreeNode[] }) {
  if (forest.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        등록된 BOM이 없습니다. 아래 &quot;BOM 라인 추가&quot; 또는 엑셀 업로드로 등록해 주세요.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {forest.map((root, idx) => (
        <TreeNode key={`${root.itemId}-${idx}`} node={root} depth={0} path={`root-${idx}`} />
      ))}
    </div>
  );
}

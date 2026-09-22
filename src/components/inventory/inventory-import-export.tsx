"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ImportResult } from "@/types/inventory";

export function InventoryImportExport() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/inventory/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setResult({ totalRows: 0, successCount: 0, failedRows: [{ row: 0, reason: data.error ?? "업로드 실패" }] });
      } else {
        setResult(data);
        router.refresh();
      }
    } catch {
      setResult({
        totalRows: 0,
        successCount: 0,
        failedRows: [{ row: 0, reason: "업로드 중 알 수 없는 오류가 발생했습니다." }],
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "업로드 중..." : "엑셀 업로드"}
        </Button>
        <a href="/api/inventory/export">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            현재고 다운로드
          </Button>
        </a>
        <span className="flex items-center gap-1 text-xs text-fg-muted">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          품목코드 · 수량
        </span>
      </div>

      {result && (
        <div className="rounded border border-border bg-surface-raised p-3 text-xs">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant={result.failedRows.length > 0 ? "warning" : "good"}>
              성공 {result.successCount} / 전체 {result.totalRows}
            </Badge>
            {result.failedRows.length > 0 && <Badge variant="critical">실패 {result.failedRows.length}건</Badge>}
          </div>
          {result.failedRows.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-fg-muted">
              {result.failedRows.map((f, idx) => (
                <li key={idx}>
                  {f.row > 0 ? `${f.row}행: ` : ""}
                  {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

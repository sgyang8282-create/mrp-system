import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { buildBomForest } from "@/lib/bom/tree";
import { getDemoBomData } from "@/lib/services/bom.demo";
import type { BomData, BomLineRow, ItemOption, ProductionGroupOption } from "@/types/bom";

export async function getBomData(): Promise<BomData> {
  if (!isSupabaseConfigured()) {
    return getDemoBomData();
  }

  try {
    const supabase = createServerSupabaseClient();

    const [{ data: itemRows, error: itemsError }, { data: groupRows, error: groupsError }, { data: lineRows, error: linesError }] =
      await Promise.all([
        supabase
          .from("items")
          .select("id, item_code, item_name, item_type")
          .eq("is_active", true)
          .order("item_code"),
        supabase.from("production_groups").select("id, group_name").order("group_name"),
        supabase
          .from("bom_lines")
          .select(
            `id, quantity_per, work_time_min,
             parent:items!bom_lines_parent_item_id_fkey(id, item_code, item_name),
             child:items!bom_lines_child_item_id_fkey(id, item_code, item_name, item_type),
             production_groups(group_name)`
          ),
      ]);

    if (itemsError || groupsError || linesError) {
      throw itemsError ?? groupsError ?? linesError;
    }

    const items: ItemOption[] = (itemRows ?? []).map((r: any) => ({
      id: r.id,
      itemCode: r.item_code,
      itemName: r.item_name,
      itemType: r.item_type,
    }));

    const groups: ProductionGroupOption[] = (groupRows ?? []).map((r: any) => ({
      id: r.id,
      groupName: r.group_name,
    }));

    const lines: BomLineRow[] = (lineRows ?? []).map((r: any) => ({
      id: r.id,
      parentItemId: r.parent?.id,
      parentItemCode: r.parent?.item_code ?? "-",
      parentItemName: r.parent?.item_name ?? "-",
      childItemId: r.child?.id,
      childItemCode: r.child?.item_code ?? "-",
      childItemName: r.child?.item_name ?? "-",
      childItemType: r.child?.item_type ?? "PART",
      quantityPer: r.quantity_per,
      workTimeMin: r.work_time_min ?? 0,
      groupName: r.production_groups?.group_name ?? null,
    }));

    return {
      items,
      groups,
      lines,
      forest: buildBomForest(items, lines),
      isDemoData: false,
    };
  } catch (error) {
    console.error("[getBomData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoBomData();
  }
}

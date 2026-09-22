import { InventoryPageClient } from "@/components/inventory/inventory-page-client";
import { getInventoryData } from "@/lib/services/inventory";

export const revalidate = 0;

export default async function InventoryPage() {
  const data = await getInventoryData();
  return <InventoryPageClient data={data} />;
}

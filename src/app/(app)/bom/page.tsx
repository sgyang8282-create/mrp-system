import { BomPageClient } from "@/components/bom/bom-page-client";
import { getBomData } from "@/lib/services/bom";

export const revalidate = 0;

export default async function BomPage() {
  const data = await getBomData();
  return <BomPageClient data={data} />;
}

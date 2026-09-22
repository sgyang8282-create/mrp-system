import type { SimAlertLevel } from "@/lib/mrp/simulation-engine";

export interface SimulationItemOption {
  id: string;
  itemCode: string;
  itemName: string;
}

export interface SimulationDayRow {
  date: string;
  beginningQty: number;
  productionQty: number;
  requirementQty: number;
  shipmentQty: number;
  defectQty: number;
  expectedQty: number;
  alertLevel: SimAlertLevel;
}

export interface SimulationData {
  itemId: string;
  itemCode: string;
  itemName: string;
  currentQty: number;
  days: SimulationDayRow[];
  items: SimulationItemOption[];
  isDemoData: boolean;
}

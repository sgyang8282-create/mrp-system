export interface PvaRow {
  planDate: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  groupName: string;
  plannedQty: number;
  actualQty: number;
  actualDefectQty: number;
  achievementPct: number | null;
}

export interface PvaDailyTotal {
  date: string;
  plannedQty: number;
  actualQty: number;
}

export interface PvaData {
  dateFrom: string;
  dateTo: string;
  rows: PvaRow[];
  dailyTotals: PvaDailyTotal[];
  isDemoData: boolean;
}

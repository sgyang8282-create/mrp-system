export interface ProductionGroupRow {
  id: string;
  groupName: string;
  headcount: number;
  monthlyWorkDays: number;
  annualLeaveMinutes: number;
  otherLossMinutes: number;
  availableMinutes: number;
}

export interface GroupsData {
  rows: ProductionGroupRow[];
  isDemoData: boolean;
}

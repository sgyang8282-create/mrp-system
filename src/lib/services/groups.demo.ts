import type { GroupsData } from "@/types/group";

function availableMinutes(headcount: number, days: number, leave: number, loss: number) {
  return headcount * days * 450 - leave - loss;
}

export function getDemoGroupsData(): GroupsData {
  const base = [
    { id: "grp-injection1", groupName: "사출1조", headcount: 5, monthlyWorkDays: 22, annualLeaveMinutes: 480, otherLossMinutes: 200 },
    { id: "grp-assembly1", groupName: "조립1조", headcount: 8, monthlyWorkDays: 22, annualLeaveMinutes: 960, otherLossMinutes: 300 },
    { id: "grp-assembly2", groupName: "조립2조", headcount: 6, monthlyWorkDays: 22, annualLeaveMinutes: 480, otherLossMinutes: 150 },
    { id: "grp-process1", groupName: "가공1조", headcount: 4, monthlyWorkDays: 22, annualLeaveMinutes: 240, otherLossMinutes: 100 },
  ];

  return {
    rows: base.map((g) => ({
      ...g,
      availableMinutes: availableMinutes(g.headcount, g.monthlyWorkDays, g.annualLeaveMinutes, g.otherLossMinutes),
    })),
    isDemoData: true,
  };
}

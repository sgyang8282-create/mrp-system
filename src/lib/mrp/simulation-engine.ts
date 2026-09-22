export type SimAlertLevel = "NONE" | "WARNING" | "CRITICAL";

export interface DailyInputs {
  date: string;
  productionQty: number;
  requirementQty: number;
  shipmentQty: number;
  defectQty: number;
}

export interface SimulationDay extends DailyInputs {
  beginningQty: number;
  expectedQty: number;
  alertLevel: SimAlertLevel;
}

const SHORTAGE_LOOKAHEAD_DAYS = 3;

/**
 * PRD "재고 시뮬레이션" 계산식을 그대로 구현한다.
 * 예상재고 = 기초재고 + 생산량 - 소요량 - 출고 - 불량
 *
 * 경고 규칙:
 * - 예상재고 < 0 → CRITICAL (빨간색)
 * - 아직 마이너스는 아니지만 앞으로 3일 이내에 마이너스로 전환될 예정 → WARNING (노란색)
 */
export function simulateInventory(currentQty: number, inputs: DailyInputs[]): SimulationDay[] {
  const days: SimulationDay[] = [];
  let runningQty = currentQty;

  for (const input of inputs) {
    const expectedQty =
      runningQty + input.productionQty - input.requirementQty - input.shipmentQty - input.defectQty;
    days.push({ ...input, beginningQty: runningQty, expectedQty, alertLevel: "NONE" });
    runningQty = expectedQty;
  }

  const firstNegativeIndex = days.findIndex((d) => d.expectedQty < 0);

  for (let i = 0; i < days.length; i++) {
    if (days[i].expectedQty < 0) {
      days[i].alertLevel = "CRITICAL";
    } else if (
      firstNegativeIndex >= 1 &&
      firstNegativeIndex <= SHORTAGE_LOOKAHEAD_DAYS &&
      i < firstNegativeIndex
    ) {
      days[i].alertLevel = "WARNING";
    }
  }

  return days;
}

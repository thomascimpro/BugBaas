import type { RealBugScanStatus } from "./realBugScanContract";

const successfulStatuses = new Set<RealBugScanStatus>([
  "matched",
  "already_spotted",
  "not_in_catalog"
]);

export function isDailyRealBugScanSuccess(status: RealBugScanStatus): boolean {
  return successfulStatuses.has(status);
}

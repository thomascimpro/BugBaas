import type { RealBugScanStatus } from "./realBugScanContract";

const successfulStatuses = new Set<RealBugScanStatus>([
  "matched",
  "already_spotted",
  "not_in_catalog",
  "pending_review"
]);

export function isDailyRealBugScanSuccess(status: RealBugScanStatus): boolean {
  return successfulStatuses.has(status);
}

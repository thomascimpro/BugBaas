export const maxDailyRealBugScans = 3;

function normalizeUsed(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function reserveRealBugScanUsage(currentUsed: number): { used: number; remaining: number } {
  const used = normalizeUsed(currentUsed);
  if (used >= maxDailyRealBugScans) throw new Error("Daglimiet voor echte bugscans bereikt.");
  const nextUsed = used + 1;
  return {
    used: nextUsed,
    remaining: Math.max(0, maxDailyRealBugScans - nextUsed)
  };
}

export function refundRealBugScanUsage(currentUsed: number): number {
  return Math.max(0, normalizeUsed(currentUsed) - 1);
}

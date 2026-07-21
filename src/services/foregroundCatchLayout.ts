export type ForegroundCatchViewport = {
  height: number;
  width: number;
};

export function resolveForegroundCatchViewport(
  windowViewport: ForegroundCatchViewport,
  measuredViewport: ForegroundCatchViewport,
  useMeasuredViewport: boolean
): ForegroundCatchViewport {
  const measuredIsValid = measuredViewport.height > 0 && measuredViewport.width > 0;
  return useMeasuredViewport && measuredIsValid ? measuredViewport : windowViewport;
}

export function canStartFitnessSyncerConnection(busy: boolean): boolean {
  return !busy;
}

export type FitnessSyncerCredentialAction = "save" | "connect" | "invalid";

export function fitnessSyncerCredentialAction(clientId: string, clientSecret: string, credentialsConfigured: boolean): FitnessSyncerCredentialAction {
  const hasClientId = Boolean(clientId.trim());
  const hasClientSecret = Boolean(clientSecret.trim());
  if (hasClientId && hasClientSecret) return "save";
  if (!hasClientId && !hasClientSecret && credentialsConfigured) return "connect";
  return "invalid";
}

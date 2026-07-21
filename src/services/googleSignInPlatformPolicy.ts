export function shouldUseNativeGoogleSignIn(platform: string, appOwnership: string | null | undefined): boolean {
  return platform !== "web" && appOwnership !== "expo";
}

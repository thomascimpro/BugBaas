import { NativeModules, Platform } from "react-native";

type BugBaasNativeSoundModule = {
  playSound?: (name: string) => Promise<boolean>;
};

const nativeModule = NativeModules.BugBaasNative as BugBaasNativeSoundModule | undefined;

export type BugSoundName =
  | "arcade_build"
  | "arcade_finish"
  | "arcade_hit"
  | "arcade_pickup"
  | "arcade_start"
  | "arcade_tap"
  | "bug_hit"
  | "bug_catch"
  | "bug_unlock"
  | "bug_rare_unlock"
  | "spray_hit"
  | "spray_start";

export function playBugSound(name: BugSoundName) {
  if (Platform.OS !== "android") return;
  void nativeModule?.playSound?.(name).catch(() => undefined);
}

import { NativeModules, Platform } from "react-native";
import { BugSoundName, WebSoundProfile, webSoundProfile, webUiSoundTargetSelector, webUiTapProfile } from "./webSoundProfile";

export type { BugSoundName } from "./webSoundProfile";

type BugBaasNativeSoundModule = {
  playSound?: (name: string) => Promise<boolean>;
};

const nativeModule = NativeModules.BugBaasNative as BugBaasNativeSoundModule | undefined;

let webAudioContext: AudioContext | null = null;
let lastNamedWebSoundAt = 0;

function browserAudioContext(): AudioContext | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  if (webAudioContext) return webAudioContext;
  const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  webAudioContext = new AudioContextConstructor();
  return webAudioContext;
}

function playWebSound(profile: WebSoundProfile) {
  const context = browserAudioContext();
  if (!context) return;
  const play = () => {
    const startAt = context.currentTime;
    const endAt = startAt + profile.durationMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = profile.wave;
    oscillator.frequency.setValueAtTime(profile.frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, profile.endFrequency ?? profile.frequency), endAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(profile.gain, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.01);
  };
  if (context.state === "suspended") void context.resume().then(play).catch(() => undefined);
  else play();
}

export function installWebUiSounds(): () => void {
  if (Platform.OS !== "web" || typeof document === "undefined") return () => undefined;
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const interactive = target?.closest(webUiSoundTargetSelector);
    if (!interactive || interactive.getAttribute("aria-disabled") === "true" || interactive.hasAttribute("disabled")) return;
    if (Date.now() - lastNamedWebSoundAt < 90) return;
    playWebSound(webUiTapProfile);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

export function playBugSound(name: BugSoundName) {
  if (Platform.OS === "android") {
    void nativeModule?.playSound?.(name).catch(() => undefined);
    return;
  }
  if (Platform.OS === "web") {
    lastNamedWebSoundAt = Date.now();
    playWebSound(webSoundProfile(name));
  }
}

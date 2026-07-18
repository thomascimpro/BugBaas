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
  | "bubble_bounce"
  | "bubble_drop"
  | "bubble_pop"
  | "bubble_pressure"
  | "bubble_shoot"
  | "bug_hit"
  | "bug_catch"
  | "bug_unlock"
  | "bug_rare_unlock"
  | "spray_hit"
  | "spray_start"
  | "tower_combo"
  | "tower_jump"
  | "tower_land"
  | "tower_zone";

export function playBugSound(name: BugSoundName) {
  if (Platform.OS === "web") {
    playWebSound(name);
    return;
  }
  if (Platform.OS === "android") void nativeModule?.playSound?.(name).catch(() => undefined);
}

type WebAudioWindow = typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let webAudioContext: AudioContext | null = null;

function playWebSound(name: BugSoundName) {
  const audioWindow = globalThis as WebAudioWindow;
  const AudioContextClass = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextClass) return;
  webAudioContext ??= new AudioContextClass();
  const context = webAudioContext;
  const patterns: Partial<Record<BugSoundName, Array<[number, number, number, OscillatorType]>>> = {
    arcade_finish: [[330, 0.08, 0, "triangle"], [247, 0.15, 0.08, "sine"]],
    arcade_start: [[330, 0.06, 0, "triangle"], [494, 0.09, 0.055, "triangle"]],
    bubble_bounce: [[520, 0.035, 0, "square"]],
    bubble_drop: [[420, 0.06, 0, "sine"], [260, 0.09, 0.06, "sine"]],
    bubble_pop: [[780, 0.045, 0, "triangle"], [1040, 0.05, 0.04, "sine"]],
    bubble_pressure: [[160, 0.12, 0, "sawtooth"], [130, 0.15, 0.09, "square"]],
    bubble_shoot: [[310, 0.045, 0, "sine"], [620, 0.08, 0.035, "triangle"]],
    tower_combo: [[520, 0.06, 0, "square"], [780, 0.08, 0.055, "triangle"]],
    tower_jump: [[260, 0.05, 0, "square"], [520, 0.1, 0.035, "triangle"]],
    tower_land: [[180, 0.07, 0, "triangle"]],
    tower_zone: [[392, 0.09, 0, "triangle"], [587, 0.11, 0.08, "triangle"], [784, 0.14, 0.17, "sine"]]
  };
  const pattern = patterns[name];
  if (!pattern) return;
  const now = context.currentTime;
  for (const [frequency, duration, delay, type] of pattern) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now + delay);
    gain.gain.setValueAtTime(0.08, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration);
  }
}

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

export type WebSoundProfile = {
  durationMs: number;
  endFrequency?: number;
  frequency: number;
  gain: number;
  wave: "sine" | "square" | "sawtooth" | "triangle";
};

const profiles: Record<BugSoundName, WebSoundProfile> = {
  arcade_build: { durationMs: 85, endFrequency: 540, frequency: 330, gain: 0.035, wave: "square" },
  arcade_finish: { durationMs: 240, endFrequency: 880, frequency: 440, gain: 0.06, wave: "triangle" },
  arcade_hit: { durationMs: 70, endFrequency: 150, frequency: 260, gain: 0.045, wave: "sawtooth" },
  arcade_pickup: { durationMs: 125, endFrequency: 980, frequency: 620, gain: 0.05, wave: "triangle" },
  arcade_start: { durationMs: 170, endFrequency: 660, frequency: 330, gain: 0.05, wave: "square" },
  arcade_tap: { durationMs: 45, endFrequency: 260, frequency: 390, gain: 0.028, wave: "square" },
  bug_hit: { durationMs: 55, endFrequency: 170, frequency: 280, gain: 0.035, wave: "sawtooth" },
  bug_catch: { durationMs: 145, endFrequency: 760, frequency: 380, gain: 0.05, wave: "triangle" },
  bug_unlock: { durationMs: 240, endFrequency: 940, frequency: 470, gain: 0.065, wave: "triangle" },
  bug_rare_unlock: { durationMs: 380, endFrequency: 1320, frequency: 520, gain: 0.09, wave: "triangle" },
  spray_hit: { durationMs: 65, endFrequency: 120, frequency: 240, gain: 0.04, wave: "sawtooth" },
  spray_start: { durationMs: 140, endFrequency: 180, frequency: 520, gain: 0.045, wave: "sawtooth" }
};

export const webUiSoundTargetSelector = 'button, a, input, select, textarea, [role="button"], [tabindex="0"]';

export const webUiTapProfile: WebSoundProfile = {
  durationMs: 32,
  endFrequency: 280,
  frequency: 360,
  gain: 0.014,
  wave: "square"
};

export function webSoundProfile(name: BugSoundName): WebSoundProfile {
  return profiles[name];
}

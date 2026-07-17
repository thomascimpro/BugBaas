import { NativeEventEmitter, NativeModules, Platform } from "react-native";

type TiltSample = {
  x: number;
  y: number;
  z: number;
};

type BugBaasTiltModule = {
  startTiltUpdates?: () => Promise<boolean>;
  stopTiltUpdates?: () => Promise<boolean>;
};

const nativeModule = NativeModules.BugBaasNative as BugBaasTiltModule | undefined;

export async function subscribeToTilt(onSample: (sample: TiltSample) => void): Promise<() => void> {
  if (Platform.OS !== "android" || !nativeModule?.startTiltUpdates) return () => undefined;

  const emitter = new NativeEventEmitter(NativeModules.BugBaasNative);
  const subscription = emitter.addListener("BugBaasTilt", (sample: Partial<TiltSample>) => {
    onSample({
      x: finiteNumber(sample.x),
      y: finiteNumber(sample.y),
      z: finiteNumber(sample.z)
    });
  });

  const started = await nativeModule.startTiltUpdates().catch(() => false);
  if (!started) {
    subscription.remove();
    return () => undefined;
  }

  return () => {
    subscription.remove();
    void nativeModule.stopTiltUpdates?.().catch(() => undefined);
  };
}

function finiteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

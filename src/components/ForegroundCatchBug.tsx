import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { BugArtId } from "../services/bugArt";
import { BugArtImage } from "./BugArtImage";

type SpawnRarity = "common" | "rare" | "epic";

type ActiveBug = {
  id: number;
  bugId: BugArtId;
  durationMs: number;
  direction: "left" | "right";
  lane: number;
  motionCycleMs: number;
  rarity: SpawnRarity;
  requiredTaps: number;
  rewardXp: number;
  size: number;
  verticalDrift: number;
};

type Props = {
  enabled: boolean;
  onCaught: (xp: number, bugId: BugArtId, rarity: SpawnRarity) => void;
};

const spawnCheckMs = 60000;
const spawnChance = 0.28;
const catchDurationMs = 20000;
const movementInput = [0, 0.06, 0.12, 0.2, 0.28, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86, 0.94, 1];

const raritySettings: Record<SpawnRarity, { motionCycleMs: number; rewardXp: number; requiredTaps: number; size: number; verticalDrift: number }> = {
  common: { motionCycleMs: 3400, rewardXp: 1, requiredTaps: 2, size: 64, verticalDrift: 0.22 },
  rare: { motionCycleMs: 2600, rewardXp: 4, requiredTaps: 4, size: 78, verticalDrift: 0.34 },
  epic: { motionCycleMs: 2050, rewardXp: 10, requiredTaps: 6, size: 94, verticalDrift: 0.46 }
};

const commonBugs: BugArtId[] = ["zilvervisje", "fruitvlieg", "mier", "pissebed", "mot", "boekluis"];
const rareBugs: BugArtId[] = ["pauwspin", "bidsprinkhaan", "schildwants", "tijgerkever", "smaragdlibel"];
const epicBugs: BugArtId[] = ["schorpioen", "orchidee-bidsprinkhaan", "neushoornkever", "goudwesp"];

export function ForegroundCatchBug({ enabled, onCaught }: Props) {
  const { height, width } = useWindowDimensions();
  const [activeBug, setActiveBug] = useState<ActiveBug | null>(null);
  const [hits, setHits] = useState(0);
  const [caught, setCaught] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const hitFeedback = useRef(new Animated.Value(0)).current;
  const poof = useRef(new Animated.Value(0)).current;
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const activeRef = useRef<ActiveBug | null>(null);
  const hitsRef = useRef(0);

  useEffect(() => {
    activeRef.current = activeBug;
  }, [activeBug]);

  useEffect(() => {
    if (!enabled) {
      clearActiveBug();
      return;
    }

    const interval = setInterval(() => {
      if (activeRef.current || Math.random() > spawnChance) return;
      spawnBug();
    }, spawnCheckMs);

    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      moveAnimation.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!activeBug) return;
    progress.setValue(0);
    hitFeedback.setValue(0);
    poof.setValue(0);
    setCaught(false);
    setHits(0);
    hitsRef.current = 0;

    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: activeBug.motionCycleMs,
        easing: Easing.inOut(Easing.quad),
        toValue: 1,
        useNativeDriver: false
      })
    );
    moveAnimation.current = animation;
    animation.start();

    clearTimer.current = setTimeout(clearActiveBug, activeBug.durationMs);
    return () => {
      animation.stop();
      if (moveAnimation.current === animation) moveAnimation.current = null;
    };
  }, [activeBug, hitFeedback, progress, poof]);

  const left = useMemo(() => {
    if (!activeBug) return 0;
    const hitboxWidth = activeBug.size + 130;
    const minLeft = 10;
    const maxLeft = Math.max(minLeft, width - hitboxWidth - 10);
    const range = maxLeft - minLeft;
    const fractions = activeBug.direction === "right"
      ? [0.08, 0.1, 0.1, 0.24, 0.33, 0.33, 0.5, 0.58, 0.58, 0.74, 0.88, 0.88, 0.08]
      : [0.92, 0.9, 0.9, 0.76, 0.67, 0.67, 0.5, 0.42, 0.42, 0.26, 0.12, 0.12, 0.92];
    return progress.interpolate({
      inputRange: movementInput,
      outputRange: fractions.map((fraction) => minLeft + range * fraction)
    });
  }, [activeBug, progress, width]);

  const top = useMemo(() => {
    if (!activeBug) return 0;
    const hitboxHeight = activeBug.size + 90;
    const minTop = Math.max(24, height * 0.1);
    const maxTop = Math.max(minTop, height - hitboxHeight - 96);
    const range = maxTop - minTop;
    const center = activeBug.lane;
    const drift = activeBug.verticalDrift;
    const fractions = [
      center,
      center + drift * 0.12,
      center + drift * 0.12,
      center + drift * 0.54,
      center - drift * 0.26,
      center - drift * 0.26,
      center + drift * 0.82,
      center + drift * 0.18,
      center + drift * 0.18,
      center - drift * 0.62,
      center - drift * 0.12,
      center - drift * 0.12,
      center
    ];
    return progress.interpolate({
      inputRange: movementInput,
      outputRange: fractions.map((fraction) => minTop + range * clamp(fraction, 0, 1))
    });
  }, [activeBug, height, progress]);

  const transform = useMemo(() => {
    if (!activeBug) return [];
    const crawlBob = progress.interpolate({
      inputRange: movementInput,
      outputRange: [0, -7, 0, -10, 0, -6, 0, -9, 0, -8, 0, -5, 0]
    });
    const rotate = progress.interpolate({
      inputRange: movementInput,
      outputRange: activeBug.direction === "right"
        ? ["86deg", "92deg", "88deg", "80deg", "91deg", "87deg", "98deg", "84deg", "88deg", "95deg", "82deg", "89deg", "86deg"]
        : ["-86deg", "-92deg", "-88deg", "-80deg", "-91deg", "-87deg", "-98deg", "-84deg", "-88deg", "-95deg", "-82deg", "-89deg", "-86deg"]
    });
    const scale = poof.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.28]
    });
    const hitShake = hitFeedback.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [0, -8, 7, -4, 0]
    });
    const hitScale = hitFeedback.interpolate({
      inputRange: [0, 0.45, 1],
      outputRange: [1, 1.12, 1]
    });
    return [{ translateY: crawlBob }, { translateX: hitShake }, { rotate }, { scale }, { scale: hitScale }];
  }, [activeBug, hitFeedback, poof, progress]);

  const hitOpacity = hitFeedback.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, 0.9, 0]
  });

  const hitRingScale = hitFeedback.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.45]
  });

  function spawnBug() {
    const rarity = pickRarity();
    const bugId = pickBugId(rarity);
    const settings = raritySettings[rarity];
    setActiveBug({
      id: Date.now(),
      bugId,
      durationMs: catchDurationMs,
      direction: Math.random() > 0.5 ? "right" : "left",
      lane: 0.2 + Math.random() * 0.6,
      motionCycleMs: settings.motionCycleMs,
      rarity,
      requiredTaps: settings.requiredTaps,
      rewardXp: settings.rewardXp,
      size: settings.size,
      verticalDrift: settings.verticalDrift
    });
  }

  function clearActiveBug() {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    moveAnimation.current?.stop();
    moveAnimation.current = null;
    setActiveBug(null);
    setCaught(false);
    setHits(0);
    hitsRef.current = 0;
  }

  function tapBug() {
    if (!activeBug || caught) return;
    const nextHits = hitsRef.current + 1;
    hitsRef.current = nextHits;
    playHitFeedback();
    if (nextHits < activeBug.requiredTaps) {
      setHits(nextHits);
      return;
    }

    setCaught(true);
    moveAnimation.current?.stop();
    moveAnimation.current = null;
    onCaught(activeBug.rewardXp, activeBug.bugId, activeBug.rarity);
    Animated.timing(poof, {
      duration: 220,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true
    }).start();

    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(clearActiveBug, 680);
  }

  function playHitFeedback() {
    hitFeedback.stopAnimation();
    hitFeedback.setValue(0);
    Animated.timing(hitFeedback, {
      duration: 240,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true
    }).start();
  }

  if (!enabled || !activeBug) return null;

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <Animated.View
        style={[
          styles.bug,
          {
            opacity: caught ? 0.88 : 1,
            left,
            top,
            transform
          }
        ]}
      >
        <Pressable hitSlop={42} onPress={tapBug} style={[styles.hitbox, { minHeight: activeBug.size + 90, minWidth: activeBug.size + 130 }]}>
          {caught ? (
            <View style={[styles.poof, { height: activeBug.size + 26, width: activeBug.size + 26 }]}>
              <Text style={styles.poofText}>+{activeBug.rewardXp} XP</Text>
            </View>
          ) : (
            <>
              <Animated.View style={[styles.hitFlashWrap, { height: activeBug.size + 18, width: activeBug.size + 18 }, { opacity: hitOpacity, transform: [{ scale: hitRingScale }] }]}>
                <View style={styles.hitFlash} />
              </Animated.View>
              <BugArtImage bugId={activeBug.bugId} size={activeBug.size} />
              {activeBug.requiredTaps > 1 && (
                <View style={[styles.hpBar, { width: Math.max(52, activeBug.size * 0.86) }]}>
                  {Array.from({ length: activeBug.requiredTaps }).map((_, index) => (
                    <View key={index} style={[styles.hpSegment, index < hits && styles.hpSegmentLost]} />
                  ))}
                </View>
              )}
              {activeBug.requiredTaps > 1 && hits > 0 && <View style={[styles.damageRing, { height: activeBug.size + 12, width: activeBug.size + 12 }]} />}
            </>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function pickRarity(): SpawnRarity {
  const roll = Math.random();
  if (roll < 0.05) return "epic";
  if (roll < 0.22) return "rare";
  return "common";
}

function pickBugId(rarity: SpawnRarity): BugArtId {
  const pool = rarity === "epic" ? epicBugs : rarity === "rare" ? rareBugs : commonBugs;
  return pool[Math.floor(Math.random() * pool.length)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    elevation: 40,
    overflow: "hidden",
    zIndex: 1400
  },
  bug: {
    position: "absolute"
  },
  hitbox: {
    alignItems: "center",
    justifyContent: "center"
  },
  hitFlashWrap: {
    position: "absolute"
  },
  hitFlash: {
    borderColor: "#fff2a8",
    borderRadius: 999,
    borderWidth: 3,
    flex: 1
  },
  hpBar: {
    bottom: 20,
    flexDirection: "row",
    gap: 3,
    height: 8,
    position: "absolute"
  },
  hpSegment: {
    backgroundColor: "#d7bd57",
    borderColor: "rgba(16,32,24,0.72)",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1
  },
  hpSegmentLost: {
    backgroundColor: "rgba(255,255,255,0.28)"
  },
  damageRing: {
    borderColor: "#d7bd57",
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.78,
    position: "absolute"
  },
  poof: {
    alignItems: "center",
    backgroundColor: "rgba(16,32,24,0.88)",
    borderColor: "#d7bd57",
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: "center"
  },
  poofText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  }
});

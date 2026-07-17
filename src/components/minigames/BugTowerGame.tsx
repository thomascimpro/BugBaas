import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, DimensionValue, Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { createArcadeSeed, loadArcadeHighScore, saveArcadeHighScore, seededNumber } from "../../services/arcadeResultService";
import { arcadeSquadAssistForUser } from "../../services/bugSquadGameBalance";
import { playBugSound } from "../../services/soundService";
import { subscribeToTilt } from "../../services/tiltControlService";
import { ArcadeRunResult, User } from "../../types";
import { ArcadeSquadAssist } from "./ArcadeSquadAssist";

type Props = { onBack: () => void; onResult?: (result: ArcadeRunResult) => void; ranked?: boolean; seed?: string; user: User };
type GameState = "ready" | "result" | "running";
type Platform = { drift: number; floor: number; id: string; width: number; x: number; y: number };
type Player = { grounded: boolean; lastGroundAt: number; vx: number; vy: number; x: number; y: number };
type RenderState = { combo: number; floor: number; maxCombo: number; platforms: Platform[]; player: Player; score: number };

const tickMs = 20;
const gravity = 0.13;
const jumpVelocity = -2.32;
const horizontalAcceleration = 0.075;
const maxHorizontalSpeed = 0.92;
const playerHalfWidth = 6.5;
const playerHalfHeight = 5.2;
const towerBackground = require("../../../assets/minigames/bug-tower/bug-tower-background.png");
const beetleSpriteSheet = require("../../../assets/minigames/bug-tower/bug-tower-beetle.png");

export function BugTowerGame({ onBack, onResult, ranked = false, seed, user }: Props) {
  const squadAssist = useMemo(() => arcadeSquadAssistForUser(user), [user.activeBugSquad]);
  const [state, setState] = useState<GameState>("ready");
  const [bestScore, setBestScore] = useState(0);
  const [result, setResult] = useState<ArcadeRunResult | null>(null);
  const [sensorActive, setSensorActive] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>(() => initialRenderState("preview"));
  const playerRef = useRef<Player>(initialPlayer());
  const platformsRef = useRef<Platform[]>([]);
  const seedRef = useRef(createArcadeSeed("bug_tower", user.uid));
  const nextFloorRef = useRef(1);
  const landedFloorRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const startAtRef = useRef(0);
  const finishedRef = useRef(false);
  const tiltRef = useRef(0);
  const tiltBaselineRef = useRef<number | null>(null);
  const manualDirectionRef = useRef(-0 as -1 | 0 | 1);
  const landedAtRef = useRef(0);

  useEffect(() => {
    let active = true;
    void loadArcadeHighScore(user.uid, "bug_tower").then((value) => active && setBestScore(value));
    return () => { active = false; };
  }, [user.uid]);

  useEffect(() => {
    if (state !== "running") return;
    let unsubscribe: () => void = () => undefined;
    let active = true;
    void subscribeToTilt((sample) => {
      if (tiltBaselineRef.current === null) tiltBaselineRef.current = sample.x;
      const calibrated = sample.x - (tiltBaselineRef.current ?? 0);
      tiltRef.current = clamp(calibrated / 4.3, -1, 1);
      if (active) setSensorActive(true);
    }).then((next) => {
      if (active) unsubscribe = next;
      else next();
    });
    return () => {
      active = false;
      unsubscribe();
      setSensorActive(false);
    };
  }, [state]);

  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(tick, tickMs);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (!ranked || state === "result") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, [ranked, state]);

  function start() {
    seedRef.current = seed ?? createArcadeSeed("bug_tower", `${user.uid}:${Date.now()}`);
    const initial = buildInitialPlatforms(seedRef.current);
    playerRef.current = initialPlayer();
    platformsRef.current = initial;
    nextFloorRef.current = initial.length;
    landedFloorRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    startAtRef.current = Date.now();
    finishedRef.current = false;
    tiltRef.current = 0;
    tiltBaselineRef.current = null;
    manualDirectionRef.current = 0;
    landedAtRef.current = Date.now();
    setResult(null);
    setSensorActive(false);
    setRenderState({ combo: 0, floor: 0, maxCombo: 0, platforms: initial, player: initialPlayer(), score: 0 });
    setState("running");
    playBugSound("arcade_start");
  }

  function tick() {
    if (finishedRef.current) return;
    const now = Date.now();
    const elapsed = now - startAtRef.current;
    const previous = playerRef.current;
    const input = manualDirectionRef.current || tiltRef.current;
    const vx = clamp(previous.vx * (Math.abs(input) < 0.08 ? 0.9 : 0.96) + input * horizontalAcceleration, -maxHorizontalSpeed, maxHorizontalSpeed);
    let nextPlayer: Player = {
      ...previous,
      grounded: false,
      vx,
      vy: Math.min(2.25, previous.vy + gravity),
      x: previous.x + vx,
      y: previous.y + previous.vy + gravity
    };

    if (nextPlayer.x <= playerHalfWidth) {
      nextPlayer.x = playerHalfWidth;
      nextPlayer.vx = Math.abs(nextPlayer.vx) * 0.9;
    } else if (nextPlayer.x >= 100 - playerHalfWidth) {
      nextPlayer.x = 100 - playerHalfWidth;
      nextPlayer.vx = -Math.abs(nextPlayer.vx) * 0.9;
    }

    const scroll = towerScrollSpeed(landedFloorRef.current, elapsed);
    let platforms = platformsRef.current.map((platform) => movePlatform(platform, scroll));
    nextPlayer.y += scroll;

    const oldBottom = previous.y + playerHalfHeight + scroll;
    const nextBottom = nextPlayer.y + playerHalfHeight;
    if (nextPlayer.vy >= 0) {
      const landing = platforms
        .filter((platform) => oldBottom <= platform.y + 0.8 && nextBottom >= platform.y - 0.5)
        .filter((platform) => nextPlayer.x + playerHalfWidth >= platform.x && nextPlayer.x - playerHalfWidth <= platform.x + platform.width)
        .sort((a, b) => a.y - b.y)[0];
      if (landing) {
        nextPlayer.y = landing.y - playerHalfHeight;
        nextPlayer.vy = 0;
        nextPlayer.grounded = true;
        nextPlayer.lastGroundAt = now;
        if (landing.floor > landedFloorRef.current) landOnFloor(landing.floor, now);
      }
    }

    if (nextPlayer.y < 36) {
      const cameraShift = 36 - nextPlayer.y;
      nextPlayer.y = 36;
      platforms = platforms.map((platform) => ({ ...platform, y: platform.y + cameraShift }));
    }

    platforms = platforms.filter((platform) => platform.y < 108);
    while (platforms.length === 0 || Math.min(...platforms.map((platform) => platform.y)) > -12) {
      const highest = platforms.reduce<Platform | null>((best, platform) => !best || platform.y < best.y ? platform : best, null);
      const next = createPlatform(highest, nextFloorRef.current, seedRef.current);
      platforms.push(next);
      nextFloorRef.current += 1;
    }

    playerRef.current = nextPlayer;
    platformsRef.current = platforms;
    scoreRef.current += 0.08 + Math.max(0, comboRef.current - 1) * 0.012;
    setRenderState({
      combo: comboRef.current,
      floor: landedFloorRef.current,
      maxCombo: maxComboRef.current,
      platforms,
      player: nextPlayer,
      score: Math.floor(scoreRef.current)
    });

    if (nextPlayer.y - playerHalfHeight > 105) finish();
  }

  function jump() {
    if (state !== "running") return;
    const now = Date.now();
    const player = playerRef.current;
    if (!player.grounded && now - player.lastGroundAt > 120) return;
    playerRef.current = { ...player, grounded: false, vy: jumpVelocity };
    playBugSound("arcade_tap");
  }

  function landOnFloor(floor: number, now: number) {
    const skipped = floor - landedFloorRef.current;
    landedFloorRef.current = floor;
    if (skipped >= 2) comboRef.current += 1;
    else comboRef.current = 0;
    maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
    scoreRef.current += floor * 2 + Math.max(0, skipped - 1) * 35 + comboRef.current * 25;
    landedAtRef.current = now;
    playBugSound(skipped >= 2 ? "arcade_pickup" : "arcade_build");
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const durationMs = Math.max(0, Date.now() - startAtRef.current);
    const finalScore = Math.max(1, Math.round(scoreRef.current + landedFloorRef.current * 14 + maxComboRef.current * 45));
    playBugSound("arcade_finish");
    void saveArcadeHighScore(user.uid, "bug_tower", finalScore).then((highScore) => {
      const nextResult: ArcadeRunResult = {
        combo: maxComboRef.current,
        durationMs,
        hits: 1,
        localHighScore: highScore,
        mode: "bug_tower",
        pickups: landedFloorRef.current,
        score: finalScore,
        streak: landedFloorRef.current,
        timestamp: new Date().toISOString()
      };
      setBestScore(highScore);
      setResult(nextResult);
      setState("result");
      onResult?.(nextResult);
    });
  }

  function back() {
    if (ranked && state !== "result") return;
    if (state === "running") {
      Alert.alert("Leave Bug Tower?", "Your climb ends if you leave now.", [
        { text: "Keep climbing", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: onBack }
      ]);
      return;
    }
    onBack();
  }

  const animationFrame = playerAnimationFrame(renderState.player, landedAtRef.current);

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Bug Tower</Text><Text style={styles.meta}>Best score: {bestScore}</Text></View>
        {(!ranked || state === "result") && <Pressable style={styles.closeButton} onPress={back}><Text style={styles.closeText}>x</Text></Pressable>}
      </View>
      {state === "ready" && <Ready onStart={start} />}
      {state === "running" && (
        <View style={styles.game}>
          <View style={styles.hud}>
            <HudChip label={`Floor ${renderState.floor}`} />
            <HudChip label={`${renderState.score} pt`} />
            <HudChip active={renderState.combo > 0} label={renderState.combo > 0 ? `Combo ${renderState.combo}` : towerZone(renderState.floor)} />
          </View>
          <Pressable style={styles.playfield} onPress={jump}>
            <ImageBackground resizeMode="cover" source={towerBackground} style={styles.background}>
              <View style={styles.backgroundShade} />
              <View style={styles.squadOverlay}><ArcadeSquadAssist compact label={`Squad ${squadAssist.activeCount}/3`} user={user} /></View>
              <View style={styles.controlHint}><Text style={styles.controlHintText}>{sensorActive ? "Tilt to steer • Tap to jump" : "Hold arrows • Tap to jump"}</Text></View>
              {renderState.platforms.map((platform) => <TowerPlatform key={platform.id} platform={platform} />)}
              <View pointerEvents="none" style={[styles.player, percentPosition(renderState.player.x, renderState.player.y)]}>
                <BugTowerSprite frame={animationFrame} />
              </View>
              <View style={styles.controls}>
                <Pressable
                  style={styles.controlButton}
                  onPressIn={() => { manualDirectionRef.current = -1; }}
                  onPressOut={() => { manualDirectionRef.current = 0; }}
                ><Text style={styles.controlButtonText}>‹</Text></Pressable>
                <Pressable
                  style={styles.jumpButton}
                  onPress={jump}
                ><Text style={styles.jumpButtonText}>JUMP</Text></Pressable>
                <Pressable
                  style={styles.controlButton}
                  onPressIn={() => { manualDirectionRef.current = 1; }}
                  onPressOut={() => { manualDirectionRef.current = 0; }}
                ><Text style={styles.controlButtonText}>›</Text></Pressable>
              </View>
            </ImageBackground>
          </Pressable>
        </View>
      )}
      {state === "result" && result && <Result onBack={onBack} onRetry={start} ranked={ranked} result={result} />}
    </View>
  );
}

function Ready({ onStart }: { onStart: () => void }) {
  return (
    <ImageBackground resizeMode="cover" source={towerBackground} style={styles.readyBackground}>
      <View style={styles.readyShade} />
      <View style={styles.panel}>
        <BugTowerSprite frame={3} large />
        <Text style={styles.panelTitle}>Climb the endless tower</Text>
        <Text style={styles.body}>Tilt your phone left or right to build speed. Tap to jump. Chain multi-floor jumps for combos before the tower outruns you.</Text>
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyChip}>Smaller floors</Text>
          <Text style={styles.difficultyChip}>Faster scroll</Text>
          <Text style={styles.difficultyChip}>Moving ledges</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onStart}><Text style={styles.primaryText}>Start climb</Text></Pressable>
      </View>
    </ImageBackground>
  );
}

function Result({ onBack, onRetry, ranked, result }: { onBack: () => void; onRetry: () => void; ranked: boolean; result: ArcadeRunResult }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Tower run complete</Text>
      <Text style={styles.score}>{result.score}</Text>
      <Text style={styles.body}>Floor {result.pickups} • Best combo {result.combo} • Best score {result.localHighScore}</Text>
      {!ranked && <Pressable style={styles.primaryButton} onPress={onRetry}><Text style={styles.primaryText}>Climb again</Text></Pressable>}
      <Pressable style={ranked ? styles.primaryButton : styles.secondaryButton} onPress={onBack}><Text style={ranked ? styles.primaryText : styles.secondaryText}>Back to Arena</Text></Pressable>
    </View>
  );
}

function HudChip({ active = false, label }: { active?: boolean; label: string }) {
  return <View style={[styles.hudChip, active && styles.hudChipActive]}><Text style={styles.hudText}>{label}</Text></View>;
}

function TowerPlatform({ platform }: { platform: Platform }) {
  const zone = Math.floor(platform.floor / 25) % 4;
  return (
    <View style={[styles.platform, zone === 1 && styles.platformViolet, zone === 2 && styles.platformAmber, zone === 3 && styles.platformVoid, {
      left: `${platform.x}%` as DimensionValue,
      top: `${platform.y}%` as DimensionValue,
      width: `${platform.width}%` as DimensionValue
    }]}>
      <View style={styles.platformShine} />
    </View>
  );
}

function BugTowerSprite({ frame, large = false }: { frame: number; large?: boolean }) {
  const column = frame % 3;
  const row = Math.floor(frame / 3);
  const size = large ? 126 : 64;
  const sheetSize = size * 3;
  const cellHeight = sheetSize / 2;
  const cropOffset = large ? 20 : 10;
  return (
    <View style={[styles.spriteFrame, { height: large ? 142 : 72, width: size }]}>
      <Image
        accessibilityIgnoresInvertColors
        source={beetleSpriteSheet}
        style={{
          height: sheetSize,
          left: -column * size,
          position: "absolute",
          top: -row * cellHeight - cropOffset,
          width: sheetSize
        }}
      />
    </View>
  );
}

function initialRenderState(seed: string): RenderState {
  const platforms = buildInitialPlatforms(seed);
  return { combo: 0, floor: 0, maxCombo: 0, platforms, player: initialPlayer(), score: 0 };
}

function initialPlayer(): Player {
  return { grounded: true, lastGroundAt: Date.now(), vx: 0, vy: 0, x: 50, y: 82.8 };
}

function buildInitialPlatforms(seed: string) {
  const platforms: Platform[] = [{ drift: 0, floor: 0, id: "floor-0", width: 76, x: 12, y: 88 }];
  for (let floor = 1; floor < 11; floor += 1) platforms.push(createPlatform(platforms[platforms.length - 1], floor, seed));
  return platforms;
}

function createPlatform(previous: Platform | null, floor: number, seed: string): Platform {
  const stage = Math.floor(floor / 12);
  const width = clamp(58 - stage * 3.1 - seededNumber(seed, floor * 5) * 7, 19, 58);
  const gap = clamp(10.8 + stage * 0.55 + seededNumber(seed, floor * 5 + 1) * 2.8, 10.8, 17.5);
  const previousCenter = previous ? previous.x + previous.width / 2 : 50;
  const reach = clamp(24 + stage * 0.7, 24, 36);
  const offset = (seededNumber(seed, floor * 5 + 2) - 0.5) * reach * 2;
  const x = clamp(previousCenter + offset - width / 2, 3.5, 96.5 - width);
  const driftRoll = seededNumber(seed, floor * 5 + 3);
  const drift = floor >= 40 && floor % 4 === 0 ? (driftRoll > 0.5 ? 1 : -1) * (0.025 + stage * 0.002) : 0;
  return { drift, floor, id: `floor-${floor}`, width, x, y: (previous?.y ?? 2) - gap };
}

function movePlatform(platform: Platform, scroll: number): Platform {
  if (!platform.drift) return { ...platform, y: platform.y + scroll };
  let x = platform.x + platform.drift;
  let drift = platform.drift;
  if (x <= 3.5 || x + platform.width >= 96.5) {
    drift *= -1;
    x = clamp(x, 3.5, 96.5 - platform.width);
  }
  return { ...platform, drift, x, y: platform.y + scroll };
}

function towerScrollSpeed(floor: number, elapsed: number) {
  if (floor < 5) return 0;
  const timePressure = Math.floor(elapsed / 30000) * 0.006;
  const floorPressure = Math.floor(floor / 15) * 0.003;
  return clamp(0.012 + timePressure + floorPressure, 0.012, 0.105);
}

function towerZone(floor: number) {
  if (floor < 25) return "Ice Cellar";
  if (floor < 50) return "Crystal Hall";
  if (floor < 75) return "Moon Keep";
  return "Void Crown";
}

function playerAnimationFrame(player: Player, landedAt: number) {
  if (Date.now() - landedAt < 120 && player.grounded) return 5;
  if (player.vy < -0.2) return 3;
  if (player.vy > 0.45) return 4;
  if (Math.abs(player.vx) > 0.12) return player.vx < 0 ? 1 : 2;
  return 0;
}

function percentPosition(x: number, y: number) {
  return { left: `${x}%` as DimensionValue, top: `${y}%` as DimensionValue };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  background: { flex: 1, overflow: "hidden" },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,8,28,0.14)" },
  body: { color: "#dce9ff", fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  closeButton: { alignItems: "center", backgroundColor: "#f8fbff", borderRadius: 10, height: 44, justifyContent: "center", width: 44 },
  closeText: { color: "#0b1638", fontSize: 24, fontWeight: "900" },
  controlButton: { alignItems: "center", backgroundColor: "rgba(7,17,50,0.78)", borderColor: "rgba(125,211,252,0.78)", borderRadius: 999, borderWidth: 2, height: 58, justifyContent: "center", width: 58 },
  controlButtonText: { color: "#eff8ff", fontSize: 44, fontWeight: "900", lineHeight: 47 },
  controlHint: { alignSelf: "center", backgroundColor: "rgba(4,12,38,0.72)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, position: "absolute", top: 8, zIndex: 8 },
  controlHintText: { color: "#dce9ff", fontSize: 11, fontWeight: "900" },
  controls: { alignItems: "center", bottom: 14, flexDirection: "row", justifyContent: "space-between", left: 14, position: "absolute", right: 14, zIndex: 12 },
  difficultyChip: { backgroundColor: "rgba(103,65,217,0.28)", borderColor: "rgba(167,139,250,0.8)", borderRadius: 999, borderWidth: 1, color: "#ede9fe", fontSize: 11, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 6 },
  difficultyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  game: { flex: 1 },
  header: { alignItems: "center", backgroundColor: "#071330", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 },
  hud: { backgroundColor: "#0a1940", borderBottomColor: "#5dd9ff", borderBottomWidth: 1, flexDirection: "row", gap: 7, minHeight: 42, paddingHorizontal: 10, paddingVertical: 6 },
  hudChip: { alignItems: "center", backgroundColor: "rgba(93,217,255,0.1)", borderColor: "rgba(93,217,255,0.35)", borderRadius: 999, borderWidth: 1, flex: 1, justifyContent: "center", paddingHorizontal: 7 },
  hudChipActive: { backgroundColor: "rgba(250,204,21,0.2)", borderColor: "#facc15" },
  hudText: { color: "#f8fbff", fontSize: 12, fontWeight: "900" },
  jumpButton: { alignItems: "center", backgroundColor: "rgba(234,179,8,0.88)", borderColor: "#fef08a", borderRadius: 999, borderWidth: 2, height: 64, justifyContent: "center", width: 82 },
  jumpButtonText: { color: "#1d1733", fontSize: 14, fontWeight: "900" },
  meta: { color: "#9fb4dd", fontSize: 12, fontWeight: "800" },
  panel: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(7,19,48,0.94)", borderColor: "#5dd9ff", borderRadius: 16, borderWidth: 1, gap: 14, margin: 16, maxWidth: 520, padding: 20 },
  panelTitle: { color: "#f8fbff", fontSize: 26, fontWeight: "900", textAlign: "center" },
  platform: { backgroundColor: "#4bc7ed", borderBottomColor: "#163e85", borderBottomWidth: 6, borderColor: "#d9f8ff", borderRadius: 8, borderTopWidth: 2, height: 12, position: "absolute", zIndex: 4 },
  platformAmber: { backgroundColor: "#f59e0b", borderBottomColor: "#78350f", borderColor: "#fef3c7" },
  platformShine: { backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 999, height: 2, left: 5, position: "absolute", right: 5, top: 2 },
  platformViolet: { backgroundColor: "#8b5cf6", borderBottomColor: "#3b1975", borderColor: "#ede9fe" },
  platformVoid: { backgroundColor: "#ec4899", borderBottomColor: "#701a75", borderColor: "#fce7f3" },
  player: { alignItems: "center", height: 72, justifyContent: "center", marginLeft: -32, marginTop: -36, position: "absolute", width: 64, zIndex: 7 },
  playfield: { flex: 1 },
  primaryButton: { alignItems: "center", backgroundColor: "#168b65", borderRadius: 10, justifyContent: "center", minHeight: 52, paddingHorizontal: 20, width: "100%" },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  readyBackground: { flex: 1, justifyContent: "center" },
  readyShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,7,24,0.35)" },
  score: { color: "#facc15", fontSize: 58, fontWeight: "900" },
  secondaryButton: { alignItems: "center", borderColor: "#dce9ff", borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 20, width: "100%" },
  secondaryText: { color: "#f8fbff", fontSize: 16, fontWeight: "900" },
  shell: { backgroundColor: "#050d24", flex: 1 },
  spriteFrame: { overflow: "hidden" },
  squadOverlay: { position: "absolute", right: 8, top: 42, zIndex: 9 },
  title: { color: "#f8fbff", fontSize: 24, fontWeight: "900" }
});

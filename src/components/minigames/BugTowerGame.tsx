import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, DimensionValue, Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { createArcadeSeed, loadArcadeHighScore, saveArcadeHighScore, seededNumber } from "../../services/arcadeResultService";
import { arcadeSquadAssistForUser } from "../../services/bugSquadGameBalance";
import { playBugSound } from "../../services/soundService";
import { ArcadeRunResult, User } from "../../types";
import { ArcadeSquadAssist } from "./ArcadeSquadAssist";
import { TOWER_MAX_CHARGE_MS, clamp, towerDifficulty, towerHeightScore, towerJumpVelocity, towerPlatformGap, towerPlatformWidth, towerZoneIndex, towerZoneName } from "./bugTowerLogic";

type Props = { onBack: () => void; onResult?: (result: ArcadeRunResult) => void; ranked?: boolean; seed?: string; user: User };
type GameState = "ready" | "result" | "running";
type Platform = { drift: number; floor: number; id: string; width: number; x: number; y: number };
type Player = { grounded: boolean; lastGroundAt: number; spinAngle: number; spinning: boolean; vx: number; vy: number; x: number; y: number };
type RenderState = { charge: number; combo: number; difficulty: number; floor: number; maxCombo: number; platforms: Platform[]; player: Player; score: number };

const tickMs = 20;
const gravity = 0.13;
const horizontalAcceleration = 0.105;
const maxHorizontalSpeed = 1.08;
const playerHalfWidth = 6.5;
const playerHalfHeight = 5.2;
const towerBackground = require("../../../assets/minigames/bug-tower/bug-tower-background.png");
const towerJungleBackground = require("../../../assets/minigames/bug-tower/bug-tower-jungle.png");
const towerForgeBackground = require("../../../assets/minigames/bug-tower/bug-tower-forge.png");
const towerSkyBackground = require("../../../assets/minigames/bug-tower/bug-tower-sky.png");
const towerVoidBackground = require("../../../assets/minigames/bug-tower/bug-tower-void.png");
const towerBackgrounds = [towerBackground, towerJungleBackground, towerForgeBackground, towerSkyBackground, towerVoidBackground];
const beetleSpriteSheet = require("../../../assets/minigames/bug-tower/bug-tower-beetle.png");

export function BugTowerGame({ onBack, onResult, ranked = false, seed, user }: Props) {
  const squadAssist = useMemo(() => arcadeSquadAssistForUser(user), [user.activeBugSquad]);
  const [state, setState] = useState<GameState>("ready");
  const [bestScore, setBestScore] = useState(0);
  const [result, setResult] = useState<ArcadeRunResult | null>(null);
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
  const manualDirectionRef = useRef(-0 as -1 | 0 | 1);
  const holdStartedAtRef = useRef(0);
  const landedAtRef = useRef(0);

  useEffect(() => {
    let active = true;
    void loadArcadeHighScore(user.uid, "bug_tower").then((value) => active && setBestScore(value));
    return () => { active = false; };
  }, [user.uid]);

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
    manualDirectionRef.current = 0;
    holdStartedAtRef.current = 0;
    landedAtRef.current = Date.now();
    setResult(null);
    setRenderState({ charge: 0, combo: 0, difficulty: 0, floor: 0, maxCombo: 0, platforms: initial, player: initialPlayer(), score: 0 });
    setState("running");
    playBugSound("arcade_start");
  }

  function tick() {
    if (finishedRef.current) return;
    const now = Date.now();
    const elapsed = now - startAtRef.current;
    const previous = playerRef.current;
    const input = manualDirectionRef.current;
    const vx = clamp(previous.vx * (Math.abs(input) < 0.08 ? 0.9 : 0.96) + input * horizontalAcceleration, -maxHorizontalSpeed, maxHorizontalSpeed);
    let nextPlayer: Player = {
      ...previous,
      grounded: false,
      spinAngle: previous.spinning ? previous.spinAngle + Math.sign(previous.vx || input || 1) * 18 : 0,
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

    const difficulty = towerDifficulty(landedFloorRef.current, elapsed);
    const scroll = difficulty.scrollSpeed;
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
        nextPlayer.spinAngle = 0;
        nextPlayer.spinning = false;
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
    setRenderState({
      charge: holdStartedAtRef.current ? clamp((now - holdStartedAtRef.current) / TOWER_MAX_CHARGE_MS, 0, 1) : 0,
      combo: comboRef.current,
      difficulty: difficulty.level,
      floor: landedFloorRef.current,
      maxCombo: maxComboRef.current,
      platforms,
      player: nextPlayer,
      score: Math.floor(scoreRef.current)
    });

    if (nextPlayer.y - playerHalfHeight > 105) finish();
  }

  function beginRun(direction: -1 | 1) {
    if (state !== "running") return;
    manualDirectionRef.current = direction;
    holdStartedAtRef.current = Date.now();
    playBugSound("arcade_tap");
  }

  function releaseJump(direction: -1 | 1) {
    if (state !== "running" || manualDirectionRef.current !== direction) return;
    const now = Date.now();
    const holdMs = holdStartedAtRef.current ? now - holdStartedAtRef.current : 0;
    manualDirectionRef.current = 0;
    holdStartedAtRef.current = 0;
    const player = playerRef.current;
    if (!player.grounded && now - player.lastGroundAt > 120) return;
    const charge = clamp(holdMs / TOWER_MAX_CHARGE_MS, 0, 1);
    const spinning = charge >= 0.58 && Math.abs(player.vx) >= maxHorizontalSpeed * 0.68;
    playerRef.current = { ...player, grounded: false, spinAngle: 0, spinning, vy: towerJumpVelocity(holdMs) };
    playBugSound("tower_jump");
  }

  function landOnFloor(floor: number, now: number) {
    const skipped = floor - landedFloorRef.current;
    landedFloorRef.current = floor;
    if (skipped >= 2) comboRef.current += 1;
    else comboRef.current = 0;
    maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
    scoreRef.current = towerHeightScore(floor, maxComboRef.current);
    landedAtRef.current = now;
    if (floor > 0 && floor % 100 === 0) playBugSound("tower_zone");
    else playBugSound(skipped >= 2 ? "tower_combo" : "tower_land");
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const durationMs = Math.min(90000, Math.max(0, Date.now() - startAtRef.current));
    const finalScore = Math.max(1, towerHeightScore(landedFloorRef.current, maxComboRef.current));
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
            <HudChip active={renderState.difficulty >= 3} label={towerZoneName(renderState.floor)} />
          </View>
          <View style={styles.playfield}>
            <ImageBackground key={towerZoneIndex(renderState.floor)} resizeMode="cover" source={towerBackgrounds[towerZoneIndex(renderState.floor)]} style={styles.background}>
              <View style={styles.backgroundShade} />
              <View style={styles.squadOverlay}><ArcadeSquadAssist compact label={`Squad ${squadAssist.activeCount}/3`} user={user} /></View>
              <View pointerEvents="none" style={styles.controlHint}><Text style={styles.controlHintText}>Hold a side to run - release to jump</Text></View>
              {renderState.platforms.map((platform) => <TowerPlatform key={platform.id} platform={platform} />)}
              <View pointerEvents="none" style={[styles.player, percentPosition(renderState.player.x, renderState.player.y), { transform: [{ rotate: `${renderState.player.spinAngle}deg` }] }]}>
                <BugTowerSprite frame={animationFrame} />
              </View>
              <View pointerEvents="none" style={styles.chargeTrack}><View style={[styles.chargeFill, { width: `${Math.max(4, renderState.charge * 100)}%` as DimensionValue }]} /></View>
              <View style={styles.controls}>
                <Pressable
                  accessibilityLabel="Run left and charge jump"
                  accessibilityHint="Hold to run left, then release to jump"
                  style={({ pressed }) => [styles.controlHalf, styles.controlHalfLeft, pressed && styles.controlHalfPressed]}
                  onPressIn={() => beginRun(-1)}
                  onPressOut={() => releaseJump(-1)}
                >
                  <View pointerEvents="none" style={styles.controlCue}>
                    <Text style={styles.controlArrow}>←</Text>
                    <Text style={styles.controlSideText}>HOLD LEFT</Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel="Run right and charge jump"
                  accessibilityHint="Hold to run right, then release to jump"
                  style={({ pressed }) => [styles.controlHalf, styles.controlHalfRight, pressed && styles.controlHalfPressed]}
                  onPressIn={() => beginRun(1)}
                  onPressOut={() => releaseJump(1)}
                >
                  <View pointerEvents="none" style={styles.controlCue}>
                    <Text style={styles.controlArrow}>→</Text>
                    <Text style={styles.controlSideText}>HOLD RIGHT</Text>
                  </View>
                </Pressable>
              </View>
            </ImageBackground>
          </View>
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
        <Text style={styles.body}>Hold anywhere on the left or right half to run. Release to jump: a longer hold gives a higher leap. Platforms alternate sides, shrink, move, and speed up.</Text>
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyChip}>Hold = jump power</Text>
          <Text style={styles.difficultyChip}>Alternating ledges</Text>
          <Text style={styles.difficultyChip}>New world every 100</Text>
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
  const zone = towerZoneIndex(platform.floor);
  return (
    <View style={[styles.platform, zone === 1 && styles.platformJungle, zone === 2 && styles.platformForge, zone === 3 && styles.platformSky, zone === 4 && styles.platformVoid, {
      left: `${platform.x}%` as DimensionValue,
      top: `${platform.y}%` as DimensionValue,
      width: `${platform.width}%` as DimensionValue
    }]}>
      <View style={styles.platformShine} />
      <Text style={styles.floorNumber}>#{platform.floor}</Text>
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
  return { charge: 0, combo: 0, difficulty: 0, floor: 0, maxCombo: 0, platforms, player: initialPlayer(), score: 0 };
}

function initialPlayer(): Player {
  return { grounded: true, lastGroundAt: Date.now(), spinAngle: 0, spinning: false, vx: 0, vy: 0, x: 50, y: 82.8 };
}

function buildInitialPlatforms(seed: string) {
  const platforms: Platform[] = [{ drift: 0, floor: 0, id: "floor-0", width: 76, x: 12, y: 88 }];
  for (let floor = 1; floor < 11; floor += 1) platforms.push(createPlatform(platforms[platforms.length - 1], floor, seed));
  return platforms;
}

function createPlatform(previous: Platform | null, floor: number, seed: string): Platform {
  const difficulty = towerDifficulty(floor, 0);
  const width = towerPlatformWidth(floor, seededNumber(seed, floor * 5));
  const gap = towerPlatformGap(floor, seededNumber(seed, floor * 5 + 1));
  const previousCenter = previous ? previous.x + previous.width / 2 : 50;
  const alternate = floor % 2 === 0 ? -1 : 1;
  const offset = alternate * (10 + seededNumber(seed, floor * 5 + 2) * Math.min(18, 11 + difficulty.level));
  const x = clamp(previousCenter + offset - width / 2, 3.5, 96.5 - width);
  const driftRoll = seededNumber(seed, floor * 5 + 3);
  const drift = floor >= 40 && floor % difficulty.movingEvery === 0 ? (driftRoll > 0.5 ? 1 : -1) * (0.022 + difficulty.level * 0.004) : 0;
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

const styles = StyleSheet.create({
  background: { flex: 1, overflow: "hidden" },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,8,28,0.14)" },
  body: { color: "#dce9ff", fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  closeButton: { alignItems: "center", backgroundColor: "#f8fbff", borderRadius: 10, height: 44, justifyContent: "center", width: 44 },
  closeText: { color: "#0b1638", fontSize: 24, fontWeight: "900" },
  chargeFill: { backgroundColor: "#facc15", borderRadius: 999, height: "100%" },
  chargeTrack: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, bottom: 18, height: 7, left: "30%", overflow: "hidden", position: "absolute", width: "40%", zIndex: 22 },
  controlHint: { alignSelf: "center", backgroundColor: "rgba(4,12,38,0.72)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, position: "absolute", top: 8, zIndex: 8 },
  controlHintText: { color: "#dce9ff", fontSize: 11, fontWeight: "900" },
  controlArrow: { color: "rgba(239,248,255,0.78)", fontSize: 46, fontWeight: "900", lineHeight: 48, textShadowColor: "rgba(0,0,0,0.55)", textShadowOffset: { height: 2, width: 0 }, textShadowRadius: 4 },
  controlCue: { alignItems: "center", backgroundColor: "rgba(4,12,38,0.24)", borderColor: "rgba(220,233,255,0.24)", borderRadius: 16, borderWidth: 1, minWidth: 92, paddingHorizontal: 12, paddingVertical: 8 },
  controlHalf: { alignItems: "center", backgroundColor: "rgba(7,20,52,0.04)", bottom: 0, justifyContent: "center", position: "absolute", top: 0, width: "50%", zIndex: 20 },
  controlHalfLeft: { borderRightColor: "rgba(220,233,255,0.12)", borderRightWidth: 1, left: 0 },
  controlHalfPressed: { backgroundColor: "rgba(93,217,255,0.14)" },
  controlHalfRight: { right: 0 },
  controlSideText: { color: "rgba(239,248,255,0.72)", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  controls: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  difficultyChip: { backgroundColor: "rgba(103,65,217,0.28)", borderColor: "rgba(167,139,250,0.8)", borderRadius: 999, borderWidth: 1, color: "#ede9fe", fontSize: 11, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 6 },
  difficultyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  game: { flex: 1 },
  header: { alignItems: "center", backgroundColor: "#071330", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 },
  hud: { backgroundColor: "#0a1940", borderBottomColor: "#5dd9ff", borderBottomWidth: 1, flexDirection: "row", gap: 7, minHeight: 42, paddingHorizontal: 10, paddingVertical: 6 },
  hudChip: { alignItems: "center", backgroundColor: "rgba(93,217,255,0.1)", borderColor: "rgba(93,217,255,0.35)", borderRadius: 999, borderWidth: 1, flex: 1, justifyContent: "center", paddingHorizontal: 7 },
  hudChipActive: { backgroundColor: "rgba(250,204,21,0.2)", borderColor: "#facc15" },
  hudText: { color: "#f8fbff", fontSize: 12, fontWeight: "900" },
  meta: { color: "#9fb4dd", fontSize: 12, fontWeight: "800" },
  panel: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(7,19,48,0.94)", borderColor: "#5dd9ff", borderRadius: 16, borderWidth: 1, gap: 14, margin: 16, maxWidth: 520, padding: 20 },
  panelTitle: { color: "#f8fbff", fontSize: 26, fontWeight: "900", textAlign: "center" },
  platform: { backgroundColor: "#4bc7ed", borderBottomColor: "#163e85", borderBottomWidth: 6, borderColor: "#d9f8ff", borderRadius: 8, borderTopWidth: 2, height: 12, position: "absolute", zIndex: 4 },
  floorNumber: { backgroundColor: "rgba(5,13,36,0.82)", borderRadius: 4, color: "#fff", fontSize: 9, fontWeight: "900", paddingHorizontal: 4, paddingVertical: 1, position: "absolute", right: 4, top: -18 },
  platformForge: { backgroundColor: "#f97316", borderBottomColor: "#7c2d12", borderColor: "#ffedd5" },
  platformJungle: { backgroundColor: "#22c55e", borderBottomColor: "#14532d", borderColor: "#dcfce7" },
  platformShine: { backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 999, height: 2, left: 5, position: "absolute", right: 5, top: 2 },
  platformSky: { backgroundColor: "#38bdf8", borderBottomColor: "#075985", borderColor: "#f0f9ff" },
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

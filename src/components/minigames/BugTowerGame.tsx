import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, DimensionValue, Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { createArcadeSeed, loadArcadeHighScore, saveArcadeHighScore, seededNumber } from "../../services/arcadeResultService";
import { arcadeSquadAssistForUser } from "../../services/bugSquadGameBalance";
import { playBugSound } from "../../services/soundService";
import { ArcadeRunResult, User } from "../../types";
import { ArcadeSquadAssist } from "./ArcadeSquadAssist";

type Props = { onBack: () => void; onResult?: (result: ArcadeRunResult) => void; practice?: boolean; ranked?: boolean; seed?: string; user: User };
type GameState = "ready" | "result" | "running";
type Platform = { coin?: boolean; drift: number; floor: number; id: string; rocket?: boolean; width: number; x: number; y: number };
type Player = { grounded: boolean; highJump: boolean; lastGroundAt: number; spinAngle: number; spinning: boolean; vx: number; vy: number; x: number; y: number };
type RenderState = { chainUntil: number; charge: number; combo: number; floor: number; maxCombo: number; platforms: Platform[]; player: Player; rocketActive: boolean; score: number };

const tickMs = 20;
const gravity = 0.13;
const horizontalAcceleration = 0.075;
const maxHorizontalSpeed = 0.92;
const playerHalfWidth = 6.5;
const playerHalfHeight = 5.2;
const towerBackground = require("../../../assets/minigames/bug-tower/bug-tower-background.png");
const towerJungleBackground = require("../../../assets/minigames/bug-tower/bug-tower-jungle.png");
const towerForgeBackground = require("../../../assets/minigames/bug-tower/bug-tower-forge.png");
const towerSkyBackground = require("../../../assets/minigames/bug-tower/bug-tower-sky.png");
const towerVoidBackground = require("../../../assets/minigames/bug-tower/bug-tower-void.png");
const towerBackgrounds = [towerBackground, towerJungleBackground, towerForgeBackground, towerSkyBackground, towerVoidBackground];
const beetleSpriteSheet = require("../../../assets/minigames/bug-tower/bug-tower-beetle.png");

export function BugTowerGame({ onBack, onResult, practice = false, ranked = false, seed, user }: Props) {
  const squadAssist = useMemo(() => arcadeSquadAssistForUser(user), [user.activeBugSquad]);
  const [state, setState] = useState<GameState>("ready");
  const [bestScore, setBestScore] = useState(0);
  const [result, setResult] = useState<ArcadeRunResult | null>(null);
  const [heldDirection, setHeldDirection] = useState<-1 | 0 | 1>(0);
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
  const runDistanceRef = useRef(0);
  const landedAtRef = useRef(0);
  const landingChainUntilRef = useRef(0);
  const coinsCollectedRef = useRef(0);
  const rocketUntilRef = useRef(0);
  const rocketCooldownUntilRef = useRef(0);

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
    runDistanceRef.current = 0;
    landedAtRef.current = Date.now();
    landingChainUntilRef.current = 0;
    coinsCollectedRef.current = 0;
    rocketUntilRef.current = 0;
    rocketCooldownUntilRef.current = 0;
    setResult(null);
    setHeldDirection(0);
    setRenderState({ chainUntil: 0, charge: 0, combo: 0, floor: 0, maxCombo: 0, platforms: initial, player: initialPlayer(), rocketActive: false, score: 0 });
    setState("running");
    playBugSound("arcade_start");
  }

  function tick() {
    if (finishedRef.current) return;
    const now = Date.now();
    const elapsed = now - startAtRef.current;
    const previous = playerRef.current;
    const input = manualDirectionRef.current;
    const rocketActive = rocketUntilRef.current > now;
    const friction = previous.grounded ? 0.84 : 0.995;
    const vx = input
      ? clamp(previous.vx * 0.96 + input * horizontalAcceleration, -maxHorizontalSpeed, maxHorizontalSpeed)
      : previous.vx * friction;
    if (previous.grounded && input) runDistanceRef.current = Math.min(32, runDistanceRef.current + Math.abs(vx));
    const nextVy = rocketActive ? -0.55 : Math.min(2.25, previous.vy + gravity);
    let nextPlayer: Player = {
      ...previous,
      grounded: false,
      spinAngle: previous.spinning ? previous.spinAngle + Math.sign(previous.vx || input || 1) * 18 : 0,
      vx,
      vy: nextVy,
      x: previous.x + vx,
      y: previous.y + (rocketActive ? -0.55 : previous.vy + gravity)
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
        const chainLanding = previous.highJump || previous.spinning;
        nextPlayer.y = landing.y - playerHalfHeight;
        nextPlayer.vy = 0;
        nextPlayer.grounded = true;
        nextPlayer.highJump = false;
        nextPlayer.lastGroundAt = now;
        nextPlayer.spinAngle = 0;
        nextPlayer.spinning = false;
        landingChainUntilRef.current = chainLanding ? now + 260 : 0;
        if (landing.coin) {
          coinsCollectedRef.current += 1;
          scoreRef.current += 45;
          platforms = platforms.map((platform) => platform.id === landing.id ? { ...platform, coin: false } : platform);
          playBugSound("arcade_pickup");
        }
        if (landing.rocket && rocketCooldownUntilRef.current <= now) {
          rocketUntilRef.current = now + 1500;
          rocketCooldownUntilRef.current = now + 9000;
          platforms = platforms.map((platform) => platform.id === landing.id ? { ...platform, rocket: false } : platform);
          playBugSound("arcade_build");
        }
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
      chainUntil: landingChainUntilRef.current,
      charge: Math.round(clamp(runDistanceRef.current / 32, 0, 1) * 100),
      combo: comboRef.current,
      floor: landedFloorRef.current,
      maxCombo: maxComboRef.current,
      platforms,
      player: nextPlayer,
      rocketActive: rocketUntilRef.current > now,
      score: Math.floor(scoreRef.current)
    });

    if (!rocketActive && nextPlayer.y - playerHalfHeight > 105) finish();
  }

  function beginRun(direction: -1 | 1) {
    if (state !== "running") return;
    tryLandingChain();
    if (manualDirectionRef.current !== direction) runDistanceRef.current = 0;
    manualDirectionRef.current = direction;
    setHeldDirection(direction);
  }

  function releaseRun(direction: -1 | 1) {
    if (manualDirectionRef.current !== direction) return;
    manualDirectionRef.current = 0;
    setHeldDirection(0);
    jumpFromRun();
  }

  function jumpFromRun() {
    if (state !== "running") return;
    const now = Date.now();
    const player = playerRef.current;
    if (!player.grounded && now - player.lastGroundAt > 140) {
      runDistanceRef.current = 0;
      return;
    }
    const speed = clamp(Math.abs(player.vx) / maxHorizontalSpeed, 0, 1);
    const charge = clamp(runDistanceRef.current / 32, 0, 1);
    const jumpVelocity = -(1.7 + speed * 0.58 + charge * 0.46);
    const spinning = speed >= 0.72 && charge >= 0.58;
    playerRef.current = { ...player, grounded: false, highJump: jumpVelocity < -2.15, spinAngle: 0, spinning, vy: jumpVelocity };
    landingChainUntilRef.current = 0;
    runDistanceRef.current = 0;
    playBugSound("arcade_tap");
  }

  function tryLandingChain() {
    if (state !== "running" || Date.now() > landingChainUntilRef.current) return false;
    const player = playerRef.current;
    playerRef.current = { ...player, grounded: false, highJump: true, spinAngle: 0, spinning: true, vy: -2.35 };
    landingChainUntilRef.current = 0;
    playBugSound("arcade_pickup");
    return true;
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
    const durationMs = Math.min(90000, Math.max(0, Date.now() - startAtRef.current));
    const finalScore = Math.min(50000, Math.max(1, Math.round(scoreRef.current + landedFloorRef.current * 14 + maxComboRef.current * 45)));
    playBugSound("arcade_finish");
    const highScorePromise = practice ? Promise.resolve(bestScore) : saveArcadeHighScore(user.uid, "bug_tower", finalScore);
    void highScorePromise.then((highScore) => {
      const nextResult: ArcadeRunResult = {
        combo: maxComboRef.current,
        durationMs,
        hits: 1,
        localHighScore: highScore,
        mode: "bug_tower",
        pickups: coinsCollectedRef.current,
        score: finalScore,
        streak: landedFloorRef.current,
        timestamp: new Date().toISOString()
      };
      if (!practice) setBestScore(highScore);
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
          <View style={styles.playfield}>
            <ImageBackground resizeMode="cover" source={towerBackgroundForFloor(renderState.floor)} style={styles.background}>
              <View style={styles.backgroundShade} />
              <View style={styles.squadOverlay}><ArcadeSquadAssist compact label={`Squad ${squadAssist.activeCount}/3`} user={user} /></View>
              <View style={styles.controlHint}><Text style={styles.controlHintText}>Hold a direction to run - release to jump</Text></View>
              {renderState.platforms.map((platform) => <TowerPlatform key={platform.id} platform={platform} />)}
              <View style={styles.controlLayer}>
                <Pressable
                  accessibilityLabel="Run left and release to jump"
                  testID="bug-tower-left-control"
                  style={[styles.controlHalf, heldDirection === -1 && styles.controlHalfActive]}
                  onPressIn={() => beginRun(-1)}
                  onPressOut={() => releaseRun(-1)}
                ><Text style={styles.controlArrow}>‹</Text><Text style={styles.controlSideLabel}>LEFT</Text></Pressable>
                <Pressable
                  accessibilityLabel="Run right and release to jump"
                  testID="bug-tower-right-control"
                  style={[styles.controlHalf, heldDirection === 1 && styles.controlHalfActive]}
                  onPressIn={() => beginRun(1)}
                  onPressOut={() => releaseRun(1)}
                ><Text style={styles.controlArrow}>›</Text><Text style={styles.controlSideLabel}>RIGHT</Text></Pressable>
              </View>
              {renderState.chainUntil > Date.now() && (
                <View pointerEvents="none" style={[styles.chainPrompt, percentPosition(renderState.player.x, renderState.player.y)]}>
                  <View style={styles.chainRing} />
                  <Text style={styles.chainText}>TAP</Text>
                </View>
              )}
              <View pointerEvents="none" style={[styles.player, percentPosition(renderState.player.x, renderState.player.y), { transform: [{ rotate: `${renderState.player.spinAngle}deg` }] }]}>
                <BugTowerSprite frame={animationFrame} />
                {renderState.rocketActive && <View style={styles.rocketFlame} />}
              </View>
              <View pointerEvents="none" style={styles.controls}>
                <View style={styles.chargeMeter}>
                  <Text style={styles.chargeLabel}>{renderState.player.spinning ? "SPIN!" : renderState.charge >= 58 ? "SPIN READY" : "JUMP POWER"}</Text>
                  <View style={styles.chargeTrack}><View style={[styles.chargeFill, { width: `${renderState.charge}%` as DimensionValue }]} /></View>
                  <Text style={styles.chargeValue}>{renderState.charge}%</Text>
                </View>
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
        <Text style={styles.body}>Hold left or right to run. Release to jump: a longer run gives a higher leap, and full speed triggers a spin. Chain multi-floor jumps before the tower catches you.</Text>
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyChip}>Run-up jumps</Text>
          <Text style={styles.difficultyChip}>100-floor worlds</Text>
          <Text style={styles.difficultyChip}>Rising pressure</Text>
        </View>
        <Pressable accessibilityLabel="Start Bug Tower" testID="bug-tower-start" style={styles.primaryButton} onPress={onStart}><Text style={styles.primaryText}>Start climb</Text></Pressable>
      </View>
    </ImageBackground>
  );
}

function Result({ onBack, onRetry, ranked, result }: { onBack: () => void; onRetry: () => void; ranked: boolean; result: ArcadeRunResult }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Tower run complete</Text>
      <Text style={styles.score}>{result.score}</Text>
      <Text style={styles.body}>Coins {result.pickups} • Best combo {result.combo} • Best score {result.localHighScore}</Text>
      {!ranked && <Pressable style={styles.primaryButton} onPress={onRetry}><Text style={styles.primaryText}>Climb again</Text></Pressable>}
      <Pressable style={ranked ? styles.primaryButton : styles.secondaryButton} onPress={onBack}><Text style={ranked ? styles.primaryText : styles.secondaryText}>Back to Arena</Text></Pressable>
    </View>
  );
}

function HudChip({ active = false, label }: { active?: boolean; label: string }) {
  return <View style={[styles.hudChip, active && styles.hudChipActive]}><Text style={styles.hudText}>{label}</Text></View>;
}

function TowerPlatform({ platform }: { platform: Platform }) {
  const zone = Math.floor(platform.floor / 100) % towerBackgrounds.length;
  return (
    <View style={[styles.platform, zone === 1 && styles.platformJungle, zone === 2 && styles.platformForge, zone === 3 && styles.platformSky, zone === 4 && styles.platformVoid, {
      left: `${platform.x}%` as DimensionValue,
      top: `${platform.y}%` as DimensionValue,
      width: `${platform.width}%` as DimensionValue
    }]}>
      <View style={styles.platformShine} />
      <Text numberOfLines={1} style={styles.floorNumber}>#{platform.floor}</Text>
      {platform.coin && <View pointerEvents="none" style={styles.coin}><View style={styles.coinInset} /></View>}
      {platform.rocket && <View pointerEvents="none" style={styles.rocketPickup}><Text style={styles.rocketPickupText}>▲</Text></View>}
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
  return { chainUntil: 0, charge: 0, combo: 0, floor: 0, maxCombo: 0, platforms, player: initialPlayer(), rocketActive: false, score: 0 };
}

function initialPlayer(): Player {
  return { grounded: true, highJump: false, lastGroundAt: Date.now(), spinAngle: 0, spinning: false, vx: 0, vy: 0, x: 50, y: 82.8 };
}

function buildInitialPlatforms(seed: string) {
  const platforms: Platform[] = [{ drift: 0, floor: 0, id: "floor-0", width: 76, x: 12, y: 88 }];
  for (let floor = 1; floor < 11; floor += 1) platforms.push(createPlatform(platforms[platforms.length - 1], floor, seed));
  return platforms;
}

export function platformWidthForFloor(floor: number, seed = "balance") {
  const baseWidth = 56 + seededNumber(seed, 0) * 6;
  return clamp(baseWidth * platformWidthMultiplierForFloor(floor), 12, 62);
}

export function platformWidthMultiplierForFloor(floor: number) {
  if (floor < 20) return 1;
  if (floor <= 50) return 1 - ((floor - 20) / 30) * 0.5;
  if (floor <= 100) return 0.5 - ((floor - 50) / 50) * (1 / 6);
  if (floor <= 200) return (1 / 3) - ((floor - 100) / 100) * (1 / 12);
  return Math.max(0.18, 0.25 - ((floor - 200) / 400) * 0.07);
}

export function movingPlatformChance(floor: number) {
  if (floor < 8) return 0;
  if (floor <= 25) return 0.1 + ((floor - 8) / 17) * 0.15;
  if (floor <= 50) return 0.25 + ((floor - 25) / 25) * 0.2;
  if (floor <= 100) return 0.45 + ((floor - 50) / 50) * 0.2;
  if (floor <= 200) return 0.65 + ((floor - 100) / 100) * 0.17;
  return Math.min(0.9, 0.82 + ((floor - 200) / 100) * 0.08);
}

function createPlatform(previous: Platform | null, floor: number, seed: string): Platform {
  const stage = Math.floor(floor / 15);
  const width = platformWidthForFloor(floor, seed);
  const gap = clamp(9.8 + stage * 0.2 + seededNumber(seed, floor * 5 + 1) * 2.8, 9.8, floor >= 200 ? 16.4 : 17.2);
  const previousCenter = previous ? previous.x + previous.width / 2 : 50;
  const reach = clamp(18 + width * 0.2, 21, 30);
  const offset = (seededNumber(seed, floor * 5 + 2) - 0.5) * reach * 2;
  const x = clamp(previousCenter + offset - width / 2, 3.5, 96.5 - width);
  const driftRoll = seededNumber(seed, floor * 5 + 3);
  const moving = driftRoll < movingPlatformChance(floor);
  const drift = moving ? (seededNumber(seed, floor * 5 + 4) > 0.5 ? 1 : -1) * clamp(0.032 + floor * 0.0002, 0.032, 0.12) : 0;
  const guaranteedRocket = floor >= 18 && floor % 29 === 0;
  const rocket = floor > 12 && (guaranteedRocket || seededNumber(seed, floor * 5 + 7) < 0.025);
  const coin = floor > 0 && !rocket && seededNumber(seed, floor * 5 + 6) > 0.72;
  return { coin, drift, floor, id: `floor-${floor}`, rocket, width, x, y: (previous?.y ?? 2) - gap };
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
  const timePressure = elapsed * 0.00000016;
  const floorPressure = floor * 0.00032;
  const zonePressure = Math.floor(floor / 50) * 0.004;
  return clamp(0.009 + timePressure + floorPressure + zonePressure, 0.009, 0.16);
}

function towerZone(floor: number) {
  const names = ["Ice Citadel", "Hive Jungle", "Ember Forge", "Sky Temple", "Cosmic Void"];
  const zone = Math.floor(floor / 100);
  const remix = Math.floor(zone / names.length);
  return `${names[zone % names.length]}${remix > 0 ? ` R${remix}` : ""}`;
}

function towerBackgroundForFloor(floor: number) {
  return towerBackgrounds[Math.floor(floor / 100) % towerBackgrounds.length];
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
  chargeFill: { backgroundColor: "#facc15", borderRadius: 999, height: "100%" },
  chargeLabel: { color: "#f8fbff", fontSize: 9, fontWeight: "900" },
  chargeMeter: { alignItems: "center", backgroundColor: "rgba(7,17,50,0.78)", borderRadius: 12, gap: 3, paddingHorizontal: 8, paddingVertical: 7, width: 104 },
  chargeTrack: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, height: 7, overflow: "hidden", width: "100%" },
  chargeValue: { color: "#bae6fd", fontSize: 10, fontWeight: "900" },
  chainPrompt: { alignItems: "center", height: 86, justifyContent: "center", marginLeft: -43, marginTop: -43, position: "absolute", width: 86, zIndex: 10 },
  chainRing: { borderColor: "#facc15", borderRadius: 999, borderWidth: 3, height: 66, position: "absolute", width: 66 },
  chainText: { color: "#fff7b2", fontSize: 12, fontWeight: "900" },
  coin: { alignItems: "center", backgroundColor: "#facc15", borderColor: "#fff7ae", borderRadius: 999, borderWidth: 2, height: 18, justifyContent: "center", left: "50%", marginLeft: -9, position: "absolute", top: -24, width: 18 },
  coinInset: { borderColor: "#b45309", borderRadius: 999, borderWidth: 2, height: 8, width: 8 },
  controlArrow: { color: "rgba(255,255,255,0.7)", fontSize: 48, fontWeight: "900", lineHeight: 50 },
  controlHalf: { alignItems: "center", flex: 1, justifyContent: "flex-end", paddingBottom: 18 },
  controlHalfActive: { backgroundColor: "rgba(14,116,144,0.2)" },
  controlLayer: { ...StyleSheet.absoluteFillObject, flexDirection: "row", zIndex: 6 },
  controlSideLabel: { color: "rgba(220,233,255,0.75)", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  controlHint: { alignSelf: "center", backgroundColor: "rgba(4,12,38,0.72)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, position: "absolute", top: 8, zIndex: 8 },
  controlHintText: { color: "#dce9ff", fontSize: 11, fontWeight: "900" },
  controls: { alignItems: "center", bottom: 14, left: "50%", marginLeft: -52, position: "absolute", zIndex: 12 },
  difficultyChip: { backgroundColor: "rgba(103,65,217,0.28)", borderColor: "rgba(167,139,250,0.8)", borderRadius: 999, borderWidth: 1, color: "#ede9fe", fontSize: 11, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 6 },
  difficultyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  game: { flex: 1 },
  header: { alignItems: "center", backgroundColor: "#071330", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 },
  hud: { backgroundColor: "#0a1940", borderBottomColor: "#5dd9ff", borderBottomWidth: 1, flexDirection: "row", gap: 7, minHeight: 42, paddingHorizontal: 10, paddingVertical: 6 },
  hudChip: { alignItems: "center", backgroundColor: "rgba(93,217,255,0.1)", borderColor: "rgba(93,217,255,0.35)", borderRadius: 999, borderWidth: 1, flex: 1, justifyContent: "center", paddingHorizontal: 7 },
  hudChipActive: { backgroundColor: "rgba(250,204,21,0.2)", borderColor: "#facc15" },
  hudText: { color: "#f8fbff", fontSize: 12, fontWeight: "900" },
  floorNumber: { backgroundColor: "rgba(5,13,36,0.86)", borderColor: "rgba(255,255,255,0.5)", borderRadius: 5, borderWidth: 1, color: "#fff", fontSize: 9, fontWeight: "900", paddingHorizontal: 4, paddingVertical: 1, position: "absolute", right: 4, top: -18 },
  meta: { color: "#9fb4dd", fontSize: 12, fontWeight: "800" },
  panel: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(7,19,48,0.94)", borderColor: "#5dd9ff", borderRadius: 16, borderWidth: 1, gap: 14, margin: 16, maxWidth: 520, padding: 20 },
  panelTitle: { color: "#f8fbff", fontSize: 26, fontWeight: "900", textAlign: "center" },
  platform: { backgroundColor: "#4bc7ed", borderBottomColor: "#163e85", borderBottomWidth: 6, borderColor: "#d9f8ff", borderRadius: 8, borderTopWidth: 2, height: 12, position: "absolute", zIndex: 4 },
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
  rocketFlame: { backgroundColor: "#facc15", borderColor: "#fb923c", borderRadius: 999, borderWidth: 2, bottom: -14, height: 22, position: "absolute", width: 12 },
  rocketPickup: { alignItems: "center", backgroundColor: "#f97316", borderColor: "#ffedd5", borderRadius: 8, borderWidth: 2, height: 24, justifyContent: "center", left: "50%", marginLeft: -10, position: "absolute", top: -30, width: 20 },
  rocketPickupText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  shell: { backgroundColor: "#050d24", flex: 1 },
  spriteFrame: { overflow: "hidden" },
  squadOverlay: { position: "absolute", right: 8, top: 42, zIndex: 9 },
  title: { color: "#f8fbff", fontSize: 24, fontWeight: "900" }
});

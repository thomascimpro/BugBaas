import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  DimensionValue,
  Easing,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { createArcadeSeed, loadArcadeHighScore, saveArcadeHighScore, seededNumber } from "../../services/arcadeResultService";
import { arcadeSquadAssistForUser } from "../../services/bugSquadGameBalance";
import { playBugSound } from "../../services/soundService";
import { ArcadeRunResult, User } from "../../types";
import { ArcadeSquadAssist } from "./ArcadeSquadAssist";

type Props = { onBack: () => void; onResult?: (result: ArcadeRunResult) => void; practice?: boolean; ranked?: boolean; seed?: string; user: User };
type GameState = "ready" | "result" | "running";
type BubbleKind = "bee" | "beetle" | "dragonfly" | "firefly" | "ladybug" | "moth";
type ShotKind = "normal" | "bomb" | "freeze" | "rainbow";
type GridBubble = { col: number; id: string; kind: BubbleKind; row: number };
type Point = { x: number; y: number };
type Shot = { bubbleKind: BubbleKind; kind: ShotKind };
type Projectile = { path: Point[]; shot: Shot; targetCell: { col: number; row: number }; durationMs: number };

const columns = 8;
const dangerRow = 10;
const maxDurationMs = 120000;
const bubbleDiameterPct = 12.4;
const bubbleRadiusPct = bubbleDiameterPct / 2;
const shooter = { x: 50, y: 91 };
const background = require("../../../assets/minigames/bubble-swarm/bubble-swarm-background.png");
const bubbleImages: Record<BubbleKind, number> = {
  bee: require("../../../assets/minigames/bubble-swarm/bug-bubble-bee.png"),
  beetle: require("../../../assets/minigames/bubble-swarm/bug-bubble-beetle.png"),
  dragonfly: require("../../../assets/minigames/bubble-swarm/bug-bubble-dragonfly.png"),
  firefly: require("../../../assets/minigames/bubble-swarm/bug-bubble-firefly.png"),
  ladybug: require("../../../assets/minigames/bubble-swarm/bug-bubble-ladybug.png"),
  moth: require("../../../assets/minigames/bubble-swarm/bug-bubble-moth.png")
};
const allKinds = Object.keys(bubbleImages) as BubbleKind[];

export function BubbleSwarmGame({ onBack, onResult, practice = false, ranked = false, seed, user }: Props) {
  const squadAssist = useMemo(() => arcadeSquadAssistForUser(user), [user.activeBugSquad]);
  const [state, setState] = useState<GameState>("ready");
  const [bestScore, setBestScore] = useState(0);
  const [result, setResult] = useState<ArcadeRunResult | null>(null);
  const [board, setBoard] = useState<GridBubble[]>(() => buildInitialBoard("preview"));
  const [currentShot, setCurrentShot] = useState<Shot>({ bubbleKind: "ladybug", kind: "normal" });
  const [nextShot, setNextShot] = useState<Shot>({ bubbleKind: "bee", kind: "normal" });
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [impact, setImpact] = useState<Point | null>(null);
  const [aim, setAim] = useState<Point>({ x: 50, y: 32 });
  const [fieldSize, setFieldSize] = useState({ height: 1, width: 1 });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [pressureSeconds, setPressureSeconds] = useState(8);
  const [freezeSeconds, setFreezeSeconds] = useState(0);
  const boardRef = useRef<GridBubble[]>(board);
  const seedRef = useRef(createArcadeSeed("bubble_swarm", user.uid));
  const shotRef = useRef(0);
  const bubbleIdRef = useRef(100);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const missesRef = useRef(0);
  const poppedRef = useRef(0);
  const startAtRef = useRef(0);
  const nextPressureAtRef = useRef(0);
  const freezeUntilRef = useRef(0);
  const resolutionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);
  const shootingRef = useRef(false);
  const projectileProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    void loadArcadeHighScore(user.uid, "bubble_swarm").then((value) => active && setBestScore(value));
    return () => { active = false; };
  }, [user.uid]);

  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(tickPressure, 250);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (!projectile) {
      projectileProgress.stopAnimation();
      projectileProgress.setValue(0);
      return;
    }
    projectileProgress.setValue(0);
    const animation = Animated.timing(projectileProgress, {
      duration: projectile.durationMs,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: Platform.OS !== "web"
    });
    animation.start(({ finished }) => { if (finished) resolveShot(projectile); });
    return () => animation.stop();
  }, [projectile]);

  useEffect(() => () => {
    if (resolutionTimerRef.current) clearTimeout(resolutionTimerRef.current);
  }, []);

  useEffect(() => {
    if (state === "result") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      back();
      return true;
    });
    return () => subscription.remove();
  }, [state]);

  function start() {
    const runSeed = seed ?? createArcadeSeed("bubble_swarm", `${user.uid}:${Date.now()}`);
    const initial = buildInitialBoard(runSeed);
    seedRef.current = runSeed;
    boardRef.current = initial;
    shotRef.current = 0;
    bubbleIdRef.current = 100;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    missesRef.current = 0;
    poppedRef.current = 0;
    startAtRef.current = Date.now();
    nextPressureAtRef.current = Date.now() + pressureDelay(0);
    finishedRef.current = false;
    shootingRef.current = false;
    freezeUntilRef.current = 0;
    const first = nextShotKind(runSeed, 0, 0);
    const second = nextShotKind(runSeed, 1, 0);
    setBoard(initial);
    setCurrentShot(first);
    setNextShot(second);
    setProjectile(null);
    setImpact(null);
    setAim({ x: 50, y: 32 });
    setScore(0);
    setCombo(0);
    setMisses(0);
    setPressureSeconds(Math.ceil(pressureDelay(0) / 1000));
    setFreezeSeconds(0);
    setResult(null);
    setState("running");
    playBugSound("arcade_start");
  }

  function tickPressure() {
    if (finishedRef.current) return;
    const now = Date.now();
    const elapsed = now - startAtRef.current;
    if (elapsed >= maxDurationMs) {
      finish();
      return;
    }
    const frozen = freezeUntilRef.current > now;
    setFreezeSeconds(frozen ? Math.ceil((freezeUntilRef.current - now) / 1000) : 0);
    setPressureSeconds(Math.max(0, Math.ceil((nextPressureAtRef.current - now) / 1000)));
    if (frozen) return;
    if (now >= nextPressureAtRef.current && !shootingRef.current) pushPressureRow(elapsed);
  }

  function pushPressureRow(elapsed: number) {
    const shifted = boardRef.current.map((bubble) => ({ ...bubble, row: bubble.row + 1 }));
    const kindCount = activeKindCount(elapsed);
    const incoming = Array.from({ length: columns }, (_, col) => ({
      col,
      id: `pressure-${bubbleIdRef.current++}`,
      kind: allKinds[Math.floor(seededNumber(seedRef.current, bubbleIdRef.current * 7) * kindCount)],
      row: 0
    }));
    const nextBoard = [...shifted, ...incoming];
    boardRef.current = nextBoard;
    setBoard(nextBoard);
    missesRef.current = 0;
    comboRef.current = 0;
    setMisses(0);
    setCombo(0);
    nextPressureAtRef.current = Date.now() + pressureDelay(elapsed);
    setPressureSeconds(Math.ceil(pressureDelay(elapsed) / 1000));
    playBugSound("arcade_hit");
    if (nextBoard.some((bubble) => bubble.row >= dangerRow)) finish();
  }

  function updateAim(locationX: number, locationY: number) {
    if (state !== "running" || shootingRef.current) return;
    setAim({
      x: clamp((locationX / fieldSize.width) * 100, 5, 95),
      y: clamp((locationY / fieldSize.height) * 100, 7, 80)
    });
  }

  function shoot() {
    if (state !== "running" || shootingRef.current || finishedRef.current) return;
    const targetCell = selectTargetCell(boardRef.current, aim);
    if (!targetCell) return;
    const target = gridPoint(targetCell.row, targetCell.col);
    const tracedPath = traceShotPath(shooter, aim, target.y);
    const path = [...tracedPath.slice(0, -1), target];
    shootingRef.current = true;
    setProjectile({ durationMs: Math.max(450, Math.round(pathLength(path) * 9)), path, shot: currentShot, targetCell });
    playBugSound("arcade_tap");
  }

  function resolveShot(nextProjectile: Projectile) {
    if (finishedRef.current || !shootingRef.current) return;
    setImpact(nextProjectile.path[nextProjectile.path.length - 1] ?? shooter);
    resolutionTimerRef.current = setTimeout(() => applyShotResolution(nextProjectile), 180);
  }

  function applyShotResolution(nextProjectile: Projectile) {
    const { shot, targetCell } = nextProjectile;
    const placedKind = shot.kind === "rainbow" ? rainbowKindForCell(boardRef.current, targetCell, shot.bubbleKind) : shot.bubbleKind;
    const placed: GridBubble = { ...targetCell, id: `shot-${bubbleIdRef.current++}`, kind: placedKind };
    let nextBoard = [...boardRef.current, placed];
    const cluster = connectedCluster(nextBoard, placed, (candidate) => candidate.kind === placedKind);
    let removed = 0;
    let dropped = 0;

    if (shot.kind === "bomb") {
      const blastIds = new Set([cellKey(targetCell), ...neighborCells(targetCell.row, targetCell.col).map(cellKey)]);
      nextBoard = nextBoard.filter((bubble) => !blastIds.has(cellKey(bubble)));
      removed = boardRef.current.length + 1 - nextBoard.length;
      comboRef.current = 0;
      missesRef.current = 0;
      playBugSound("arcade_hit");
    } else if (cluster.length >= 3) {
      const matchedIds = new Set(cluster.map((bubble) => bubble.id));
      nextBoard = nextBoard.filter((bubble) => !matchedIds.has(bubble.id));
      removed = cluster.length;
      const supportedIds = supportedBubbleIds(nextBoard);
      const beforeDrop = nextBoard.length;
      nextBoard = nextBoard.filter((bubble) => supportedIds.has(bubble.id));
      dropped = beforeDrop - nextBoard.length;
      comboRef.current += 1;
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
      missesRef.current = Math.max(0, missesRef.current - 1);
      const gained = removed * 35 + dropped * 60 + Math.max(0, comboRef.current - 1) * 45;
      scoreRef.current += gained;
      poppedRef.current += removed + dropped;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setMisses(missesRef.current);
      playBugSound("arcade_pickup");
    } else {
      comboRef.current = 0;
      missesRef.current += 1;
      setCombo(0);
      setMisses(missesRef.current);
      playBugSound("arcade_build");
    }

    if (shot.kind === "freeze") {
      freezeUntilRef.current = Math.max(freezeUntilRef.current, Date.now() + 6000);
      setFreezeSeconds(6);
    }
    if (shot.kind === "bomb" && removed > 0) {
      const supportedIds = supportedBubbleIds(nextBoard);
      const beforeDrop = nextBoard.length;
      nextBoard = nextBoard.filter((bubble) => supportedIds.has(bubble.id));
      dropped = beforeDrop - nextBoard.length;
      scoreRef.current += removed * 50 + dropped * 60;
      poppedRef.current += removed + dropped;
      setScore(scoreRef.current);
      setCombo(0);
      setMisses(0);
    }
    if (shot.kind === "freeze") {
      missesRef.current = 0;
      setMisses(0);
    }

    boardRef.current = nextBoard;
    setBoard(nextBoard);
    shotRef.current += 1;
    const elapsed = Date.now() - startAtRef.current;
    const following = nextShotKind(seedRef.current, shotRef.current + 1, elapsed);
    setCurrentShot(nextShot);
    setNextShot(following);
    setProjectile(null);
    setImpact(null);
    shootingRef.current = false;

    if (nextBoard.some((bubble) => bubble.row >= dangerRow)) {
      finish();
    } else if (missesRef.current >= missLimit(elapsed)) {
      pushPressureRow(elapsed);
    }
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    shootingRef.current = false;
    const durationMs = Math.min(maxDurationMs, Math.max(0, Date.now() - startAtRef.current));
    const finalScore = Math.min(50000, Math.max(1, Math.round(scoreRef.current + poppedRef.current * 4 + maxComboRef.current * 30)));
    playBugSound("arcade_finish");
    const highScorePromise = practice ? Promise.resolve(bestScore) : saveArcadeHighScore(user.uid, "bubble_swarm", finalScore);
    void highScorePromise.then((highScore) => {
      const nextResult: ArcadeRunResult = {
        combo: maxComboRef.current,
        durationMs,
        hits: shotRef.current,
        localHighScore: highScore,
        mode: "bubble_swarm",
        pickups: poppedRef.current,
        score: finalScore,
        streak: maxComboRef.current,
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
      Alert.alert("Leave Bubble Swarm?", "Your solo score is only saved after game over.", [
        { text: "Keep playing", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: onBack }
      ]);
      return;
    }
    onBack();
  }

  function onLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    setFieldSize({ height: Math.max(1, height), width: Math.max(1, width) });
  }

  const elapsed = state === "running" ? Date.now() - startAtRef.current : 0;
  const remainingMisses = Math.max(0, missLimit(elapsed) - misses);
  const previewTargetCell = selectTargetCell(board, aim);
  const previewPath = previewTargetCell
    ? pathToTarget(aim, previewTargetCell)
    : [shooter, aim];
  const projectileTransform = projectile ? animatedPathTransform(projectile.path, projectileProgress, fieldSize) : null;

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Bubble Swarm</Text><Text style={styles.meta}>Best score: {bestScore}</Text></View>
        {(!ranked || state === "result") && <Pressable accessibilityLabel="Close Bubble Swarm" testID="bubble-swarm-close" style={styles.closeButton} onPress={back}><Text style={styles.closeText}>x</Text></Pressable>}
      </View>
      {state === "ready" && <Ready onStart={start} />}
      {state === "running" && (
        <View style={styles.game}>
          <View style={styles.hud}>
            <HudChip label={`${score} pt`} />
            <HudChip active={combo > 1} label={combo > 1 ? `Chain x${combo}` : `${remainingMisses} safe shots`} />
            <HudChip active={freezeSeconds > 0 || pressureSeconds <= 5} label={freezeSeconds > 0 ? `FROZEN ${freezeSeconds}s` : `Swarm ${pressureSeconds}s`} />
          </View>
          <ImageBackground resizeMode="cover" source={background} style={styles.background}>
            <View style={styles.backgroundShade} />
            <View
              accessibilityLabel="Bubble Swarm playfield"
              testID="bubble-swarm-playfield"
              onLayout={onLayout}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(event) => updateAim(event.nativeEvent.locationX, event.nativeEvent.locationY)}
              onResponderMove={(event) => updateAim(event.nativeEvent.locationX, event.nativeEvent.locationY)}
              onResponderRelease={shoot}
              onStartShouldSetResponder={() => true}
              style={styles.playfield}
            >
              <View style={styles.dangerLine}><Text style={styles.dangerText}>DANGER</Text></View>
              {!projectile && samplePath(previewPath, 18).map((point, index) => (
                <View key={`aim-${index}`} pointerEvents="none" style={[styles.aimDot, { left: `${point.x}%`, top: `${point.y}%` }]} />
              ))}
              {board.map((bubble) => <Bubble key={bubble.id} bubble={bubble} size={fieldSize.width * bubbleDiameterPct / 100} />)}
              {impact && <View pointerEvents="none" style={[styles.impactRing, { left: `${impact.x}%`, top: `${impact.y}%` }]} />}
              {projectile && projectileTransform && (
                <Animated.Image
                  source={bubbleImages[projectile.shot.bubbleKind]}
                  style={[
                    styles.projectile,
                    {
                      height: fieldSize.width * bubbleDiameterPct / 100,
                      left: `${shooter.x - bubbleRadiusPct}%`,
                      top: `${shooter.y - bubbleRadiusPct}%`,
                      width: fieldSize.width * bubbleDiameterPct / 100,
                      transform: projectileTransform
                    }
                  ]}
                />
              )}
              <View pointerEvents="none" style={styles.squadOverlay}><ArcadeSquadAssist compact label={`Squad ${squadAssist.activeCount}/3`} user={user} /></View>
              <View pointerEvents="none" style={styles.launcher}>
                <Text style={styles.nextLabel}>NEXT {shotKindLabel(nextShot.kind)}</Text>
                <Image source={bubbleImages[nextShot.bubbleKind]} style={styles.nextBubble} />
                {!projectile && <Image source={bubbleImages[currentShot.bubbleKind]} style={styles.currentBubble} />}
                {!projectile && currentShot.kind !== "normal" && <Text style={styles.currentShotBadge}>{shotKindLabel(currentShot.kind)}</Text>}
                <View style={styles.launcherBase} />
              </View>
              {!projectile && currentShot.kind !== "normal" && (
                <View pointerEvents="none" style={styles.powerReady}>
                  <Text style={styles.powerReadyText}>{shotKindLabel(currentShot.kind)} READY</Text>
                </View>
              )}
              <View pointerEvents="none" style={styles.controlHint}><Text style={styles.controlHintText}>Drag to aim - release to shoot</Text></View>
            </View>
          </ImageBackground>
        </View>
      )}
      {state === "result" && result && <Result onBack={onBack} onRetry={start} ranked={ranked} result={result} />}
    </View>
  );
}

function Ready({ onStart }: { onStart: () => void }) {
  return (
    <ImageBackground resizeMode="cover" source={background} style={styles.readyBackground}>
      <View style={styles.readyShade} />
      <View style={styles.panel}>
        <View style={styles.heroBubbles}>
          <Image source={bubbleImages.ladybug} style={styles.heroBubble} />
          <Image source={bubbleImages.bee} style={[styles.heroBubble, styles.heroBubbleRaised]} />
          <Image source={bubbleImages.moth} style={styles.heroBubble} />
        </View>
        <Text style={styles.panelTitle}>Hold back the swarm</Text>
        <Text style={styles.body}>Drag to aim and release to shoot. Match 3 bug bubbles, drop loose clusters, and build chains before the swarm reaches the danger line.</Text>
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyChip}>Faster pressure</Text>
          <Text style={styles.difficultyChip}>More bug colors</Text>
          <Text style={styles.difficultyChip}>120-second peak</Text>
        </View>
        <Pressable accessibilityLabel="Start Bubble Swarm" testID="bubble-swarm-start" style={styles.primaryButton} onPress={onStart}><Text style={styles.primaryText}>Start solo run</Text></Pressable>
      </View>
    </ImageBackground>
  );
}

function Result({ onBack, onRetry, ranked, result }: { onBack: () => void; onRetry: () => void; ranked: boolean; result: ArcadeRunResult }) {
  return (
    <ImageBackground resizeMode="cover" source={background} style={styles.resultBackground}>
      <View style={styles.readyShade} />
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>The swarm broke through</Text>
        <Text style={styles.score}>{result.score}</Text>
        <Text style={styles.body}>{result.pickups} bubbles cleared - Best chain x{result.combo} - Best score {result.localHighScore}</Text>
        {!ranked && <Pressable style={styles.primaryButton} onPress={onRetry}><Text style={styles.primaryText}>Play again</Text></Pressable>}
        <Pressable style={ranked ? styles.primaryButton : styles.secondaryButton} onPress={onBack}><Text style={ranked ? styles.primaryText : styles.secondaryText}>Back to Arena</Text></Pressable>
      </View>
    </ImageBackground>
  );
}

function Bubble({ bubble, size }: { bubble: GridBubble; size: number }) {
  const point = gridPoint(bubble.row, bubble.col);
  return <Image source={bubbleImages[bubble.kind]} style={[styles.bubble, { height: size, width: size }, percentPosition(point.x - bubbleRadiusPct, point.y - bubbleRadiusPct)]} />;
}

function HudChip({ active = false, label }: { active?: boolean; label: string }) {
  return <View style={[styles.hudChip, active && styles.hudChipActive]}><Text style={styles.hudText}>{label}</Text></View>;
}

function buildInitialBoard(seed: string) {
  const bubbles: GridBubble[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const kind = allKinds[(col + row * 2 + Math.floor(seededNumber(seed, row * columns + col) * 2)) % 4];
      bubbles.push({ col, id: `initial-${row}-${col}`, kind, row });
    }
  }
  return bubbles;
}

function nextShotKind(seed: string, shot: number, elapsed: number): Shot {
  const count = activeKindCount(elapsed);
  const bubbleKind = allKinds[Math.floor(seededNumber(seed, 500 + shot * 11) * count)];
  const kind = scheduledPowerKind(seed, shot);
  return { bubbleKind, kind };
}

function scheduledPowerKind(seed: string, shot: number): ShotKind {
  let powerShot = 6 + Math.floor(seededNumber(seed, 900) * 3);
  let index = 0;
  while (powerShot <= shot) {
    if (powerShot === shot) {
      const roll = seededNumber(seed, 1000 + index * 43);
      return roll < 0.36 ? "bomb" : roll < 0.7 ? "freeze" : "rainbow";
    }
    powerShot += 7 + Math.floor(seededNumber(seed, 940 + index * 37) * 4);
    index += 1;
  }
  return "normal";
}

function activeKindCount(elapsed: number) {
  if (elapsed >= 55000) return 6;
  if (elapsed >= 28000) return 5;
  return 4;
}

function pressureDelay(elapsed: number) {
  return clamp(8000 - Math.floor(elapsed / 20000) * 700, 4500, 8000);
}

function missLimit(elapsed: number) {
  if (elapsed >= 80000) return 3;
  if (elapsed >= 45000) return 4;
  return 5;
}

function gridPoint(row: number, col: number): Point {
  return { x: 6.4 + col * 11.6 + (row % 2 ? 5.8 : 0), y: 6.2 + row * 7.2 };
}

export function traceShotPath(from: Point, aim: Point, endY = 5): Point[] {
  const direction = normalize({ x: aim.x - from.x, y: Math.min(-3, aim.y - from.y) });
  const points = [from];
  let current = { ...from };
  let dx = direction.x;
  const dy = direction.y;
  const boundaryLeft = 5;
  const boundaryRight = 95;
  const targetY = clamp(endY, boundaryLeft, 82);
  for (let step = 0; step < 4 && current.y > targetY; step += 1) {
    const targetTime = (targetY - current.y) / dy;
    const wallTime = dx > 0 ? (boundaryRight - current.x) / dx : dx < 0 ? (boundaryLeft - current.x) / dx : Number.POSITIVE_INFINITY;
    if (wallTime >= 0 && wallTime < targetTime) {
      current = { x: dx > 0 ? boundaryRight : boundaryLeft, y: current.y + dy * wallTime };
      points.push(current);
      dx *= -1;
      continue;
    }
    current = { x: current.x + dx * targetTime, y: targetY };
    points.push(current);
    break;
  }
  return points.length > 1 ? points : [from, { x: from.x, y: targetY }];
}

function selectTargetCell(board: GridBubble[], aim: Point) {
  const occupied = new Set(board.map(cellKey));
  const candidates = new Map<string, { col: number; row: number }>();
  for (let col = 0; col < columns; col += 1) candidates.set(`0:${col}`, { col, row: 0 });
  for (const bubble of board) {
    for (const neighbor of neighborCells(bubble.row, bubble.col)) {
      if (neighbor.row < 0 || neighbor.row > dangerRow || neighbor.col < 0 || neighbor.col >= columns) continue;
      const key = cellKey(neighbor);
      if (!occupied.has(key)) candidates.set(key, neighbor);
    }
  }
  let best: { cell: { col: number; row: number }; score: number } | null = null;
  for (const cell of candidates.values()) {
    if (occupied.has(cellKey(cell))) continue;
    const point = gridPoint(cell.row, cell.col);
    const ray = traceShotPath(shooter, aim, point.y);
    const impact = ray[ray.length - 1] ?? aim;
    const exposedNeighbors = neighborCells(cell.row, cell.col).filter((neighbor) => occupied.has(cellKey(neighbor))).length;
    const candidateScore = distance(point, impact) - exposedNeighbors * 0.12;
    if (!best || candidateScore < best.score) best = { cell, score: candidateScore };
  }
  return best?.cell ?? null;
}

function pathToTarget(aim: Point, targetCell: { col: number; row: number }) {
  const target = gridPoint(targetCell.row, targetCell.col);
  const traced = traceShotPath(shooter, aim, target.y);
  return [...traced.slice(0, -1), target];
}

function rainbowKindForCell(board: GridBubble[], target: { col: number; row: number }, fallback: BubbleKind) {
  const byCell = new Map(board.map((bubble) => [cellKey(bubble), bubble]));
  let best = { kind: fallback, size: 0 };
  for (const cell of neighborCells(target.row, target.col)) {
    const neighbor = byCell.get(cellKey(cell));
    if (!neighbor) continue;
    const size = connectedCluster(board, neighbor, (bubble) => bubble.kind === neighbor.kind).length;
    if (size > best.size) best = { kind: neighbor.kind, size };
  }
  return best.kind;
}

function connectedCluster(board: GridBubble[], start: GridBubble, include: (bubble: GridBubble) => boolean) {
  const byCell = new Map(board.map((bubble) => [cellKey(bubble), bubble]));
  const visited = new Set<string>();
  const queue = [start];
  const found: GridBubble[] = [];
  while (queue.length) {
    const bubble = queue.shift()!;
    if (visited.has(bubble.id) || !include(bubble)) continue;
    visited.add(bubble.id);
    found.push(bubble);
    for (const cell of neighborCells(bubble.row, bubble.col)) {
      const neighbor = byCell.get(cellKey(cell));
      if (neighbor && !visited.has(neighbor.id)) queue.push(neighbor);
    }
  }
  return found;
}

function supportedBubbleIds(board: GridBubble[]) {
  const byCell = new Map(board.map((bubble) => [cellKey(bubble), bubble]));
  const supported = new Set<string>();
  const queue = board.filter((bubble) => bubble.row === 0);
  while (queue.length) {
    const bubble = queue.shift()!;
    if (supported.has(bubble.id)) continue;
    supported.add(bubble.id);
    for (const cell of neighborCells(bubble.row, bubble.col)) {
      const neighbor = byCell.get(cellKey(cell));
      if (neighbor && !supported.has(neighbor.id)) queue.push(neighbor);
    }
  }
  return supported;
}

function neighborCells(row: number, col: number) {
  const diagonal = row % 2 ? 1 : -1;
  return [
    { row, col: col - 1 }, { row, col: col + 1 },
    { row: row - 1, col }, { row: row + 1, col },
    { row: row - 1, col: col + diagonal }, { row: row + 1, col: col + diagonal }
  ];
}

function cellKey(cell: { col: number; row: number }) {
  return `${cell.row}:${cell.col}`;
}

function pathLength(path: Point[]) {
  return path.slice(1).reduce((total, point, index) => total + distance(path[index], point), 0);
}

function pointAtPathDistance(path: Point[], progress: number): Point {
  const total = pathLength(path);
  let remaining = total * progress;
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const segment = distance(start, end);
    if (remaining <= segment) {
      const ratio = segment ? remaining / segment : 1;
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= segment;
  }
  return path[path.length - 1] ?? { x: 50, y: 91 };
}

function samplePath(path: Point[], count: number) {
  return Array.from({ length: count }, (_, index) => pointAtPathDistance(path, index / Math.max(1, count - 1)));
}

function animatedPathTransform(path: Point[], progress: Animated.Value, fieldSize: { height: number; width: number }) {
  const lengths = path.slice(1).map((point, index) => distance(path[index], point));
  const total = Math.max(0.001, lengths.reduce((sum, value) => sum + value, 0));
  const inputRange = [0];
  let travelled = 0;
  for (const length of lengths) {
    travelled += length;
    inputRange.push(travelled / total);
  }
  const points = path.length > 1 ? path : [shooter, shooter];
  return [
    { translateX: progress.interpolate({ inputRange, outputRange: points.map((point) => ((point.x - shooter.x) / 100) * fieldSize.width) }) },
    { translateY: progress.interpolate({ inputRange, outputRange: points.map((point) => ((point.y - shooter.y) / 100) * fieldSize.height) }) }
  ];
}

function shotKindLabel(kind: ShotKind) {
  if (kind === "bomb") return "BOMB";
  if (kind === "freeze") return "FREEZE";
  if (kind === "rainbow") return "RAINBOW";
  return "";
}

function normalize(point: Point) {
  const length = Math.max(0.001, Math.sqrt(point.x * point.x + point.y * point.y));
  return { x: point.x / length, y: point.y / length };
}

function distance(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function percentPosition(x: number, y: number) {
  return { left: `${x}%` as DimensionValue, top: `${y}%` as DimensionValue };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  aimDot: { backgroundColor: "#fff", borderColor: "#67e8f9", borderRadius: 999, borderWidth: 1, height: 6, marginLeft: -3, marginTop: -3, position: "absolute", width: 6, zIndex: 2 },
  aimLine: { backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 2, height: 2, position: "absolute", zIndex: 2 },
  background: { flex: 1 },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,9,28,0.12)" },
  body: { color: "#dce9ff", fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  bubble: { position: "absolute", zIndex: 5 },
  closeButton: { alignItems: "center", backgroundColor: "#f8fbff", borderRadius: 10, height: 44, justifyContent: "center", width: 44 },
  closeText: { color: "#0b1638", fontSize: 24, fontWeight: "900" },
  controlHint: { alignSelf: "center", backgroundColor: "rgba(4,12,38,0.78)", borderRadius: 999, bottom: 4, paddingHorizontal: 12, paddingVertical: 5, position: "absolute", zIndex: 12 },
  controlHintText: { color: "#dce9ff", fontSize: 11, fontWeight: "900" },
  currentBubble: { bottom: 5, height: 60, position: "absolute", width: 60, zIndex: 9 },
  currentShotBadge: { backgroundColor: "#fbbf24", borderRadius: 999, bottom: 54, color: "#102018", fontSize: 10, fontWeight: "900", paddingHorizontal: 5, paddingVertical: 2, position: "absolute", zIndex: 10 },
  dangerLine: { borderTopColor: "rgba(251,113,133,0.8)", borderTopWidth: 2, left: 6, position: "absolute", right: 6, top: "82%", zIndex: 3 },
  dangerText: { alignSelf: "flex-end", backgroundColor: "rgba(77,10,30,0.84)", color: "#fecdd3", fontSize: 9, fontWeight: "900", paddingHorizontal: 5, paddingVertical: 2 },
  difficultyChip: { backgroundColor: "rgba(14,116,144,0.3)", borderColor: "rgba(103,232,249,0.72)", borderRadius: 999, borderWidth: 1, color: "#cffafe", fontSize: 11, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 6 },
  difficultyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  game: { flex: 1 },
  header: { alignItems: "center", backgroundColor: "#06152b", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 },
  heroBubble: { height: 82, width: 82 },
  heroBubbleRaised: { marginHorizontal: -8, marginTop: -18, zIndex: 2 },
  heroBubbles: { flexDirection: "row", height: 86, justifyContent: "center" },
  hud: { backgroundColor: "#08213b", borderBottomColor: "#67e8f9", borderBottomWidth: 1, flexDirection: "row", gap: 7, minHeight: 42, paddingHorizontal: 10, paddingVertical: 6 },
  hudChip: { alignItems: "center", backgroundColor: "rgba(34,211,238,0.1)", borderColor: "rgba(103,232,249,0.35)", borderRadius: 999, borderWidth: 1, flex: 1, justifyContent: "center", paddingHorizontal: 7 },
  hudChipActive: { backgroundColor: "rgba(251,191,36,0.2)", borderColor: "#fbbf24" },
  hudText: { color: "#f8fbff", fontSize: 12, fontWeight: "900" },
  impactRing: { borderColor: "#fbbf24", borderRadius: 999, borderWidth: 3, height: 36, marginLeft: -18, marginTop: -18, position: "absolute", width: 36, zIndex: 11 },
  launcher: { alignItems: "center", bottom: "3%", height: 92, left: "35%", position: "absolute", width: "30%", zIndex: 8 },
  launcherBase: { backgroundColor: "#145d65", borderColor: "#a5f3fc", borderRadius: 999, borderWidth: 3, bottom: 0, height: 28, position: "absolute", width: 88 },
  meta: { color: "#9fb4dd", fontSize: 12, fontWeight: "800" },
  nextBubble: { bottom: 9, height: 34, left: -18, position: "absolute", width: 34 },
  nextLabel: { bottom: 43, color: "#cffafe", fontSize: 8, fontWeight: "900", left: -22, position: "absolute" },
  panel: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(5,19,43,0.94)", borderColor: "#67e8f9", borderRadius: 16, borderWidth: 1, gap: 14, margin: 16, maxWidth: 520, padding: 20 },
  panelTitle: { color: "#f8fbff", fontSize: 26, fontWeight: "900", textAlign: "center" },
  playfield: { flex: 1, overflow: "hidden" },
  primaryButton: { alignItems: "center", backgroundColor: "#0f8f72", borderRadius: 10, justifyContent: "center", minHeight: 52, paddingHorizontal: 20, width: "100%" },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  projectile: { position: "absolute", zIndex: 7 },
  powerReady: { alignSelf: "center", backgroundColor: "rgba(88,28,135,0.92)", borderColor: "#e879f9", borderRadius: 999, borderWidth: 2, bottom: 112, paddingHorizontal: 12, paddingVertical: 6, position: "absolute", zIndex: 11 },
  powerReadyText: { color: "#fae8ff", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  readyBackground: { flex: 1, justifyContent: "center" },
  readyShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,7,24,0.4)" },
  resultBackground: { flex: 1, justifyContent: "center" },
  score: { color: "#fbbf24", fontSize: 58, fontWeight: "900" },
  secondaryButton: { alignItems: "center", borderColor: "#dce9ff", borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 20, width: "100%" },
  secondaryText: { color: "#f8fbff", fontSize: 16, fontWeight: "900" },
  shell: { backgroundColor: "#030d20", flex: 1 },
  squadOverlay: { position: "absolute", right: 8, top: 8, zIndex: 12 },
  title: { color: "#f8fbff", fontSize: 24, fontWeight: "900" }
});

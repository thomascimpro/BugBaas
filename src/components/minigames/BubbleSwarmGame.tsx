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
import { BUBBLE_COLUMNS, BUBBLE_DANGER_ROW, bubbleAimPath, bubbleAvailableKinds, bubbleCellKey, bubbleNeighborCells, resolveBubbleMatch } from "./bubbleSwarmLogic";

type Props = { onBack: () => void; onResult?: (result: ArcadeRunResult) => void; ranked?: boolean; seed?: string; user: User };
type GameState = "ready" | "result" | "running";
type BubbleKind = "bee" | "beetle" | "dragonfly" | "firefly" | "ladybug" | "moth";
type GridBubble = { col: number; id: string; kind: BubbleKind; row: number };
type Point = { x: number; y: number };
type Projectile = { bounceAt: number | null; kind: BubbleKind; path: Point[]; target: Point; targetCell: { col: number; row: number } };

const columns = BUBBLE_COLUMNS;
const dangerRow = BUBBLE_DANGER_ROW;
const maxDurationMs = 90000;
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

export function BubbleSwarmGame({ onBack, onResult, ranked = false, seed, user }: Props) {
  const squadAssist = useMemo(() => arcadeSquadAssistForUser(user), [user.activeBugSquad]);
  const [state, setState] = useState<GameState>("ready");
  const [bestScore, setBestScore] = useState(0);
  const [result, setResult] = useState<ArcadeRunResult | null>(null);
  const [board, setBoard] = useState<GridBubble[]>(() => buildInitialBoard("preview"));
  const [currentKind, setCurrentKind] = useState<BubbleKind>("ladybug");
  const [nextKind, setNextKind] = useState<BubbleKind>("bee");
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [aim, setAim] = useState<Point>({ x: 50, y: 32 });
  const [fieldSize, setFieldSize] = useState({ height: 1, width: 1 });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [pressureSeconds, setPressureSeconds] = useState(22);
  const flight = useRef(new Animated.Value(0)).current;
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
  const finishedRef = useRef(false);
  const shootingRef = useRef(false);

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
    if (state === "result") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!ranked) back();
      return true;
    });
    return () => subscription.remove();
  }, [ranked, state]);

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
    const first = nextShotKind(runSeed, 0, initial);
    const second = nextShotKind(runSeed, 1, initial);
    setBoard(initial);
    setCurrentKind(first);
    setNextKind(second);
    setProjectile(null);
    setAim({ x: 50, y: 32 });
    setScore(0);
    setCombo(0);
    setMisses(0);
    setPressureSeconds(Math.ceil(pressureDelay(0) / 1000));
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
    setPressureSeconds(Math.max(0, Math.ceil((nextPressureAtRef.current - now) / 1000)));
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
    playBugSound("bubble_pressure");
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
    const rawPath = bubbleAimPath(shooter, aim, target.y);
    const path = [...rawPath.slice(0, -1), target];
    const bounceAt = path.length === 3 ? pathSegmentProgress(path, 0) : null;
    shootingRef.current = true;
    setProjectile({ bounceAt, kind: currentKind, path, target, targetCell });
    flight.setValue(0);
    playBugSound("bubble_shoot");
    if (bounceAt !== null) setTimeout(() => playBugSound("bubble_bounce"), Math.round(620 * bounceAt));
    Animated.timing(flight, {
      duration: clamp(Math.round(pathLength(path) * 7.2), 440, 720),
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished && !finishedRef.current) resolveShot(currentKind, targetCell);
      else shootingRef.current = false;
    });
  }

  function resolveShot(kind: BubbleKind, targetCell: { col: number; row: number }) {
    const placed: GridBubble = { ...targetCell, id: `shot-${bubbleIdRef.current++}`, kind };
    let nextBoard = [...boardRef.current, placed];
    let removed = 0;
    let dropped = 0;

    const resolution = resolveBubbleMatch(nextBoard, placed);
    if (resolution.popped >= 3) {
      nextBoard = resolution.board;
      removed = resolution.popped;
      dropped = resolution.dropped;
      comboRef.current += 1;
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
      missesRef.current = Math.max(0, missesRef.current - 1);
      const gained = removed * 35 + dropped * 60 + Math.max(0, comboRef.current - 1) * 45;
      scoreRef.current += gained;
      poppedRef.current += removed + dropped;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setMisses(missesRef.current);
      playBugSound(dropped > 0 ? "bubble_drop" : "bubble_pop");
    } else {
      comboRef.current = 0;
      missesRef.current += 1;
      setCombo(0);
      setMisses(missesRef.current);
      playBugSound("bubble_bounce");
    }

    boardRef.current = nextBoard;
    setBoard(nextBoard);
    shotRef.current += 1;
    const elapsed = Date.now() - startAtRef.current;
    const available = bubbleAvailableKinds(nextBoard) as BubbleKind[];
    const safeNextKind = available.includes(nextKind) ? nextKind : nextShotKind(seedRef.current, shotRef.current, nextBoard);
    const following = nextShotKind(seedRef.current, shotRef.current + 1, nextBoard);
    setCurrentKind(safeNextKind);
    setNextKind(following);
    setProjectile(null);
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
    void saveArcadeHighScore(user.uid, "bubble_swarm", finalScore).then((highScore) => {
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
      setBestScore(highScore);
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
  const targetCell = selectTargetCell(board, aim);
  const targetPoint = targetCell ? gridPoint(targetCell.row, targetCell.col) : { x: aim.x, y: 7 };
  const previewPath = [...bubbleAimPath(shooter, aim, targetPoint.y).slice(0, -1), targetPoint];
  const aimDots = samplePath(previewPath, 15);

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Bubble Swarm</Text><Text style={styles.meta}>Best score: {bestScore}</Text></View>
        {(!ranked || state === "result") && <Pressable style={styles.closeButton} onPress={back}><Text style={styles.closeText}>x</Text></Pressable>}
      </View>
      {state === "ready" && <Ready onStart={start} ranked={ranked} />}
      {state === "running" && (
        <View style={styles.game}>
          <View style={styles.hud}>
            <HudChip label={`${score} pt`} />
            <HudChip active={combo > 1} label={combo > 1 ? `Chain x${combo}` : `${remainingMisses} safe shots`} />
            <HudChip active={pressureSeconds <= 5} label={`Swarm ${pressureSeconds}s`} />
          </View>
          <ImageBackground resizeMode="cover" source={background} style={styles.background}>
            <View style={styles.backgroundShade} />
            <View
              accessibilityLabel="Bubble Swarm playfield"
              accessible
              onLayout={onLayout}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(event) => updateAim(event.nativeEvent.locationX, event.nativeEvent.locationY)}
              onResponderMove={(event) => updateAim(event.nativeEvent.locationX, event.nativeEvent.locationY)}
              onResponderRelease={shoot}
              onStartShouldSetResponder={() => true}
              style={styles.playfield}
            >
              <View style={styles.dangerLine}><Text style={styles.dangerText}>DANGER</Text></View>
              <View pointerEvents="none" style={styles.aimGuide} testID="bubble-trajectory-guide">
                {aimDots.map((dot, index) => <View key={index} style={[styles.aimDot, percentPosition(dot.x - 0.55, dot.y - 0.55)]} />)}
              </View>
              {board.map((bubble) => <Bubble key={bubble.id} bubble={bubble} />)}
              {projectile && (
                <Animated.Image
                  accessibilityLabel="Bubble projectile"
                  resizeMode="contain"
                  source={bubbleImages[projectile.kind]}
                  style={[
                    styles.projectile,
                    {
                      left: flight.interpolate(projectileInterpolation(projectile.path, "x", 4.85)),
                      top: flight.interpolate(projectileInterpolation(projectile.path, "y", 4.05))
                    }
                  ]}
                />
              )}
              <View pointerEvents="none" style={styles.squadOverlay}><ArcadeSquadAssist compact label={`Squad ${squadAssist.activeCount}/3`} user={user} /></View>
              <View pointerEvents="none" style={styles.launcher}>
                <Text style={styles.nextLabel}>NEXT</Text>
                <Image resizeMode="contain" source={bubbleImages[nextKind]} style={styles.nextBubble} />
                {!projectile && <Image resizeMode="contain" source={bubbleImages[currentKind]} style={styles.currentBubble} />}
                <View style={styles.launcherBase} />
              </View>
              <View pointerEvents="none" style={styles.controlHint}><Text style={styles.controlHintText}>Aim - release - match 3 or more</Text></View>
            </View>
          </ImageBackground>
        </View>
      )}
      {state === "result" && result && <Result onBack={onBack} onRetry={start} ranked={ranked} result={result} />}
    </View>
  );
}

function Ready({ onStart, ranked }: { onStart: () => void; ranked: boolean }) {
  return (
    <ImageBackground resizeMode="cover" source={background} style={styles.readyBackground}>
      <View style={styles.readyShade} />
      <View style={styles.panel}>
        <View style={styles.heroBubbles}>
          <Image resizeMode="contain" source={bubbleImages.ladybug} style={styles.heroBubble} />
          <Image resizeMode="contain" source={bubbleImages.bee} style={[styles.heroBubble, styles.heroBubbleRaised]} />
          <Image resizeMode="contain" source={bubbleImages.moth} style={styles.heroBubble} />
        </View>
        <Text style={styles.panelTitle}>Classic bug bubble shooter</Text>
        <Text style={styles.body}>Aim and release to shoot. Connect 3 or more identical bug bubbles to pop them. Unsupported bubbles fall for bonus points.</Text>
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyChip}>Faster pressure</Text>
          <Text style={styles.difficultyChip}>More bug colors</Text>
          <Text style={styles.difficultyChip}>Wall bounce shots</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onStart}><Text style={styles.primaryText}>{ranked ? "Start ranked match" : "Start training"}</Text></Pressable>
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

function Bubble({ bubble }: { bubble: GridBubble }) {
  const point = gridPoint(bubble.row, bubble.col);
  return (
    <View pointerEvents="none" style={[styles.bubble, percentPosition(point.x - 4.85, point.y - 4.05)]}>
      <Image resizeMode="contain" source={bubbleImages[bubble.kind]} style={styles.bubbleImage} />
    </View>
  );
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

function nextShotKind(seed: string, shot: number, board: GridBubble[]) {
  const available = bubbleAvailableKinds(board) as BubbleKind[];
  const choices = available.length ? available : allKinds.slice(0, 4);
  return choices[Math.floor(seededNumber(seed, 500 + shot * 11) * choices.length)];
}

function activeKindCount(elapsed: number) {
  if (elapsed >= 75000) return 6;
  if (elapsed >= 45000) return 5;
  return 4;
}

function pressureDelay(elapsed: number) {
  return clamp(22000 - Math.floor(elapsed / 18000) * 2000, 10000, 22000);
}

function missLimit(elapsed: number) {
  return clamp(7 - Math.floor(elapsed / 30000), 4, 7);
}

function gridPoint(row: number, col: number): Point {
  return { x: 5.4 + col * 10.15 + (row % 2 ? 5.05 : 0), y: 5.3 + row * 7.15 };
}

function selectTargetCell(board: GridBubble[], aim: Point) {
  const occupied = new Set(board.map(bubbleCellKey));
  const candidates = new Map<string, { col: number; row: number }>();
  for (let col = 0; col < columns; col += 1) candidates.set(`0:${col}`, { col, row: 0 });
  for (const bubble of board) {
    for (const neighbor of bubbleNeighborCells(bubble.row, bubble.col)) {
      if (neighbor.row < 0 || neighbor.row > dangerRow || neighbor.col < 0 || neighbor.col >= columns) continue;
      const key = bubbleCellKey(neighbor);
      if (!occupied.has(key)) candidates.set(key, neighbor);
    }
  }
  const path = bubbleAimPath(shooter, aim, 5);
  let best: { cell: { col: number; row: number }; score: number } | null = null;
  for (const cell of candidates.values()) {
    if (occupied.has(bubbleCellKey(cell))) continue;
    const point = gridPoint(cell.row, cell.col);
    const candidateScore = distanceToPath(point, path) * 2.4 + point.y * 0.012;
    if (!best || candidateScore < best.score) best = { cell, score: candidateScore };
  }
  return best?.cell ?? null;
}

function distance(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function pathLength(path: Point[]) {
  return path.slice(1).reduce((total, point, index) => total + distance(path[index], point), 0);
}

function pathSegmentProgress(path: Point[], segmentIndex: number) {
  return distance(path[segmentIndex], path[segmentIndex + 1]) / Math.max(0.001, pathLength(path));
}

function samplePath(path: Point[], count: number) {
  const total = pathLength(path);
  return Array.from({ length: count }, (_, index) => pointAlongPath(path, total * ((index + 1) / (count + 1))));
}

function pointAlongPath(path: Point[], targetDistance: number): Point {
  let remaining = targetDistance;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = distance(path[index], path[index + 1]);
    if (remaining <= segment) {
      const progress = remaining / Math.max(0.001, segment);
      return { x: path[index].x + (path[index + 1].x - path[index].x) * progress, y: path[index].y + (path[index + 1].y - path[index].y) * progress };
    }
    remaining -= segment;
  }
  return path[path.length - 1];
}

function distanceToPath(point: Point, path: Point[]) {
  return Math.min(...path.slice(0, -1).map((start, index) => {
    const end = path[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const progress = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / Math.max(0.001, dx * dx + dy * dy), 0, 1);
    return distance(point, { x: start.x + dx * progress, y: start.y + dy * progress });
  }));
}

function projectileInterpolation(path: Point[], axis: "x" | "y", offset: number) {
  if (path.length === 3) {
    const bounceAt = pathSegmentProgress(path, 0);
    return { inputRange: [0, bounceAt, 1], outputRange: path.map((point) => `${point[axis] - offset}%`) };
  }
  return { inputRange: [0, 1], outputRange: path.map((point) => `${point[axis] - offset}%`) };
}

function percentPosition(x: number, y: number) {
  return { left: `${x}%` as DimensionValue, top: `${y}%` as DimensionValue };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  aimDot: { backgroundColor: "#ffffff", borderColor: "#67e8f9", borderRadius: 999, borderWidth: 1, height: 8, position: "absolute", shadowColor: "#22d3ee", shadowOpacity: 0.9, shadowRadius: 4, width: 8 },
  aimGuide: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  background: { flex: 1 },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,9,28,0.12)" },
  body: { color: "#dce9ff", fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  bubble: { aspectRatio: 1, backgroundColor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.82)", borderRadius: 999, borderWidth: 1.5, elevation: 4, overflow: "hidden", position: "absolute", shadowColor: "#020617", shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.36, shadowRadius: 4, width: "9.7%", zIndex: 5 },
  bubbleImage: { height: "100%", width: "100%" },
  closeButton: { alignItems: "center", backgroundColor: "#f8fbff", borderRadius: 10, height: 44, justifyContent: "center", width: 44 },
  closeText: { color: "#0b1638", fontSize: 24, fontWeight: "900" },
  controlHint: { alignSelf: "center", backgroundColor: "rgba(4,12,38,0.78)", borderRadius: 999, bottom: 4, paddingHorizontal: 12, paddingVertical: 5, position: "absolute", zIndex: 12 },
  controlHintText: { color: "#dce9ff", fontSize: 11, fontWeight: "900" },
  currentBubble: { bottom: 5, height: 60, position: "absolute", width: 60, zIndex: 9 },
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
  projectile: { aspectRatio: 1, position: "absolute", width: "9.7%", zIndex: 11 },
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

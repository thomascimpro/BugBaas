import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { GeneratedBugArtDefinition } from "../services/generatedBugArt";

type Props = {
  definition: GeneratedBugArtDefinition;
  size: number;
};

type PartProps = {
  style?: StyleProp<ViewStyle>;
};

function Part({ style }: PartProps) {
  return <View style={[styles.part, style]} />;
}

function Line({ color, height, left, rotate, top, width }: { color: string; height: number; left: number; rotate: string; top: number; width: number }) {
  return <Part style={{ backgroundColor: color, borderRadius: height / 2, height, left, top, transform: [{ rotate }], width }} />;
}

function renderWingPattern(definition: GeneratedBugArtDefinition, u: number, mirrored = false) {
  const side = mirrored ? -1 : 1;
  switch (definition.pattern) {
    case "eyes":
      return (
        <>
          <Part style={{ backgroundColor: definition.detail, borderRadius: 6 * u, height: 12 * u, left: (mirrored ? 68 : 20) * u, top: 34 * u, width: 12 * u }} />
          <Part style={{ backgroundColor: definition.accent, borderRadius: 3 * u, height: 6 * u, left: (mirrored ? 71 : 23) * u, top: 37 * u, width: 6 * u }} />
        </>
      );
    case "spots":
      return (
        <>
          <Part style={{ backgroundColor: definition.detail, borderRadius: 4 * u, height: 8 * u, left: (mirrored ? 72 : 20) * u, opacity: 0.9, top: 25 * u, width: 8 * u }} />
          <Part style={{ backgroundColor: definition.detail, borderRadius: 3 * u, height: 6 * u, left: (mirrored ? 65 : 29) * u, opacity: 0.75, top: 50 * u, width: 6 * u }} />
        </>
      );
    case "veins":
      return (
        <>
          <Line color={definition.detail} height={1.5 * u} left={(mirrored ? 61 : 25) * u} rotate={`${side * 28}deg`} top={34 * u} width={18 * u} />
          <Line color={definition.detail} height={1.2 * u} left={(mirrored ? 64 : 24) * u} rotate={`${side * -24}deg`} top={45 * u} width={17 * u} />
        </>
      );
    case "map":
      return (
        <>
          <Line color={definition.detail} height={2 * u} left={(mirrored ? 63 : 21) * u} rotate={`${side * 32}deg`} top={28 * u} width={18 * u} />
          <Line color={definition.detail} height={2 * u} left={(mirrored ? 66 : 18) * u} rotate={`${side * -38}deg`} top={44 * u} width={20 * u} />
          <Part style={{ backgroundColor: definition.detail, borderRadius: 2 * u, height: 5 * u, left: (mirrored ? 72 : 23) * u, top: 55 * u, width: 5 * u }} />
        </>
      );
    case "bands":
      return (
        <Line color={definition.detail} height={2.2 * u} left={(mirrored ? 62 : 21) * u} rotate={`${side * 20}deg`} top={39 * u} width={20 * u} />
      );
    default:
      return null;
  }
}

function ButterflyArt({ definition, size, moth = false }: Props & { moth?: boolean }) {
  const u = size / 100;
  const wingOpacity = moth ? 0.92 : 0.96;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      <View style={[styles.wing, { backgroundColor: definition.body, borderColor: definition.accent, borderRadius: moth ? 13 * u : 24 * u, borderWidth: 2 * u, height: (moth ? 42 : 50) * u, left: 9 * u, opacity: wingOpacity, top: (moth ? 29 : 18) * u, transform: [{ rotate: moth ? "-18deg" : "-25deg" }], width: (moth ? 37 : 40) * u }]} />
      <View style={[styles.wing, { backgroundColor: definition.body, borderColor: definition.accent, borderRadius: moth ? 13 * u : 24 * u, borderWidth: 2 * u, height: (moth ? 42 : 50) * u, opacity: wingOpacity, right: 9 * u, top: (moth ? 29 : 18) * u, transform: [{ rotate: moth ? "18deg" : "25deg" }], width: (moth ? 37 : 40) * u }]} />
      {!moth && (
        <>
          <Part style={{ backgroundColor: definition.accent, borderRadius: 16 * u, height: 33 * u, left: 16 * u, opacity: 0.9, top: 49 * u, transform: [{ rotate: "18deg" }], width: 29 * u }} />
          <Part style={{ backgroundColor: definition.accent, borderRadius: 16 * u, height: 33 * u, opacity: 0.9, right: 16 * u, top: 49 * u, transform: [{ rotate: "-18deg" }], width: 29 * u }} />
        </>
      )}
      {renderWingPattern(definition, u)}
      {renderWingPattern(definition, u, true)}
      <Part style={{ backgroundColor: definition.detail, borderRadius: 5 * u, height: 48 * u, left: 46 * u, top: 27 * u, width: 8 * u }} />
      <Part style={{ backgroundColor: definition.accent, borderRadius: 4 * u, height: 10 * u, left: 45 * u, top: 21 * u, width: 10 * u }} />
      <Line color={definition.detail} height={1.5 * u} left={42 * u} rotate="-48deg" top={15 * u} width={13 * u} />
      <Line color={definition.detail} height={1.5 * u} left={47 * u} rotate="48deg" top={15 * u} width={13 * u} />
    </View>
  );
}

function SilverfishArt({ definition, size }: Props) {
  const u = size / 100;
  return (
    <View style={[styles.canvas, { height: size, transform: [{ rotate: "-12deg" }], width: size }]}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Part key={index} style={{ backgroundColor: index % 2 ? definition.accent : definition.body, borderColor: definition.detail, borderRadius: (12 - index) * u, borderWidth: 0.8 * u, height: (25 - index * 2.5) * u, left: (37 + index * 3.3) * u, top: (15 + index * 11) * u, width: (27 - index * 2.8) * u }} />
      ))}
      <Line color={definition.detail} height={1.5 * u} left={26 * u} rotate="-50deg" top={9 * u} width={25 * u} />
      <Line color={definition.detail} height={1.5 * u} left={44 * u} rotate="50deg" top={6 * u} width={25 * u} />
      <Line color={definition.detail} height={1.5 * u} left={45 * u} rotate="75deg" top={76 * u} width={26 * u} />
      <Line color={definition.detail} height={1.5 * u} left={51 * u} rotate="90deg" top={78 * u} width={25 * u} />
      <Line color={definition.detail} height={1.5 * u} left={55 * u} rotate="105deg" top={76 * u} width={26 * u} />
    </View>
  );
}

function FlatBugArt({ definition, size }: Props) {
  const u = size / 100;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      {[22, 34, 46, 58, 70].flatMap((top, row) => [
        <Line key={`l-${row}`} color={definition.detail} height={2 * u} left={18 * u} rotate={row < 2 ? "-25deg" : "25deg"} top={top * u} width={25 * u} />,
        <Line key={`r-${row}`} color={definition.detail} height={2 * u} left={57 * u} rotate={row < 2 ? "25deg" : "-25deg"} top={top * u} width={25 * u} />
      ])}
      <View style={[styles.shell, { backgroundColor: definition.body, borderColor: definition.detail, borderRadius: 28 * u, borderWidth: 2 * u, height: 65 * u, left: 27 * u, top: 18 * u, width: 46 * u }]}>
        {[1, 2, 3, 4].map((index) => <Part key={index} style={{ backgroundColor: definition.accent, height: 2 * u, left: 4 * u, opacity: 0.75, top: index * 11 * u, width: 34 * u }} />)}
      </View>
      <Part style={{ backgroundColor: definition.detail, borderRadius: 9 * u, height: 14 * u, left: 41 * u, top: 12 * u, width: 18 * u }} />
    </View>
  );
}

function FlyArt({ definition, size, bee = false, wasp = false }: Props & { bee?: boolean; wasp?: boolean }) {
  const u = size / 100;
  const fuzzy = bee;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      <Part style={{ backgroundColor: "#dff1ef", borderColor: definition.accent, borderRadius: 22 * u, borderWidth: 1.2 * u, height: 38 * u, left: 15 * u, opacity: 0.72, top: 25 * u, transform: [{ rotate: "-28deg" }], width: 34 * u }} />
      <Part style={{ backgroundColor: "#dff1ef", borderColor: definition.accent, borderRadius: 22 * u, borderWidth: 1.2 * u, height: 38 * u, opacity: 0.72, right: 15 * u, top: 25 * u, transform: [{ rotate: "28deg" }], width: 34 * u }} />
      {[28, 45, 61].flatMap((top, index) => [
        <Line key={`l-${index}`} color={definition.detail} height={2 * u} left={20 * u} rotate={index === 0 ? "-32deg" : "25deg"} top={top * u} width={27 * u} />,
        <Line key={`r-${index}`} color={definition.detail} height={2 * u} left={53 * u} rotate={index === 0 ? "32deg" : "-25deg"} top={top * u} width={27 * u} />
      ])}
      <View style={[styles.shell, { backgroundColor: definition.body, borderColor: definition.detail, borderRadius: fuzzy ? 18 * u : 13 * u, borderWidth: 1.5 * u, height: (wasp ? 52 : 48) * u, left: 38 * u, top: 30 * u, width: 24 * u }]}>
        {(definition.pattern === "bands" || wasp || bee) && [1, 2, 3].map((index) => <Part key={index} style={{ backgroundColor: definition.accent, height: (fuzzy ? 5 : 4) * u, left: 1 * u, top: index * 10 * u, width: 20 * u }} />)}
      </View>
      <Part style={{ backgroundColor: definition.detail, borderRadius: 11 * u, height: 20 * u, left: 39 * u, top: 20 * u, width: 22 * u }} />
      <Part style={{ backgroundColor: definition.accent, borderRadius: 5 * u, height: 8 * u, left: 40 * u, top: 24 * u, width: 8 * u }} />
      <Part style={{ backgroundColor: definition.accent, borderRadius: 5 * u, height: 8 * u, left: 52 * u, top: 24 * u, width: 8 * u }} />
      <Line color={definition.detail} height={1.4 * u} left={36 * u} rotate="-48deg" top={13 * u} width={16 * u} />
      <Line color={definition.detail} height={1.4 * u} left={48 * u} rotate="48deg" top={13 * u} width={16 * u} />
    </View>
  );
}

function SpiderArt({ definition, size, longLegs = false }: Props & { longLegs?: boolean }) {
  const u = size / 100;
  const legLength = longLegs ? 43 : 32;
  const legColor = definition.detail;
  const legs = [
    { left: longLegs ? 7 : 13, top: 24, rotate: "-38deg" },
    { left: longLegs ? 4 : 11, top: 39, rotate: "-12deg" },
    { left: longLegs ? 7 : 13, top: 57, rotate: "20deg" },
    { left: longLegs ? 13 : 18, top: 70, rotate: "42deg" },
    { left: longLegs ? 50 : 55, top: 24, rotate: "38deg" },
    { left: longLegs ? 53 : 57, top: 39, rotate: "12deg" },
    { left: longLegs ? 50 : 55, top: 57, rotate: "-20deg" },
    { left: longLegs ? 44 : 50, top: 70, rotate: "-42deg" }
  ];
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      {legs.map((leg, index) => <Line key={index} color={legColor} height={(longLegs ? 1.3 : 2.2) * u} left={leg.left * u} rotate={leg.rotate} top={leg.top * u} width={legLength * u} />)}
      <Part style={{ backgroundColor: definition.body, borderColor: definition.detail, borderRadius: 22 * u, borderWidth: 1.5 * u, height: 40 * u, left: 34 * u, top: 42 * u, width: 32 * u }} />
      <Part style={{ backgroundColor: definition.accent, borderColor: definition.detail, borderRadius: 14 * u, borderWidth: 1.5 * u, height: 24 * u, left: 38 * u, top: 25 * u, width: 24 * u }} />
      {definition.pattern === "stripes" && [0, 1, 2].map((index) => <Part key={index} style={{ backgroundColor: definition.accent, height: 2.5 * u, left: 39 * u, top: (52 + index * 8) * u, width: 22 * u }} />)}
      {definition.pattern === "map" && <Line color={definition.detail} height={2 * u} left={38 * u} rotate="35deg" top={58 * u} width={24 * u} />}
      <Part style={{ backgroundColor: definition.detail, borderRadius: 2 * u, height: 4 * u, left: 42 * u, top: 31 * u, width: 4 * u }} />
      <Part style={{ backgroundColor: definition.detail, borderRadius: 2 * u, height: 4 * u, left: 54 * u, top: 31 * u, width: 4 * u }} />
    </View>
  );
}

function MiteArt({ definition, size }: Props) {
  const u = size / 100;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      <Part style={{ borderColor: definition.accent, borderRadius: 39 * u, borderWidth: 1.2 * u, height: 78 * u, left: 11 * u, opacity: 0.38, top: 11 * u, transform: [{ rotate: "18deg" }], width: 78 * u }} />
      {[18, 31, 56, 69].flatMap((top, index) => [
        <Line key={`l-${index}`} color={definition.detail} height={2 * u} left={18 * u} rotate={index < 2 ? "-30deg" : "30deg"} top={top * u} width={28 * u} />,
        <Line key={`r-${index}`} color={definition.detail} height={2 * u} left={54 * u} rotate={index < 2 ? "30deg" : "-30deg"} top={top * u} width={28 * u} />
      ])}
      <Part style={{ backgroundColor: definition.body, borderColor: definition.detail, borderRadius: 24 * u, borderWidth: 2 * u, height: 48 * u, left: 30 * u, top: 27 * u, width: 40 * u }} />
      {[0, 1, 2].map((index) => <Part key={index} style={{ backgroundColor: definition.accent, borderRadius: 4 * u, height: 8 * u, left: (37 + index * 9) * u, top: (39 + (index % 2) * 13) * u, width: 8 * u }} />)}
    </View>
  );
}

function FluffyArt({ definition, size }: Props) {
  const u = size / 100;
  const tufts = [
    [30, 30, 24], [47, 24, 26], [61, 33, 23], [25, 48, 25], [43, 43, 30], [61, 50, 25], [31, 63, 24], [50, 62, 28]
  ];
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      {tufts.map(([left, top, diameter], index) => <Part key={index} style={{ backgroundColor: index % 2 ? definition.body : definition.accent, borderColor: definition.detail, borderRadius: diameter * u / 2, borderWidth: 0.7 * u, height: diameter * u, left: left * u, top: top * u, width: diameter * u }} />)}
      <Part style={{ backgroundColor: definition.detail, borderRadius: 5 * u, height: 10 * u, left: 45 * u, top: 44 * u, width: 10 * u }} />
    </View>
  );
}

function SpringtailArt({ definition, size }: Props) {
  const u = size / 100;
  return (
    <View style={[styles.canvas, { height: size, transform: [{ rotate: "-18deg" }], width: size }]}>
      {[0, 1, 2, 3].map((index) => <Part key={index} style={{ backgroundColor: index % 2 ? definition.accent : definition.body, borderColor: definition.detail, borderRadius: 10 * u, borderWidth: 0.8 * u, height: (20 - index * 2) * u, left: (30 + index * 11) * u, top: (36 + index * 5) * u, width: (22 - index * 2) * u }} />)}
      <Line color={definition.detail} height={1.5 * u} left={21 * u} rotate="-38deg" top={25 * u} width={27 * u} />
      <Line color={definition.detail} height={1.5 * u} left={32 * u} rotate="35deg" top={22 * u} width={27 * u} />
      <Line color={definition.detail} height={2 * u} left={54 * u} rotate="58deg" top={58 * u} width={32 * u} />
      <Line color={definition.detail} height={2 * u} left={59 * u} rotate="-58deg" top={58 * u} width={32 * u} />
    </View>
  );
}

function SegmentedArt({ definition, size, kind }: Props & { kind: "millipede" | "isopod" | "caterpillar" | "grub" | "worm" }) {
  const u = size / 100;
  if (kind === "isopod") {
    return (
      <View style={[styles.canvas, { height: size, width: size }]}>
        <View style={[styles.shell, { backgroundColor: definition.body, borderColor: definition.detail, borderRadius: 29 * u, borderWidth: 2 * u, height: 58 * u, left: 21 * u, top: 22 * u, transform: [{ rotate: "-8deg" }], width: 58 * u }]}>
          {[1, 2, 3, 4, 5].map((index) => <Part key={index} style={{ backgroundColor: definition.accent, height: 3 * u, left: 5 * u, opacity: 0.85, top: index * 8.5 * u, width: 44 * u }} />)}
        </View>
        {[30, 42, 54, 66].flatMap((top, index) => [
          <Line key={`l-${index}`} color={definition.detail} height={1.6 * u} left={14 * u} rotate="-25deg" top={top * u} width={18 * u} />,
          <Line key={`r-${index}`} color={definition.detail} height={1.6 * u} left={68 * u} rotate="25deg" top={top * u} width={18 * u} />
        ])}
      </View>
    );
  }

  const count = kind === "millipede" ? 10 : kind === "worm" ? 8 : 7;
  const startX = kind === "grub" ? 24 : 13;
  const step = kind === "millipede" ? 7 : kind === "worm" ? 9 : 10;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      {Array.from({ length: count }, (_, index) => {
        const curve = kind === "grub" ? Math.abs(index - count / 2) * 4 : Math.sin(index * 0.9) * (kind === "worm" ? 8 : 5);
        const diameter = kind === "millipede" ? 18 : kind === "worm" ? 19 : 23;
        return (
          <React.Fragment key={index}>
            <Part style={{ backgroundColor: index % 2 ? definition.accent : definition.body, borderColor: definition.detail, borderRadius: diameter * u / 2, borderWidth: 0.8 * u, height: diameter * u, left: (startX + index * step) * u, top: (43 + curve) * u, width: diameter * u }} />
            {(kind === "millipede" || kind === "caterpillar") && (
              <>
                <Line color={definition.detail} height={1.2 * u} left={(startX + index * step + 2) * u} rotate="48deg" top={(56 + curve) * u} width={10 * u} />
                <Line color={definition.detail} height={1.2 * u} left={(startX + index * step + 7) * u} rotate="-48deg" top={(56 + curve) * u} width={10 * u} />
              </>
            )}
          </React.Fragment>
        );
      })}
      {kind !== "worm" && <Part style={{ backgroundColor: definition.detail, borderRadius: 5 * u, height: 9 * u, left: (startX + 3) * u, top: 47 * u, width: 9 * u }} />}
    </View>
  );
}

function BeetleArt({ definition, size }: Props) {
  const u = size / 100;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      {[25, 46, 66].flatMap((top, index) => [
        <Line key={`l-${index}`} color={definition.detail} height={2 * u} left={15 * u} rotate={index === 0 ? "-35deg" : "28deg"} top={top * u} width={28 * u} />,
        <Line key={`r-${index}`} color={definition.detail} height={2 * u} left={57 * u} rotate={index === 0 ? "35deg" : "-28deg"} top={top * u} width={28 * u} />
      ])}
      <Part style={{ backgroundColor: definition.body, borderColor: definition.detail, borderRadius: 24 * u, borderWidth: 2 * u, height: 58 * u, left: 29 * u, top: 27 * u, width: 42 * u }} />
      <Line color={definition.detail} height={2 * u} left={49 * u} rotate="90deg" top={34 * u} width={44 * u} />
      <Part style={{ backgroundColor: definition.accent, borderRadius: 12 * u, height: 22 * u, left: 38 * u, top: 17 * u, width: 24 * u }} />
      <Line color={definition.detail} height={1.4 * u} left={35 * u} rotate="-48deg" top={10 * u} width={18 * u} />
      <Line color={definition.detail} height={1.4 * u} left={47 * u} rotate="48deg" top={10 * u} width={18 * u} />
    </View>
  );
}

function MolluskArt({ definition, size, shell = false }: Props & { shell?: boolean }) {
  const u = size / 100;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      <Part style={{ backgroundColor: definition.body, borderColor: definition.detail, borderRadius: 20 * u, borderWidth: 1.2 * u, height: 28 * u, left: 18 * u, top: 55 * u, transform: [{ rotate: "-6deg" }], width: 66 * u }} />
      <Part style={{ backgroundColor: definition.accent, borderRadius: 13 * u, height: 24 * u, left: 63 * u, top: 45 * u, width: 21 * u }} />
      <Line color={definition.detail} height={1.5 * u} left={68 * u} rotate="-55deg" top={33 * u} width={22 * u} />
      <Line color={definition.detail} height={1.5 * u} left={72 * u} rotate="55deg" top={33 * u} width={22 * u} />
      <Part style={{ backgroundColor: definition.detail, borderRadius: 2 * u, height: 4 * u, left: 65 * u, top: 34 * u, width: 4 * u }} />
      <Part style={{ backgroundColor: definition.detail, borderRadius: 2 * u, height: 4 * u, left: 88 * u, top: 34 * u, width: 4 * u }} />
      {shell && (
        <View style={[styles.shell, { backgroundColor: definition.accent, borderColor: definition.detail, borderRadius: 24 * u, borderWidth: 2 * u, height: 48 * u, left: 22 * u, top: 25 * u, width: 48 * u }]}>
          <Part style={{ borderColor: definition.detail, borderRadius: 16 * u, borderWidth: 2 * u, height: 31 * u, left: 7 * u, top: 7 * u, width: 31 * u }} />
          <Part style={{ borderColor: definition.detail, borderRadius: 8 * u, borderWidth: 2 * u, height: 15 * u, left: 15 * u, top: 15 * u, width: 15 * u }} />
        </View>
      )}
    </View>
  );
}

export function GeneratedBugArt({ definition, size }: Props) {
  const glow = definition.glow;
  return (
    <View style={[styles.canvas, { height: size, width: size }]}>
      {glow ? <Part style={{ backgroundColor: glow, borderRadius: size * 0.38, height: size * 0.76, left: size * 0.12, opacity: 0.15, top: size * 0.12, width: size * 0.76 }} /> : null}
      {definition.kind === "butterfly" ? <ButterflyArt definition={definition} size={size} /> : null}
      {definition.kind === "moth" ? <ButterflyArt definition={definition} moth size={size} /> : null}
      {definition.kind === "silverfish" ? <SilverfishArt definition={definition} size={size} /> : null}
      {definition.kind === "flatBug" ? <FlatBugArt definition={definition} size={size} /> : null}
      {definition.kind === "fly" ? <FlyArt definition={definition} size={size} /> : null}
      {definition.kind === "bee" ? <FlyArt bee definition={definition} size={size} /> : null}
      {definition.kind === "wasp" ? <FlyArt definition={definition} size={size} wasp /> : null}
      {definition.kind === "spider" ? <SpiderArt definition={definition} size={size} /> : null}
      {definition.kind === "cellarSpider" ? <SpiderArt definition={definition} longLegs size={size} /> : null}
      {definition.kind === "mite" ? <MiteArt definition={definition} size={size} /> : null}
      {definition.kind === "fluffy" ? <FluffyArt definition={definition} size={size} /> : null}
      {definition.kind === "springtail" ? <SpringtailArt definition={definition} size={size} /> : null}
      {definition.kind === "millipede" ? <SegmentedArt definition={definition} kind="millipede" size={size} /> : null}
      {definition.kind === "isopod" ? <SegmentedArt definition={definition} kind="isopod" size={size} /> : null}
      {definition.kind === "caterpillar" ? <SegmentedArt definition={definition} kind="caterpillar" size={size} /> : null}
      {definition.kind === "grub" ? <SegmentedArt definition={definition} kind="grub" size={size} /> : null}
      {definition.kind === "worm" ? <SegmentedArt definition={definition} kind="worm" size={size} /> : null}
      {definition.kind === "beetle" ? <BeetleArt definition={definition} size={size} /> : null}
      {definition.kind === "slug" ? <MolluskArt definition={definition} size={size} /> : null}
      {definition.kind === "snail" ? <MolluskArt definition={definition} shell size={size} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    position: "relative"
  },
  part: {
    position: "absolute"
  },
  shell: {
    overflow: "hidden",
    position: "absolute"
  },
  wing: {
    elevation: 2,
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 2
  }
});

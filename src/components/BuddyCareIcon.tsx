import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { BuddyCareAction } from "../services/bugBuddyService";

type Props = {
  action: BuddyCareAction;
  disabled?: boolean;
  size?: number;
};

const actionButtonImage = require("../../assets/buddy/kenney/ui/buddy_round_button.png");

const actionColors: Record<BuddyCareAction, string> = {
  adventure: "#f59f00",
  clean: "#38bdf8",
  feed: "#69c88d",
  play: "#d7bd57",
  train: "#9c36b5"
};

export function BuddyCareIcon({ action, disabled = false, size = 34 }: Props) {
  const color = actionColors[action];
  return (
    <ImageBackground imageStyle={styles.buttonImage} resizeMode="stretch" source={actionButtonImage} style={[styles.shell, { borderColor: color, height: size, width: size }, disabled && styles.disabled]}>
      <View style={[styles.glow, { backgroundColor: color }]} />
      {action === "feed" && <FeedIcon color={color} />}
      {action === "play" && <PlayIcon color={color} />}
      {action === "train" && <TrainIcon color={color} />}
      {action === "clean" && <CleanIcon color={color} />}
      {action === "adventure" && <AdventureIcon color={color} />}
    </ImageBackground>
  );
}

function FeedIcon({ color }: { color: string }) {
  return (
    <View style={styles.feedBowl}>
      <View style={[styles.feedFill, { backgroundColor: color }]} />
      <View style={styles.feedDotRow}>
        <View style={[styles.feedDot, { backgroundColor: color }]} />
        <View style={[styles.feedDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function PlayIcon({ color }: { color: string }) {
  return (
    <View style={[styles.playBall, { borderColor: color }]}>
      <View style={[styles.playStripe, { backgroundColor: color }]} />
    </View>
  );
}

function TrainIcon({ color }: { color: string }) {
  return (
    <View style={styles.trainWrap}>
      <View style={[styles.trainBar, { backgroundColor: color }]} />
      <View style={[styles.trainWeight, { backgroundColor: color }]} />
      <View style={[styles.trainWeight, { backgroundColor: color }]} />
    </View>
  );
}

function CleanIcon({ color }: { color: string }) {
  return (
    <View style={styles.cleanWrap}>
      <View style={[styles.cleanBubbleLarge, { borderColor: color }]} />
      <View style={[styles.cleanBubbleSmall, { backgroundColor: color }]} />
      <View style={[styles.cleanSpark, { backgroundColor: color }]} />
    </View>
  );
}

function AdventureIcon({ color }: { color: string }) {
  return (
    <View style={styles.questWrap}>
      <Text style={[styles.questStar, { color }]}>★</Text>
      <View style={[styles.questPath, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonImage: { borderRadius: 999 },
  cleanBubbleLarge: { borderRadius: 999, borderWidth: 2, height: 16, position: "absolute", right: 2, top: 1, width: 16 },
  cleanBubbleSmall: { borderRadius: 999, height: 8, left: 3, position: "absolute", top: 10, width: 8 },
  cleanSpark: { borderRadius: 2, bottom: 2, height: 11, position: "absolute", transform: [{ rotate: "45deg" }], width: 3 },
  cleanWrap: { height: 24, position: "relative", width: 24 },
  disabled: { opacity: 0.48 },
  feedBowl: { alignItems: "center", borderBottomColor: "#f9fbf7", borderBottomWidth: 2, borderRadius: 9, height: 22, justifyContent: "flex-end", overflow: "hidden", width: 24 },
  feedDot: { borderRadius: 999, height: 4, width: 4 },
  feedDotRow: { flexDirection: "row", gap: 5, marginBottom: 3 },
  feedFill: { bottom: 0, height: 10, opacity: 0.65, position: "absolute", width: "100%" },
  glow: { borderRadius: 999, height: 22, opacity: 0.22, position: "absolute", width: 22 },
  playBall: { alignItems: "center", borderRadius: 999, borderWidth: 3, height: 23, justifyContent: "center", overflow: "hidden", width: 23 },
  playStripe: { height: 4, transform: [{ rotate: "-28deg" }], width: 30 },
  questPath: { borderRadius: 999, bottom: 1, height: 3, opacity: 0.75, position: "absolute", width: 22 },
  questStar: { fontSize: 20, fontWeight: "900", marginTop: -2 },
  questWrap: { alignItems: "center", height: 24, justifyContent: "center", width: 24 },
  shell: { alignItems: "center", borderRadius: 999, borderWidth: 2, justifyContent: "center", overflow: "hidden" },
  trainBar: { borderRadius: 999, height: 4, position: "absolute", top: 10, width: 24 },
  trainWeight: { borderRadius: 3, height: 16, position: "absolute", top: 4, width: 6 },
  trainWrap: { alignItems: "center", height: 24, justifyContent: "center", width: 26 }
});

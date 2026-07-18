import React from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
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

const actionImages: Record<BuddyCareAction, number> = {
  adventure: require("../../assets/buddy/kenney/state/buddy_state_swarm.png"),
  clean: require("../../assets/buddy/kenney/state/buddy_state_clean.png"),
  feed: require("../../assets/buddy/kenney/state/buddy_state_nectar.png"),
  play: require("../../assets/buddy/kenney/state/buddy_state_leaf.png"),
  train: require("../../assets/buddy/kenney/state/buddy_state_dig.png")
};

export function BuddyCareIcon({ action, disabled = false, size = 34 }: Props) {
  const color = actionColors[action];
  return (
    <ImageBackground imageStyle={styles.buttonImage} resizeMode="stretch" source={actionButtonImage} style={[styles.shell, { borderColor: color, height: size, width: size }, disabled && styles.disabled]}>
      <View style={[styles.glow, { backgroundColor: color }]} />
      <Image accessibilityIgnoresInvertColors source={actionImages[action]} style={[styles.actionImage, { height: size * 0.68, width: size * 0.68 }]} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  actionImage: { zIndex: 1 },
  buttonImage: { borderRadius: 999 },
  disabled: { opacity: 0.48 },
  glow: { borderRadius: 999, height: 22, opacity: 0.22, position: "absolute", width: 22 },
  shell: { alignItems: "center", borderRadius: 999, borderWidth: 2, justifyContent: "center", overflow: "hidden" },
});

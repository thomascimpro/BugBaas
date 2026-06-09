import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "../services/i18n";
import { type UserTier } from "../services/pointsService";
import { playBugSound } from "../services/soundService";
import { BugArtImage } from "./BugArtImage";

type Props = {
  tier: UserTier | null;
  onClose: () => void;
};

export function RankUpModal({ tier, onClose }: Props) {
  const { t, tr } = useI18n();
  const scale = useRef(new Animated.Value(0.84)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!tier) return;
    playBugSound("bug_rare_unlock");
    scale.setValue(0.84);
    glow.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { friction: 5, tension: 90, toValue: 1, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { duration: 780, toValue: 1, useNativeDriver: true }),
          Animated.timing(glow, { duration: 780, toValue: 0, useNativeDriver: true })
        ]),
        { iterations: 2 }
      )
    ]).start();
  }, [glow, scale, tier]);

  if (!tier) return null;

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.34, 0.72] });

  return (
    <Modal transparent animationType="fade" visible={Boolean(tier)} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { borderColor: tier.frameColor, transform: [{ scale }] }]}>
          <View style={[styles.topBar, { backgroundColor: tier.frameColor }]} />
          <Text style={[styles.kicker, { color: tier.frameColor }]}>{t("rankup.kicker")}</Text>
          <Text style={styles.title}>{tr(tier.title)}</Text>
          <View style={[styles.stage, { backgroundColor: tier.frameBackground }]}>
            <Animated.View style={[styles.glow, { backgroundColor: tier.frameAccent, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
            <BugArtImage bugId={tier.bugArtId} fallbackLevel={tier.evolutionLevel} fallbackVariant={tier.insect} size={Math.max(96, tier.bugSize)} />
          </View>
          <Text style={styles.body}>{t("rankup.body", { points: tier.minPoints })}</Text>
          <Text style={[styles.reward, { color: tier.frameColor }]}>{tr(tier.rewardText)}</Text>
          <Pressable style={[styles.button, { backgroundColor: tier.frameColor }]} onPress={onClose}>
            <Text style={styles.buttonText}>{t("rankup.close")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(16,32,24,0.6)",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  card: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderRadius: 8,
    borderWidth: 3,
    maxWidth: 440,
    overflow: "hidden",
    padding: 22,
    width: "100%"
  },
  topBar: {
    height: 8,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  kicker: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
    textTransform: "uppercase"
  },
  title: {
    color: "#102018",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center"
  },
  stage: {
    alignItems: "center",
    borderRadius: 8,
    height: 168,
    justifyContent: "center",
    marginTop: 14,
    overflow: "hidden",
    width: 168
  },
  glow: {
    borderRadius: 80,
    height: 160,
    position: "absolute",
    width: 160
  },
  body: {
    color: "#53645d",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 14,
    textAlign: "center"
  },
  reward: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center"
  },
  button: {
    alignItems: "center",
    borderRadius: 8,
    marginTop: 18,
    minWidth: 160,
    paddingHorizontal: 22,
    paddingVertical: 13
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900"
  }
});

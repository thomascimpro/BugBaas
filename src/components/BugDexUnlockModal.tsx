import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BugDexDropResult } from "../services/bugDexService";
import { bugDexFacts, BugDexRarity } from "../services/pointsService";
import { BugArtImage } from "./BugArtImage";

type Props = {
  drop: BugDexDropResult | null;
  onClose: () => void;
};

const rarityColors: Record<BugDexRarity, string> = {
  Gewoon: "#6f7f5f",
  Zeldzaam: "#15724f",
  Episch: "#356d7c",
  Legendarisch: "#b83227"
};

export function BugDexUnlockModal({ drop, onClose }: Props) {
  const scale = useRef(new Animated.Value(0.82)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!drop) return;
    scale.setValue(0.82);
    glow.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        friction: 5,
        tension: 95,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { duration: 760, toValue: 1, useNativeDriver: true }),
          Animated.timing(glow, { duration: 760, toValue: 0, useNativeDriver: true })
        ]),
        { iterations: 2 }
      )
    ]).start();
  }, [drop, glow, scale]);

  if (!drop) return null;
  const isPointsReward = drop.rewardType === "points";
  const isDailyReward = drop.source === "daily_login";
  const rarityColor = isPointsReward ? "#d7bd57" : rarityColors[drop.entry.rarity];
  const bugFact = isPointsReward ? "Daily login" : bugDexFacts[drop.entry.id] ?? drop.entry.note;
  const title = isDailyReward ? "Daily bonus" : drop.source === "combine" ? "Combine gelukt" : drop.isNew ? "Bug unlocked" : "Dubbele bug";
  const subtitle = isPointsReward
    ? `+${drop.points} punten`
    : drop.source === "combine" && drop.isNew
      ? "Nieuwe vondst gemaakt"
      : drop.isNew
        ? "Nieuw in je BugDex"
        : "Extra exemplaar";
  const streakText = isDailyReward && drop.streakDay
    ? `Dag ${drop.streakDay} streak - nog ${drop.daysUntilBetterReward ?? 0} dagen voor betere reward`
    : "";
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Modal transparent animationType="fade" visible={Boolean(drop)} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { borderColor: rarityColor, transform: [{ scale }] }]}>
          <Text style={styles.kicker}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.artStage}>
            <Animated.View style={[styles.glow, { backgroundColor: rarityColor, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
            {isPointsReward ? <Text style={styles.pointsReward}>+{drop.points}</Text> : <BugArtImage bugId={drop.entry.id} size={138} />}
          </View>
          <Text style={styles.name}>{isPointsReward ? "Punten gevonden" : drop.entry.name}</Text>
          <Text style={styles.meta}>{bugFact}</Text>
          {!!streakText && <Text style={styles.streak}>{streakText}</Text>}
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Mooi</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(16,32,24,0.58)",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  card: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#d7bd57",
    borderRadius: 8,
    borderWidth: 2,
    padding: 22,
    width: "100%"
  },
  kicker: {
    color: "#15724f",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  subtitle: {
    color: "#53645d",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10
  },
  artStage: {
    alignItems: "center",
    height: 156,
    justifyContent: "center",
    width: 156
  },
  glow: {
    backgroundColor: "#d7bd57",
    borderRadius: 78,
    height: 156,
    position: "absolute",
    width: 156
  },
  name: {
    color: "#102018",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center"
  },
  meta: {
    color: "#53645d",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4
  },
  pointsReward: {
    color: "#102018",
    fontSize: 54,
    fontWeight: "900"
  },
  streak: {
    color: "#15724f",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center"
  },
  button: {
    alignItems: "center",
    backgroundColor: "#15724f",
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 28,
    paddingVertical: 14
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900"
  }
});

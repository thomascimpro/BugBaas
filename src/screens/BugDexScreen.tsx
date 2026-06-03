import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { InsectIllustration } from "../components/InsectIllustration";
import { bugDexEntries, BugDexRarity, isBugDexEntryUnlocked, unlockedBugDexCount } from "../services/pointsService";
import { User } from "../types";
import { sharedStyles } from "./sharedStyles";

const bugDexRanksImage = require("../../assets/generated/bugbaas-bugdex-ranks-hd.png");

type Props = {
  user: User;
  onBack: () => void;
};

const rarityColors: Record<BugDexRarity, string> = {
  Gewoon: "#6f7f5f",
  Zeldzaam: "#15724f",
  Episch: "#356d7c",
  Legendarisch: "#b83227"
};

export function BugDexScreen({ user, onBack }: Props) {
  const unlockedCount = unlockedBugDexCount(user);
  const totalCount = bugDexEntries.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  return (
    <ScrollView contentContainerStyle={styles.content} style={sharedStyles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[sharedStyles.title, styles.headerTitle]}>BugDex</Text>
          <Text style={styles.headerMeta}>{unlockedCount}/{totalCount} ontdekt - {progress}%</Text>
        </View>
        <InsectIllustration size={66} variant="ladybug" evolutionLevel={5} />
      </View>

      <View style={styles.banner}>
        <Image accessibilityLabel="BugDex ranks" resizeMode="cover" source={bugDexRanksImage} style={styles.bannerImage} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryValue}>{user.totalPoints}</Text>
          <Text style={styles.summaryLabel}>punten</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryValue}>{user.bugCount}</Text>
          <Text style={styles.summaryLabel}>bugs</Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryValue}>{totalCount - unlockedCount}</Text>
          <Text style={styles.summaryLabel}>te gaan</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {bugDexEntries.map((entry, index) => {
          const unlocked = isBugDexEntryUnlocked(entry, user);
          const color = rarityColors[entry.rarity];
          return (
            <View key={entry.id} style={[styles.card, unlocked && { borderColor: color }, !unlocked && styles.lockedCard]}>
              <View style={styles.cardTop}>
                <View style={[styles.numberPill, unlocked && { backgroundColor: color }]}>
                  <Text style={styles.numberText}>{String(index + 1).padStart(2, "0")}</Text>
                </View>
                <Text style={[styles.rarity, { color }]}>{entry.rarity}</Text>
              </View>
              <View style={styles.bugWrap}>
                <InsectIllustration size={unlocked ? 58 : 46} variant={entry.insect} evolutionLevel={unlocked ? entry.evolutionLevel : 1} />
                {!unlocked && <View style={styles.lockOverlay}><Text style={styles.lockText}>?</Text></View>}
              </View>
              <Text style={[styles.name, !unlocked && styles.lockedText]}>{unlocked ? entry.name : "Onbekende bug"}</Text>
              <Text style={[styles.title, !unlocked && styles.lockedText]}>{unlocked ? entry.title : `${entry.minPoints} pt - ${entry.minBugs} bugs`}</Text>
              <Text style={styles.note}>{unlocked ? entry.note : "Nog niet gevangen."}</Text>
            </View>
          );
        })}
      </View>

      <Pressable style={sharedStyles.secondaryButton} onPress={onBack}>
        <Text style={sharedStyles.secondaryButtonText}>Terug</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120
  },
  header: {
    alignItems: "center",
    backgroundColor: "#102018",
    borderColor: "#294338",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 14
  },
  banner: {
    borderColor: "#d7e1d9",
    borderRadius: 8,
    borderWidth: 1,
    height: 142,
    marginBottom: 12,
    overflow: "hidden"
  },
  bannerImage: {
    height: "100%",
    width: "100%"
  },
  headerText: {
    flex: 1
  },
  headerTitle: {
    color: "#ffffff"
  },
  headerMeta: {
    color: "#dce9df",
    fontSize: 14,
    fontWeight: "900"
  },
  progressTrack: {
    backgroundColor: "#dbe8de",
    borderRadius: 8,
    height: 12,
    marginBottom: 12,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: "#15724f",
    height: "100%"
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  summaryTile: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#d7e1d9",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 10
  },
  summaryValue: {
    color: "#102018",
    fontSize: 20,
    fontWeight: "900"
  },
  summaryLabel: {
    color: "#52665d",
    fontSize: 12,
    fontWeight: "900"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  card: {
    backgroundColor: "#fdfefb",
    borderColor: "#d7e1d9",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 218,
    padding: 10,
    width: "48%"
  },
  lockedCard: {
    backgroundColor: "#eef4ed",
    opacity: 0.82
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  numberPill: {
    backgroundColor: "#87958e",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  numberText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  },
  rarity: {
    fontSize: 11,
    fontWeight: "900"
  },
  bugWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    minHeight: 62
  },
  lockOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(16,32,24,0.62)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    width: 40
  },
  lockText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900"
  },
  name: {
    color: "#102018",
    fontSize: 15,
    fontWeight: "900"
  },
  title: {
    color: "#52665d",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2
  },
  note: {
    color: "#6d7b73",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 7
  },
  lockedText: {
    color: "#52665d"
  }
});

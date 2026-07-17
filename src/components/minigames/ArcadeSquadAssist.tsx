import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { activeBugSquadBonusList, bugSquadAttackKindForCategory } from "../../services/bugSquadService";
import { BugDexRarity, bugDexEntries } from "../../services/pointsService";
import { User } from "../../types";
import { BugJarArt } from "../BugJarArt";

type Props = {
  compact?: boolean;
  label: string;
  user: Pick<User, "activeBugSquad">;
};

const rarityColors: Record<BugDexRarity, string> = {
  Gewoon: "#2f9e44",
  Zeldzaam: "#228be6",
  Episch: "#9c36b5",
  Legendarisch: "#f59f00",
  Mythisch: "#ef4444"
};

const entryById = new Map(bugDexEntries.map((entry) => [entry.id, entry]));

export function ArcadeSquadAssist({ compact = false, label, user }: Props) {
  const bonuses = activeBugSquadBonusList(user);

  if (!bonuses.length) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      <View style={styles.jars}>
        {bonuses.map((bonus) => {
          const entry = entryById.get(bonus.bugId);
          const kind = bugSquadAttackKindForCategory(bonus.category);
          return (
            <View key={bonus.bugId} style={[styles.jarSlot, compact && styles.jarSlotCompact, { borderColor: rarityColors[bonus.rarity] }]}>
              <BugJarArt bugId={bonus.bugId} rarity={bonus.rarity} size={compact ? 30 : 44} />
              <Text style={[styles.kind, compact && styles.kindCompact]} numberOfLines={1}>{kind}</Text>
              {!compact && entry ? <Text style={styles.name} numberOfLines={1}>{entry.name}</Text> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  jarSlot: {
    alignItems: "center",
    backgroundColor: "rgba(249,251,247,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: 0,
    padding: 5
  },
  jarSlotCompact: {
    flex: 0,
    minWidth: 48,
    padding: 3
  },
  jars: {
    flexDirection: "row",
    gap: 6
  },
  kind: {
    color: "#d7bd57",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  kindCompact: {
    fontSize: 8
  },
  label: {
    color: "#f9fbf7",
    fontSize: 12,
    fontWeight: "900"
  },
  labelCompact: {
    fontSize: 10
  },
  name: {
    color: "#a9b8ae",
    fontSize: 9,
    fontWeight: "800",
    maxWidth: 62
  },
  wrap: {
    backgroundColor: "rgba(16,32,24,0.78)",
    borderColor: "rgba(215,189,87,0.42)",
    borderRadius: 10,
    borderWidth: 1,
    gap: 7,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 8
  },
  wrapCompact: {
    backgroundColor: "rgba(16,32,24,0.58)",
    gap: 4,
    marginHorizontal: 0,
    marginTop: 0,
    padding: 5
  }
});

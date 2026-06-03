import React, { useEffect, useState } from "react";
import { DimensionValue, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RouteName } from "../../App";
import { BugArtImage } from "../components/BugArtImage";
import { TierBadge } from "../components/TierBadge";
import { listBugs } from "../services/bugService";
import { entryByBugId, listBugDexInventory } from "../services/bugDexService";
import { BugDexEntry, bugDexEntries, getTierForPoints, userTiers } from "../services/pointsService";
import { listUsers } from "../services/userService";
import { weeklyMissionLabel, weeklyMissionSet } from "../services/weeklyMissionService";
import { BugDexInventoryItem, BugReport, User } from "../types";
import { sharedStyles } from "./sharedStyles";

type Props = {
  user: User;
  onNavigate: (route: RouteName) => void;
};

export function HomeScreen({ user, onNavigate }: Props) {
  const tier = getTierForPoints(user.totalPoints);
  const [users, setUsers] = useState<User[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [inventory, setInventory] = useState<BugDexInventoryItem[]>([]);
  const leaders = users.slice(0, 3);
  const userRank = Math.max(1, users.findIndex((item) => item.uid === user.uid) + 1);
  const dexCount = inventory.length;
  const dexPreviewEntries = inventory.slice(0, 3).map((item) => entryByBugId(item.bugId)).filter((entry): entry is BugDexEntry => Boolean(entry));
  const missions = weeklyMissionSet(user, bugs);

  useEffect(() => {
    listUsers().then(setUsers);
    listBugs().then(setBugs);
    listBugDexInventory(user).then(setInventory);
  }, [user.uid, user.totalPoints]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={sharedStyles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <View style={styles.heroNameRow}>
            <Text style={[sharedStyles.title, styles.heroTitle]} numberOfLines={1}>{user.displayName}</Text>
            <Pressable style={styles.profilePill} onPress={() => onNavigate("profile")}>
              <Text style={styles.profileText}>Profiel</Text>
            </Pressable>
          </View>
          <Text style={styles.scoreText}>{user.title}</Text>
        </View>
        <BugArtImage bugId={tier.bugArtId} fallbackLevel={tier.evolutionLevel} fallbackVariant={tier.insect} size={tier.bugSize + 20} />
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{user.bugCount}</Text>
          <Text style={styles.statLabel}>Bugs</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>#{userRank}</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
        <View style={styles.statTile}>
          <BugArtImage bugId={tier.bugArtId} fallbackLevel={tier.evolutionLevel} fallbackVariant={tier.insect} size={Math.max(38, tier.bugSize * 0.58)} />
          <Text style={styles.statLabel}>{tier.title}</Text>
        </View>
      </View>
      <View style={styles.stage}>
        {userTiers.map((item) => {
          const unlocked = user.totalPoints >= item.minPoints;
          return (
            <BugArtImage
              key={item.title}
              bugId={unlocked ? item.bugArtId : undefined}
              fallbackLevel={unlocked ? item.evolutionLevel : 1}
              fallbackVariant={unlocked ? item.insect : "larva"}
              opacity={unlocked ? 1 : 0.3}
              size={Math.max(34, item.bugSize * 0.62)}
            />
          );
        })}
      </View>
      <View style={styles.tierWrap}>
        <TierBadge points={user.totalPoints} />
      </View>
      <Pressable style={styles.rankingCard} onPress={() => onNavigate("leaderboard")}>
        <View style={styles.rankingHeader}>
          <Text style={styles.sectionTitle}>Top</Text>
          <BugArtImage bugId="goliathkever" size={38} />
        </View>
        <View style={styles.rankingList}>
          {leaders.map((leader, index) => (
            <View key={leader.uid} style={styles.rankingLine}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.rankingName}>{leader.displayName}</Text>
              <Text style={styles.rankingPoints}>{leader.totalPoints}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      <Pressable style={styles.dexCard} onPress={() => onNavigate("bugdex")}>
        <View style={styles.dexText}>
          <Text style={styles.dexTitle}>BugDex</Text>
          <Text style={styles.dexMeta}>{dexCount}/{bugDexEntries.length} gevangen</Text>
        </View>
        <View style={styles.dexBugs}>
          {dexPreviewEntries.map((entry) => (
            <BugArtImage key={entry.id} bugId={entry.id} size={50} />
          ))}
          {Array.from({ length: Math.max(0, 3 - dexPreviewEntries.length) }).map((_, index) => (
            <BugArtImage key={`locked-${index}`} fallbackLevel={1} fallbackVariant="larva" opacity={0.28} size={44} />
          ))}
        </View>
      </Pressable>
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <View>
            <Text style={styles.missionTitle}>Weekly missies</Text>
            <Text style={styles.missionWeek}>{weeklyMissionLabel()}</Text>
          </View>
          <BugArtImage bugId="sprinkhaan" size={48} />
        </View>
        <View style={styles.missionList}>
          {missions.map((mission) => {
            const done = mission.progress >= mission.target;
            const width: DimensionValue = `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%`;
            return (
              <View key={mission.id} style={styles.missionItem}>
                <View style={styles.missionLine}>
                  <Text style={styles.missionName}>{mission.title}</Text>
                  <Text style={[styles.missionCount, done && styles.missionDone]}>{mission.progress}/{mission.target}</Text>
                </View>
                <View style={styles.missionTrack}>
                  <View style={[styles.missionFill, { width }]} />
                </View>
                <Text style={styles.missionReward}>{done ? "Extra vrijgespeeld" : mission.reward}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.quickCard}>
        <Text style={styles.newsTitle}>Acties</Text>
        <View style={styles.newsGrid}>
          <View style={styles.updatePill}>
            <BugArtImage bugId="pissebed" size={32} />
            <Text style={styles.newsItemTitle}>3 bugs</Text>
          </View>
          <View style={styles.updatePill}>
            <BugArtImage bugId="mestkever" size={32} />
            <Text style={styles.newsItemTitle}>Fix +15</Text>
          </View>
          <Pressable style={styles.updatePill} onPress={() => onNavigate("bugdex")}>
            <BugArtImage bugId="lieveheersbeestje" size={32} />
            <Text style={styles.newsItemTitle}>BugDex</Text>
          </Pressable>
        </View>
      </View>
      <Pressable style={[sharedStyles.button, styles.actionButton]} onPress={() => onNavigate("bugs")}>
        <BugArtImage bugId="neushoornkever" size={38} />
        <Text style={sharedStyles.buttonText}>Bugs bekijken</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 160
  },
  hero: {
    alignItems: "center",
    backgroundColor: "#102018",
    borderColor: "#294338",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    padding: 16
  },
  heroText: {
    flex: 1
  },
  heroNameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  heroTitle: {
    color: "#ffffff",
    flex: 1
  },
  profilePill: {
    backgroundColor: "#d7bd57",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  profileText: {
    color: "#102018",
    fontSize: 12,
    fontWeight: "900"
  },
  scoreText: {
    color: "#dbe8de",
    fontSize: 16,
    fontWeight: "800"
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12
  },
  statTile: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#d7e1d9",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 82,
    justifyContent: "center",
    padding: 10
  },
  statValue: {
    color: "#102018",
    fontSize: 22,
    fontWeight: "900"
  },
  statLabel: {
    color: "#52665d",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3
  },
  stage: {
    alignItems: "center",
    backgroundColor: "#edf6ea",
    borderColor: "#d0dfcf",
    borderRadius: 8,
    borderWidth: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 12,
    padding: 12
  },
  tierWrap: {
    marginBottom: 12
  },
  rankingCard: {
    backgroundColor: "#102018",
    borderRadius: 8,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14
  },
  dexCard: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#cddfd3",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginTop: 12,
    padding: 14
  },
  dexText: {
    flex: 1
  },
  dexTitle: {
    color: "#102018",
    fontSize: 20,
    fontWeight: "900"
  },
  dexMeta: {
    color: "#52665d",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2
  },
  dexBugs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 0
  },
  missionCard: {
    backgroundColor: "#102018",
    borderColor: "#294338",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14
  },
  missionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  missionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900"
  },
  missionWeek: {
    color: "#d7bd57",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2
  },
  missionList: {
    gap: 9
  },
  missionItem: {
    backgroundColor: "#fdfefb",
    borderRadius: 8,
    padding: 10
  },
  missionLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  missionName: {
    color: "#102018",
    flex: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  missionCount: {
    color: "#53645d",
    fontSize: 12,
    fontWeight: "900"
  },
  missionDone: {
    color: "#15724f"
  },
  missionTrack: {
    backgroundColor: "#dbe8de",
    borderRadius: 8,
    height: 8,
    marginTop: 7,
    overflow: "hidden"
  },
  missionFill: {
    backgroundColor: "#15724f",
    height: "100%"
  },
  missionReward: {
    color: "#15724f",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6
  },
  rankingHeader: {
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    width: 70
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900"
  },
  rankingList: {
    flex: 1,
    gap: 4
  },
  rankingLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  rank: {
    color: "#d7bd57",
    fontWeight: "900",
    width: 18
  },
  rankingName: {
    color: "#ffffff",
    flex: 1,
    fontWeight: "800"
  },
  rankingPoints: {
    color: "#d7bd57",
    fontWeight: "900"
  },
  quickCard: {
    backgroundColor: "#fdfefb",
    borderColor: "#d7e1d9",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14
  },
  newsTitle: {
    color: "#102018",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10
  },
  newsGrid: {
    flexDirection: "row",
    gap: 8
  },
  updatePill: {
    alignItems: "center",
    backgroundColor: "#eef4ed",
    borderRadius: 8,
    flex: 1,
    gap: 5,
    padding: 9
  },
  newsItemTitle: {
    color: "#17211c",
    fontSize: 12,
    fontWeight: "900"
  },
  actionButton: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center"
  }
});

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BugArtImage } from "../components/BugArtImage";
import { User } from "../types";
import { activeSquad, listArenaOpponents, loadArenaSave, teamPowerForSave } from "../services/bugSquadArenaService";

type Props = { user: User; onBack: () => void };

export function BugSquadArenaScreen({ user, onBack }: Props) {
  const [save, setSave] = useState<Awaited<ReturnType<typeof loadArenaSave>> | null>(null);

  useEffect(() => {
    let active = true;
    void loadArenaSave(user.uid).then((next) => { if (active) setSave(next); });
    return () => { active = false; };
  }, [user.uid]);

  if (!save) return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>BugSquad Arena laden...</Text></View>;
  const squad = activeSquad(save);
  const opponents = listArenaOpponents();

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={onBack}><Text style={styles.backText}>Terug</Text></Pressable>
        <Text style={styles.title}>BugSquad Arena</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>3v3 async squad battler</Text>
          <Text style={styles.heroTitle}>Kies 3 bugs. Vecht tegen snapshots.</Text>
          <Text style={styles.muted}>Engine, AI, save-service en balance zijn toegevoegd. Deze shell is bewust klein gehouden omdat grote screen-payloads door de GitHub write-filter werden geblokkeerd.</Text>
        </View>
        <Text style={styles.section}>Actieve squad · power {teamPowerForSave(save)}</Text>
        <View style={styles.row}>{squad.map((bug) => <View key={bug.instanceId} style={styles.card}><BugArtImage bugId={bug.sourceBugArtId} size={72} /><Text style={styles.cardTitle}>{bug.displayName}</Text><Text style={styles.muted}>Lv {bug.level} · {bug.type}</Text></View>)}</View>
        <Text style={styles.section}>Mock opponents</Text>
        {opponents.map((opponent) => <View key={opponent.snapshotId} style={styles.panel}><Text style={styles.cardTitle}>{opponent.ownerDisplayName}</Text><Text style={styles.muted}>Team power {opponent.teamPower}</Text></View>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ shell: { flex: 1, backgroundColor: "#08111f", padding: 14 }, center: { alignItems: "center", flex: 1, justifyContent: "center" }, header: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 12 }, back: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 10 }, backText: { color: "#fff", fontWeight: "900" }, title: { color: "#fff", fontSize: 22, fontWeight: "900" }, content: { gap: 12, paddingBottom: 30 }, hero: { backgroundColor: "#101c31", borderRadius: 24, padding: 18 }, kicker: { color: "#63f6a1", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }, heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900" }, muted: { color: "#95a5c6", fontSize: 12 }, section: { color: "#fff", fontSize: 18, fontWeight: "900" }, row: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, card: { alignItems: "center", backgroundColor: "#101c31", borderRadius: 18, padding: 10, width: 108 }, cardTitle: { color: "#fff", fontWeight: "900", textAlign: "center" }, panel: { backgroundColor: "#101c31", borderRadius: 18, padding: 12 } });

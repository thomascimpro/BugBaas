import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BugArtImage } from "../components/BugArtImage";
import { BugCard } from "../components/BugCard";
import { listBugs } from "../services/bugService";
import { BugReport, BugStatus } from "../types";
import { sharedStyles } from "./sharedStyles";

const statuses: BugStatus[] = ["Nieuw", "Bevestigd", "In behandeling", "Gefixt", "Afgekeurd", "Dubbel"];

type Props = {
  onBack: () => void;
  onNew: () => void;
  onSelect: (bug: BugReport) => void;
};

export function BugListScreen({ onBack, onNew, onSelect }: Props) {
  const [filter, setFilter] = useState<BugStatus | undefined>();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listBugs(filter).then(setBugs).finally(() => setLoading(false));
  }, [filter]);

  return (
    <View style={[sharedStyles.screen, styles.screen]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={sharedStyles.title}>Bugs</Text>
          <Text style={styles.subtitle}>{bugs.length} meldingen</Text>
        </View>
        <Pressable style={styles.newButton} onPress={onNew}>
          <BugArtImage bugId="lieveheersbeestje" size={32} />
          <Text style={styles.newButtonText}>Nieuw</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
        <Pressable style={[styles.filterPill, !filter && styles.filterPillActive]} onPress={() => setFilter(undefined)}>
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>Alles</Text>
        </Pressable>
        {statuses.map((status) => {
          const active = filter === status;
          return (
            <Pressable key={status} style={[styles.filterPill, active && styles.filterPillActive]} onPress={() => setFilter(status)}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{status}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={bugs}
          keyExtractor={(bug) => bug.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <BugArtImage bugId="zilvervisje" size={74} opacity={0.72} />
              <Text style={styles.emptyTitle}>Geen bugs</Text>
              <Text style={styles.emptyText}>Kies een andere status of meld een nieuwe bug.</Text>
            </View>
          }
          renderItem={({ item }) => <BugCard bug={item} onPress={() => onSelect(item)} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Terug</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 150
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 10
  },
  headerText: {
    flex: 1
  },
  subtitle: {
    color: "#52665d",
    fontSize: 14,
    fontWeight: "800"
  },
  newButton: {
    alignItems: "center",
    backgroundColor: "#102018",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14
  },
  newButtonText: {
    color: "#ffffff",
    fontWeight: "900"
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 10
  },
  filters: {
    gap: 8,
    paddingRight: 12
  },
  filterPill: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#cbd8d1",
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  filterPillActive: {
    backgroundColor: "#15724f",
    borderColor: "#15724f"
  },
  filterText: {
    color: "#17211c",
    fontSize: 13,
    fontWeight: "900"
  },
  filterTextActive: {
    color: "#ffffff"
  },
  list: {
    flex: 1
  },
  listContent: {
    gap: 10,
    paddingBottom: 18
  },
  empty: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#d7e1d9",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 24
  },
  emptyTitle: {
    color: "#102018",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8
  },
  emptyText: {
    color: "#53645d",
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center"
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#c6d3cc",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48
  },
  backButtonText: {
    color: "#17211c",
    fontWeight: "900"
  }
});

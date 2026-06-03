import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RouteName } from "../../App";
import { BugArtId } from "../services/bugArt";
import { BugArtImage } from "./BugArtImage";

type NavRoute = "home" | "new" | "leaderboard";

type Props = {
  activeRoute: RouteName;
  onNavigate: (route: NavRoute) => void;
};

const items: Array<{ route: NavRoute; label: string; bugId: BugArtId }> = [
  { route: "home", label: "Home", bugId: "zilvervisje" },
  { route: "new", label: "Meld", bugId: "mier" },
  { route: "leaderboard", label: "Ranglijst", bugId: "goliathkever" }
];

export function BottomNav({ activeRoute, onNavigate }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = activeRoute === item.route;
        const primary = item.route === "new";
        return (
          <Pressable key={item.route} style={[styles.item, primary && styles.primaryItem, active && styles.activeItem, primary && active && styles.activePrimary]} onPress={() => onNavigate(item.route)}>
            <BugArtImage bugId={item.bugId} size={primary ? 44 : active ? 32 : 26} />
            <Text style={[styles.label, primary && styles.primaryLabel, active && styles.activeLabel, primary && active && styles.activePrimaryLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#c8d5ce",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 8,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 14,
    marginHorizontal: 18,
    padding: 9,
    shadowColor: "#102018",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    zIndex: 100
  },
  item: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    gap: 3,
    minHeight: 70,
    justifyContent: "center",
    paddingVertical: 7
  },
  primaryItem: {
    backgroundColor: "#102018",
    elevation: 6,
    marginTop: -24,
    minHeight: 88,
    shadowColor: "#102018",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  activeItem: {
    backgroundColor: "#e6f2e7"
  },
  activePrimary: {
    backgroundColor: "#15724f"
  },
  label: {
    color: "#52665d",
    fontSize: 11,
    fontWeight: "800"
  },
  primaryLabel: {
    color: "#ffffff",
    fontSize: 12
  },
  activeLabel: {
    color: "#15724f"
  },
  activePrimaryLabel: {
    color: "#ffffff"
  }
});

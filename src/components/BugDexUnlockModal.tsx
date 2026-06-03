import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BugDexDropResult } from "../services/bugDexService";
import { BugArtImage } from "./BugArtImage";

type Props = {
  drop: BugDexDropResult | null;
  onClose: () => void;
};

export function BugDexUnlockModal({ drop, onClose }: Props) {
  if (!drop) return null;
  const title = drop.isNew ? "Bug unlocked" : "Dubbele bug";

  return (
    <Modal transparent animationType="fade" visible={Boolean(drop)} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>{title}</Text>
          <BugArtImage bugId={drop.entry.id} size={132} />
          <Text style={styles.name}>{drop.entry.name}</Text>
          <Text style={styles.meta}>{drop.entry.rarity}{drop.item.count > 1 ? ` - x${drop.item.count}` : ""}</Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Mooi</Text>
          </Pressable>
        </View>
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
    marginBottom: 12,
    textTransform: "uppercase"
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

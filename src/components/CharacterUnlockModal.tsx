import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CharacterOption } from "../services/characterService";
import { useI18n } from "../services/i18n";
import { playBugSound } from "../services/soundService";
import { CharacterAvatarImage } from "./CharacterAvatarImage";

type Props = {
  character: CharacterOption | null;
  onClose: () => void;
};

export function CharacterUnlockModal({ character, onClose }: Props) {
  const { t } = useI18n();
  const scale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    if (!character) return;
    playBugSound("bug_rare_unlock");
    scale.setValue(0.86);
    Animated.spring(scale, { friction: 5, tension: 92, toValue: 1, useNativeDriver: true }).start();
  }, [character, scale]);

  if (!character) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { borderColor: character.accent, transform: [{ scale }] }]}>
          <View style={[styles.topBar, { backgroundColor: character.accent }]} />
          <Text style={[styles.kicker, { color: character.accent }]}>{t("characterUnlock.kicker")}</Text>
          <Text style={styles.title}>{character.label}</Text>
          <View style={[styles.avatar, { backgroundColor: `${character.accent}22`, borderColor: character.accent }]}>
            <CharacterAvatarImage characterId={character.id} selected size={132} />
          </View>
          <Text style={styles.body}>{t("characterUnlock.body")}</Text>
          <Pressable style={[styles.button, { backgroundColor: character.accent }]} onPress={onClose}>
            <Text style={styles.buttonText}>{t("characterUnlock.close")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: "center", borderRadius: 18, borderWidth: 2, height: 174, justifyContent: "center", marginTop: 14, width: 174 },
  backdrop: { alignItems: "center", backgroundColor: "rgba(16,32,24,0.64)", flex: 1, justifyContent: "center", padding: 24 },
  body: { color: "#53645d", fontSize: 14, fontWeight: "800", lineHeight: 20, marginTop: 14, textAlign: "center" },
  button: { alignItems: "center", borderRadius: 10, marginTop: 18, minWidth: 170, paddingHorizontal: 22, paddingVertical: 13 },
  buttonText: { color: "#ffffff", fontWeight: "900" },
  card: { alignItems: "center", backgroundColor: "#fdfefb", borderRadius: 14, borderWidth: 3, maxWidth: 420, overflow: "hidden", padding: 22, width: "100%" },
  kicker: { fontSize: 13, fontWeight: "900", marginTop: 8, textTransform: "uppercase" },
  title: { color: "#102018", fontSize: 27, fontWeight: "900", marginTop: 4, textAlign: "center" },
  topBar: { height: 8, left: 0, position: "absolute", right: 0, top: 0 }
});

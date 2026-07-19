import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { disconnectFitnessSyncer, FitnessSyncerStatus, getFitnessSyncerStatus, startFitnessSyncerConnection, syncFitnessSyncerActivities } from "../services/fitnessSyncerService";
import { useI18n } from "../services/i18n";
import { NotificationSettings, NotificationType } from "../types";
import { sharedStyles } from "./sharedStyles";

const options: { type: NotificationType; titleKey: string; bodyKey: string }[] = [
  { type: "trade", titleKey: "settings.tradeTitle", bodyKey: "settings.tradeBody" },
  { type: "new_bug", titleKey: "settings.newBugTitle", bodyKey: "settings.newBugBody" },
  { type: "comment", titleKey: "settings.commentTitle", bodyKey: "settings.commentBody" },
  { type: "bug_update", titleKey: "settings.bugUpdateTitle", bodyKey: "settings.bugUpdateBody" },
  { type: "bugdex", titleKey: "settings.bugdexTitle", bodyKey: "settings.bugdexBody" },
  { type: "movement", titleKey: "settings.movementTitle", bodyKey: "settings.movementBody" },
  { type: "duel", titleKey: "settings.duelTitle", bodyKey: "settings.duelBody" }
];

type Props = {
  settings: NotificationSettings;
  onBack: () => void;
  onChange: (settings: NotificationSettings) => void;
  onHealthPermissionOpen?: () => Promise<void>;
  onMovementRegistered?: (todayKm: number, weekKm?: number) => Promise<void>;
  onShowHelp: () => void;
};

export function SettingsScreen({ settings, onBack, onChange, onHealthPermissionOpen, onMovementRegistered, onShowHelp }: Props) {
  const { t } = useI18n();
  const [healthPermissionOpening, setHealthPermissionOpening] = React.useState(false);
  const [fitnessStatus, setFitnessStatus] = React.useState<FitnessSyncerStatus | null>(null);
  const [fitnessBusy, setFitnessBusy] = React.useState(false);
  const [fitnessMessage, setFitnessMessage] = React.useState("");

  React.useEffect(() => {
    void refreshFitnessStatus();
  }, []);

  async function refreshFitnessStatus() {
    setFitnessStatus(await getFitnessSyncerStatus());
  }

  async function connectFitnessSyncer() {
    if (fitnessBusy || !fitnessStatus?.configured) return;
    setFitnessBusy(true);
    setFitnessMessage("");
    try {
      await Linking.openURL(await startFitnessSyncerConnection());
    } catch (error) {
      setFitnessMessage(error instanceof Error ? error.message : t("settings.fitnessError"));
    } finally {
      setFitnessBusy(false);
    }
  }

  async function syncFitnessSyncer() {
    if (fitnessBusy || !fitnessStatus?.connected) return;
    setFitnessBusy(true);
    setFitnessMessage("");
    try {
      const result = await syncFitnessSyncerActivities();
      if (result.todayKm > 0 || result.weekKm > 0) await onMovementRegistered?.(result.todayKm, result.weekKm);
      setFitnessMessage(t("settings.fitnessSynced", { km: result.weekKm.toFixed(1) }));
      await refreshFitnessStatus();
    } catch (error) {
      setFitnessMessage(error instanceof Error ? error.message : t("settings.fitnessError"));
    } finally {
      setFitnessBusy(false);
    }
  }

  async function disconnectFitness() {
    if (fitnessBusy || !fitnessStatus?.connected) return;
    setFitnessBusy(true);
    setFitnessMessage("");
    try {
      await disconnectFitnessSyncer();
      await refreshFitnessStatus();
    } catch (error) {
      setFitnessMessage(error instanceof Error ? error.message : t("settings.fitnessError"));
    } finally {
      setFitnessBusy(false);
    }
  }
  function toggle(type: NotificationType) {
    onChange({ ...settings, [type]: !settings[type] });
  }

  async function openHealthPermissions() {
    if (!onHealthPermissionOpen || healthPermissionOpening) return;
    setHealthPermissionOpening(true);
    try {
      await onHealthPermissionOpen();
    } finally {
      setHealthPermissionOpening(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={sharedStyles.screen}>
      <Text style={sharedStyles.title}>{t("settings.title")}</Text>
      <Text style={sharedStyles.subtitle}>{t("settings.notifications")}</Text>
      <View style={styles.list}>
        {options.map((option) => {
          const enabled = settings[option.type];
          return (
            <Pressable key={option.type} style={styles.row} onPress={() => toggle(option.type)}>
              <View style={styles.copy}>
                <Text style={styles.rowTitle}>{t(option.titleKey)}</Text>
                <Text style={styles.rowBody}>{t(option.bodyKey)}</Text>
              </View>
              <View style={[styles.toggle, enabled && styles.toggleOn]}>
                <View style={[styles.knob, enabled && styles.knobOn]} />
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.helpButton} onPress={onShowHelp}>
        <Text style={styles.helpButtonText}>{t("settings.help")}</Text>
      </Pressable>
      <Pressable disabled={healthPermissionOpening} style={[styles.healthButton, healthPermissionOpening && styles.healthButtonDisabled]} onPress={openHealthPermissions}>
        <Text style={styles.healthButtonText}>{healthPermissionOpening ? "..." : t("health.reopen")}</Text>
        <Text style={styles.healthButtonBody}>{t("settings.healthBody")}</Text>
      </Pressable>
      <View style={styles.fitnessCard}>
        <Text style={styles.fitnessTitle}>{t("settings.fitnessTitle")}</Text>
        <Text style={styles.fitnessBody}>{t("settings.fitnessBody")}</Text>
        <Text style={styles.fitnessPrivacy}>{t("settings.fitnessPrivacy")}</Text>
        {fitnessStatus?.connected ? (
          <>
            <Text style={styles.fitnessStatus}>{fitnessStatus.lastSyncAt ? t("settings.fitnessLastSync", { time: new Date(fitnessStatus.lastSyncAt).toLocaleString() }) : t("settings.fitnessConnected")}</Text>
            <Pressable disabled={fitnessBusy} style={[styles.fitnessPrimary, fitnessBusy && styles.healthButtonDisabled]} onPress={() => void syncFitnessSyncer()}>
              <Text style={styles.fitnessPrimaryText}>{fitnessBusy ? "..." : t("settings.fitnessSync")}</Text>
            </Pressable>
            <Pressable disabled={fitnessBusy} style={styles.fitnessSecondary} onPress={() => void disconnectFitness()}>
              <Text style={styles.fitnessSecondaryText}>{t("settings.fitnessDisconnect")}</Text>
            </Pressable>
          </>
        ) : (
          <>
            {(!fitnessStatus || !fitnessStatus.configured) && <Text style={styles.fitnessWarning}>{t("settings.fitnessUnavailable")}</Text>}
            <Pressable disabled={fitnessBusy || !fitnessStatus?.configured} style={[styles.fitnessPrimary, (fitnessBusy || !fitnessStatus?.configured) && styles.healthButtonDisabled]} onPress={() => void connectFitnessSyncer()}>
              <Text style={styles.fitnessPrimaryText}>{fitnessBusy ? "..." : t("settings.fitnessConnect")}</Text>
            </Pressable>
          </>
        )}
        {!!fitnessMessage && <Text style={styles.fitnessMessage}>{fitnessMessage}</Text>}
      </View>
      <Pressable style={sharedStyles.secondaryButton} onPress={onBack}>
        <Text style={sharedStyles.secondaryButtonText}>{t("common.back")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 160
  },
  list: {
    gap: 10,
    marginBottom: 14
  },
  helpButton: {
    alignItems: "center",
    backgroundColor: "#102018",
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 10,
    minHeight: 50
  },
  helpButtonText: {
    color: "#ffffff",
    fontWeight: "900"
  },
  healthButton: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#15724f",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 10,
    minHeight: 56,
    padding: 10
  },
  healthButtonBody: {
    color: "#53645d",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center"
  },
  healthButtonDisabled: {
    opacity: 0.6
  },
  healthButtonText: {
    color: "#15724f",
    fontWeight: "900"
  },
  fitnessBody: { color: "#53645d", fontSize: 12, fontWeight: "700", lineHeight: 17 },
  fitnessCard: { backgroundColor: "#fdfefb", borderColor: "#15724f", borderRadius: 8, borderWidth: 1, gap: 8, marginBottom: 10, padding: 12 },
  fitnessMessage: { color: "#15724f", fontSize: 12, fontWeight: "800" },
  fitnessPrimary: { alignItems: "center", backgroundColor: "#15724f", borderRadius: 8, minHeight: 46, justifyContent: "center", padding: 10 },
  fitnessPrimaryText: { color: "#ffffff", fontWeight: "900" },
  fitnessPrivacy: { color: "#64756d", fontSize: 11, fontWeight: "700" },
  fitnessSecondary: { alignItems: "center", padding: 8 },
  fitnessSecondaryText: { color: "#8f312a", fontSize: 12, fontWeight: "900" },
  fitnessStatus: { color: "#15724f", fontSize: 12, fontWeight: "900" },
  fitnessTitle: { color: "#102018", fontSize: 16, fontWeight: "900" },
  fitnessWarning: { color: "#8f5a12", fontSize: 12, fontWeight: "800" },
  row: {
    alignItems: "center",
    backgroundColor: "#fdfefb",
    borderColor: "#d7e1d9",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  rowTitle: {
    color: "#102018",
    fontSize: 15,
    fontWeight: "900"
  },
  rowBody: {
    color: "#53645d",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  toggle: {
    backgroundColor: "#c6d3cc",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 54
  },
  toggleOn: {
    backgroundColor: "#15724f"
  },
  knob: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    height: 24,
    width: 24
  },
  knobOn: {
    alignSelf: "flex-end"
  }
});

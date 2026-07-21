import React from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { fitnessSyncerCallbackUrl, fitnessSyncerSetupKeys, fitnessSyncerSetupUrl } from "../services/fitnessSyncerLinks";
import { MovementSyncSource } from "../services/movementSyncSource";
import { clearFitnessSyncerCredentials, disconnectFitnessSyncer, FitnessSyncerStatus, getFitnessSyncerStatus, saveFitnessSyncerCredentials, startFitnessSyncerConnection, syncFitnessSyncerActivities } from "../services/fitnessSyncerService";
import { canStartFitnessSyncerConnection, fitnessSyncerCredentialAction } from "../services/fitnessSyncerUiPolicy";
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
  onMovementRegistered?: (todayKm: number, weekKm?: number, source?: MovementSyncSource) => Promise<void>;
  onShowHelp: () => void;
};

export function SettingsScreen({ settings, onBack, onChange, onHealthPermissionOpen, onMovementRegistered, onShowHelp }: Props) {
  const { t } = useI18n();
  const [healthPermissionOpening, setHealthPermissionOpening] = React.useState(false);
  const [fitnessStatus, setFitnessStatus] = React.useState<FitnessSyncerStatus | null>(null);
  const [fitnessBusy, setFitnessBusy] = React.useState(false);
  const [fitnessClientId, setFitnessClientId] = React.useState("");
  const [fitnessClientSecret, setFitnessClientSecret] = React.useState("");
  const [fitnessMessage, setFitnessMessage] = React.useState("");
  const fitnessSetupSteps = fitnessSyncerSetupKeys(
    Platform.OS === "android" ? "android" : Platform.OS === "ios" ? "ios" : "web"
  );
  const fitnessConnectEnabled = canStartFitnessSyncerConnection(fitnessBusy);

  React.useEffect(() => {
    void refreshFitnessStatus();
  }, []);

  async function refreshFitnessStatus() {
    setFitnessStatus(await getFitnessSyncerStatus());
  }

  async function openFitnessSyncerSetup() {
    try {
      await Linking.openURL(fitnessSyncerSetupUrl);
    } catch {
      setFitnessMessage(t("settings.fitnessError"));
    }
  }

  async function connectFitnessSyncer() {
    if (!fitnessConnectEnabled) return;
    const credentialAction = fitnessSyncerCredentialAction(fitnessClientId, fitnessClientSecret, Boolean(fitnessStatus?.credentialsConfigured));
    if (credentialAction === "invalid") {
      setFitnessMessage(t("settings.fitnessCredentialsRequired"));
      return;
    }
    setFitnessBusy(true);
    setFitnessMessage("");
    try {
      if (credentialAction === "save") {
        const status = await saveFitnessSyncerCredentials(fitnessClientId.trim(), fitnessClientSecret.trim());
        setFitnessStatus(status);
        setFitnessClientId("");
        setFitnessClientSecret("");
      }
      await Linking.openURL(await startFitnessSyncerConnection());
    } catch (error) {
      const message = error instanceof Error ? error.message : t("settings.fitnessError");
      setFitnessMessage(message === "FitnessSyncer configuration is not active yet." ? t("settings.fitnessUnavailable") : message);
    } finally {
      setFitnessBusy(false);
    }
  }

  async function clearFitnessSyncerConfiguration() {
    if (fitnessBusy) return;
    setFitnessBusy(true);
    setFitnessMessage("");
    try {
      setFitnessStatus(await clearFitnessSyncerCredentials());
      setFitnessClientId("");
      setFitnessClientSecret("");
      setFitnessMessage(t("settings.fitnessCredentialsRemoved"));
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
      if (result.todayKm > 0 || result.weekKm > 0) await onMovementRegistered?.(result.todayKm, result.weekKm, "fitness_syncer");
      setFitnessMessage(t("settings.fitnessSynced", { km: result.weekKm.toFixed(1), steps: result.weekSteps.toLocaleString() }));
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
            <View style={styles.fitnessSetup}>
              <Text style={styles.fitnessSetupTitle}>{t("settings.fitnessSetupTitle")}</Text>
              {fitnessSetupSteps.map((key, index) => (
                <View key={key} style={styles.fitnessSetupStep}>
                  <View style={styles.fitnessSetupNumber}>
                    <Text style={styles.fitnessSetupNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.fitnessSetupText}>{t(key)}</Text>
                </View>
              ))}
              <Text style={styles.fitnessFreeNote}>{t("settings.fitnessFreeAccount")}</Text>
            </View>
            {fitnessStatus && !fitnessStatus.configured && (
              <Text style={styles.fitnessWarning}>{t("settings.fitnessUnavailable")}</Text>
            )}
            <Pressable style={styles.fitnessAccountButton} onPress={() => void openFitnessSyncerSetup()}>
              <Text style={styles.fitnessAccountButtonText}>{t("settings.fitnessSetupHelp")}</Text>
            </Pressable>
            <Text selectable style={styles.fitnessCallbackLabel}>{t("settings.fitnessCallbackLabel")}</Text>
            <Text selectable style={styles.fitnessCallbackUrl}>{fitnessSyncerCallbackUrl}</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!fitnessBusy}
              onChangeText={setFitnessClientId}
              placeholder={t("settings.fitnessClientId")}
              style={styles.fitnessInput}
              value={fitnessClientId}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!fitnessBusy}
              onChangeText={setFitnessClientSecret}
              placeholder={t("settings.fitnessClientSecret")}
              secureTextEntry
              style={styles.fitnessInput}
              value={fitnessClientSecret}
            />
            <Text style={styles.fitnessPrivacy}>{fitnessStatus?.credentialsConfigured ? t("settings.fitnessCredentialsSaved") : t("settings.fitnessCredentialsPrivacy")}</Text>
            <Pressable disabled={!fitnessConnectEnabled} style={[styles.fitnessPrimary, !fitnessConnectEnabled && styles.healthButtonDisabled]} onPress={() => void connectFitnessSyncer()}>
              <Text style={styles.fitnessPrimaryText}>{fitnessBusy ? "..." : t("settings.fitnessConnect")}</Text>
            </Pressable>
            {fitnessStatus?.credentialsConfigured && (
              <Pressable disabled={fitnessBusy} style={styles.fitnessSecondary} onPress={() => void clearFitnessSyncerConfiguration()}>
                <Text style={styles.fitnessSecondaryText}>{t("settings.fitnessCredentialsRemove")}</Text>
              </Pressable>
            )}
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
  fitnessAccountButton: { alignItems: "center", borderColor: "#15724f", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 42, padding: 9 },
  fitnessAccountButtonText: { color: "#15724f", fontSize: 12, fontWeight: "900" },
  fitnessBody: { color: "#53645d", fontSize: 12, fontWeight: "700", lineHeight: 17 },
  fitnessCallbackLabel: { color: "#31473e", fontSize: 11, fontWeight: "900" },
  fitnessCallbackUrl: { backgroundColor: "#edf6f1", borderRadius: 8, color: "#31473e", fontSize: 10, lineHeight: 15, padding: 8 },
  fitnessCard: { backgroundColor: "#fdfefb", borderColor: "#15724f", borderRadius: 8, borderWidth: 1, gap: 8, marginBottom: 10, padding: 12 },
  fitnessMessage: { color: "#15724f", fontSize: 12, fontWeight: "800" },
  fitnessPrimary: { alignItems: "center", backgroundColor: "#15724f", borderRadius: 8, minHeight: 46, justifyContent: "center", padding: 10 },
  fitnessPrimaryText: { color: "#ffffff", fontWeight: "900" },
  fitnessPrivacy: { color: "#64756d", fontSize: 11, fontWeight: "700" },
  fitnessFreeNote: { color: "#53645d", fontSize: 11, fontWeight: "800", lineHeight: 16, marginTop: 2 },
  fitnessInput: { backgroundColor: "#ffffff", borderColor: "#9bb8aa", borderRadius: 8, borderWidth: 1, color: "#102018", minHeight: 44, paddingHorizontal: 10 },
  fitnessSecondary: { alignItems: "center", padding: 8 },
  fitnessSetup: { backgroundColor: "#edf6f1", borderRadius: 8, gap: 7, padding: 10 },
  fitnessSetupNumber: { alignItems: "center", backgroundColor: "#15724f", borderRadius: 8, height: 22, justifyContent: "center", width: 22 },
  fitnessSetupNumberText: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  fitnessSetupStep: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  fitnessSetupText: { color: "#31473e", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  fitnessSetupTitle: { color: "#102018", fontSize: 13, fontWeight: "900" },
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

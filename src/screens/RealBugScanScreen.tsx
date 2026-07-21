import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BugArtImage } from "../components/BugArtImage";
import { type Language, useI18n } from "../services/i18n";
import { type RealBugScanResponse } from "../services/realBugScanContract";
import {
  emergencyRealBugPhotoPlan,
  fallbackRealBugPhotoPlan,
  primaryRealBugPhotoPlan,
  reviewRealBugThumbnailPlan,
  shouldFallbackRealBugPhoto,
  type RealBugPhotoPlan
} from "../services/realBugScanImagePolicy";
import { normalizeRealBugCameraAsset, type RealBugPhotoAsset } from "../services/realBugCameraAsset";
import { getRemainingRealBugScans, RealBugScanLimitError, submitRealBugScan } from "../services/realBugScanService";
import { type User } from "../types";

type Props = {
  user: User;
  onBack: () => void;
};

type PreparedPhoto = {
  dataUrl: string;
  previewUri: string;
  reviewThumbnailDataUrl: string;
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

function localizedIdentification(result: RealBugScanResponse, language: Language): { name: string; fact: string; reason: string } {
  if (language === "en") return { name: result.identification.commonNameEn, fact: result.identification.factEn, reason: result.identification.reasonEn };
  if (language === "fr") return { name: result.identification.commonNameFr, fact: result.identification.factFr, reason: result.identification.reasonFr };
  return { name: result.identification.commonName, fact: result.identification.fact, reason: result.identification.reason };
}

function resultCopy(result: RealBugScanResponse, t: Translate, displayName: string): { eyebrow: string; title: string; body: string } {
  if (result.status === "matched" && result.reward?.granted) {
    return {
      eyebrow: t("bugScan.result.reward.eyebrow"),
      title: t("bugScan.result.reward.title", { name: displayName }),
      body: t("bugScan.result.reward.body")
    };
  }
  if (result.status === "matched") {
    return {
      eyebrow: t("bugScan.result.matched.eyebrow"),
      title: displayName,
      body: t("bugScan.result.matched.body")
    };
  }
  if (result.status === "already_spotted") {
    return {
      eyebrow: t("bugScan.result.seen.eyebrow"),
      title: displayName,
      body: t("bugScan.result.seen.body")
    };
  }
  if (result.status === "not_in_catalog") {
    return {
      eyebrow: t("bugScan.result.newSpecies.eyebrow"),
      title: displayName,
      body: t("bugScan.result.newSpecies.body")
    };
  }
  if (result.status === "pending_review") {
    return {
      eyebrow: t("bugScan.result.uncertain.eyebrow"),
      title: displayName,
      body: t("bugScan.result.uncertain.body")
    };
  }
  if (result.status === "rejected_quality") {
    return {
      eyebrow: t("bugScan.result.quality.eyebrow"),
      title: displayName,
      body: t("bugScan.result.quality.body")
    };
  }
  return {
    eyebrow: t("bugScan.result.noBug.eyebrow"),
    title: displayName,
    body: t("bugScan.result.noBug.body")
  };
}

export function RealBugScanScreen({ user, onBack }: Props) {
  const { language, t } = useI18n();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [result, setResult] = useState<RealBugScanResponse | null>(null);
  const [remainingScans, setRemainingScans] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getRemainingRealBugScans(user)
      .then((remaining) => {
        if (active) setRemainingScans(remaining);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  async function prepareAsset(asset: RealBugPhotoAsset | ImagePicker.ImagePickerAsset) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const manipulatePhoto = (uri: string, plan: RealBugPhotoPlan) => ImageManipulator.manipulateAsync(uri, plan.resize, {
        base64: true,
        compress: plan.quality,
        format: ImageManipulator.SaveFormat.JPEG
      });
      const primary = await manipulatePhoto(
        asset.uri,
        primaryRealBugPhotoPlan(asset.width ?? 0, asset.height ?? 0)
      );
      if (!primary.base64) throw new Error(t("bugScan.error.prepare"));

      let prepared = shouldFallbackRealBugPhoto(primary.base64)
        ? await manipulatePhoto(
            primary.uri,
            fallbackRealBugPhotoPlan(primary.width ?? 0, primary.height ?? 0)
          )
        : primary;
      if (!prepared.base64) throw new Error(t("bugScan.error.prepare"));
      if (shouldFallbackRealBugPhoto(prepared.base64)) {
        prepared = await manipulatePhoto(
          prepared.uri,
          emergencyRealBugPhotoPlan(prepared.width ?? 0, prepared.height ?? 0)
        );
      }
      if (!prepared.base64) throw new Error(t("bugScan.error.prepare"));

      const thumbnail = await manipulatePhoto(
        prepared.uri,
        reviewRealBugThumbnailPlan(prepared.width ?? 0, prepared.height ?? 0)
      );
      if (!thumbnail.base64) throw new Error(t("bugScan.error.thumbnail"));

      setPhoto({
        dataUrl: `data:image/jpeg;base64,${prepared.base64}`,
        previewUri: prepared.uri,
        reviewThumbnailDataUrl: `data:image/jpeg;base64,${thumbnail.base64}`
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("bugScan.error.openPhoto"));
    } finally {
      setBusy(false);
    }
  }

  async function openCamera() {
    setError("");
    if (remainingScans <= 0) {
      setError(t("bugScan.error.limit"));
      return;
    }
    try {
      const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
      if (!permission.granted) {
        setError(t("bugScan.error.cameraPermission"));
        return;
      }
      setCameraReady(false);
      setCameraOpen(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("bugScan.error.cameraOpen"));
    }
  }

  async function capturePhoto() {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    setError("");
    try {
      const captured = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!captured) throw new Error(t("bugScan.error.noCapture"));
      setCameraOpen(false);
      setCameraReady(false);
      await prepareAsset(normalizeRealBugCameraAsset(captured));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("bugScan.error.capture"));
    } finally {
      setCapturing(false);
    }
  }

  async function selectPhoto() {
    setError("");
    if (remainingScans <= 0) {
      setError(t("bugScan.error.limit"));
      return;
    }
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1
      });
      if (!picked.canceled && picked.assets[0]) await prepareAsset(picked.assets[0]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("bugScan.error.openPhoto"));
    }
  }

  async function analyzePhoto() {
    if (!photo || busy) return;
    setBusy(true);
    setError("");
    try {
      const nextResult = await submitRealBugScan(user, photo.dataUrl, photo.reviewThumbnailDataUrl);
      setResult(nextResult);
      setRemainingScans(nextResult.remainingScans);
    } catch (nextError) {
      if (nextError instanceof RealBugScanLimitError) setRemainingScans(0);
      setError(nextError instanceof Error ? nextError.message : t("bugScan.error.failed"));
    } finally {
      setBusy(false);
    }
  }

  function resetScan() {
    setCameraOpen(false);
    setCameraReady(false);
    setPhoto(null);
    setResult(null);
    setError("");
  }

  const localized = result ? localizedIdentification(result, language) : null;
  const copy = result && localized ? resultCopy(result, t, localized.name) : null;
  const matchedBugId = result?.reward?.bugId ?? result?.identification.bugId ?? undefined;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>BUGSCAN</Text>
          <Text style={styles.title}>{t("bugScan.title")}</Text>
        </View>
        <View style={[styles.counter, remainingScans === 0 && styles.counterEmpty]}>
          <Text style={styles.counterValue}>{remainingScans}/3</Text>
          <Text style={styles.counterLabel}>{t("bugScan.today")}</Text>
        </View>
      </View>

      {!photo && !result && cameraOpen && (
        <View style={styles.cameraCard}>
          <View style={styles.cameraFrame}>
            <CameraView
              ref={cameraRef}
              facing="back"
              mode="picture"
              onCameraReady={() => setCameraReady(true)}
              onMountError={(event) => {
                setCameraOpen(false);
                setCameraReady(false);
                setError(event.message || t("bugScan.error.cameraStart"));
              }}
              style={styles.cameraView}
            />
            <View pointerEvents="none" style={styles.cameraGuide}>
              <View style={styles.cameraGuideBox} />
              <Text style={styles.cameraGuideText}>{t("bugScan.camera.place")}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" disabled={!cameraReady || capturing} onPress={() => void capturePhoto()} style={({ pressed }) => [styles.primaryButton, (!cameraReady || capturing) && styles.disabledButton, pressed && styles.pressed]}>
            {capturing ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{t("bugScan.camera.take")}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" disabled={capturing} onPress={() => {
            setCameraOpen(false);
            setCameraReady(false);
          }} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>{t("bugScan.camera.close")}</Text>
          </Pressable>
        </View>
      )}

      {!photo && !result && !cameraOpen && (
        <>
          <View style={styles.heroCard}>
            <View style={styles.scannerRing}>
              <Text style={styles.scannerIcon}>⌖</Text>
            </View>
            <Text style={styles.heroTitle}>{t("bugScan.hero.title")}</Text>
            <Text style={styles.heroBody}>{t("bugScan.hero.body")}</Text>
            <View style={styles.stepsRow}>
              <View style={styles.stepChip}><Text style={styles.stepNumber}>1</Text><Text style={styles.stepText}>{t("bugScan.step.photo")}</Text></View>
              <Text style={styles.stepArrow}>›</Text>
              <View style={styles.stepChip}><Text style={styles.stepNumber}>2</Text><Text style={styles.stepText}>{t("bugScan.step.check")}</Text></View>
              <Text style={styles.stepArrow}>›</Text>
              <View style={styles.stepChip}><Text style={styles.stepNumber}>3</Text><Text style={styles.stepText}>{t("bugScan.step.reward")}</Text></View>
            </View>
          </View>

          <Pressable accessibilityRole="button" disabled={busy || remainingScans <= 0} onPress={() => void openCamera()} style={({ pressed }) => [styles.primaryButton, (busy || remainingScans <= 0) && styles.disabledButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonIcon}>◉</Text>
            <Text style={styles.primaryButtonText}>{remainingScans > 0 ? t("bugScan.openCamera") : t("bugScan.limitReached")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy || remainingScans <= 0} onPress={() => void selectPhoto()} style={({ pressed }) => [styles.secondaryButton, (busy || remainingScans <= 0) && styles.disabledSecondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>{t("bugScan.chooseGallery")}</Text>
          </Pressable>
        </>
      )}

      {photo && !result && (
        <View style={styles.previewCard}>
          <View style={styles.previewFrame}>
            <Image resizeMode="cover" source={{ uri: photo.previewUri }} style={styles.previewImage} />
            <View pointerEvents="none" style={styles.cornerTopLeft} />
            <View pointerEvents="none" style={styles.cornerTopRight} />
            <View pointerEvents="none" style={styles.cornerBottomLeft} />
            <View pointerEvents="none" style={styles.cornerBottomRight} />
          </View>
          <Text style={styles.previewTitle}>{t("bugScan.preview.title")}</Text>
          <Text style={styles.previewBody}>{t("bugScan.preview.body")}</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void analyzePhoto()} style={({ pressed }) => [styles.primaryButton, busy && styles.disabledButton, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{t("bugScan.analyze")}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={resetScan} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>{t("bugScan.newPhoto")}</Text>
          </Pressable>
        </View>
      )}

      {result && copy && (
        <View style={styles.resultCard}>
          <View style={styles.rewardGlow}>
            {matchedBugId ? <BugArtImage bugId={matchedBugId} size={126} /> : <Text style={styles.resultFallbackIcon}>?</Text>}
          </View>
          <Text style={styles.resultEyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.resultTitle}>{copy.title}</Text>
          <Text style={styles.resultBody}>{copy.body}</Text>
          <View style={styles.identificationCard}>
            <View style={styles.identificationHeader}>
              <Text style={styles.identificationLabel}>{t("bugScan.identification")}</Text>
              <Text style={styles.confidence}>{Math.round(result.identification.confidence * 100)}%</Text>
            </View>
            <Text style={styles.identificationName}>{localized?.name}</Text>
            {result.identification.scientificName ? <Text style={styles.scientificName}>{result.identification.scientificName}</Text> : null}
            <Text style={styles.reason}>{localized?.reason}</Text>
            {localized?.fact ? <Text style={styles.reason}>{t("bugScan.fact", { fact: localized.fact })}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" disabled={remainingScans <= 0} onPress={resetScan} style={({ pressed }) => [styles.primaryButton, remainingScans <= 0 && styles.disabledButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{remainingScans > 0 ? t("bugScan.scanAgain") : t("bugScan.scanTomorrow")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>{t("bugScan.backHome")}</Text>
          </Pressable>
        </View>
      )}

      {busy && !photo && (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#15724f" size="large" />
          <Text style={styles.loadingText}>{t("bugScan.preparing")}</Text>
        </View>
      )}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>{t("bugScan.identification")}</Text>
        <Text style={styles.privacyText}>{t("bugScan.privacy")}</Text>
        <Text style={styles.misuseWarning}>{t("bugScan.misuse")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    alignSelf: "center",
    maxWidth: 620,
    padding: 18,
    paddingBottom: 150,
    width: "100%"
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 18
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#cfddd5",
    borderRadius: 15,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  backButtonText: {
    color: "#173f31",
    fontSize: 34,
    fontWeight: "500",
    lineHeight: 36,
    marginTop: -3
  },
  headerCopy: {
    flex: 1
  },
  kicker: {
    color: "#be7a1d",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4
  },
  title: {
    color: "#102018",
    fontSize: 24,
    fontWeight: "900"
  },
  counter: {
    alignItems: "center",
    backgroundColor: "#e5f5ed",
    borderColor: "#a9d5bf",
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  counterEmpty: {
    backgroundColor: "#f5e7e4",
    borderColor: "#dfb6ae"
  },
  counterValue: {
    color: "#125c42",
    fontSize: 17,
    fontWeight: "900"
  },
  counterLabel: {
    color: "#587064",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  cameraCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "#cfddd5",
    borderRadius: 24,
    borderWidth: 1,
    padding: 14
  },
  cameraFrame: {
    aspectRatio: 0.75,
    backgroundColor: "#102018",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  cameraView: {
    height: "100%",
    width: "100%"
  },
  cameraGuide: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 22,
    position: "absolute",
    right: 0,
    top: 0
  },
  cameraGuideBox: {
    borderColor: "rgba(122,255,190,0.94)",
    borderRadius: 22,
    borderStyle: "dashed",
    borderWidth: 3,
    height: "62%",
    width: "82%"
  },
  cameraGuideText: {
    backgroundColor: "rgba(16,32,24,0.76)",
    borderRadius: 12,
    bottom: 26,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    textAlign: "center"
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "#cfddd5",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24
  },
  scannerRing: {
    alignItems: "center",
    backgroundColor: "#eaf7f0",
    borderColor: "#68b38f",
    borderRadius: 64,
    borderStyle: "dashed",
    borderWidth: 2,
    height: 112,
    justifyContent: "center",
    marginBottom: 18,
    width: 112
  },
  scannerIcon: {
    color: "#167451",
    fontSize: 58,
    fontWeight: "700"
  },
  heroTitle: {
    color: "#102018",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  heroBody: {
    color: "#53685e",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 430,
    textAlign: "center"
  },
  stepsRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 22
  },
  stepChip: {
    alignItems: "center",
    gap: 5
  },
  stepNumber: {
    backgroundColor: "#173f31",
    borderRadius: 13,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    height: 25,
    lineHeight: 25,
    textAlign: "center",
    width: 25
  },
  stepText: {
    color: "#53685e",
    fontSize: 10,
    fontWeight: "800"
  },
  stepArrow: {
    color: "#9bb0a6",
    fontSize: 24,
    marginHorizontal: 13,
    marginTop: -14
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#15724f",
    borderRadius: 16,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 15
  },
  primaryButtonIcon: {
    color: "#ffffff",
    fontSize: 20
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#c9d8d0",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13
  },
  secondaryButtonText: {
    color: "#193f32",
    fontSize: 14,
    fontWeight: "900"
  },
  disabledButton: {
    backgroundColor: "#91aa9f"
  },
  disabledSecondaryButton: {
    opacity: 0.55
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  },
  previewCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "#cfddd5",
    borderRadius: 24,
    borderWidth: 1,
    padding: 16
  },
  previewFrame: {
    aspectRatio: 1,
    backgroundColor: "#dce8e2",
    borderRadius: 19,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  previewImage: {
    height: "100%",
    width: "100%"
  },
  cornerTopLeft: {
    borderLeftColor: "#7affbe",
    borderLeftWidth: 4,
    borderTopColor: "#7affbe",
    borderTopLeftRadius: 9,
    borderTopWidth: 4,
    height: 35,
    left: 16,
    position: "absolute",
    top: 16,
    width: 35
  },
  cornerTopRight: {
    borderRightColor: "#7affbe",
    borderRightWidth: 4,
    borderTopColor: "#7affbe",
    borderTopRightRadius: 9,
    borderTopWidth: 4,
    height: 35,
    position: "absolute",
    right: 16,
    top: 16,
    width: 35
  },
  cornerBottomLeft: {
    borderBottomColor: "#7affbe",
    borderBottomLeftRadius: 9,
    borderBottomWidth: 4,
    borderLeftColor: "#7affbe",
    borderLeftWidth: 4,
    bottom: 16,
    height: 35,
    left: 16,
    position: "absolute",
    width: 35
  },
  cornerBottomRight: {
    borderBottomColor: "#7affbe",
    borderBottomRightRadius: 9,
    borderBottomWidth: 4,
    borderRightColor: "#7affbe",
    borderRightWidth: 4,
    bottom: 16,
    height: 35,
    position: "absolute",
    right: 16,
    width: 35
  },
  previewTitle: {
    color: "#102018",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 17,
    textAlign: "center"
  },
  previewBody: {
    color: "#53685e",
    fontSize: 13,
    lineHeight: 19,
    marginHorizontal: 8,
    marginTop: 7,
    textAlign: "center"
  },
  resultCard: {
    alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderColor: "#d9c389",
    borderRadius: 26,
    borderWidth: 1,
    padding: 20
  },
  rewardGlow: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#fff5cf",
    borderColor: "#e5bd50",
    borderRadius: 85,
    borderWidth: 2,
    height: 164,
    justifyContent: "center",
    marginBottom: 15,
    width: 164
  },
  resultFallbackIcon: {
    color: "#98731a",
    fontSize: 68,
    fontWeight: "900"
  },
  resultEyebrow: {
    color: "#b27616",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center"
  },
  resultTitle: {
    color: "#102018",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center"
  },
  resultBody: {
    color: "#53685e",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center"
  },
  identificationCard: {
    backgroundColor: "#f0f6f2",
    borderColor: "#d4e2da",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 14
  },
  identificationHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  identificationLabel: {
    color: "#5c7066",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  confidence: {
    color: "#15724f",
    fontSize: 13,
    fontWeight: "900"
  },
  identificationName: {
    color: "#173f31",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 7
  },
  scientificName: {
    color: "#63766d",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2
  },
  reason: {
    color: "#4d6258",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#cfddd5",
    borderRadius: 20,
    borderWidth: 1,
    padding: 28
  },
  loadingText: {
    color: "#53685e",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 12
  },
  error: {
    backgroundColor: "#fff0ed",
    borderColor: "#e1ada4",
    borderRadius: 13,
    borderWidth: 1,
    color: "#a93227",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 12,
    padding: 13,
    textAlign: "center"
  },
  privacyCard: {
    backgroundColor: "rgba(238,244,241,0.92)",
    borderRadius: 14,
    marginTop: 16,
    padding: 13
  },
  privacyTitle: {
    color: "#3d564a",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  privacyText: {
    color: "#5c7066",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4
  },
  misuseWarning: {
    color: "#8b3a2d",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 16,
    marginTop: 8
  }
});

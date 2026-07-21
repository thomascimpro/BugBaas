import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BugArtImage } from "../components/BugArtImage";
import { normalizeRealBugCameraAsset, type RealBugPhotoAsset } from "../services/realBugCameraAsset";
import type { RealBugScanResponse } from "../services/realBugScanContract";
import {
  fallbackRealBugPhotoPlan,
  primaryRealBugPhotoPlan,
  reviewRealBugThumbnailPlan,
  shouldFallbackRealBugPhoto,
  type RealBugPhotoPlan
} from "../services/realBugScanImagePolicy";
import { getRemainingRealBugScans, RealBugScanLimitError, submitRealBugScan } from "../services/realBugScanService";
import type { User } from "../types";

type Props = {
  user: User;
  onBack: () => void;
};

type PreparedPhoto = {
  dataUrl: string;
  previewUri: string;
  reviewThumbnailDataUrl: string;
};

function resultCopy(result: RealBugScanResponse) {
  switch (result.status) {
    case "matched":
      return result.reward?.granted
        ? {
            eyebrow: "BUGDEX REWARD",
            title: `${result.reward.bugName} gevangen`,
            body: "Deze echte vondst is aan je BugDex toegevoegd."
          }
        : {
            eyebrow: "ECHTE VONDST",
            title: result.reward?.bugName ?? result.identification.commonName,
            body: "Deze soort is herkend en geregistreerd."
          };
    case "already_spotted":
      return {
        eyebrow: "AL GESPOT",
        title: result.reward?.bugName ?? result.identification.commonName,
        body: "Deze soort had je al eerder in het echt gescand."
      };
    case "not_in_catalog":
      return {
        eyebrow: "NIEUWE SOORT ONTDEKT",
        title: result.identification.commonName,
        body: "Deze bug staat nog niet in de BugDex. De vondst is naar de developer gestuurd om toe te voegen."
      };
    case "pending_review":
      return {
        eyebrow: "NOG NIET ZEKER",
        title: result.identification.commonName,
        body: "De AI ziet waarschijnlijk een bug, maar de herkenning is nog niet betrouwbaar genoeg."
      };
    case "rejected_quality":
      return {
        eyebrow: "FOTO TE ONDUIDELIJK",
        title: "Probeer dichterbij",
        body: "Gebruik meer licht en zorg dat de bug scherp en groot in beeld staat."
      };
    default:
      return {
        eyebrow: "GEEN BUG HERKEND",
        title: "Geen duidelijke bug gevonden",
        body: "Fotografeer één insect of spin van dichtbij."
      };
  }
}

export function RealBugScanScreen({ user, onBack }: Props) {
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
      const manipulate = (uri: string, plan: RealBugPhotoPlan) => ImageManipulator.manipulateAsync(uri, plan.resize, {
        base64: true,
        compress: plan.quality,
        format: ImageManipulator.SaveFormat.JPEG
      });
      const primary = await manipulate(asset.uri, primaryRealBugPhotoPlan(asset.width ?? 0, asset.height ?? 0));
      if (!primary.base64) throw new Error("De foto kon niet worden voorbereid.");
      const prepared = shouldFallbackRealBugPhoto(primary.base64)
        ? await manipulate(primary.uri, fallbackRealBugPhotoPlan(primary.width ?? 0, primary.height ?? 0))
        : primary;
      if (!prepared.base64) throw new Error("De foto kon niet worden voorbereid.");
      const thumbnail = await manipulate(prepared.uri, reviewRealBugThumbnailPlan(prepared.width ?? 0, prepared.height ?? 0));
      if (!thumbnail.base64) throw new Error("De reviewfoto kon niet worden voorbereid.");
      setPhoto({
        dataUrl: `data:image/jpeg;base64,${prepared.base64}`,
        previewUri: prepared.uri,
        reviewThumbnailDataUrl: `data:image/jpeg;base64,${thumbnail.base64}`
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "De foto kon niet worden geopend.");
    } finally {
      setBusy(false);
    }
  }

  async function openCamera() {
    setError("");
    if (remainingScans <= 0) return setError("Je hebt vandaag al drie echte bugs gescand.");
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) return setError("Cameratoegang is nodig om een bug te fotograferen.");
    setCameraReady(false);
    setCameraOpen(true);
  }

  async function capturePhoto() {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    setError("");
    try {
      const captured = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!captured) throw new Error("De camera gaf geen foto terug.");
      setCameraOpen(false);
      await prepareAsset(normalizeRealBugCameraAsset(captured));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "De foto kon niet worden gemaakt.");
    } finally {
      setCapturing(false);
    }
  }

  async function selectPhoto() {
    setError("");
    if (remainingScans <= 0) return setError("Je hebt vandaag al drie echte bugs gescand.");
    const picked = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1
    });
    if (!picked.canceled && picked.assets[0]) await prepareAsset(picked.assets[0]);
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
      setError(nextError instanceof Error ? nextError.message : "De bugscan is mislukt.");
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

  const copy = result ? resultCopy(result) : null;
  const bugId = result?.reward?.bugId ?? result?.identification.bugId ?? undefined;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>BUGSCAN</Text>
          <Text style={styles.title}>Scan een echte bug</Text>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{remainingScans}/3</Text>
          <Text style={styles.counterLabel}>vandaag</Text>
        </View>
      </View>

      {cameraOpen && !photo && !result ? (
        <View style={styles.card}>
          <View style={styles.cameraFrame}>
            <CameraView
              ref={cameraRef}
              facing="back"
              mode="picture"
              onCameraReady={() => setCameraReady(true)}
              onMountError={(event) => {
                setCameraOpen(false);
                setError(event.message || "De camera kon niet worden gestart.");
              }}
              style={styles.camera}
            />
            <Text style={styles.cameraHint}>Plaats één bug groot in beeld</Text>
          </View>
          <Pressable disabled={!cameraReady || capturing} onPress={() => void capturePhoto()} style={styles.primaryButton}>
            {capturing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Maak foto</Text>}
          </Pressable>
          <Pressable onPress={() => setCameraOpen(false)} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Sluit camera</Text>
          </Pressable>
        </View>
      ) : null}

      {!cameraOpen && !photo && !result ? (
        <View style={styles.card}>
          <Text style={styles.heroIcon}>⌖</Text>
          <Text style={styles.heroTitle}>Zet de bug scherp in beeld</Text>
          <Text style={styles.body}>De AI vertelt wat het is. Staat de soort nog niet in BugBaas, dan wordt hij naar de developer gestuurd.</Text>
          <Pressable disabled={busy || remainingScans <= 0} onPress={() => void openCamera()} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{remainingScans > 0 ? "Open camera" : "Daglimiet bereikt"}</Text>
          </Pressable>
          <Pressable disabled={busy || remainingScans <= 0} onPress={() => void selectPhoto()} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Kies foto uit galerij</Text>
          </Pressable>
        </View>
      ) : null}

      {photo && !result ? (
        <View style={styles.card}>
          <Image resizeMode="cover" source={{ uri: photo.previewUri }} style={styles.preview} />
          <Text style={styles.heroTitle}>Foto klaar voor analyse</Text>
          <Pressable disabled={busy} onPress={() => void analyzePhoto()} style={styles.primaryButton}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Analyseer bug</Text>}
          </Pressable>
          <Pressable disabled={busy} onPress={resetScan} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Nieuwe foto</Text>
          </Pressable>
        </View>
      ) : null}

      {result && copy ? (
        <View style={styles.card}>
          <View style={styles.art}>{bugId ? <BugArtImage bugId={bugId} size={120} /> : <Text style={styles.question}>?</Text>}</View>
          <Text style={styles.kicker}>{copy.eyebrow}</Text>
          <Text style={styles.resultTitle}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.identification}>
            <Text style={styles.confidence}>{Math.round(result.identification.confidence * 100)}% zeker</Text>
            <Text style={styles.identificationName}>{result.identification.commonName}</Text>
            {result.identification.scientificName ? <Text style={styles.scientific}>{result.identification.scientificName}</Text> : null}
            <Text style={styles.reason}>{result.identification.reason}</Text>
          </View>
          <Pressable disabled={remainingScans <= 0} onPress={resetScan} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{remainingScans > 0 ? "Scan nog een bug" : "Morgen weer scannen"}</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Text style={styles.privacy}>Foto's worden verkleind. Alleen bij een nog ontbrekende soort wordt een kleine reviewfoto voor de developer bewaard.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignSelf: "center", maxWidth: 620, padding: 18, paddingBottom: 140, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 18 },
  headerText: { flex: 1 },
  backButton: { alignItems: "center", backgroundColor: "#fff", borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  backText: { color: "#173f31", fontSize: 34, lineHeight: 36 },
  kicker: { color: "#b36c12", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#102018", fontSize: 24, fontWeight: "900" },
  counter: { alignItems: "center", backgroundColor: "#e5f5ed", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  counterValue: { color: "#125c42", fontSize: 17, fontWeight: "900" },
  counterLabel: { color: "#587064", fontSize: 9, fontWeight: "800" },
  card: { backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 24, gap: 14, padding: 16 },
  heroIcon: { color: "#16704f", fontSize: 56, textAlign: "center" },
  heroTitle: { color: "#102018", fontSize: 21, fontWeight: "900", textAlign: "center" },
  body: { color: "#50635a", fontSize: 14, lineHeight: 21, textAlign: "center" },
  primaryButton: { alignItems: "center", backgroundColor: "#16704f", borderRadius: 15, minHeight: 50, justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  secondaryButton: { alignItems: "center", backgroundColor: "#edf4f0", borderRadius: 15, minHeight: 48, justifyContent: "center", paddingHorizontal: 18 },
  secondaryText: { color: "#214a39", fontSize: 14, fontWeight: "800" },
  cameraFrame: { aspectRatio: 0.75, backgroundColor: "#102018", borderRadius: 18, overflow: "hidden" },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraHint: { alignSelf: "center", backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 12, bottom: 16, color: "#fff", fontWeight: "800", padding: 9, position: "absolute" },
  preview: { aspectRatio: 1, borderRadius: 18, width: "100%" },
  art: { alignItems: "center", justifyContent: "center", minHeight: 125 },
  question: { color: "#16704f", fontSize: 72, fontWeight: "900" },
  resultTitle: { color: "#102018", fontSize: 25, fontWeight: "900", textAlign: "center" },
  identification: { backgroundColor: "#f1f6f3", borderRadius: 16, gap: 5, padding: 14 },
  confidence: { color: "#16704f", fontSize: 12, fontWeight: "900" },
  identificationName: { color: "#102018", fontSize: 18, fontWeight: "900" },
  scientific: { color: "#66766f", fontSize: 13, fontStyle: "italic" },
  reason: { color: "#50635a", fontSize: 13, lineHeight: 19 },
  error: { backgroundColor: "#f8e4e1", borderRadius: 12, color: "#9f3028", fontWeight: "800", marginTop: 14, padding: 12, textAlign: "center" },
  privacy: { color: "#65776f", fontSize: 11, lineHeight: 17, marginTop: 16, textAlign: "center" }
});

import type { User } from "../types";
import type { RealBugIdentification } from "./realBugScanContract";

const maxReviewThumbnailLength = 220_000;
const thumbnailPattern = /^data:image\/jpeg;base64,[a-z0-9+/=]+$/i;

export type PendingBugDexDiscoveryRecord = {
  scanId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  organizationId: string;
  commonName: string;
  commonNameEn: string;
  commonNameFr: string;
  scientificName: string;
  fact: string;
  factEn: string;
  factFr: string;
  normalizedSpeciesKey: string;
  confidence: number;
  reason: string;
  reasonEn: string;
  reasonFr: string;
  createdAt: string;
  updatedAt: string;
  status: "reward_owed";
  bugDexBugId: null;
  reviewThumbnailDataUrl: string;
};

type BuildPendingDiscoveryInput = {
  user: User;
  scanId: string;
  identification: RealBugIdentification;
  reviewThumbnailDataUrl: string;
  now?: string;
};

export function normalizePendingSpeciesKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function buildPendingBugDexDiscoveryRecord({
  user,
  scanId,
  identification,
  reviewThumbnailDataUrl,
  now = new Date().toISOString()
}: BuildPendingDiscoveryInput): PendingBugDexDiscoveryRecord {
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(scanId)) throw new Error("Ongeldige discovery scan-ID.");
  if (identification.bugId !== null) throw new Error("Alleen ontbrekende BugDex-soorten kunnen worden opgeslagen.");
  if (!Number.isFinite(identification.confidence) || identification.confidence < 0 || identification.confidence > 1) {
    throw new Error("Ongeldige discovery confidence.");
  }
  if (
    reviewThumbnailDataUrl.length > maxReviewThumbnailLength
    || !thumbnailPattern.test(reviewThumbnailDataUrl)
  ) throw new Error("De review-thumbnail is ongeldig of te groot.");

  const commonName = identification.commonName.trim().slice(0, 120);
  const scientificName = identification.scientificName.trim().slice(0, 160);
  const fact = identification.fact.trim().slice(0, 500);
  const normalizedSpeciesKey = normalizePendingSpeciesKey(scientificName || commonName);
  if (!commonName || !normalizedSpeciesKey || !fact) throw new Error("De ontbrekende soort heeft geen bruikbare naam of feitje.");

  return {
    scanId,
    userId: user.uid,
    userDisplayName: user.displayName.trim().slice(0, 120),
    userEmail: user.email.trim().slice(0, 180),
    organizationId: String(user.organizationId || "public").slice(0, 120),
    commonName,
    commonNameEn: identification.commonNameEn.trim().slice(0, 120) || commonName,
    commonNameFr: identification.commonNameFr.trim().slice(0, 120) || commonName,
    scientificName,
    fact,
    factEn: identification.factEn.trim().slice(0, 500) || fact,
    factFr: identification.factFr.trim().slice(0, 500) || fact,
    normalizedSpeciesKey,
    confidence: identification.confidence,
    reason: identification.reason.trim().slice(0, 500),
    reasonEn: identification.reasonEn.trim().slice(0, 500) || identification.reason.trim().slice(0, 500),
    reasonFr: identification.reasonFr.trim().slice(0, 500) || identification.reason.trim().slice(0, 500),
    createdAt: now,
    updatedAt: now,
    status: "reward_owed",
    bugDexBugId: null,
    reviewThumbnailDataUrl
  };
}

export async function recordPendingBugDexDiscovery(input: BuildPendingDiscoveryInput): Promise<PendingBugDexDiscoveryRecord> {
  const record = buildPendingBugDexDiscoveryRecord(input);
  const firebase = await import("../firebase");
  if (!firebase.isFirebaseConfigured) return record;
  const firestore = await import("firebase/firestore");
  await firestore.setDoc(
    firestore.doc(firebase.db, "pendingBugDexDiscoveries", record.scanId),
    record
  );
  return record;
}

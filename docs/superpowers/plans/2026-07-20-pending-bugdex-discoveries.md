# Pending BugDex Discoveries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store confident real-world bug identifications that are absent from the BugDex, tell the user a future reward is owed, and support the flow on Vercel web and Android.

**Architecture:** Extend the OpenAI response with an explicit catalog classification so low-confidence matches remain separate from genuinely missing species. The authenticated client stores one immutable Firestore discovery document per scan, including a small review thumbnail and the user who is owed a reward. Expo ImagePicker handles web/native capture; Android camera permission is restored through app config.

**Tech Stack:** Expo SDK 54, React Native, TypeScript, Firebase Auth/Firestore, Firestore Security Rules, Vercel Node function, OpenAI Responses API.

## Global Constraints

- Keep the OpenAI API key server-side.
- Do not use Cloud Storage or Cloud Functions.
- Store only a small review thumbnail for missing BugDex species.
- Do not award a BugDex item until the species exists in the catalog.
- Low-confidence identification must not create reward debt.
- Support Vercel web and Android camera capture.

---

### Task 1: Classification contract

**Files:**
- Modify: `server/realBugScan/openaiVision.mjs`
- Modify: `server/realBugScan/classification.mjs`
- Modify: `server/realBugScan/openaiVision.test.mjs`
- Modify: `server/realBugScan/classification.test.mjs`
- Modify: `src/services/realBugScanContract.ts`
- Modify: `src/services/realBugScanContract.test.ts`

- [ ] Add `catalogStatus: matched | not_in_catalog | uncertain` to structured output.
- [ ] Add `not_in_catalog` to scan status and require a confident named species before using it.
- [ ] Verify known, unknown, and uncertain classifications with tests.

### Task 2: Pending discovery persistence

**Files:**
- Create: `src/services/pendingBugDexDiscovery.ts`
- Create: `src/services/pendingBugDexDiscovery.test.ts`
- Modify: `src/services/realBugScanImagePolicy.ts`
- Modify: `src/services/realBugScanImagePolicy.test.ts`
- Modify: `src/services/realBugScanService.ts`
- Modify: `src/screens/RealBugScanScreen.tsx`

- [ ] Generate a 320 px JPEG review thumbnail at quality 0.35.
- [ ] Store immutable `pendingBugDexDiscoveries/{scanId}` data for confident missing species.
- [ ] Include uid, display name, email, species names, confidence, reason, timestamps, status `reward_owed`, and thumbnail.
- [ ] Show user copy explaining the species will be added and the reward remains owed.

### Task 3: Camera configuration

**Files:**
- Modify: `app.json`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] Remove CAMERA from blocked Android permissions.
- [ ] Configure `expo-image-picker` with a Dutch camera permission message and no microphone permission.
- [ ] Ensure native manifest no longer removes CAMERA.

### Task 4: Firestore rules and validation

**Files:**
- Modify: `firestore.rules`

- [ ] Allow authenticated users to create only their own immutable discovery records.
- [ ] Limit fields, strings, confidence range, status, scan id, and thumbnail size.
- [ ] Deny client reads, updates, and deletes.
- [ ] Compile rules and deploy only Firestore rules.

### Task 5: Verification and Vercel readiness

**Files:**
- Modify: `package.json`
- Create or modify: `vercel.json` only if required by the linked project build setup.

- [ ] Run real bug scan tests and typecheck.
- [ ] Export the web build.
- [ ] Validate Android resources/config.
- [ ] Verify the Vercel API build/deployment and required environment variables without exposing secrets.

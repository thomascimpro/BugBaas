# Real Bug Scan Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web test flow that captures or uploads an insect photo, identifies it through a server-side OpenAI API call, and grants the matching BugDex reward once per user and species.

**Architecture:** Add a hidden reusable Expo/React Native Web screen and client service inside BugBaas. Add a framework-neutral Node backend core with a Vercel adapter and local development server; the backend verifies Firebase ID tokens, calls the OpenAI Responses API with structured output, and validates the returned BugDex ID against a generated catalog. The internal lab reuses existing authenticated Firestore transactions for the three-scan limit and idempotent BugDex reward; production hardening moves those writes to Firebase Admin later.

**Tech Stack:** Expo 54, React Native Web, expo-image-picker, expo-image-manipulator, Firebase Auth/Firestore, Firebase Admin, OpenAI Responses API, Node test runner, Vercel-compatible Node function.

## Global Constraints

- Keep `OPENAI_API_KEY` and Firebase Admin credentials server-side only.
- Preserve Firebase Spark-compatible data sizes; do not store successful images.
- Maximum three submitted scans per user per Europe/Amsterdam calendar day.
- A technical API failure refunds the reserved attempt; a bad or non-bug photo consumes it.
- A real species is rewarded at most once per user; existing ownership gets a real-world spotted marker without another duplicate.
- Do not modify unrelated dirty worktree files.
- Reuse current BugDex IDs, names, rarity, inventory, unlock, and event document shapes.

---

### Task 1: Shared contract and deterministic helpers

**Files:**
- Create: `src/services/realBugScanContract.ts`
- Create: `src/services/realBugScanContract.test.ts`

**Interfaces:**
- Produces: `RealBugScanResponse`, `RealBugScanStatus`, `parseRealBugScanResponse`, `realBugScanApiUrl`.

- [ ] Write tests for response validation and URL normalization.
- [ ] Run tests and confirm they fail because the module does not exist.
- [ ] Implement the smallest contract parser and URL helper.
- [ ] Run tests and confirm they pass.

### Task 2: Server classification helpers

**Files:**
- Create: `shared/bugdex-catalog.json`
- Create: `server/realBugScan/classification.mjs`
- Create: `server/realBugScan/classification.test.mjs`

**Interfaces:**
- Produces: `buildBugCatalogPrompt(catalog)`, `normalizeIdentification(raw, catalog)`, `dayKeyInTimeZone(date, timeZone)`.

- [ ] Generate the catalog from `bugDexEntries` with only `id`, `name`, and `rarity`.
- [ ] Write failing tests for known matches, unknown IDs, confidence routing, and Amsterdam day keys.
- [ ] Implement minimal normalization and prompt generation.
- [ ] Run tests and confirm they pass.

### Task 3: Server-side OpenAI and Firebase authentication workflow

**Files:**
- Create: `server/realBugScan/openaiVision.mjs`
- Create: `server/realBugScan/firebaseTokenVerifier.mjs`
- Create: `server/realBugScan/handler.mjs`
- Create: `server/realBugScan/handler.test.mjs`
- Create: `api/real-bug-identify.js`
- Create: `scripts/realBugScanLocalServer.mjs`
- Create: `.env.real-bug-scan.example`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: generated catalog and classification helpers.
- Produces: POST `/api/real-bug-identify` accepting `{ imageDataUrl, scanId }` with `Authorization: Bearer <Firebase ID token>`.

- [ ] Write failing handler tests with injected auth, classifier, and reward store.
- [ ] Implement request validation, CORS, body limits, and dependency injection.
- [ ] Implement OpenAI Responses API image classification with strict JSON schema.
- [ ] Implement Firebase ID-token verification through the Identity Toolkit lookup endpoint.
- [ ] Add Vercel adapter and local server.
- [ ] Run backend tests and confirm they pass.

### Task 4: Reusable web scan screen

**Files:**
- Create: `src/services/realBugScanService.ts`
- Create: `src/screens/RealBugScanScreen.tsx`
- Modify: `app.config.js`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `RealBugScanResponse` and Firebase Auth.
- Produces: hidden route `realBugScan`, opened on web by `?real-bug-scan=1` or `/real-bug-scan`.

- [ ] Add client service using Firebase ID token and configured API base URL.
- [ ] Add an authenticated Firestore transaction for three daily scans, technical-error refunds, and one real-world reward event per species.
- [ ] Add camera and upload fallback, preview, 1024px JPEG compression, loading, result, and error states.
- [ ] Add route with no bottom navigation while the lab is open.
- [ ] Keep copy compact and explicitly mention AI processing.

### Task 5: Verification and setup documentation

**Files:**
- Create: `docs/REAL_BUG_SCAN_LAB.md`

- [ ] Run contract tests and backend tests.
- [ ] Run `npm run typecheck`.
- [ ] Run Expo web export.
- [ ] Document local environment variables, two-terminal startup, URL, Vercel deployment variables, and untested real OpenAI/Firebase steps.
- [ ] Inspect the final targeted diff and confirm no secrets or unrelated files were added.

# Real Bug Scan Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the hidden real bug photo scanner as an official BugBaas feature with safe API usage, daily mission progress, Vercel deployment, and Android APK release.

**Architecture:** Keep the existing client scan UI and Vercel identification endpoint. Add small focused helpers for successful-scan progress, local duplicate prevention, and server-side quota reservation. Reuse existing routes and daily mission patterns; avoid new dependencies and Firebase Blaze-only features.

**Tech Stack:** Expo 54, React Native, TypeScript, Firebase Auth/Firestore Spark, Vercel Functions, OpenAI Responses API, Android Gradle.

## Global Constraints

- Android-first and small-screen safe.
- Firebase Spark only; no Cloud Functions or Cloud Storage additions.
- Keep image detail `high` and prepared image maximum 768 px.
- Maximum three AI scan attempts per user per Europe/Amsterdam day.
- Stage only intentional feature/release files; never stage local secrets or unrelated dirty worktree changes.
- Version target: `2.10.14`.

---

### Task 1: Daily scan progress contract

**Files:**
- Create: `src/services/realBugScanProgress.ts`
- Create: `src/services/realBugScanProgress.test.ts`
- Modify: `src/services/realBugScanService.ts`
- Modify: `src/services/dailyMissionService.ts`
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `firestore.rules`
- Modify: `package.json`

**Interfaces:**
- Produces: `isDailyRealBugScanSuccess(status): boolean`
- Produces: `recordDailyRealBugScanProgress(user, result): Promise<void>`
- Produces: `getDailyRealBugScanProgress(user, date?): Promise<number>`
- Daily mission context consumes `realBugScanProgress: number`.

- [ ] **Step 1: Write failing progress tests**

```ts
assert.equal(isDailyRealBugScanSuccess("matched"), true);
assert.equal(isDailyRealBugScanSuccess("already_spotted"), true);
assert.equal(isDailyRealBugScanSuccess("not_in_catalog"), true);
assert.equal(isDailyRealBugScanSuccess("pending_review"), true);
assert.equal(isDailyRealBugScanSuccess("rejected_no_bug"), false);
assert.equal(isDailyRealBugScanSuccess("rejected_quality"), false);
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `node --experimental-strip-types --test src/services/realBugScanProgress.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement immutable daily progress helper**

Use `realBugScanDayKey()` for Europe/Amsterdam day IDs. Store `users/{uid}/realBugScanProgress/{day}` with `{ day, completed: true, scanId, status, completedAt }`. In demo mode use an in-memory set.

- [ ] **Step 4: Record progress after a successful classified result**

In `submitRealBugScan`, call `recordDailyRealBugScanProgress` after reward/pending-discovery handling and before returning the parsed response. Do not record rejected or failed requests.

- [ ] **Step 5: Add progress to Home daily mission loading**

Load `getDailyRealBugScanProgress(user)` in `HomeScreen`, pass it into `dailyMissionSet`, and refresh it after returning to Home through the existing user/route lifecycle.

- [ ] **Step 6: Add daily mission template**

Add:

```ts
{
  id: "real-bug-scan",
  title: "mission.dailyRealBugScan",
  target: 1,
  reward: "mission.rewardXp10",
  rewardSource: "daily_mission_bonus",
  rewardXp: 10,
  progressFor: (_user, { realBugScanProgress }) => realBugScanProgress
}
```

- [ ] **Step 7: Add Firestore rules**

Allow owner read and create-only writes for `realBugScanProgress/{dayId}`. Require matching day ID, `completed == true`, valid status, authenticated uid, and immutable data.

- [ ] **Step 8: Run tests and typecheck**

Run: `npm run test:real-bug-scan && npm run typecheck`
Expected: PASS.

### Task 2: Official navigation and Home report card

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Modify: `App.tsx`
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/RealBugScanScreen.tsx`
- Modify: `src/services/i18n.tsx`

**Interfaces:**
- Bottom navigation accepts `realBugScan` instead of `bugs`.
- Home report card calls `onNavigate("bugs")`.

- [ ] **Step 1: Replace the bottom Bugs item**

Change nav route type and item:

```ts
{ route: "realBugScan", labelKey: "nav.bugScan", bugId: "lieveheersbeestje" }
```

Keep five items and the existing center Arena emphasis.

- [ ] **Step 2: Update main navigation types**

Allow `navigateMain` to receive `realBugScan`. Keep the existing hidden URL route for direct web testing.

- [ ] **Step 3: Keep bottom navigation visible on the scan screen**

Remove the `!realBugScanRouteActive` condition around `BottomNav`. Keep walking bugs hidden during scanning. Make scan content bottom padding large enough to clear the nav.

- [ ] **Step 4: Change scan back behavior**

`RealBugScanScreen` back action returns Home. Result secondary action says `Terug naar home`.

- [ ] **Step 5: Remove production gallery upload**

Delete `uploadPhoto()` and the `Kies testfoto` button. Camera remains the only official capture path.

- [ ] **Step 6: Add Home report/tip card**

Insert a compact card before the Wiki card with title `Meld bug of tip`, supporting copy, and CTA. Press opens route `bugs`.

- [ ] **Step 7: Add translations**

Add Dutch and English keys for `nav.bugScan`, daily mission title, Home report card, and updated scan copy.

- [ ] **Step 8: Run typecheck and web export**

Run: `npm run typecheck && npx expo export --platform web --output-dir tmp/real-bug-scan-release-web`
Expected: PASS and export completes.

### Task 3: Duplicate prevention and server-side API quota

**Files:**
- Create: `src/services/realBugScanFingerprint.ts`
- Create: `src/services/realBugScanFingerprint.test.ts`
- Create: `server/realBugScan/firebaseUsageStore.mjs`
- Create: `server/realBugScan/firebaseUsageStore.test.mjs`
- Modify: `src/services/realBugScanService.ts`
- Modify: `server/realBugScan/handler.mjs`
- Modify: `server/realBugScan/handler.test.mjs`
- Modify: `server/realBugScan/openaiVision.mjs`
- Modify: `api/real-bug-identify.js`
- Modify: `firestore.rules`
- Modify: `package.json`

**Interfaces:**
- Produces: `realBugScanFingerprint(dataUrl): Promise<string>`
- Produces: `hasRecentRealBugScanFingerprint(user, fingerprint, day): Promise<boolean>`
- Server handler consumes `reserveUsage({ uid, dayKey, scanId })` and `refundUsage(...)`.

- [ ] **Step 1: Write failing duplicate tests**

Verify identical prepared data URLs generate identical fingerprints and different images generate different fingerprints.

- [ ] **Step 2: Implement Web Crypto SHA-256 fingerprinting**

Hash only the prepared base64 payload. Store a local AsyncStorage key per uid/day/fingerprint after a classified response. Reject a repeat before reserving a client attempt.

- [ ] **Step 3: Write failing server quota tests**

Cover first reservation, fourth-attempt rejection, duplicate `scanId`, and refund after upstream failure.

- [ ] **Step 4: Implement Firebase REST quota store**

Use the authenticated user ID token against Firestore REST. Read with ETag and write with `if-match` to `users/{uid}/realBugScanServerUsage/{day}`. Fields: `day`, `used`, `scanIds`, `updatedAt`. Retry conflicts a small fixed number of times.

- [ ] **Step 5: Reserve before OpenAI**

After token verification and body validation, reserve quota before `identifyImage`. Return HTTP 429 when exhausted or duplicate. Refund only when `identifyImage` throws.

- [ ] **Step 6: Tighten client usage rules**

Remove client decrement permission for `realBugScanUsage`; client usage can only increment to 3. API server usage collection is readable by owner but not client-writable.

- [ ] **Step 7: Reduce structured output ceiling**

Change `max_output_tokens` from `1200` to `300`. Keep model, image detail, schema, and image dimensions unchanged.

- [ ] **Step 8: Run focused tests**

Run: `npm run test:real-bug-scan && npm run typecheck`
Expected: PASS.

### Task 4: Release metadata and documentation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app.json`
- Modify: `android/app/build.gradle`
- Modify: `CHANGELOG.md`
- Modify: `STATUS.md`
- Modify: `TESTRESULTS.md`
- Modify: `docs/REAL_BUG_SCAN_LAB.md`

- [ ] **Step 1: Bump version to 2.10.14**

Update all app/package/native version references consistently. Increment Android `versionCode` by one.

- [ ] **Step 2: Add release notes**

Document BugScan tab, Home report card, daily mission, server quota, camera-only capture, and API savings.

- [ ] **Step 3: Document production environment**

List required Vercel variables: `OPENAI_API_KEY`, `FIREBASE_API_KEY`, `BUG_SCAN_ALLOWED_ORIGINS`, optional `OPENAI_BUG_SCAN_MODEL`.

- [ ] **Step 4: Run complete local verification**

Run:

```bash
npm run typecheck
npm run test:real-bug-scan
npx expo export --platform web --output-dir dist-vercel-release
cd android && gradlew.bat :app:processDebugResources --console=plain
cd android && gradlew.bat :app:assembleRelease --console=plain
```

Expected: all commands succeed.

### Task 5: Deploy and publish

**Files:**
- Generated APK: `android/app/build/outputs/apk/release/app-release.apk`
- Release copy: `dist/BugBaas-2.10.14.apk`

- [ ] **Step 1: Verify deploy credentials and project links**

Run read-only Vercel, Firebase, and Git checks. Confirm the deployment target is `bugbaas.vercel.app` and Firebase project is the existing BugBaas project.

- [ ] **Step 2: Deploy Firestore rules**

Run: `npx firebase-tools deploy --only firestore:rules`
Expected: successful rules deployment.

- [ ] **Step 3: Deploy Vercel production**

Run the existing production Vercel workflow and verify `/api/real-bug-identify` rejects unauthenticated requests with 401 rather than routing to `index.html`.

- [ ] **Step 4: Copy APK**

Copy the verified release APK to `dist/BugBaas-2.10.14.apk`.

- [ ] **Step 5: Review and stage only intended files**

Use `git diff -- <explicit paths>` and explicit `git add <paths>`. Exclude `.env*`, `new secret key/`, unrelated generated assets, and pre-existing unrelated modifications.

- [ ] **Step 6: Commit, tag, push, and publish release**

Use release commit `release: BugBaas 2.10.14`, tag `v2.10.14`, push the intended branch/tag, and upload `dist/BugBaas-2.10.14.apk` to the GitHub Release.

- [ ] **Step 7: Online verification**

Verify production web loads, BugScan route exists after login, API auth rejection works, and GitHub Release contains the APK.

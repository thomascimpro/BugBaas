# FitnessSyncer User Credentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each signed-in BugBaas user enter their own FitnessSyncer Client ID and Client Secret, then connect and synchronize without administrator-provided provider credentials.

**Architecture:** Firebase Functions keeps one BugBaas server encryption key. Each user's FitnessSyncer OAuth application credentials and access tokens are encrypted separately in `users/{uid}/privateIntegrations/fitnesssyncer`. The client can save, replace, or remove credentials but never reads stored secrets back.

**Tech Stack:** Expo 54, React Native, TypeScript, Firebase Authentication, Firestore Admin SDK, Firebase Functions v2, Node.js 22.

## Global Constraints

- Never expose `FITNESSSYNCER_TOKEN_KEY`, provider Client Secrets, access tokens, or refresh tokens to the Expo client.
- Keep OAuth state + PKCE and Firebase ID-token checks.
- Use the existing callback `https://us-central1-thomascimpro-6266f.cloudfunctions.net/fitnessSyncerCallback`.
- Make the smallest focused change; no new dependencies.
- Preserve Android-first layout and existing Settings card styling.

---

### Task 1: Separate server and user configuration

**Files:**
- Modify: `firebase/functions/fitnessSyncerCore.js`
- Modify: `firebase/functions/fitnessSyncerCore.test.js`

**Interfaces:**
- Produces: `fitnessServerConfigurationStatus(environment)` and `fitnessUserConfigurationStatus(credentials)`.

- [ ] Add failing tests proving the server only requires `FITNESSSYNCER_TOKEN_KEY` and a user requires `clientId` plus `clientSecret`.
- [ ] Run `npm test` in `firebase/functions` and confirm failure.
- [ ] Implement the two pure status helpers and exports.
- [ ] Run `npm test` and confirm pass.

### Task 2: Add authenticated credential lifecycle endpoints

**Files:**
- Modify: `firebase/functions/index.js`

**Interfaces:**
- Produces: `fitnessSyncerConfigure` POST `{ clientId, clientSecret }`.
- Produces: `fitnessSyncerClearConfiguration` POST with no payload.
- Changes status to return `serverReady`, `credentialsConfigured`, `configured`, and token-based `connected`.

- [ ] Add `fitnessSyncerConfigure` to validate non-empty values, encrypt them, replace existing OAuth tokens, and save only encrypted credentials.
- [ ] Add `fitnessSyncerClearConfiguration` to revoke when possible and remove credentials plus connection fields.
- [ ] Change start, callback, refresh, and disconnect to load the signed-in user's encrypted OAuth app credentials.
- [ ] Keep token key as the only process environment secret.
- [ ] Run Functions tests.

### Task 3: Add client service methods

**Files:**
- Modify: `src/services/fitnessSyncerService.ts`

**Interfaces:**
- Produces: `saveFitnessSyncerCredentials(clientId, clientSecret): Promise<FitnessSyncerStatus>`.
- Produces: `clearFitnessSyncerCredentials(): Promise<FitnessSyncerStatus>`.

- [ ] Update status types for server and per-user readiness.
- [ ] Add authenticated configure and clear requests.
- [ ] Run `npm run typecheck`.

### Task 4: Add Settings credential UI and instructions

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/services/fitnessSyncerLinks.ts`
- Modify: `src/services/fitnessSyncerLinks.test.ts`
- Modify: `src/services/i18n.tsx`

**Interfaces:**
- Consumes: service methods from Task 3.

- [ ] Point setup help to the official FitnessSyncer Developer Accounts page.
- [ ] Add Client ID and secure Client Secret fields for disconnected users.
- [ ] Make the primary action save entered credentials and immediately start OAuth; use saved credentials when both fields are blank.
- [ ] Add replace/remove controls and clear validation messages.
- [ ] Add Dutch, English, and French copy explaining where credentials come from and that the secret is stored encrypted.
- [ ] Run link tests and `npm run typecheck`.

### Task 5: Activate server encryption and deploy Functions

**Files:**
- Create ignored local file: `firebase/functions/.env.thomascimpro-6266f`
- Modify: `docs/FITNESSSYNCER_INTEGRATION.md`

**Interfaces:**
- Consumes: `FITNESSSYNCER_TOKEN_KEY` at Functions runtime.

- [ ] Generate a cryptographically random token key locally without printing it in user-facing output.
- [ ] Confirm the env file is ignored by Git.
- [ ] Update integration documentation for per-user OAuth credentials.
- [ ] Run `npm test`, `npm run typecheck`, and a production Functions deploy.
- [ ] Verify status/start endpoints still require Firebase authentication and preflight returns HTTP 204.

### Task 6: Review focused diff

**Files:**
- Review only FitnessSyncer files changed by this plan.

- [ ] Inspect the focused diff for secret exposure, accidental unrelated edits, and connection-state regressions.
- [ ] Report changed files, checks, deployment result, and remaining manual OAuth test.

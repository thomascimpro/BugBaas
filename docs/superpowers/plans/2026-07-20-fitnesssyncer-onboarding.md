# FitnessSyncer Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing FitnessSyncer OAuth and kilometer sync understandable and usable from BugBaas without exposing technical credentials to users.

**Architecture:** Keep the existing Firebase OAuth/API flow unchanged. Replace the misleading generic account-login action with platform-aware setup instructions and an official setup-help link, then keep the existing OAuth connect and sync buttons as the only BugBaas actions.

**Tech Stack:** Expo 54, React Native, TypeScript, Firebase Functions, Node test runner.

## Global Constraints

- Android-first and small-screen friendly.
- No new dependencies or Blaze-only services.
- Do not expose FitnessSyncer client credentials to users.
- Preserve the existing kilometer registration and duplicate-prevention flow.

---

### Task 1: Define testable setup guidance

**Files:**
- Modify: `src/services/fitnessSyncerLinks.test.ts`
- Modify: `src/services/fitnessSyncerLinks.ts`

- [ ] Write a failing test for platform-specific setup translation keys and the official FitnessSyncer setup-help URL.
- [ ] Run the focused Node test and confirm it fails because the setup guidance is missing.
- [ ] Add the minimal exported helper and URL.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Replace misleading login UI

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/services/i18n.tsx`

- [ ] Render a compact numbered setup checklist using the platform-specific keys.
- [ ] Replace `Open FitnessSyncer-login` with an optional official setup-help link.
- [ ] Keep `Koppel FitnessSyncer`, `Nu synchroniseren`, and disconnect behavior unchanged.
- [ ] Add Dutch, English, and French copy explaining source, permissions, first source sync, OAuth approval, and BugBaas sync.

### Task 3: Verify the complete path

**Files:**
- Verify: `src/screens/SettingsScreen.tsx`
- Verify: `src/services/fitnessSyncerService.ts`
- Verify: `firebase/functions/index.js`

- [ ] Run the focused setup test.
- [ ] Run Firebase Functions tests.
- [ ] Run `npm run typecheck`.
- [ ] Review the targeted diff and confirm no unrelated files were changed by this task.

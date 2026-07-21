# Real Bug Scan Image Compression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce uploaded bug photos before AI analysis while preserving enough detail for reliable recognition.

**Architecture:** Add a small pure compression policy helper that determines the first and fallback resize/compression settings. Keep Expo image manipulation inside `RealBugScanScreen`, using the helper to run a second pass only when the first JPEG remains above 750 KB.

**Tech Stack:** TypeScript, Expo ImageManipulator, Node test runner.

## Global Constraints

- First pass: longest side 768 px, JPEG quality 0.60.
- Fallback pass above 750 KB: longest side 640 px, JPEG quality 0.50.
- Never upscale small images.
- Keep the compressed image as the preview and API payload.
- Do not modify unrelated files or add dependencies.

---

### Task 1: Compression policy

**Files:**
- Create: `src/services/realBugScanImagePolicy.ts`
- Create: `src/services/realBugScanImagePolicy.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `primaryRealBugPhotoPlan(width, height)` and `shouldFallbackRealBugPhoto(base64)`.

- [ ] Write failing tests for 768 px sizing, no upscaling, and the 750 KB fallback threshold.
- [ ] Run the focused test and verify it fails because the policy module does not exist.
- [ ] Implement the pure compression policy.
- [ ] Run the focused test and verify all cases pass.

### Task 2: Screen integration

**Files:**
- Modify: `src/screens/RealBugScanScreen.tsx`

**Interfaces:**
- Consumes: compression policy helpers from Task 1.
- Produces: a compressed JPEG preview and data URL used by `submitRealBugScan`.

- [ ] Replace the current 1024 px / 0.72 pass with the 768 px / 0.60 plan.
- [ ] Run a second 640 px / 0.50 manipulation only when the first base64 payload exceeds 750 KB.
- [ ] Keep error handling and UI flow unchanged.

### Task 3: Verification

**Files:**
- No additional source files.

- [ ] Run `npm.cmd run test:real-bug-scan` and verify zero failures.
- [ ] Run `npm.cmd run typecheck` and verify zero TypeScript errors.
- [ ] Run `npx.cmd expo export --platform web --output-dir tmp/real-bug-scan-compression-check` and verify the web bundle succeeds.
- [ ] Inspect the targeted diff and confirm no secrets or unrelated files were changed.

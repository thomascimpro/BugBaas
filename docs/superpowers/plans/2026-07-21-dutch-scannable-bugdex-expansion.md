# Dutch Scannable BugDex Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 48 recognizable Dutch scan results with safe drop-only unlocking, gameplay rarity, category membership, facts and valid BugDex art.

**Architecture:** Extend the existing flat `bugDexEntries` catalog with an optional unlock mode. Separate set filtering from badge completion by freezing current badge members in `badgeBugIds`, then add two filter-only Dutch sets. Reuse existing transparent art assets through new `bugArt` aliases so no missing-image state can reach the app.

**Tech Stack:** Expo 54, React Native 0.81, TypeScript 5.9, Firebase client SDK.

## Global Constraints

- Android-first and no new dependency.
- Firebase Spark compatible; no Cloud Functions or Storage changes.
- Preserve all current BugDex IDs and badge completion requirements.
- Add exactly 48 new IDs and no Mythic rarity.
- New entries are drop-only and must not be granted by point synchronization.
- Every new entry must resolve to a valid art source.
- Do not touch unrelated existing workspace changes.

---

### Task 1: Safe catalog unlock mode

**Files:**
- Modify: `src/services/pointsService.ts`
- Test: `src/services/bugDexCatalog.test.ts`

**Interfaces:**
- Produces: `BugDexUnlockMode = "rank" | "drop"`
- Produces: `BugDexEntry.unlockMode?: BugDexUnlockMode`
- Produces: `isBugDexEntryUnlocked()` returns `false` for drop-only entries.

- [ ] Add `BugDexUnlockMode` and the optional `unlockMode` field.
- [ ] Update `isBugDexEntryUnlocked` to require `(entry.unlockMode ?? "rank") === "rank"`.
- [ ] Add a focused catalog test asserting a drop-only entry cannot rank-unlock.

### Task 2: Add 48 catalog entries and facts

**Files:**
- Modify: `src/services/pointsService.ts`
- Test: `src/services/bugDexCatalog.test.ts`

**Interfaces:**
- Consumes: `BugDexEntry.unlockMode`
- Produces: 48 unique new entries with `unlockMode: "drop"`.

- [ ] Append the approved 48 IDs, Dutch names, titles, rarity, variant, level and notes.
- [ ] Add one Dutch fact for every new ID.
- [ ] Assert exact new-entry count, unique IDs and zero Mythic additions.

### Task 3: Separate filters from badge requirements

**Files:**
- Modify: `src/services/bugDexSetService.ts`
- Modify: `src/services/characterService.ts`
- Modify: `src/screens/ProfileScreen.tsx`
- Test: `src/services/bugDexCatalog.test.ts`

**Interfaces:**
- Produces: `BugDexSet.badgeId?: string`
- Produces: `BugDexSet.badgeBugIds?: string[]`
- Produces: `bugDexSetBadgeBugIds(set): string[]`

- [ ] Freeze each existing set's current members in `badgeBugIds`.
- [ ] Add new entries to relevant thematic `bugIds` arrays.
- [ ] Add `dutch_home` and `dutch_garden` without badge IDs.
- [ ] Make badge checks consume `bugDexSetBadgeBugIds`.
- [ ] Assert old badge requirements did not change.

### Task 4: Add valid art aliases

**Files:**
- Modify: `src/services/bugArt.ts`
- Test: `src/services/bugDexCatalog.test.ts`

**Interfaces:**
- Produces: one `bugArt` mapping for every new ID.

- [ ] Map `bedwants` to `assets/new bugs/cropped/bed-bug.png`.
- [ ] Map remaining IDs to the closest existing transparent BugDex asset.
- [ ] Assert all 48 new IDs exist in `allBugArtIds`.

### Task 5: Add category translations

**Files:**
- Modify: `src/services/i18n.tsx`

**Interfaces:**
- Produces translation keys for `dutch_home` and `dutch_garden` in Dutch, English and French.

- [ ] Add set labels and descriptions to all three locale blocks.
- [ ] Keep entry name/title/fact fallback generation unchanged.

### Task 6: Verify integration

**Files:**
- Review all modified files.

**Interfaces:**
- Consumes all prior task outputs.

- [ ] Run `node --experimental-strip-types --test src/services/bugDexCatalog.test.ts`.
- [ ] Run `npm run typecheck`.
- [ ] Inspect `git diff --` only for task files and confirm unrelated changes are untouched.

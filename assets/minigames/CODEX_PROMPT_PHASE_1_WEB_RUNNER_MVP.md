# Codex prompt: BugBaas Arcade hub + Web Runner MVP

## Goal

Build the first playable mini-game expansion for BugBaas without breaking the existing Duel flow.

End result:

1. The existing Duel screen becomes an Arcade-style hub with four modes:
   - Tap Duel: existing Bug Smash Duel, unchanged behavior.
   - Web Runner: new playable MVP.
   - Nest Defense: visible placeholder only.
   - Bug Glide: visible placeholder only.
2. Web Runner is fully playable locally.
3. Results and high scores are local-only.
4. No Firebase writes.
5. No rewards.
6. No Bug Mastery XP.
7. No Firestore rules changes.
8. Existing users and older app versions must keep working.

## Read first

Before coding, read these files:

```text
README.md
STATUS.md
TESTRESULTS.md
assets/minigames/ARCADE_GAME_DESIGN.md
assets/minigames/ASSET_MANIFEST.md
assets/minigames/web-runner/README.md
docs/ASSET_UI_CHANGE_NOTES.md
src/screens/BugSmashDuelScreen.tsx
src/services/i18n.tsx
src/types.ts
```

Also inspect current patterns in:

```text
src/services/*Service.ts
src/components/*
```

Use existing style patterns from BugBaas. Do not introduce a new styling framework.

## Hard constraints

Do not do any of this:

- Do not change Firestore rules.
- Do not deploy Firebase.
- Do not write to Firebase from the new mini-games.
- Do not change existing `BugSmashDuel` document structure.
- Do not rename existing fields, enum values, routes, or Firebase collections.
- Do not add mandatory fields to existing user/bug/duel records.
- Do not add native Android changes.
- Do not add new dependencies unless absolutely required. Prefer zero new dependencies.
- Do not implement Nest Defense yet.
- Do not implement Bug Glide yet.
- Do not add online leaderboard yet.
- Do not add rewards, points, economy, mastery XP, or missions.
- Do not break Tap Duel.

Backward compatibility rule:

Existing users on older versions must continue to work. This task should be UI/local-state only.

## Preferred implementation shape

Keep the implementation maintainable. `BugSmashDuelScreen.tsx` is already large.

Preferred approach:

1. Add small dedicated components inside `BugSmashDuelScreen.tsx` only if the change stays manageable.
2. If Web Runner logic becomes large, create a new file:

```text
src/components/minigames/WebRunnerGame.tsx
```

3. If shared arcade result logic is needed, create:

```text
src/services/arcadeResultService.ts
```

4. If asset mapping is needed, create:

```text
src/services/minigameAssets.ts
```

Keep file count small and clear.

Allowed files for this task:

```text
src/screens/BugSmashDuelScreen.tsx
src/services/i18n.tsx
src/services/arcadeResultService.ts
src/services/minigameAssets.ts
src/components/minigames/WebRunnerGame.tsx
src/types.ts
```

Only touch assets if a file already exists and needs a require mapping. Do not create binary assets.

## Asset rules

Use real PNG files only when present.

Do not use data URI embedded images.

Expected Web Runner assets from manifest:

```text
assets/minigames/web-runner/web-runner-background.png
assets/minigames/web-runner/web-runner-lane-tile.png
assets/minigames/web-runner/runner-bug-idle.png
assets/minigames/web-runner/runner-bug-jump.png
assets/minigames/web-runner/runner-bug-hit.png
assets/minigames/web-runner/obstacle-web.png
assets/minigames/web-runner/obstacle-water-drop.png
assets/minigames/web-runner/obstacle-leaf-pile.png
assets/minigames/web-runner/pickup-nectar.png
assets/minigames/web-runner/pickup-speed.png
assets/minigames/web-runner/pickup-shield.png
```

If assets are missing, use fallback visuals:

- lanes as styled `View` blocks
- player as `BugArtImage` or a styled bug-like circle/card
- obstacles as colored rounded blocks with short labels/icons
- pickups as small glowing circles

Fallbacks must look acceptable on mobile and must not crash.

## Arcade hub requirement

Replace or extend the current Arena/Duel mode selector into an Arcade hub.

Hub must show four full-width mobile-friendly cards/buttons:

1. Tap Duel
   - Opens existing Duel flow exactly as before.
   - Existing rating panel and duel logic must still work.

2. Web Runner
   - Opens the new Web Runner game shell.
   - Shows local best score when available.
   - Status: Ready.

3. Nest Defense
   - Placeholder only.
   - Status: Coming next.
   - Tapping opens a simple placeholder panel, not a broken game.

4. Bug Glide
   - Placeholder only.
   - Status: Coming next.
   - Tapping opens a simple placeholder panel, not a broken game.

Hub card content:

- Title
- One-line skill promise
- Best local score if applicable
- Status pill
- Image/fallback visual

Keep the style consistent with current BugBaas dark mobile game UI.

## Shared result model

Use this model for local Web Runner result:

```ts
type ArcadeMode = "tap_duel" | "web_runner" | "nest_defense" | "bug_glide";

type ArcadeRunResult = {
  mode: ArcadeMode;
  score: number;
  durationMs: number;
  pickups: number;
  hits: number;
  combo: number;
  streak: number;
  timestamp: string;
  localHighScore: number;
  ratingPreview?: number;
};
```

MVP storage:

- Local only.
- Use `AsyncStorage`.
- Suggested key pattern:

```text
bugbaas:arcade:highScore:<uid>:<mode>
```

Do not store to Firestore.

If using `src/services/arcadeResultService.ts`, include functions like:

```ts
loadArcadeHighScore(uid: string, mode: ArcadeMode): Promise<number>
saveArcadeHighScore(uid: string, mode: ArcadeMode, score: number): Promise<number>
```

Return the resulting high score.

## Web Runner MVP gameplay

Core fantasy:

A fast bug runs through a garden path, dodging webs and collecting nectar.

Simple explanation in UI:

Swipe left/right to switch lanes. Tap to jump. Avoid obstacles, collect nectar, keep combo alive.

Controls:

- Swipe left: move one lane left.
- Swipe right: move one lane right.
- Tap: jump.
- Add optional on-screen buttons for reliability on emulator/small phone:
  - Left
  - Jump
  - Right

For MVP, buttons may always be visible at the bottom. Minimum touch size: around 48px.

Game rules:

- Duration: 45 seconds.
- Three lanes: 0, 1, 2.
- Player stays near bottom of screen.
- Obstacles move toward player.
- Pickups move toward player.
- Speed increases every 10 seconds.
- No native physics. Use simple time-based movement.
- Max active entities: 18.
- Entity cleanup must be deterministic.

Obstacles:

1. Web
   - Lane block.
   - Hit if player is in same lane and not shielded.
2. Water drop
   - Jump obstacle.
   - Player avoids it if jumping.
3. Leaf pile
   - Low obstacle.
   - Player avoids it if jumping.

Pickups:

1. Nectar
   - Points.
2. Speed
   - Temporary score multiplier only. Do not increase movement speed in MVP.
3. Shield
   - Absorbs one hit.

Hit rules:

- Hit obstacle breaks combo.
- If shield is active, consume shield and do not count as damage hit.
- Three unshielded hits ends run early.
- Score must never go below 0.

Jump rule:

- Jump lasts short fixed time, for example 500-700ms.
- During jump, water drop and leaf pile are avoided.
- Web still blocks lane unless design says otherwise. For MVP, web hits even while jumping.

Speed/difficulty:

- 0-10s: easy, single obstacles, wide gaps.
- 10-25s: medium, more obstacles, occasional pickup bait.
- 25-45s: faster scroll, tighter gaps.

Keep it playable. Do not make impossible patterns.

Scoring:

Use the documented formula:

```text
distance = secondsAlive * 8
pickupScore = nectar * 10 + speedPickup * 15 + shieldPickup * 12
comboScore = maxCombo * 3
penalty = hits * 25
score = distance + pickupScore + comboScore - penalty
```

Clamp final score to minimum 0.

During run, displayed score can update live using the same components of the formula or a simple running score. Result screen must use the final formula.

Result screen must show:

- Mode name: Web Runner
- Score
- Best score
- Pickups
- Hits
- Max combo
- Duration survived
- Retry button
- Back to Arcade button

## Web Runner UI states

Required states:

1. Ready
   - Show instructions.
   - Start button.
2. Countdown
   - 3, 2, 1 or short ready state.
3. Running
   - HUD: timer, score, hits/hearts, shield, combo.
   - Player visible.
   - Lanes visible.
   - Obstacles and pickups visible.
4. Result
   - Final result and actions.
5. Exit confirmation
   - If leaving during active run, ask confirmation.

## Mobile/small phone requirements

Target: Android Small_Phone emulator.

Layout rules:

- No tiny required text during gameplay.
- Controls must be large enough for touch.
- HUD must not cover player/obstacles.
- Keep the running area readable.
- No horizontal overflow.
- Works in portrait mode.

## i18n requirements

Add clear Dutch and English labels to `src/services/i18n.tsx`.

Minimum keys:

```text
arcade.title
arcade.tapDuel.title
arcade.tapDuel.body
arcade.webRunner.title
arcade.webRunner.body
arcade.webRunner.ready
arcade.webRunner.start
arcade.webRunner.instructions
arcade.webRunner.resultTitle
arcade.webRunner.bestScore
arcade.webRunner.retry
arcade.webRunner.backToArcade
arcade.nestDefense.title
arcade.nestDefense.body
arcade.bugGlide.title
arcade.bugGlide.body
arcade.status.ready
arcade.status.comingNext
arcade.status.practice
```

Use existing translation style. Do not hardcode visible UI text when translation helpers are already used nearby.

## Existing Duel must not regress

Tap Duel/current Duel behavior must stay intact:

- Existing challenge flow works.
- Existing training flow works.
- Existing solo campaign works.
- Existing powerups still work.
- Existing rating display still works.
- Existing BugSmashDuel Firebase path remains untouched.

Do not alter current duel service contracts.

## Firebase and rules check

Expected result for this task:

- Firebase schema impact: none.
- Firestore rules impact: none.
- Existing users: safe.

If you find that a Firebase or rules change seems necessary, stop and report instead of implementing it.

## Testing required

Run:

```bash
npm run typecheck
```

Then build Android release:

```bash
cd android && ./gradlew.bat :app:assembleRelease --no-daemon --console=plain
```

If emulator is available, install/run:

```bash
adb -s emulator-5554 install -r android/app/build/outputs/apk/release/app-release.apk
adb -s emulator-5554 shell monkey -p nl.cimpro.bugbaas -c android.intent.category.LAUNCHER 1
adb -s emulator-5554 shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp"
```

Expected foreground package:

```text
nl.cimpro.bugbaas/.MainActivity
```

## Manual QA checklist

After implementation, report whether each item is covered:

- Arcade hub shows four cards.
- Tap Duel still opens existing Duel mode.
- Web Runner opens and can start.
- Player cannot move outside lanes 0-2.
- Tap/jump works.
- Obstacles spawn and move.
- Pickups spawn and can be collected.
- Shield consumes once.
- Three unshielded hits ends the run.
- Timer ending also ends the run.
- Result screen shows score and best score.
- Retry resets entities, hits, pickups, combo, and timer.
- Back returns to Arcade hub.
- No Firebase writes were added.
- No rules change was made.

## Stop conditions

Stop and report if:

- Tap Duel breaks.
- Typecheck cannot pass.
- The required changes become larger than expected.
- Firebase/rules changes appear necessary.
- Web Runner needs new native dependencies.
- Existing app navigation becomes unstable.

## Final report format

Return a short Dutch report:

```text
Gewijzigd:
- <files>

Gebouwd:
- npm run typecheck: OK/FAIL
- Android release build: OK/FAIL
- Small_Phone run: OK/FAIL/not run

QA:
- Arcade hub: OK/FAIL
- Tap Duel unchanged: OK/FAIL
- Web Runner playable: OK/FAIL
- Local highscore: OK/FAIL

Firebase/rules:
- Impact: none / explain
- Rules changed: no / yes
- Existing users safe: yes / no

Open punten:
- <short list>
```

## Important quality bar

Build small, stable, and playable. Do not overbuild.

The MVP should feel like a real mini-game, but it does not need final art, perfect animations, or online scoring yet.

Prefer a clean playable loop over many unfinished features.

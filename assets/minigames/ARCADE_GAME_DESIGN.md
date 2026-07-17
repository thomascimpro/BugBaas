# Arcade Game Design

Status: implementation-ready design only. No game code in this task.

## Scope

Arcade becomes a four-button hub:

- Tap Duel: existing Bug Smash Duel.
- Web Runner: lane runner.
- Nest Defense: quick defense/tower-lite round.
- Bug Glide: vertical/side glide survival.

MVP principle: each game is local-first, short, deterministic enough for replay/debug, and returns the same result shape. No multiplayer, economy rewards, Bug Mastery XP, heavy animation system, native physics, or online matchmaking in the first build.

## Shared Arcade Result Model

Use one local result object for all mini-games:

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

Future online hook:

- `score` feeds local high score first.
- `ratingPreview` can later map into the same leaderboard/rating idea as Duel.
- Do not write into current `BugSmashDuel` documents for MVP.
- Tap Duel keeps its existing `BugSmashDuelScore` and rating path unchanged.

Shared scoring shape:

```text
score = baseObjectiveScore + pickupScore + comboScore + survivalScore - penaltyScore
```

Shared rating mapping for future use:

- Bronze: below 40% expected score.
- Silver: 40-69%.
- Gold: 70-89%.
- Elite: 90-109%.
- Master: 110%+.

Expected score is per mode and difficulty tier. MVP stores only local high score.

## Hub Design

The current Arena/Duel area already has mode cards and a rating panel. Replace the mode selector with four full-width arcade buttons/cards on mobile:

- Tap Duel: existing duel card and current rating.
- Web Runner: `arcade-card-web-runner.png`.
- Nest Defense: `arcade-card-nest-defense.png`.
- Bug Glide: `arcade-card-bug-glide.png`.

Card content:

- Image cover.
- Title.
- One-line skill promise.
- Best local score.
- Status pill: Ready, Coming next, or Practice.

Tap behavior:

- Tap Duel opens current Duel panel.
- Other games open their local game shell when implemented.

Fallback:

- If card PNG is missing, use existing card surface with gradient-free solid background, BugArtImage, and icon text.

## Web Runner

Core fantasy: a fast bug sprints through a garden path, dodging webs and collecting nectar.

10-second explanation: Swipe left/right to switch lanes, tap to jump. Avoid obstacles, collect nectar, keep the combo alive.

Controls:

- Swipe left/right: lane change.
- Tap: jump.
- Optional accessibility buttons: left, jump, right.

Game loop:

- 45-second run.
- Three lanes.
- Obstacles scroll toward player.
- Pickups appear between obstacle gaps.
- Speed increases every 10 seconds.

Win/fail:

- MVP has no hard fail.
- Hit obstacle loses shield or breaks combo.
- Three unshielded hits ends the run early.

Score:

```text
distance = secondsAlive * 8
pickupScore = nectar * 10 + speedPickup * 15 + shieldPickup * 12
comboScore = maxCombo * 3
penalty = hits * 25
score = distance + pickupScore + comboScore - penalty
```

Difficulty:

- 0-10s: single obstacles, wide gaps.
- 10-25s: paired obstacles.
- 25-45s: faster scroll, pickup bait near obstacles.

Pickups:

- Nectar: points.
- Speed: temporary score multiplier, not movement speed in MVP.
- Shield: absorbs one hit.

Obstacles:

- Web: lane block.
- Water drop: jump timing.
- Leaf pile: low obstacle.

UI states:

- Ready countdown.
- Running HUD: timer, score, lane feedback, shield.
- Hit feedback.
- Result screen: score, pickups, hits, max combo, retry, back.

Mobile layout:

- Full-screen lanes.
- Bottom 20% reserved for optional controls only when accessibility mode is enabled.
- No small text during run.

Assets:

- Required: `web-runner-background.png`, `runner-bug-idle.png`, `obstacle-web.png`, `pickup-nectar.png`, `arcade-card-web-runner.png`.
- Optional: jump/hit poses, lane tile, water drop, leaf pile, speed, shield.
- Fallback: View rectangles for lanes/obstacles, existing BugArtImage for player.

Performance:

- Max 18 active entities.
- Use `Animated`/state tick already proven in Duel; avoid physics dependency.
- No per-frame allocation-heavy arrays beyond current target model.

Manual QA:

- Lane swipe never moves outside 0-2.
- Jump clears jump obstacles.
- Shield consumes exactly once.
- Score never goes below 0.
- Retry resets speed, hits, pickups, combo.

## Nest Defense

Core fantasy: defend a bug nest from waves of garden enemies with quick traps and taps.

10-second explanation: Tap enemies to push them back. Place short-lived defenses around the nest before they break through.

Controls:

- Tap enemy: deal 1 damage.
- Tap defense button, then arena: place defense.
- Long press not required.

Game loop:

- 60-second defense round.
- Enemies spawn from edges and move toward nest.
- Player taps enemies and places limited defenses.
- Waves intensify every 15 seconds.

Win/fail:

- Win: survive 60 seconds.
- Fail: nest HP reaches 0.

Score:

```text
killScore = enemiesDefeated * 12
survivalScore = secondsAlive * 6
nestBonus = remainingNestHp * 40
comboScore = maxStreak * 4
penalty = leaks * 20
score = killScore + survivalScore + nestBonus + comboScore - penalty
```

Difficulty:

- More enemies over time.
- Tank beetles after 20s.
- Flying moths after 35s.

Defenses:

- Web trap: slows enemies in a small area.
- Leaf shield: blocks one enemy hit near nest.
- Stink cloud: short area damage pulse.

Enemies:

- Small ant: fast, low HP.
- Beetle tank: slow, high HP.
- Moth flying: ignores web trap, low HP.

UI states:

- Setup countdown with defense buttons visible.
- Running HUD: nest HP, wave timer, score.
- Defense cooldown states.
- Result screen: survived/wiped, score, enemies, leaks, nest HP.

Mobile layout:

- Nest centered lower-middle.
- Spawn lanes from top/left/right.
- Defense buttons bottom, 48px minimum.

Assets:

- Required: `nest-defense-background.png`, `nest-base.png`, `enemy-small-ant.png`, `arcade-card-nest-defense.png`, `ui-nest-heart.png`.
- Optional: damaged nest, web trap, leaf shield, stink cloud, beetle, moth, wave marker.
- Fallback: circular nest View, colored enemy dots, icon text buttons.

Performance:

- Max 24 enemies, max 6 active defense effects.
- Collision by simple distance checks.
- No pathfinding.

Manual QA:

- Nest HP decreases only when enemies reach nest.
- Defense cooldowns cannot go negative.
- Enemies are removed on defeat/leak.
- Result appears once.
- Retry clears all enemies/defenses.

## Bug Glide

Core fantasy: glide through a windy garden air stream while dodging birds, rain, and webs.

10-second explanation: Hold to rise, release to glide down. Collect pollen and nectar, dodge hazards, ride wind boosts.

Controls:

- Press/hold screen: rise.
- Release: descend.
- Tap controls fallback: up/down buttons.

Game loop:

- 45-second glide.
- Player x is mostly fixed; vertical movement responds to hold.
- Obstacles and pickups scroll from right to left.
- Wind swirl briefly stabilizes/rises.

Win/fail:

- Hit hazards lose one heart.
- Three hits ends run.
- Surviving full duration gives survival bonus.

Score:

```text
survivalScore = secondsAlive * 9
pickupScore = pollen * 8 + nectar * 14
noHitBonus = hits == 0 ? 150 : 0
streakScore = maxPickupStreak * 5
penalty = hits * 35
score = survivalScore + pickupScore + noHitBonus + streakScore - penalty
```

Difficulty:

- Early: sparse rain drops.
- Mid: webs plus pollen trails.
- Late: bird silhouettes and tighter gaps.

Pickups:

- Pollen: common score.
- Nectar: higher score.
- Wind swirl: short control assist.

Obstacles:

- Bird silhouette: large hazard.
- Rain drop: small fast hazard.
- Spider web: stationary slow/hit hazard.

UI states:

- Ready countdown.
- Running HUD: timer, score, hearts, streak.
- Wind boost indicator.
- Result screen: score, pickups, hits, no-hit badge.

Mobile layout:

- Full-screen field.
- Player left third.
- Keep HUD top; no bottom controls unless accessibility mode.

Assets:

- Required: `bug-glide-background.png`, `glider-bug-idle.png`, `obstacle-rain-drop.png`, `pickup-pollen.png`, `arcade-card-bug-glide.png`.
- Optional: up/down poses, bird, web, nectar, wind swirl, no-hit badge.
- Fallback: BugArtImage player, simple oval hazards/pickups.

Performance:

- Max 20 active entities.
- Fixed-step update with clamped delta.
- No native physics.

Manual QA:

- Hold/release movement is responsive.
- Player cannot leave screen.
- Three hits ends run.
- Wind boost expires.
- No-hit bonus only appears with zero hits.

## Shared UI And QA Rules

All new mini-games must support:

- Pause/exit confirmation.
- Retry from result.
- Back to Arcade hub.
- Local high score per mode.
- No rewards or mastery XP in MVP.
- Deterministic cleanup when unmounting.
- No Android/native changes in MVP.

Shared result screen:

- Title: mode name.
- Score.
- Best score.
- Pickups.
- Hits.
- Combo/streak.
- Retry and Arcade buttons.

## Phased Codex Build Plan

### Phase 1: Hub Shell

Allowed files:

- `src/screens/BugSmashDuelScreen.tsx`
- `src/services/i18n.tsx`
- optional `src/services/arcadeResultService.ts`

Test command: `npm run typecheck`

Acceptance:

- Four Arcade buttons visible.
- Tap Duel keeps current behavior.
- New games show locked/placeholder panel.
- No current Duel regression.

Stop condition:

- Hub compiles and current Duel still opens.

### Phase 2: Web Runner MVP

Allowed files:

- `src/screens/BugSmashDuelScreen.tsx`
- `src/services/i18n.tsx`
- optional `src/services/arcadeResultService.ts`
- optional `src/services/minigameAssets.ts`

Test command: `npm run typecheck`

Acceptance:

- Playable 45s lane runner.
- Score/result/local high score works.
- Fallback visuals if assets missing.

Stop condition:

- One complete Web Runner run can finish and retry.

### Phase 3: Nest Defense MVP

Allowed files: same as Phase 2.

Test command: `npm run typecheck`

Acceptance:

- 60s nest defense with enemies, nest HP, one trap type.
- Result model populated.
- Retry clears all state.

Stop condition:

- Win and fail both reachable.

### Phase 4: Bug Glide MVP

Allowed files: same as Phase 2.

Test command: `npm run typecheck`

Acceptance:

- Hold/release glide control.
- Hazards, pickups, hearts, result.
- No-hit badge logic.

Stop condition:

- Run can end by timeout or hits.

### Phase 5: Score/Rating Integration

Allowed files:

- `src/services/arcadeResultService.ts`
- `src/screens/BugSmashDuelScreen.tsx`
- `src/types.ts`
- `src/services/i18n.tsx`

Test command: `npm run typecheck`

Acceptance:

- Shared result model used by all three new games.
- Local high scores persist.
- Rating preview is display-only.
- Tap Duel rating unchanged.

Stop condition:

- Local results can be viewed without network writes.

### Phase 6: Asset Polish

Allowed files:

- `src/services/minigameAssets.ts`
- `src/screens/BugSmashDuelScreen.tsx`
- `assets/minigames/**` only if replacing missing files explicitly requested.

Test command: `npm run typecheck`

Acceptance:

- All available PNGs used from manifest.
- Missing PNG fallback documented in code.
- No layout overflow on small screens.

Stop condition:

- Screenshots show no broken/missing image crashes.

### Phase 7: QA/Performance

Allowed files:

- Bug fixes only in files touched by phases.

Test command:

- `npm run typecheck`
- Android smoke test if plugin/tool is available.

Acceptance:

- 10 repeated retries per game without stale entities.
- No timer keeps running after exit.
- No major frame stutter from entity count.
- Result screen appears once.

Stop condition:

- Ready for release candidate build.

## Feasibility And Time

Feasibility: high for MVP if built in phases. Risk is medium only if all three games are built in one pass, because `BugSmashDuelScreen.tsx` is already large and current Duel/Solo must not regress.

Estimated hands-on time:

- Design/spec task: 30-45 minutes.
- Phase 1 hub: 1-2 hours.
- Web Runner MVP: 2-4 hours.
- Nest Defense MVP: 3-5 hours.
- Bug Glide MVP: 2-4 hours.
- Shared result/high score polish: 1-2 hours.
- QA/polish pass: 2-4 hours.

Pragmatic total: 2-3 focused work sessions for stable MVP, longer if all assets and screenshots must be polished.

Recommended first build: Phase 1 then Phase 2 only. Ship one new mode behind the hub before adding the next two.

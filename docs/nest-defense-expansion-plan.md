# Nest Defense expansion plan

## Goal
Make Nest Defense feel like a real tower defense mini-game: readable waves, clear tower roles, active tapping, meaningful upgrades, and room to add art without rewriting the core loop.

## Current change set
- Manual tapping is always available and no longer uses a 3 second cooldown.
- Tower and ability taps are guarded so they do not accidentally trigger manual field attacks.
- Run length is extended from 90 seconds to 150 seconds.
- Wave pacing is slower and enemy scaling is less spiky.
- Starting nest HP and coins are increased.
- Tower build costs are lower, but upgrades scale more deliberately.
- Tower max level is increased from 3 to 4.
- Upgrade strength is toned down per level so longer runs do not snowball too quickly.

## Professional TD structure
### Core loop
1. Build a small defense.
2. Survive a wave.
3. Earn coins from kills.
4. Upgrade or diversify towers.
5. Use abilities for emergency control.
6. Face stronger mixed waves.

### Tower roles
- Rapid: cheap anti-fast tower, low damage, high fire rate.
- Heavy: expensive anti-tank/boss tower, high damage, slow fire rate.
- Slow: control tower, low damage, keeps enemies inside tower range longer.

### Economy rules
- Build costs should let the player place 2 towers early.
- First upgrades should be reachable after a few kills.
- Higher upgrades should require commitment.
- Boss kills should fund one meaningful upgrade, not a full rebuild.

### Wave rules
- Early waves: normal + a few fast enemies.
- Mid waves: tanks force heavy tower investment.
- Every 5th wave: boss pressure check.
- Late waves: mixed compositions, not only higher HP.

## Next art additions
Add these as separate transparent PNGs under `assets/minigames/nest-defense/`:

1. `nest_background_garden.png`
- top-down leaf/soil background
- readable path space
- dark green/brown palette

2. `nest_path_overlay.png`
- clear winding insect trail
- soft dirt/leaf edge
- should sit above background, below enemies

3. `tower_rapid_leaf_spitter.png`
- small green tower
- conveys fast shots

4. `tower_heavy_stink_launcher.png`
- heavier red/brown tower
- conveys splash or heavy hit

5. `tower_slow_web_spinner.png`
- web/blue-white tower
- conveys slow/control

6. `ability_bug_spray.png`
- spray bottle or mist icon

7. `ability_sticky_web.png`
- web trap icon

8. `enemy_fast_ant.png`
- small fast silhouette

9. `enemy_tank_beetle.png`
- large armored beetle

10. `enemy_boss_goliath.png`
- large boss sprite with readable outline

## Follow-up implementation plan
1. Replace cropped generated background with dedicated background and path overlay.
2. Add projectile visuals per tower type.
3. Add upgrade preview text on tower slot: cost, next level, expected role.
4. Add pre-wave warning for boss waves.
5. Add wave composition table so difficulty is deterministic and tunable.
6. Add optional endless mode after 150 seconds.
7. Add balance constants at top of file in one config object.

## Acceptance checks
- Tapping enemies works continuously.
- Tapping tower slots does not fire manual attack.
- Using abilities does not block tower building or upgrading.
- First 45 seconds are survivable with imperfect play.
- Full 150 seconds is possible with good tower placement and upgrades.
- Boss waves require heavy/control towers but are not instant fail checks.

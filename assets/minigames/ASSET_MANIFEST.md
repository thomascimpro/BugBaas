# Mini-games asset manifest

Doel: vaste assetnamen voor Web Runner, Nest Defense, Bug Glide en gedeelde Arcade UI. Gebruik PNG tenzij anders vermeld.

Regels:
- Character, obstacle, pickup en icon assets: transparante achtergrond.
- Background assets: volledige achtergrond, geen transparantie nodig.
- Geen tekst in afbeeldingen.
- HD mobile game stijl: vriendelijk 3D/cartoon fantasy bug world.
- Exporteer met nette crop rond onderwerp, geen grote lege randen.
- Houd bestanden zo klein mogelijk na export.

| Game | Filename | Type | Target size | In-app size | Omschrijving |
|---|---|---:|---:|---:|---|
| Web Runner | web-runner-background.png | background | 1536x1024 | full screen | Tuinpad met 3 duidelijke lanes |
| Web Runner | web-runner-lane-tile.png | tile | 512x256 | repeated/cover | Mos/aarde lane strip |
| Web Runner | runner-bug-idle.png | transparent | 512x512 | 56-96px | Speelbare rennende bug |
| Web Runner | runner-bug-jump.png | transparent | 512x512 | 56-96px | Spring pose |
| Web Runner | runner-bug-hit.png | transparent | 512x512 | 56-96px | Geraakte/stunned pose |
| Web Runner | obstacle-web.png | transparent | 512x512 | 48-90px | Spinrag obstakel |
| Web Runner | obstacle-water-drop.png | transparent | 512x512 | 48-90px | Vallende waterdruppel |
| Web Runner | obstacle-leaf-pile.png | transparent | 512x512 | 48-100px | Bladerenhoop |
| Web Runner | pickup-nectar.png | transparent | 512x512 | 36-64px | Nectar pickup |
| Web Runner | pickup-speed.png | transparent | 512x512 | 36-64px | Speed pickup |
| Web Runner | pickup-shield.png | transparent | 512x512 | 36-64px | Shield pickup |
| Nest Defense | nest-defense-background.png | background | 1536x1024 | full screen | Bosgrond/tuin arena rond nest |
| Nest Defense | nest-base.png | transparent | 768x768 | 120-180px | Gezond bug nest |
| Nest Defense | nest-damaged.png | transparent | 768x768 | 120-180px | Beschadigd nest |
| Nest Defense | trap-web.png | transparent | 512x512 | 60-120px | Web slow trap |
| Nest Defense | defense-leaf-shield.png | transparent | 512x512 | 60-120px | Bladschild effect |
| Nest Defense | defense-stink-cloud.png | transparent | 512x512 | 60-140px | Stink bomb cloud |
| Nest Defense | enemy-small-ant.png | transparent | 512x512 | 42-72px | Snelle mier enemy |
| Nest Defense | enemy-beetle-tank.png | transparent | 512x512 | 60-96px | Trage tank kever |
| Nest Defense | enemy-moth-flying.png | transparent | 512x512 | 52-84px | Vliegende mot enemy |
| Nest Defense | ui-wave-marker.png | transparent | 256x256 | 24-40px | Wave indicator |
| Nest Defense | ui-nest-heart.png | transparent | 256x256 | 20-36px | Nest HP icoon |
| Bug Glide | bug-glide-background.png | background | 1536x1024 | full screen | Luchtige tuin met diepte |
| Bug Glide | glider-bug-idle.png | transparent | 512x512 | 56-96px | Zwevende bug neutraal |
| Bug Glide | glider-bug-up.png | transparent | 512x512 | 56-96px | Omhoog flap pose |
| Bug Glide | glider-bug-down.png | transparent | 512x512 | 56-96px | Daal pose |
| Bug Glide | obstacle-bird-silhouette.png | transparent | 512x512 | 60-120px | Vogel silhouette obstacle |
| Bug Glide | obstacle-rain-drop.png | transparent | 512x512 | 40-80px | Regendruppel obstacle |
| Bug Glide | obstacle-spider-web.png | transparent | 512x512 | 60-120px | Web obstacle |
| Bug Glide | pickup-pollen.png | transparent | 512x512 | 32-58px | Pollen pickup |
| Bug Glide | pickup-nectar.png | transparent | 512x512 | 32-58px | Nectar pickup |
| Bug Glide | effect-wind-swirl.png | transparent | 512x512 | 80-160px | Wind swirl boost |
| Bug Glide | ui-no-hit-badge.png | transparent | 256x256 | 28-48px | No-hit badge |
| Shared | arcade-card-tap-duel.png | background/card | 1024x512 | card cover | Tap Duel hub card |
| Shared | arcade-card-web-runner.png | background/card | 1024x512 | card cover | Web Runner hub card |
| Shared | arcade-card-nest-defense.png | background/card | 1024x512 | card cover | Nest Defense hub card |
| Shared | arcade-card-bug-glide.png | background/card | 1024x512 | card cover | Bug Glide hub card |
| Shared | ui-score-medal.png | transparent | 256x256 | 32-56px | Score medal |
| Shared | ui-retry-icon.png | transparent | 256x256 | 24-40px | Retry icoon |
| Shared | ui-back-icon.png | transparent | 256x256 | 24-40px | Back icoon |
| Shared | ui-combo-badge.png | transparent | 256x256 | 28-48px | Combo badge |
| Shared | ui-timer-badge.png | transparent | 256x256 | 28-48px | Timer badge |

Integratie:
- Maak later 1 asset map, bijvoorbeeld `src/services/minigameAssets.ts`.
- Importeer assets centraal, niet los verspreid door schermen.
- Houd MVP fallback met View/Text shapes zolang PNG ontbreekt.

# Game Balance Runbook

Procedures voor XP, BugDex kansen en duel-helper balance.

## XP per actie

Bronbestand: `src/services/rewardBalanceService.ts`.

Huidige waarden:

| Actie | XP |
| --- | ---: |
| Daily login claim | 5 |
| Duel verliezen | 5 |
| Duel winnen | 10 |
| Movement radar bug | 3 per bug |
| Weekly mission claim | 10 |
| Weekly all-3 bonus claim | 10 + BugDex reward |
| Foreground catch common | 1 |
| Foreground catch rare | 3 |
| Foreground catch epic | 6 |
| Foreground catch legendary | 10 |
| Foreground catch mythic | 15 |

Procedure:

1. Pas alleen `rewardBalanceService.ts` aan.
2. Controleer alle callsites met `rg "duelWinXp|weeklyMissionXp|weeklyMissionBonusXp|foregroundCatchXpByRarity|movementRadarXpPerBug|dailyLoginXp" src`.
3. Houd spamgevoelige acties laag: duel loss/win, foreground catch en repeatable movement.
4. Geef weekly/daily XP pas na claim, niet bij openen van modal of voorbereiden van reward.
5. Voeg een korte `CHANGELOG.md` regel toe als XP verandert.

## BugDex drop kans per actie

Bronbestand: `src/services/bugDexService.ts`.

Drop chance per actie:

| Bron | Kans op BugDex drop |
| --- | ---: |
| daily_login | 35% |
| bug_reported | 58% |
| comment | 24% |
| status_update | 22% |
| bug_fixed | 45% |
| upvote_given | 18% |
| profile_view | 8% |
| bug_splat | 35% |
| weekly_mission | 100% |
| duel_win | 100% |
| combine | 100% |

Rarity weights per bron:

| Bron | Gewoon | Zeldzaam | Episch | Legendarisch | Mythisch |
| --- | ---: | ---: | ---: | ---: | ---: |
| daily_login | 100 | 0 | 0 | 0 | 0 |
| bug_reported | 54.1 | 31 | 12 | 2.5 | 0.4 |
| comment | 68 | 27 | 4.7 | 0.3 | 0 |
| status_update | 0 | 67 | 30 | 2.7 | 0.3 |
| bug_fixed | 18 | 50 | 25 | 6.6 | 0.4 |
| upvote_given | 75 | 24.5 | 0.5 | 0 | 0 |
| profile_view | 88 | 12 | 0 | 0 | 0 |
| bug_splat | 65.1 | 25 | 7.5 | 2 | 0.4 |
| weekly_mission | 0 | 54 | 36 | 9.6 | 0.4 |
| duel_win | 68 | 24 | 6.5 | 1.1 | 0.4 |
| combine | 0 | 100 | 0 | 0 | 0 |

Procedure:

1. Mythisch blijft onder 0.5% voor random/repeatable sources.
2. Weekly mission mag hoge rarity-kansen hebben, maar alleen de all-3 bonus geeft een BugDex drop; losse weekly missions geven XP.
3. Duel win geeft al XP en een bug, dus houd rare/epic/legendary lager dan weekly.
4. Bug fixed mag beter zijn dan comment/upvote, maar rare bug types moeten niet te veel Legendarisch/Mythisch geven.
5. Na wijziging: update deze tabel en `CHANGELOG.md`.

## Duel helper balance

Bronbestand: `src/screens/BugSmashDuelScreen.tsx`.

Huidige uitgangspunten:

- Base taps: Gewoon 2, Zeldzaam 3, Episch 5, Legendarisch 7, Mythisch 9.
- Helper damage: Gewoon 1, Zeldzaam 2, Episch 3, Legendarisch 3, Mythisch 6.
- Helper cooldown: Gewoon 9000ms, Zeldzaam 7800ms, Episch 6500ms, Legendarisch 5100ms, Mythisch 4600ms.
- Helpers starten niet vol; initial charge blijft gedeeltelijk.
- Sticky geeft een korte slow/pauze en +1 hit als de target nog meer dan 1 hit nodig heeft.
- Shield geeft bij late targets een korte guard-pauze en +1/+2 urgent hits afhankelijk van hoe ver de target is.

Procedure:

1. Verander damage en cooldown samen; sneller schieten plus meer damage wordt snel te sterk.
2. Lage tier helpers mogen voelbaar helpen, maar niet zelfstandig de ronde spelen.
3. Episch/Legendarisch/Mythisch verschil moet zichtbaar zijn in hits en cooldown, niet alleen kleur.
4. Mythic specials mogen utility geven zoals freeze, chain of shield, maar geen permanente lock.
5. Na balance-wijziging altijd training duel handmatig spelen en scoregevoel vergelijken met een squad zonder Mythic.

## Solo Campaign balance

Bronbestanden:

- `src/services/soloCampaignBalance.ts`
- `scripts/solo_campaign_balance.mjs`

Huidige structuur:

- 5 levels.
- 20 waves totaal.
- 4 waves per level.
- Elke 4e wave is een boss wave.
- Elke wave duurt 30 seconden en gebruikt dezelfde duel-regels als training.
- Solo geeft geen rewards; het is bedoeld als oefen/game-mode.

Target score:

```ts
8 + level * 2 + waveInLevel * 2 + Math.floor((level - 1) * waveInLevel * 0.55) + bossBonus
```

Boss bonus:

```ts
boss ? 5 + level : 0
```

BugBot score blijft net onder de target:

- Normal wave: `targetScore - 2`
- Boss wave: `targetScore - 1`

Doel per profiel:

| Profiel | Verwachting |
| --- | --- |
| Beginner zonder squad | Training leren; campaign gates meestal niet halen. |
| Gemiddeld met lage squad | Eerste normale waves halen, boss wave 1 soms halen. |
| Skilled met epic squad | Meerdere boss gates halen, late levels worden spannend. |
| Skilled met mythic squad | Campaign kan gehaald worden, maar eindboss is niet gratis. |

Balanscheck:

```powershell
node scripts\solo_campaign_balance.mjs
```

Laatste simulatie-uitkomst voor boss gates:

| Boss wave | Target | Average low squad | Skilled epic squad | Skilled mythic squad |
| --- | ---: | ---: | ---: | ---: |
| 4 | 24 | 11% | 100% | 100% |
| 8 | 29 | 0% | 89% | 100% |
| 12 | 34 | 0% | 63% | 100% |
| 16 | 39 | 0% | 28% | 89% |
| 20 | 44 | 0% | 0% | 63% |

Procedure:

1. Pas `soloCampaignBalance.ts` aan.
2. Houd `scripts/solo_campaign_balance.mjs` gelijk aan dezelfde targetformule.
3. Run de simulator en controleer dat winrate duidelijk stijgt met betere techniek/squad.
4. Boss wave 20 mag zwaar zijn, maar skilled mythic moet rond 50-70% blijven.
5. Update deze tabel en `CHANGELOG.md` bij elke balance-wijziging.

## Release check bij balance

Voor elke release met balance-wijziging:

```powershell
npm.cmd run typecheck
```

Neem in GitHub release notes op:

- Welke XP/kans/damage is veranderd.
- Of het een feature train wijziging of patch-fix is.
- Wat spelers ervan merken.

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
| Weekly mission claim | 15 |
| Foreground catch common | 1 |
| Foreground catch rare | 3 |
| Foreground catch epic | 6 |
| Foreground catch legendary | 10 |
| Foreground catch mythic | 15 |

Procedure:

1. Pas alleen `rewardBalanceService.ts` aan.
2. Controleer alle callsites met `rg "duelWinXp|weeklyMissionXp|foregroundCatchXpByRarity|movementRadarXpPerBug|dailyLoginXp" src`.
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
- Helper damage: Gewoon/Zeldzaam 1, Episch 2, Legendarisch 3, Mythisch 5.
- Helper cooldown: Gewoon 9000ms, Zeldzaam 7800ms, Episch 6500ms, Legendarisch 5100ms, Mythisch 4600ms.
- Helpers starten niet vol; initial charge blijft gedeeltelijk.

Procedure:

1. Verander damage en cooldown samen; sneller schieten plus meer damage wordt snel te sterk.
2. Lage tier helpers mogen voelbaar helpen, maar niet zelfstandig de ronde spelen.
3. Episch/Legendarisch/Mythisch verschil moet zichtbaar zijn in hits en cooldown, niet alleen kleur.
4. Mythic specials mogen utility geven zoals freeze, chain of shield, maar geen permanente lock.
5. Na balance-wijziging altijd training duel handmatig spelen en scoregevoel vergelijken met een squad zonder Mythic.

## Release check bij balance

Voor elke release met balance-wijziging:

```powershell
npm.cmd run typecheck
```

Neem in GitHub release notes op:

- Welke XP/kans/damage is veranderd.
- Of het een feature train wijziging of patch-fix is.
- Wat spelers ervan merken.

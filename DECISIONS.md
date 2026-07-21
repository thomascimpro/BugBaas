# Decisions

## 2026-07-21 BugScan recognition and developer review

- AI identifies the photographed subject independently before receiving the BugDex comparison requirement; catalog entries are never candidate labels for the first identification step.
- AI input uses a 1536 px/0.90 JPEG and falls back to 1280 px/0.80 only above 4 MB, preserving small anatomical details while remaining below the 6 MB API data-URL limit.
- Missing BugDex taxa are stored in `pendingBugDexDiscoveries` with finder identity and localized review context; developer/admin claims can resolve those records.
- Existing live documents are not overwritten by review flows, and hidden test-account cleanup is scoped exclusively to `testAccount: true` users.

## 2026-07-19 web auth, rewards and Tower hold hotfix

- Web Google authentication uses the Firebase JavaScript SDK directly; native token exchange remains unchanged for Android.
- Tower does not trust web `Pressable.onPressOut` because browser selection/context gestures can cancel that event; a document-level `pointerup` is the authoritative release.
- Reward permissions are not widened globally: Buddy, BugDex and mastery writes stay UID-bound and schema-validated.

## 2026-07-19 web arcade interaction hotfix

- Selectie- en contextmenuonderdrukking geldt alleen zolang een duelgame fullscreen is; normale apptekst blijft selecteerbaar buiten games.
- Tower-pickups hebben eigen wereldcoordinaten en collision in plaats van platformvelden, zodat ze zichtbaar en fysiek los van treden kunnen staan.
- Bubble-pressure wisselt een globale hexgridfase bij iedere nieuwe rij; daardoor blijft de horizontale positie en volgorde van alle bestaande bubbels gelijk.
- Bubble-powerups activeren alleen wanneer hun gemarkeerde gridbubble wordt weggecleared; het afgeschoten projectiel blijft altijd een normale gekleurde bubble.
- Practice-X sluit direct zonder web-alert; non-practice runs blijven tot het resultaat beschermd.

## 2026-07-19 regression restoration release 2.10.10

- Reporttypes zijn primaire categorieën en blijven daarom zonder extra tap zichtbaar op het nieuwe-meldingsformulier.
- Nest Defense scheidt handmatige aanvalinput van de visuele en torenlagen; de lege taplaag meet uitsluitend zijn eigen veldcoördinaten.
- BugDex-medailles gebruiken de geladen `bugdexUnlocks` als directe bron voor totalen en rarity-aantallen, zodat ruilen of verbruiken nooit voortgang verwijdert.
- Vroegtijdig verlaten wordt bepaald door `practice`, niet door een afgeleide `ranked`-flag: alleen Train mag voor een resultaat stoppen.

## 2026-07-19 arcade survival tuning release 2.10.9

- De linker Bug Glide-strook blijft een inputzone, maar de karaktergrens gebruikt strookbreedte plus halve visuele spritebreedte zodat het karakter de lijn nooit kruist.
- Beide survivalgames gebruiken een harde 120-secondenlimiet; tijdsdruk maakt niet-spelen deterministisch fataal rond 45-60 seconden, terwijl actief vrijspelen de run richting 90 seconden kan rekken.
- Bug Tower-boosts en Bubble Swarm-power shots volgen seeded onregelmatige intervallen. Daardoor zijn ze testbaar en eerlijk voor gelijke seeds zonder op iedere trede of ieder schot te verschijnen.
- Bubble Swarm vergroot bubblebeelden en verkleint de verticale gridafstand binnen het bestaande 8-koloms staggered grid; match-, buur- en bankshotlogica blijft daardoor compatibel.

## 2026-07-18 arcade repair release 2.10.8

- Training is een expliciete practice-mode: het scherm slaat geen Firestore-run op en iedere minigame slaat in practice ook geen lokale highscore op.
- Bubble Swarm is voortaan zowel ranked via een willekeurige uitdaging als los te oefenen; dezelfde seed/resultaatflow als de andere arcadegames wordt gebruikt.
- Bubble-projectielen gebruiken één `Animated.Value` over het volledige pad. De laatste animatiepositie en de geplaatste gridcel zijn exact hetzelfde punt.
- Bug Tower gebruikt twee transparante touchhelften over het hele speelveld. De zichtbare pijlen en powermeter zijn feedback en geen losse kleine knoppen.
- Platformbreedte en moving-platform-kans schalen deterministisch per floor; rockets krijgen naast een zeldzame kans vaste intervallen zodat lange runs niet zonder power-up blijven.

## 2026-07-18 web shell and arcade release candidate

- De web-shell blijft maximaal 460px breed en gebruikt één interne scrollcontainer; de document-body wordt niet als tweede scrolllaag gebruikt.
- Fullscreen wordt gestuurd door de actuele game-state en niet door een mount-effect, zodat de navigatie niet kort terugkeert tijdens game-start of gamewissels.
- Bug Tower-platformbreedte en moving-platform-kans zijn deterministisch aan floor/seed gekoppeld; coins en rockets zijn pickups en beïnvloeden de runscore zonder nieuwe backend-schema's.
- Bubble Swarm gebruikt alleen React Native views, requestAnimationFrame en transform; power-ups blijven lokaal aan de bestaande solo-resultaatflow gekoppeld.
- Daily 7-duel target behoudt het oude claim-id zodat bestaande dagelijkse claims idempotent blijven.

- De inactivity-decay gebruikt dezelfde absolute ondergrens van 100 als normale Duel-ratingverliezen; 1000 blijft alleen de startrating.
- Ranked-inactiviteitsdecay draait dagelijks via GitHub Actions met de bestaande Firebase-service-accountsecret; het script is idempotent, gebruikt Firestore update-time preconditions en houdt de bodem op 1000.
- Bug Tower gebruikt geen kantelsensor meer: `onPressIn` links/rechts start de aanloop en `onPressOut` zet de opgebouwde afstand en snelheid om in sprongkracht.
- De minimale sprong blijft bruikbaar voor een nabije trede; maximale aanloop haalt circa 28,9% schermhoogte en spin activeert pas vanaf 72% snelheid plus 58% charge.
- Backgroundgenres wisselen per blok van 100 floors en worden boven floor 500 als steeds moeilijkere remixes herhaald, zodat een endless run geen onbeperkte set assets nodig heeft.
- Platformdruk schaalt continu met floor en in extra stappen per zone; time pressure is klein gehouden zodat vaardigheid belangrijker blijft dan alleen speeltijd.
- Bubble Swarm is uitsluitend solo en wordt niet aan `validDuelMode` of de dagelijkse duelmissie toegevoegd; alleen het bestaande solo Arcade-resultaatpad krijgt de nieuwe mode.
- De bubble-shooter gebruikt React Native views en `Animated` zonder nieuwe game- of canvasdependency: slepen richt, loslaten schiet, matches van drie verwijderen en niet meer aan het plafond verbonden clusters vallen.
- De moeilijkheid schaalt op drie assen: drukrijen komen steeds sneller, de misslimiet daalt van zes naar drie en na 28/55 seconden komen een vijfde en zesde bugkleur beschikbaar.
- Bubble Swarm gebruikt originele imagegen-art; sprites of geluiden uit bestaande commerciële bubble-shooters worden niet gekopieerd. De game hergebruikt de bestaande BugBaas arcade-soundset.
- Nieuwe BugDex-beelden gebruiken uitsluitend exacte uitsneden uit de aangeleverde bronbladen; onduidelijke exemplaren worden niet toegevoegd en zeldzaamheid volgt de visuele bijzonderheid.
- Hogere scoretiers schalen na 2.400 punten grofweg exponentieel naar 5.000, 10.000, 20.000 en 40.000; behaalde bestaande tiers blijven daardoor intact, terwijl de nieuwe top langdurig doel blijft.
- Nest Defense gebruikt absolute touchposities minus de gemeten speelveldoorsprong; lokale `locationX/locationY` van geneste vijand-views zijn hiervoor onbetrouwbaar.
- De vaste linker Bug Glide-strook is een actieve stuurzone: taps lopen door naar dezelfde physics-handler en geven daardoor een duidelijke impuls naar rechts.
- Ranked-inactiviteit wordt client-side bij Arena-open verwerkt: 5 Duel rating per volledig gemiste lokale kalenderdag, nooit lager dan 1000 en met een dagcheckpoint tegen dubbele decay.
- Bug Tower gebruikt originele BugBaas-assets en retro arcadefeedback; originele Icy Tower-sprites, muziek en samples worden niet gekopieerd.
- Alleen Bug Tower-ranked breidt het bestaande Arcade-resultaat uit met `ranked` en `duelId`; de vier bestaande gamerecords behouden hun huidige schema en aanroep.
- Tiltbesturing gebruikt de bestaande Android native module met gravity/accelerometer en geen nieuwe dependency; zichtbare links/rechtsknoppen blijven beschikbaar als sensorfallback.
- Een Bug Tower-run wordt uiteindelijk onhoudbaar door tijd- en floor-gebonden scrollversnelling, terwijl platformbreedte, gaten en beweging per hoogteband moeilijker worden.
- BugDex-achievements tellen unieke bugs uit `bugdexUnlocks`; inventory blijft alleen de bron voor actueel bezit en actieve squads.
- Ranked minigames mogen vóór het resultaat niet via de UI of Android-back worden verlaten.
- BugBaas gebruikt Android `appCategory=game`, zodat de bestaande portraitrestrictie op Android 16-tablets van toepassing blijft zonder de mobiele flow te wijzigen.
- De buddywidget communiceert zijn primaire status met bestaande state-drawables; verborgen tekstvelden blijven alleen compatibiliteitsdata.
- Nest Defense bepaalt handmatige tap-targets in pixels met een geschaalde hitradius, niet met één procentuele afstand over verschillende aspectratio's.
- Expo + React Native + TypeScript gebruikt voor Android-first mobiele app.
- Handmatige schermnavigatie gebruikt om V1 klein te houden en extra navigatie-dependency te vermijden.
- Firebase config staat als lege placeholder in `app.json`; geen secrets hardcoded.
- Demo-modus gebruikt lokale in-memory data wanneer Firebase config ontbreekt, zodat UI smoke-testbaar blijft.
- Punten: Afgekeurd/Dubbel = 0, Gefixt = basispunten + 15, Bevestigd/In behandeling = basispunten + 5.
- Firebase Spark/free plan is uitgangspunt; Cloud Functions, Cloud Storage en Blaze-only features zijn buiten scope.
- Screenshots worden client-side beperkt tot maximaal 640 px en JPEG-compressie 0.35.
- Screenshots worden als kleine data-URL in Firestore opgeslagen. Dit is bewust beperkt voor V1; grote of meerdere screenshots vereisen Blaze + Storage.
- Insect visuals zijn lokaal opgebouwd met React Native views en animaties. Geen externe assetfiles nodig voor V1.
- Als later externe insect-assets nodig zijn: Kenney CC0-packs of aangeleverde transparante PNG/WebP frame sequences gebruiken, geen GIF als eerste keuze.
- Tier-systeem gebruikt eigen insectnamen: Larve, Keverscout, Sprinkhaan Specialist, Libelle Leider, Opperbugmeister.
- Nummer 1 in leaderboard krijgt Opperbugmeister-label, los van normale puntentier.
- BugDex toont losse bug-art; potjes zijn alleen voor de actieve squad onder Duel/Solo Campaign.
- Solo Campaign targets zijn vaste level/wave gates; level 1 start hoger en boss-waves vragen duidelijk meer score.
- Solo Campaign bosses gebruiken eigen HD boss-art en custom target scaling in de bestaande native game view; geen extra chart/game-library toegevoegd.
- Campaign clear reward gebruikt `solo_campaign_clear` als dagelijkse BugDex source met gegarandeerd Zeldzaam, zodat het max 1x per dag claimbaar blijft.
- Bug Radar widget toont request-status als compacte native badges in plaats van extra schermen of notificatiekaarten.
# 2026-07-19 Nest and FitnessSyncer release 2.10.11

- Nest Defense makes the field itself the manual-attack responder so lower-path taps are not lost behind higher visual layers.
- FitnessSyncer stays hidden until its server reports complete OAuth configuration; incomplete production setup is never shown as connected.
- OAuth uses PKCE and read-only activity scopes. Tokens remain encrypted in a private server-only Firestore path.
- Manual and daily-summary activities are excluded; provider source plus activity ID forms the idempotency key.

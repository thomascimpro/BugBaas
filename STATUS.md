# Status

## 2026-07-19 regression repair release 2.10.10

- Het nieuwe-meldingsformulier toont Bug, Tip, Trick en Idee altijd direct; de gekozen categorie blijft bepalend voor de velden.
- Nest Defense gebruikt een volledige, voorgrondvrije taplaag en vertaalt web- en native taps naar het gemeten speelveld.
- Medaillecriteria voor BugDex-aantallen en zeldzaamheden worden rechtstreeks uit historische unlocks berekend, inclusief niet-meer-bezette bugs.
- Alleen oefenruns tonen en accepteren voortijdig afsluiten; actieve ranked minigames blokkeren de UI- en Android-terugroute tot het resultaat.
- Webversie 2.10.10 staat productie op `https://bugbaas.vercel.app`, deployment `dpl_DQfZuBFLVCeVwbHicBKEXaaVCFRp` (`READY`).
- Android 2.10.10 is gebouwd en gecontroleerd als `dist/BugBaas-2.10.10.apk`; GitHub Release `v2.10.10` is gepubliceerd en als latest gemarkeerd.
- Geen Android-toestel aangesloten; fysieke installatie en native touch-feel blijven open.

## 2026-07-19 arcade survival release 2.10.9

- Bug Glide ontvangt taps over het volledige speelveld, inclusief links van de stuurgrens; de sprite stopt volledig rechts van de lijn.
- Bug Tower toont een vaste salto-chain uitleg en een actieve `TAP NOW`-timingbalk; coins, rockets en springs verschijnen op onregelmatige seeded intervallen.
- Bug Tower eindigt zonder input live rond 50 seconden en heeft een harde bovengrens van 120 seconden.
- Bubble Swarm gebruikt aaneengesloten staggered bubbles en een zichtbaar vloeiend projectieltraject; Bomb, Freeze en Rainbow verschijnen onregelmatig iedere 7-10 schoten.
- Bubble Swarm eindigt zonder input live rond 55 seconden en heeft een harde bovengrens van 120 seconden.
- Webversie 2.10.9 staat productie op `https://bugbaas.vercel.app`, deployment `dpl_FJntL59LsTuVeQK5nJ91SDsWG94p` (`READY`).
- Android 2.10.9 is gebouwd als `dist/BugBaas-2.10.9.apk`; metadata, ARM64-inhoud, v2-signing en SHA-256 zijn gecontroleerd.
- GitHub Release `v2.10.9` is gepubliceerd met de geverifieerde APK en expliciet als latest gemarkeerd, zodat de native updatechecker 2.10.9 ziet.
- Geen Android-toestel aangesloten; fysieke install-, performance- en touch-feeltest blijft open.

## 2026-07-19 arcade repair release 2.10.8

- Bug Tower gebruikt twee volledige touchhelften, snellere floor pressure, exact 1/2-, 1/3- en 1/4-brede mijlpalen, eerdere moving platforms en betrouwbare coin/rocket-pickups.
- Bubble Swarm gebruikt een vloeiend Animated-pad met exact grid-eindpunt; de live gevonden web-stretchbug in bubble-afmetingen is hersteld en opnieuw visueel getest.
- Train staat bij alle arcadegames, inclusief Bubble Swarm. Practice schrijft geen ranked run, Firestore-resultaat of lokaal highscore-record.
- Herculeskever is vervangen door een transparante 1254x1254 HD-versie waarin hoorn, lijf en poten volledig zichtbaar zijn; Hooiwagen en Buddy-assets zijn gecontroleerd en bleken al correct.
- Webversie 2.10.8 staat productie op `https://bugbaas.vercel.app`, deployment `dpl_2Zz1LbmkbBig1V5piHiVR2ocrzvj` (`READY`).
- Android 2.10.8 is gebouwd en gecontroleerd als `dist/BugBaas-2.10.8.apk`; GitHub Release `v2.10.8` is gepubliceerd met de geverifieerde APK-asset.
- Geen Android-toestel aangesloten; de fysieke install- en touch-feeltest blijft daarom expliciet open.

## 2026-07-18 web shell, arcade scaling and release candidate

- De Expo-webshell is op web gecentreerd met een maximale breedte van 460px; html/body/root zijn viewport-locked en scroll blijft binnen de schermcontent.
- Duel-arcadegames schakelen naar een eigen fullscreen game-shell; BottomNav, WalkingBugs en foreground overlays worden tijdens actieve games niet gerenderd.
- Bug Tower heeft smallere hoge-floor platforms, oplopende moving-platform-kans, chain taps, coins en tijdelijke rocket flight; Bubble Swarm gebruikt RAF/transform-projectielen, wall-bounce aim paths, bomb en freeze shots.
- BuddyCareIcon gebruikt transparante state/action PNG-assets; Hooiwagen is opnieuw met volledige poten gecropt.
- Daily duelmission gebruikt target 7 en behoudt id `duel-play-5` voor bestaande claims.
- Web export en Vercel production deployment zijn geslaagd op het bestaande project `bugbaas`; productie-deployment `dpl_2xQH3VU5RYbdncywnQEM6LeN53jH` is `READY` op `https://bugbaas.vercel.app`.
- Browser-plugin en fysieke device-smoke waren in deze run niet beschikbaar; die visuele/control-flow checks blijven expliciet open.
- Android fast release-build 2.10.7 is geslaagd; APK staat op `dist/BugBaas-2.10.7.apk`, metadata/signing/hash zijn gecontroleerd.
- GitHub Release `v2.10.7` is gepubliceerd met APK-asset.

- Ranked-inactiviteitsdecay loopt nu door onder 1000 tot de absolute Duel-ratingbodem van 100.
- Dagelijkse ranked rating-decay is als GitHub Actions-scheduler voorbereid: ook afwezige spelers worden server-side verwerkt zonder app-login; live dry-run tegen Firestore is geslaagd.
- Bug Tower gebruikt nu uitsluitend touchbesturing: links/rechts vasthouden bouwt loopsnelheid en sprongkracht op, loslaten springt; snelle geladen sprongen laten het karakter ronddraaien.
- Alle treden tonen hun floornummer en de achtergrond wisselt iedere 100 floors tussen Ice Citadel, Hive Jungle, Ember Forge, Sky Temple en Cosmic Void.
- De neerwaartse torendruk begint rustig na floor 8 en schaalt samen met smallere treden, grotere gaten en meer bewegende platforms door tot een onhoudbare late game.
- Bubble Swarm is lokaal als zesde Arena-game geimplementeerd: solo richten/schieten, match-3, vallende clusters, kettingcombo's, lokale highscore en afzonderlijke Firebase-runrecords.
- Bubble Swarm wordt door snellere automatische zwermdruk, minder toegestane missers en zes oplopende bubblekleuren uiteindelijk onhoudbaar; elke run eindigt uiterlijk na 90 seconden.
- Android fast release-build 2.10.0 met Bubble Swarm en alle zeven nieuwe assets is geslaagd; device-smoke en deployment van de gewijzigde Firestore rules staan nog open.
- Release 2.10.0 is lokaal geminificeerd en gesigneerd gebouwd; metadata, v2-signing en SHA-256 zijn geverifieerd, publicatie op GitHub volgt.
- BugDex bevat 45 nieuwe, transparant gecropte bugs uit `new17-17-2026`; catalogus-, asset- en Android-releasecontrole zijn geslaagd.
- De scoreladder loopt nu door tot 40.000 punten met vier nieuwe stretch-tiers boven Goliath BugBaas.
- Nest Defense zet taps en hitdetectie nu in dezelfde gemeten speelveldcoördinaten; taps op bugs springen niet meer naar linksboven.
- De linker Bug Glide-stuurstrook is klikbaar en duwt de bug naar rechts, zodat hij niet aan de linkerrand blijft hangen.
- Ranked Duel rating krijgt bij het openen van Arena eenmalig 5 punten decay per volledig gemiste dag, met een bodem van 1000.
- Bug Tower is lokaal als vijfde Arcade-game geimplementeerd met animated beetle, tilt/tap-besturing, fallbackknoppen, combo's, highscores, training en ranked; release-APK build is geslaagd, device-smoke staat nog open.
- Ranked Bug Tower-resultaten krijgen lokaal een afzonderlijk herkenbare Firebase-context met `ranked: true` en de bijbehorende `duelId`.
- De 2.10.0-release bevat de ranked Bug Tower-context en de uitgebreide BugDex.
- Bug Tower-moeilijkheid schaalt door smallere/grotere platformgaten, bewegende platforms vanaf floor 40 en steeds snellere neerwaartse scroll.
- Release-APK `dist/BugBaas-2.10.0.apk` is normaal geminificeerd en op metadata en signing gecontroleerd; device-smoke staat nog open.
- Lokale gameplay/reward-verbeteringen zijn opgenomen in 2.10.0; device-smoke op tablet en telefoon staat nog open.
- BugDex-medailles en set-characters gebruiken nu de blijvende unlockhistorie in plaats van alleen huidig bezit.
- Ranked Web Runner, Nest Defense en Bug Glide blokkeren annuleren/teruggaan tot het resultaat.
- Buddywidget toont status met hunt-, reward-, beschikbaar- en rustafbeeldingen.
- Projectbasis: klaar.
- Auth-flow: klaar met Firebase integratie en demo-fallback.
- Google-login werkt via native Google Sign-In in standalone APK.
- Eerste standalone APK gebouwd en getest op Pixel 8.
- GitHub Release `v0.1.0` met APK: klaar.
- GitHub Release `v2.2.1`: voorbereid met embedded release image bovenaan de release notes en APK `BugBaas-2.2.1.apk`.
- GitHub Release `v2.2.2`: klaar te publiceren met BugDex-revert, rustig squad-potje, betere Solo Campaign targets en kleinere APK.
- GitHub Release `v2.2.3`: klaar met boss HD-art, campaign-clear reward, weekly-claim fix, BugDex periodefilter en radar-widget request badges.
- GitHub Release `v2.2.4`: klaar met squad-potjes zichtbaar in fullscreen 1v1 duel.
- Bug melden concept/herstel en screenshot verwijderen: klaar.
- Bug CRUD V1: aanmaken, tonen en status wijzigen klaar.
- Upvotes op bugmeldingen: klaar.
- Screenshot V1: client-side resize/compressie klaar; opgeslagen als Firestore data-URL voor Spark-only gebruik.
- Puntenlogica: klaar.
- Leaderboard/profiel: klaar.
- Modern profielscherm met tier, badges en status: klaar.
- Tier-systeem met insectbeelden: klaar.
- Tier-upgrades tonen grotere, betere insect-assets per niveau: klaar.
- Modern UI met achtergrond, betere knoppen, insect-stage en ranking-preview: klaar.
- Walking bug animaties: klaar met vooruit lopend zijaanzicht.
- Walking bugs zijn klikbaar en tonen splat-effect: klaar.
- Bottom navigation met Home, Bug melden en Ranglijst: klaar.
- Profielroute bereikbaar vanaf Home: klaar.
- Home nieuws en Ranglijst status/badgechips: klaar.
- Clean UI zonder zichtbare demo/uitlegtekst: klaar.
- Online-inspired modern UI met prominente meldknop, dashboardtegels en sterkere ranglijstheader: klaar.
- Firebase echte projectconfig, Auth persistence en Firestore rules: klaar.
- Firebase live koppeling met Auth, Firestore users en bugs: klaar.
- Firebase CLI beheert Firestore rules en indexes: klaar.
- Spark-plan documentatie: klaar in `FIREBASE_SPARK_PLAN.md`.
- Android test: zie `TESTRESULTS.md`.

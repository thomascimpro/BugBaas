# Status

## 2026-07-21 BugScan analysis hotfix 2.10.18

- Production failures were caused by the 1200-token response limit truncating the expanded 15-field multilingual JSON result, not by image quality.
- The first request now uses 3200 output tokens with low reasoning effort and concise fields; incomplete, missing or truncated JSON receives exactly one 5000-token retry.
- Vercel deployment `dpl_89VffjN5sPH1twe4egfGqfcc9SRT` is `READY` and `https://bugbaas.vercel.app` points to it.
- The signed APK was rebuilt and replaced at `dist/BugBaas-2.10.18.apk`; it is byte-identical because this hotfix changes only server-side Vercel code.

## 2026-07-21 release 2.10.18

- Release scope: sharper BugScan input, honest subject-first identification, localized missing-species developer records and hidden test-account cleanup.
- Version metadata is aligned at 2.10.18 / Android versionCode 198.
- Firebase Rules are live on `thomascimpro-6266f` and Vercel production deployment `dpl_2gwHfcpXmMgytVoMuSPsEhAJszGk` is `READY` on `https://bugbaas.vercel.app`.
- Signed APK `dist/BugBaas-2.10.18.apk` is built and verified; physical-device smoke testing was not possible because ADB reported no connected device.
- Release commit `d479d4f` is pushed to `origin/codex/BugBaas` and tag `v2.10.18` is published; GitHub Release asset upload is blocked because GitHub CLI is not logged in.
- `origin/master` now points to history-preserving merge `2d87f0e`, with the 2.10.18 release tree authoritative and the former remote master retained as its second parent.
- The working branch is `master`; the former local master tip remains recoverable as `codex/backup-master-before-2.10.18`.

## 2026-07-21 BugScan missing-species correction

- BugScan sends a 1536 px JPEG at quality 0.90 to AI, with a 1280 px/0.80 fallback only above 4 MB, instead of the former 768 px/0.60 input.
- BugScan identifies the photographed taxon before comparing it with BugDex and rejects a forced nearest catalog match server-side.
- The result always displays the AI's honest name for the visible subject, including unclear and rejected photos.
- A confidently identified species outside BugDex now shows and stores localized names, facts, and explanations in Dutch, English, and French under `pendingBugDexDiscoveries`.
- Developer/admin Firebase claims can review and resolve discovery records; existing 2.10.17 clients remain compatible with the updated rules.
- All 37 live users marked `testAccount: true` and their 477 Firestore documents were removed from Firebase; no marked accounts remain.
- The complete BugScan page is translated in Dutch, English, and French. Deployment is still pending release approval.

## 2026-07-21 release 2.10.17

- Alle 48 ontbrekende BugDex-afbeeldingen zijn toegevoegd, transparant gemaakt, geoptimaliseerd en gekoppeld aan de catalogus.
- BugScan verbruikt alleen een dagpoging bij een geldige herkenning; een zekere soort buiten de catalogus wordt als developersuggestie vastgelegd en afwijzingen of onzekere scans kosten geen poging.
- FitnessSyncer ondersteunt persoonlijke OAuth-appgegevens, PKCE, versleutelde opslag, tokenrefresh en detailimport; providerconsent blijft afhankelijk van een door FitnessSyncer geregistreerde productiecallback.
- Webexport en de getekende Android APK 2.10.17 zijn lokaal succesvol gebouwd. Productiepublicatie volgt vanuit deze releasecommit.

## 2026-07-21 FitnessSyncer OAuth connect hotfix

- `Koppel FitnessSyncer` blijft op web actief en wordt alleen tijdens een lopende request geblokkeerd; ontbrekende backendconfiguratie verschijnt als duidelijke melding in plaats van een niet-werkende grijze knop.
- Alle vijf FitnessSyncer HTTPS Functions zijn expliciet publiek invokeerbaar gemaakt. Status, start, sync en disconnect blijven daarna beschermd door Firebase ID-tokencontrole; de callback blijft beschermd door OAuth-state en PKCE.
- De Functions zijn succesvol bijgewerkt op Firebase-project `thomascimpro-6266f`; CORS-preflight op `fitnessSyncerStart` geeft HTTP 204 en start/sync geven zonder login correct HTTP 401.
- Vercel-productie is `READY` op deployment `dpl_Gz5vb23fJx1rCCv6Uz2dELP8TqKo`; `bugbaas.vercel.app` serveert bundle `AppEntry-149da9e01d13fbc13eb1ecbf9e3fcd45.js`.
- Echte FitnessSyncer-toestemming en tokenuitwisseling blijven extern geblokkeerd totdat FitnessSyncer een geldige BugBaas Client ID en Client Secret heeft uitgegeven en deze server-side zijn ingesteld.

## 2026-07-20 BugScan reward release 2.10.15

- Elke geldige unieke echte bugscan geeft voortaan altijd `+1` van de herkende BugDex-bug, ook wanneer de bestaande voorraad `count: 0` was.
- De reward-event-ID gebruikt de unieke scan-ID; dubbele verwerking van exact hetzelfde event blijft idempotent geblokkeerd.
- Vercel-productie is `READY` op deployment `dpl_69KTPZko2Eyx1fsFLuwCUD9vquPv`; `bugbaas.vercel.app` serveert bundle `AppEntry-167d3edc9a0761bf18ba854c17f600d5.js` en de BugScan API-route antwoordt op CORS preflight.
- Android APK 2.10.15 is gebouwd als `dist/BugBaas-2.10.15.apk`, package `nl.cimpro.bugbaas`, versionCode `195`.
- GitHub Release is niet gemaakt; GitHub CLI is lokaal niet ingelogd.

## 2026-07-20 daily rewards, buddy persistence and Tower jump hotfix

- Geclaimde daily mission-bugs openen direct als BugDex-rewardpopup in plaats van als mogelijk gemiste rondlopende vangbug.
- Buddy-taken worden vóór optionele notificatieplanning in Firebase opgeslagen en gebruiken absolute start/eindtijden; de timer loopt dus door wanneer Vercel gesloten is.
- Hidden/testaccounts en normale accounts blijven strikt gescheiden in zowel Score- als Duel-ranking; Home en het volledige leaderboard gebruiken een verse complete lijst.
- Bug Tower-pressure start direct, een volle balk haalt circa 5-6 normale treden en de groene `MEGA` geeft +100 punten plus een sterkere volgende sprong.
- FitnessSyncer Functions tonen nu exact welke veilige configuratievelden ontbreken. De providerlogin blijft uitgeschakeld zolang Client ID, Client Secret en Token key niet zijn ingesteld.
- Vercel-productie is `READY` op deployment `dpl_HcJSahLW4Fg4cxBLfQx14mZ6JAtS`; `bugbaas.vercel.app` serveert bundle `AppEntry-a309d12e23b3a0b702e78ca3bf1dc4e3.js`.
- Geen APK gebouwd of gepubliceerd; bestaande APK-binaries zijn niet gewijzigd.

## 2026-07-20 Vercel ranks, sounds, ranked permissions and Tower balance

- Vercel gebruikt browserbrede WebAudio-feedback voor bestaande game-events en alle actieve React Native Web `Pressable`-acties; Android-geluid blijft ongewijzigd.
- Home berekent Score- en Duel-rank uit een verse volledige actieve gebruikerslijst en vervangt een verouderde eigen leaderboard-snapshot door de actuele gebruiker.
- Firestore accepteert nu alle zes Arena-ranked modes, inclusief `bubble_swarm`; de rules zijn gecompileerd en live op `thomascimpro-6266f`.
- Bug Tower spreidt opeenvolgende treden sterker links/rechts en gebruikt vanaf hogere floors oplopend grotere missing-step-gaps; deze gameplaybron wordt gedeeld door web en een toekomstige APK-build.
- FitnessSyncer OAuth-return, stappenimport en dag/week-deduplicatie staan in de gedeployde Functions-code. De runtime blijft bewust uitgeschakeld zolang `FITNESSSYNCER_CLIENT_ID`, `FITNESSSYNCER_CLIENT_SECRET` en `FITNESSSYNCER_TOKEN_KEY` ontbreken.
- Vercel-productie is `READY` op deployment `dpl_HeJ27nWsLoiAHKxsNXTyk9omozXM`; `bugbaas.vercel.app` serveert bundle `AppEntry-0bea8ee78d9ca4fe36230482d686fcf9.js`.
- Geen APK gebouwd of gepubliceerd; bestaande APK-bestanden zijn niet gewijzigd.

## 2026-07-19 web auth, rewards and Tower hold hotfix

- Web Google-login uses Firebase's browser popup instead of the unsupported native RN Google Sign-In method; Android keeps the native flow.
- Bug Tower web hold ignores React Native Web press cancellation and releases only on a real global pointer-up or window blur.
- Buddy, BugDex and mastery reward writes remain restricted to the signed-in owner's subcollections; the compiled rules are live on Firebase project `thomascimpro-6266f`.
- Production is live at `https://bugbaas.vercel.app`, deployment `dpl_AgBRAgZyq9ysDpj7osQEEDs9KWZF` (`READY`).

## 2026-07-19 web arcade interaction hotfix

- Bug Tower web-hold toont geen copy/selectiemenu meer; pickups staan los van treden en rockets vliegen langer en verder.
- Bubble Swarm gebruikt Bomb/Freeze-gridbubbels en vloeiende, positievaste drukrijen; Web Runner ondersteunt swipe-up jump.
- Train-X sluit direct en Nest Defense-controls staan buiten het speelveld zonder de mobiele overlay uit de aangeleverde screenshot.
- Web-hotfix staat productie op `https://bugbaas.vercel.app`, deployment `dpl_9pKLUM1DmuaC1oF9HodtUdekqtRW` (`READY`).
- Android/APK is niet gewijzigd of opnieuw uitgebracht voor deze webgerichte hotfix.

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
# 2026-07-19 Nest and FitnessSyncer release 2.10.11

- Nest Defense lower-field tapping is repaired and verified on production with a hidden test account.
- Five FitnessSyncer Firebase Functions are active and protected by Firebase authentication; container cleanup is set to seven days.
- FitnessSyncer Client ID, Client Secret, and token encryption key are not configured yet; the production UI therefore remains hidden by design.
- Web 2.10.11 is live on `https://bugbaas.vercel.app`, deployment `dpl_BMZtL6j5ZmsjkrZ5C4Gn7heqUSrL` (`READY`).
- Android 2.10.11 is published as `dist/BugBaas-2.10.11.apk`; GitHub Release `v2.10.11` is latest.

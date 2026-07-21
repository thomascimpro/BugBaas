# Test Results

## 2026-07-21 corrected Android release 2.10.16

- `npm run typecheck`: geslaagd.
- `npm run test:daily-missions`: 1 gerichte regressietest geslaagd; unieke speltypes van vandaag worden per gebruiker correct bepaald.
- `npm run test:real-bug-scan`: 5 tests geslaagd.
- `git diff --check`: geslaagd.
- Normale `BUGBAAS_REQUIRE_ENV=1 NODE_ENV=production` release-build: geslaagd; Gradle gaf `Success` terug.
- APK: `android/app/build/outputs/apk/release/app-release.apk`, 85.900.795 bytes, package `nl.cimpro.bugbaas`, versionCode `196`, versionName `2.10.16`, targetSdk `36`, ABI `arm64-v8a`.
- APK Signature Scheme v2: geldig; certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, gelijk aan 2.10.15.
- APK SHA-256: `58A3559EC632B7B745C83A2C237FBE54AE07648688D70539BA75CE83EBD32CE1`.
- Gebundelde APK bevat de herstelde Real BugScan-daily, Home-meldingskaart en `play-all-game-types`-missie.
- `adb devices -l`: geen aangesloten toestel; fysieke install-, layout- en touch-smoke niet uitgevoerd.

## 2026-07-19 web auth, rewards and Tower hold hotfix

- `npm run typecheck`: passed.
- Isolated Expo web export from commit `92281d5`: passed; bundle `AppEntry-6a276fec375b9198824d7e903353bd97.js`.
- Firestore rules compiled and deployed successfully to `thomascimpro-6266f`.
- Vercel production `dpl_AgBRAgZyq9ysDpj7osQEEDs9KWZF`: `READY`; `https://bugbaas.vercel.app` points to this artifact.
- In-app Browser with hidden account `Luna Review`: right Tower control is 230 x 614 px with `touch-action: none` and `user-select: none`.
- Raw pointer test: after 4.2 seconds held, run remained active at `SPIN READY` / 100% and no Copy UI appeared; after `pointerup`, charge reset to 0% and jump state resumed.
- Google popup code path is typechecked and present in the deployed bundle; full Google account selection was not completed because the Browser profile was already authenticated as the hidden test account.

## 2026-07-19 web arcade interaction hotfix

- `npx tsc --noEmit`: geslaagd.
- Expo web export: geslaagd; bundle `AppEntry-797c3719c1e537f1fe3ebe583e0450f4.js`.
- Vercel productie `dpl_9pKLUM1DmuaC1oF9HodtUdekqtRW`: `READY`, alias actief en root HTTP 200.
- Lokale en productie-bundle hebben dezelfde SHA-256 `3F2DAF60EA624BE68CCD0FA56C93E3EB69A3E6A3FDC5CA1E1D1F1600DEA2E153`.
- Chrome mobiele viewport 460x844 met hidden testaccount: Tower toont vrij zwevende pickups; fullscreen `user-select` is `none`; Train-X keert direct terug naar Arena.
- Bubble Swarm toont zichtbare B/F-powerups in het grid. Na twee drukstappen kwamen alle acht vastgelegde bestaande kleurvolgordes exact en ongewijzigd twee rijen lager terug.
- Web Runner swipe omhoog activeerde direct `Jump` en `JUMP`; Train-X werkte tijdens de actieve run.
- Nest Defense toont veld en drie controlrijen zonder overlap; screenshotcontrole bevestigde dat het control deck volledig onder het speelveld staat.
- Geen app-consolefouten gezien; alleen bestaande Chrome-extensionmeldingen buiten `https://bugbaas.vercel.app`.
- Android/APK niet gebouwd of fysiek getest omdat deze hotfix uitsluitend webinteractie en layout wijzigt.

## 2026-07-19 regression repair release 2.10.10

- `npx tsc --noEmit`: geslaagd.
- Broninvarianten: alle vier categorieen permanent aanwezig; historische unlockstatistieken gebruikt; alle vijf ranked minigames blokkeren voortijdig afsluiten.
- Expo web export: geslaagd; definitieve bundle `AppEntry-65440d3d21c2f7ce965bce03065e4fe5.js`.
- Vercel productie `dpl_DQfZuBFLVCeVwbHicBKEXaaVCFRp`: `READY`; root HTTP 200 en alias `https://bugbaas.vercel.app` actief.
- Lokale en productie-bundle hebben dezelfde SHA-256 `14138FC36D7B8360130FB304D7AAB9364B2950EBC86342D269A90E3D97001D19`.
- In-app Browser met hidden account `Luna Review`: 2.10.10-changelog zichtbaar; Bug, Tip, Trick en Idee gelijktijdig zichtbaar; Trick-selectie past formulierlabels en urgentieveld correct aan.
- Browser Nest Defense: oefenen toont afsluiten; taplaag is exact 460 x 618,8 px en vult het speelveld; handmatige vijandtap activeert aanvalscooldown en `HIT`-feedback. Productieconsole: nul errors.
- `NODE_ENV=production npm run apk:release`: geslaagd na het stoppen van twee achtergebleven Gradle-daemons; eerste resource-cleanup-poging was daardoor geblokkeerd.
- APK: `dist/BugBaas-2.10.10.apk`, 83.883.289 bytes, package `nl.cimpro.bugbaas`, versionCode `190`, versionName `2.10.10`, ABI arm64-v8a.
- `apksigner verify --verbose --print-certs`: APK Signature Scheme v2 geslaagd; bestaand Android debugcertificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `E0640C65811A59462BB83D7EF9E660C16817ADC8EB05878D494CF513BB272A56`.
- GitHub latest-release API: `v2.10.10`, naam `BugBaas 2.10.10`, APK-asset aanwezig met exact 83.883.289 bytes.
- `adb devices`: geen aangesloten toestel; fysieke install-, performance- en touch-feeltest niet uitgevoerd.

## 2026-07-19 arcade survival release 2.10.9

- `npx tsc --noEmit`: geslaagd.
- `git diff --check`: geslaagd; alleen bestaande LF/CRLF-waarschuwingen.
- Expo web export: geslaagd; definitieve bundle `AppEntry-17609851333759e41258b7620158b6cf.js`.
- Vercel productie `dpl_FJntL59LsTuVeQK5nJ91SDsWG94p`: `READY` en gekoppeld aan `https://bugbaas.vercel.app`.
- Productie-root en lokale export hebben dezelfde SHA-256 `1F70B10CE139E0CA7E93E6470D5D6C5CF1C082200F6AEFEFD89DE2D8D032ECAA`; productie- en lokale JS-bundle zijn beide 2.512.954 bytes met SHA-256 `18C353FB2A17DDDC08A47F9230FC9F430D7E20E3B75E948F0344475132E1335D`.
- In-app Browser met hidden account `Luna Review`: Bug Glide accepteert taps links van de lijn terwijl het karakter rechts van de lijn stopt.
- Browser Bug Tower: vaste salto-uitleg, coin op floor 3 en eerste zeldzame boost rond floor 8 zichtbaar; idle run eindigde live na circa 50 seconden.
- Browser Bubble Swarm: bubbles sluiten zonder lege gridruimte aan; projectile is halverwege het veld zichtbaar en landt daarna in het grid; idle run eindigde live na circa 55 seconden.
- Deterministische powerupchecks: Bubble Swarm-intervallen 7-10 schoten; Bug Tower-boostintervallen 8-14 floors.
- `NODE_ENV=production npm run apk:release`: geslaagd na het stoppen van een achtergebleven Gradle-daemon die de eerste Windows-resource-optimalisatie lockte.
- APK: `dist/BugBaas-2.10.9.apk`, 83.882.237 bytes, package `nl.cimpro.bugbaas`, versionCode `189`, versionName `2.10.9`, ABI arm64-v8a.
- `apksigner verify --verbose --print-certs`: APK Signature Scheme v2 geslaagd; certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` (bestaand Android debugcertificaat).
- APK SHA-256: `91DB42ABE5C39F601BE5E61EA103C6A5E79806BE698A358B37A175392923E54D`.
- GitHub latest-release API: `v2.10.9`, naam `BugBaas 2.10.9`, APK-asset aanwezig met exact 83.882.237 bytes en download-URL voor `BugBaas-2.10.9.apk`.
- `adb devices -l`: geen aangesloten toestel; fysieke install-, performance- en touch-feeltest niet uitgevoerd.
- De circa 90-secondenervaring voor een goede speler is als balance-doel gekalibreerd, maar vereist spelers-telemetrie of een fysieke playtest om statistisch te bevestigen.

## 2026-07-19 arcade repair release 2.10.8

- `npm.cmd run typecheck`: geslaagd na alle gameplay- en practice-wijzigingen.
- `npx.cmd expo export --platform web`: geslaagd; definitieve bundle `AppEntry-6ace068ca0fd86bc2d369230b456105e.js`.
- Vercel preview `dpl_96ZF2PCNxesvAmLGaHqGC2AssDpT`: root en exacte bundle HTTP 200; bundlelengte 2.507.091 bytes en ETag komt overeen met de exporthash.
- Vercel productie `dpl_2Zz1LbmkbBig1V5piHiVR2ocrzvj`: `READY`; `bugbaas.vercel.app` serveert de definitieve bundle met HTTP 200.
- Chrome hidden-account smoke: Arena toont Start en Train voor alle zes modes; Bug Tower toont twee volledige touchzones, trede-pickups en fullscreen mobiele shell.
- Chrome Bubble Swarm smoke: Luna-stretchbug gereproduceerd, hersteld, herdeployd en opnieuw getest; ronde bubbles, volledige richtlijn, zichtbaar tussenpunt en aansluitende gridlanding bevestigd.
- In-app Browser smoke op 390x844 met hidden account `Luna Review`: 2.10.8-changelogpopup, mobiele shell en Start/Train voor alle modes bevestigd.
- `./android/gradlew.bat -p android :app:assembleRelease`: geslaagd na de definitieve Bubble Swarm-fix.
- APK: `dist/BugBaas-2.10.8.apk`, 83.876.785 bytes, package `nl.cimpro.bugbaas`, versionCode `188`, versionName `2.10.8`, targetSdk 36, ABI arm64-v8a.
- APK-certificaat SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`; gelijk aan de bestaande install-base.
- APK SHA-256: `D4D73C51F02E487BFDB59C1C7D744025897592ED4E6743D581ED51C66156D14A`.
- GitHub latest-release API: `v2.10.8`, naam `BugBaas 2.10.8`, APK-asset aanwezig met exact 83.876.785 bytes.
- `adb devices`: geen aangesloten toestel; fysieke install- en touch-feeltest niet uitgevoerd.

## 2026-07-18 web shell and arcade release candidate

- `npm.cmd run typecheck`: geslaagd.
- `npx expo export --platform web`: geslaagd; 317 assets en webbundle gegenereerd in `dist`.
- `git diff --check`: geslaagd.
- Vercel preview `dpl_7NTp9fwjhzvDN6mMP7fsg4betyiC`: `READY`; root en de exacte hashed webbundle zijn via de protection-bypass gecontroleerd met HTTP 200.
- Vercel productie `dpl_2xQH3VU5RYbdncywnQEM6LeN53jH`: `READY` op `https://bugbaas.vercel.app`; root en `AppEntry-33a36722fe5e807a104036435bda6d87.js` geven HTTP 200 en de bundle-ETag komt overeen met de exporthash.
- Browser visual smoke: niet uitgevoerd; Browser/Chrome-plugin en lokale Chrome/Edge executable waren niet beschikbaar.
- Android device-smoke: nog niet uitgevoerd; pas na APK-build opnieuw gecontroleerd met `adb devices -l`.
- `npm.cmd run apk:fast`: geslaagd (exit 0).
- APK: `android/app/build/outputs/apk/release/app-release.apk`, 95.034.823 bytes, package `nl.cimpro.bugbaas`, versionCode `187`, versionName `2.10.7`.
- Kopie voor release: `dist/BugBaas-2.10.7.apk`.
- `apksigner verify --verbose --print-certs`: v2 geslaagd; certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `324D5633E398AF57059FC623AB875176C33D766ED0CC34B28B6375EF7DF45F78`.
- `adb devices -l`: geen aangesloten apparaat; install/control-smoke blijft open.
- GitHub Release `v2.10.7` en APK-downloadasset: geslaagd.

## 2026-07-18 scheduled ranked rating decay

- Decaybodem verlaagd van 1000 naar de bestaande absolute Duel-ratingbodem van 100; startrating blijft 1000.
- Zes gerichte checks geslaagd: gisteren gespeeld, een gemiste dag, bestaand checkpoint, gedeeltelijke floor-cap, rating op de floor en Nederlandse zomertijdovergang.
- `node --check scripts/apply_ranked_decay.mjs`: geslaagd.
- YAML-parse van de nieuwe en bestaande scheduled workflow: geslaagd.
- `git diff --check` op script en workflow: geslaagd.
- Live Firestore dry-run: 31 gebruikers gelezen, 1 gebruiker geraakt, 5 totale rating-decay; geen writes uitgevoerd.
- De workflow gebruikt de bestaande `FIREBASE_SERVICE_ACCOUNT` secret en schrijft alleen na de dry-run.
- GitHub Actions push-dry-run op `master`: geslaagd in 33 seconden; service-accountauth en live Firestore-read werken.
- GitHub meldde alleen dat de gebruikte action-versies intern van Node.js 20 naar Node.js 24 worden geforceerd; dit blokkeerde de run niet.
- Zes sub-1000-grenschecks geslaagd: 1000 daalt, een rating onder 1000 daalt verder en de absolute bodem 100 wordt niet doorbroken.
- `npm.cmd run typecheck`: geslaagd na verlaging van de decaybodem.
- Actuele `master`-rules compileerden en zijn succesvol naar `thomascimpro-6266f` gedeployed.
- Live inhaalrun: 5 gebruikers bijgewerkt, 495 totale rating verwijderd; aansluitende dry-run vond 0 openstaande gevallen.
- Live verificatie: Niva-cross 880, Biertje 885, test2 895, Favo B 905 en Thomas Test 926; checkpoint voor alle vijf staat op `2026-07-17`.

## 2026-07-17 Bug Tower hold-release controls

- `npm run typecheck`: geslaagd.
- `git diff --check` voor `BugTowerGame.tsx`: geslaagd; alleen bestaande LF/CRLF-waarschuwing.
- Tilt-import, sensorstate en tap-to-jump handler zijn volledig uit Bug Tower verwijderd.
- Berekende spronggrenzen: korte druk 12,6%, medium 19,1%, spin-threshold 21,9% en maximale aanloop 28,9% schermhoogte.
- Spin vereist minimaal 72% snelheid en 58% jump charge.
- Berekende floor pressure zonder extra tijdstap: floor 8 = 0,36%, floor 100 = 1,30%, floor 200 = 2,30%, floor 300 = 3,30% en floor 400 = 4,30% schermhoogte per seconde.
- Platformrange schaalt van 56-62% breed / 9,8-12,2% gap bij de start naar 28-34% breed / 14,2-16,6% gap rond floor 400.
- Vier nieuwe imagegen-achtergronden visueel gecontroleerd: jungle/hive, magma/forge, sky temple en cosmic void hebben elk een vrije verticale gameplaybaan.
- `npm run apk:fast` met `NODE_ENV=production`: geslaagd (`BUILD SUCCESSFUL` in 59 seconden; 317 assets gebundeld).
- Fast-build APK: `android/app/build/outputs/apk/release/app-release.apk`, 95.124.931 bytes, package `nl.cimpro.bugbaas`, versionCode `180`, versionName `2.10.0`.
- APK v2-signing: geslaagd; certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `601CDD975B07E2F241A0192969E6AB804D9755967EB338321C65D341C4BC4F0C`.
- Metro-generated Android resources bevatten alle vier nieuwe Bug Tower-zoneachtergronden.
- Device-smoke voor knoprelease, coyote jump, landing, spin en zonewissel is niet uitgevoerd; `adb devices -l` vond geen aangesloten apparaat.

## 2026-07-17 Bubble Swarm

- `npm run typecheck`: geslaagd.
- `git diff --check` op de Bubble Swarm-code, integratie, vertalingen en Firestore rules: geslaagd; alleen bestaande LF/CRLF-waarschuwingen.
- Firestore Emulator rules-compile op geisoleerde poort 8183: geslaagd; live Firebase is niet gewijzigd.
- Imagegen-assets visueel gecontroleerd: verticale vrije gameplaybaan en zes goed onderscheidbare insect-bubbles; de afzonderlijke ronde sprites behouden hun originele kleurdetails.
- `npm run apk:fast` met `NODE_ENV=production`: geslaagd in 152 seconden.
- Fast-build APK: `android/app/build/outputs/apk/release/app-release.apk`, 86.681.853 bytes, package `nl.cimpro.bugbaas`, versionCode `180`, versionName `2.10.0`, minSdk `26`, targetSdk `36`.
- APK v2-signing: geslaagd; certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `9792FCEF716F567E80AA42992B81239A2F64BD8C80043244AAEDE5A9ECD84018`.
- Metro-generated Android resources bevatten de Bubble Swarm-achtergrond en alle zes gebruikte bubble-sprites.
- Device-smoke voor aimgevoel, collisionkeuze, pressure pacing en Firebase-write is niet uitgevoerd; `adb devices -l` vond geen aangesloten apparaat.
- De eerste emulatorpoging op standaardpoort 8080 werd geblokkeerd door een bestaand proces; de herhaling op 8183 compileerde succesvol.

## 2026-07-17 release 2.10.0

- Versiebronnen: package/Expo `2.10.0`, Android versionName `2.10.0`, versionCode `180`.
- `npm run typecheck`: geslaagd.
- `BUGBAAS_REQUIRE_ENV=1` en `NODE_ENV=production` normale `apk:release`: geslaagd (`BUILD SUCCESSFUL`, R8/minify en resource-optimalisatie actief).
- APK: `dist/BugBaas-2.10.0.apk`, 72.010.767 bytes.
- Metadata: package `nl.cimpro.bugbaas`, versionCode `180`, versionName `2.10.0`, minSdk `26`, targetSdk `36`.
- Signing: APK Signature Scheme v2 geldig, 1 signer, certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `0473F1B67E305B41C959B14B491949DD6F574E6A607B8EAA4336FC4267829CFE`.
- Device-smoke: niet uitgevoerd.

## 2026-07-17 score tier expansion

- Vier nieuwe scoretiers toegevoegd boven de bestaande grens van 2.400 punten.
- Tien gerichte grenscontroles van 2.399 tot en met 40.000 punten: geslaagd.
- `npm.cmd run typecheck`: geslaagd.
- `git diff --check` op de tierbestanden: geslaagd; alleen bestaande LF/CRLF-waarschuwingen.

## 2026-07-17 Nest Defense tap coordinates

- Touches gebruiken nu `pageX/pageY` minus de via `measure` bepaalde speelveldoorsprong; geneste vijandcoördinaten worden niet meer als veldcoördinaten gelezen.
- Hitselectie en de visuele impact gebruiken hetzelfde gemeten veldformaat en dezelfde tappositie.
- Vijand-views hebben `pointerEvents="none"` en onderscheppen de bovenliggende speelveld-`Pressable` niet.
- `npm run typecheck`: geslaagd.
- Device-smoke is niet uitgevoerd.

## 2026-07-17 Bug Glide left control strip

- De blokkerende early return voor taps binnen de eerste 32 pixels is verwijderd; de bestaande links-van-de-bug physics geeft daar nu een impuls naar rechts.
- De visuele strook gebruikt `pointerEvents="none"`, waardoor de bovenliggende speelveld-`Pressable` de tap ontvangt.
- `npm run typecheck`: geslaagd.
- Device-smoke is niet uitgevoerd.

## 2026-07-17 ranked inactivity decay

- Zes gerichte berekeningen geslaagd: gisteren gespeeld, een gemiste dag, vier gemiste dagen, bestaand checkpoint, gedeeltelijke floor-cap en rating onder de floor.
- `npm run typecheck`: geslaagd.
- `git diff --check` op de vier featurebestanden: geslaagd; alleen bestaande LF/CRLF-waarschuwingen.
- Firestore rule toegevoegd die de eigen rating alleen laat dalen, nooit onder 1000, en alleen samen met een geldig dagcheckpoint.
- Firestore rules geladen door de lokale Firebase Emulator op poort 8181: geslaagd; er is niets gedeployed.
- Device-smoke is niet uitgevoerd.

## 2026-07-17 Bug Tower

- `npm.cmd run typecheck`: geslaagd na de definitieve sprite-schaalaanpassing.
- `git diff --check` op alle Bug Tower-code, Android-module, vertalingen en rules: geslaagd; alleen bestaande LF/CRLF-waarschuwingen.
- Imagegen-assets visueel gecontroleerd: spritesheet `1254x1254` met zes volledige poses en transparante achtergrond; torenachtergrond `1024x1536` met vrije centrale gameplaybaan.
- Chroma-key conversie: 1.185.974 volledig transparante en 10.269 gedeeltelijk transparante pixels; randen visueel schoon.
- React Native codegen voor AsyncStorage en Google Sign-In opnieuw gegenereerd: geslaagd.
- `npm.cmd run apk:fast` met `NODE_ENV=production`: geslaagd. De Kotlin-daemon meldde een bestaande incrementele Google Sign-In-cachefout en compileerde daarna succesvol via fallback.
- Fast-build APK: `android/app/build/outputs/apk/release/app-release.apk`, 76.117.648 bytes, opnieuw gebouwd op `2026-07-17 22:24:57` met ranked Firebase-context.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `179`, versionName `2.9.4`, minSdk `26`, targetSdk `36`.
- `aapt2 dump resources`: beide nieuwe resources aanwezig: `assets_minigames_bugtower_bugtowerbackground` en `assets_minigames_bugtower_bugtowerbeetle`.
- `apksigner verify --print-certs`: geslaagd; SHA-256 certificaat `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Fast-build APK SHA-256: `0336D45D136B79D055E040FCB57BADF343BB5E0B709076B4F1513251C6C0AFBC`.
- Definitieve normale `assembleRelease --no-daemon`: geslaagd in 2m 7s, inclusief lint, R8/minify en resource-optimalisatie.
- Definitieve APK: `dist/BugBaas-2.9.4.apk`, 64.953.831 bytes.
- Definitieve APK metadata: package `nl.cimpro.bugbaas`, versionCode `179`, versionName `2.9.4`, minSdk `26`, targetSdk `36`.
- Definitieve APK signing: v2-verified, 1 signer, certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Definitieve APK SHA-256: `9163ADF4CAC05E8D1C8BAA0FF4411E355B34E7EBC65BEBC625DBA74E6128A985`.
- Device-smoke voor kantelhoek, animatie, platformcollision en zichtbare Arena-flow: nog niet uitgevoerd; `adb devices` gaf geen aangesloten apparaat.
- Firestore rules bevatten lokaal `bug_tower`; deployment naar Firebase is niet uitgevoerd.
- Ranked recordcontrole: alleen de `bug_tower`-route stuurt `{ ranked: true, duelId }`; bestaande game-aanroepen blijven zonder context.
- Ranked rules-validatie vereist een bestaand Bug Tower-duel, de ingelogde gebruiker als deelnemer en een exact overeenkomende duelscore.
- Firestore Emulator rules-compile op een geisoleerde lokale poort: geslaagd; live Firebase is niet gewijzigd.
- De bestaande geminificeerde `dist/BugBaas-2.9.4.apk` dateert van voor deze ranked-recordwijziging en is in deze stap niet overschreven.

## 2026-07-17 local gameplay/reward changes

- `npm run typecheck`: geslaagd.
- Android manifest, buddywidget-layout en alle gebruikte buddy-state drawables: XML-parse geslaagd.
- Unlockhistorie: statberekening, setmedailles en badge-characters gebruiken dezelfde `bugdexUnlocks`-bron; legacy inventorydocs met count 0 worden naar unlockhistorie teruggevuld.
- Ranked guard: sluitknop verborgen en Android hardware-back geblokkeerd in alle drie ranked minigames tot de result-state.
- Android `assembleDebug`: niet afgerond; Gradle bleef tijdens bestaande React Native C++-codegen hangen met een padlengtewaarschuwing onder de workspace met spaties.
- Gerichte Kotlin/resourcebuild: gestart maar binnen de commandotime-out niet voorbij Expo-projectconfiguratie gekomen; native build is daarom nog niet als geslaagd aangemerkt.
- Device-smoke voor tabletoriëntatie, Nest Defense-taps en widgetafbeeldingen: nog niet uitgevoerd; geen device in deze taak gebruikt.

## 2.2.28 release

- `npm.cmd run typecheck`: geslaagd.
- `:app:assembleRelease`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.28.apk`.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `123`, versionName `2.2.28`, native-code `arm64-v8a`.
- `apksigner verify --print-certs`: geslaagd.
- Signing blijft legacy/debug SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `3378445bde042e2c13e4f28ae3161c12e43f2be6b8e93f7198d14dfdffa5ba2e`.

## 2.2.27 release

- `npm.cmd run typecheck`: geslaagd.
- `:app:assembleRelease`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.27.apk`.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `122`, versionName `2.2.27`, native-code `arm64-v8a`.
- `apksigner verify --print-certs`: geslaagd.
- Signing blijft legacy/debug SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `3152267b4da06e4df17ab9d402b3f8285b5153fe69040ba8c32bc00b10837c56`.

## 2.2.18 release

- `npm.cmd run typecheck`: geslaagd.
- `npx.cmd expo config --type public`: geslaagd; versie `2.2.18`, package `nl.cimpro.bugbaas`.
- `npx.cmd expo install --check`: geslaagd.
- Logic smoke-check: actieve duelkaart toont score in plaats van gevangen bugs, `score: 0` wordt hersteld vanuit gevangen bugs, dubbele passieve duelhelpers zijn verborgen, en app/rules gebruiken 56 duelbugs per gedeelde seed.
- `firebase.cmd deploy --only firestore:rules --project <firebase-project-id>`: geslaagd.
- `.\android\gradlew.bat -p android assembleRelease -PbugbaasLegacyDebugSigning=true`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.18.apk`.
- APK grootte: `44,651,178` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `113`, versionName `2.2.18`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `FB112B971C4D9E5EB3B44A4584EC2B4680B27B0AB1AE8FA3F492FAB165A2955C`.
- `adb devices`: geen device aangesloten; install-smoke niet uitgevoerd.

## 2.2.17 release

- `npm.cmd run typecheck`: geslaagd.
- `npx.cmd expo config --type public`: geslaagd; versie `2.2.17`, package `nl.cimpro.bugbaas`.
- `npx.cmd expo install --check`: geslaagd.
- Logic smoke-check: 0-bugs duel retry conditie aanwezig en `actief duel loopt al` kaart opent het bestaande duel.
- `.\android\gradlew.bat -p android assembleRelease -PbugbaasLegacyDebugSigning=true`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.17.apk`.
- APK grootte: `44,650,170` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `112`, versionName `2.2.17`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `95B03270C29AF85D2782EFC7C52EF96EC43A4758EEB95C3CE65515F546CFA386`.
- `adb devices`: geen device aangesloten; install-smoke niet uitgevoerd.

## 2.2.16 release

- `npm.cmd run typecheck`: geslaagd.
- `npx.cmd expo config --type public`: geslaagd; versie `2.2.16`, package `nl.cimpro.bugbaas`.
- `npx.cmd expo install --check`: geslaagd.
- Logic smoke-check: helper attack labels in Duel/BugDex, waiting-result ack met Arena-overview, trade/upgrade workshopkaart als enige toggle, weekly 7.5 km en geen screenshot weekly template aanwezig.
- `.\android\gradlew.bat -p android assembleRelease -PbugbaasLegacyDebugSigning=true`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.16.apk`.
- APK grootte: `44,650,094` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `111`, versionName `2.2.16`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `D34BDD811EEF27C2655F2DE357FC398868C4607AD3A2E6830CF108D12DF697D5`.
- `adb devices`: geen device aangesloten; install-smoke niet uitgevoerd.

## 2.2.15 release

- `npm.cmd run typecheck`: geslaagd.
- `npx.cmd expo config --type public`: geslaagd; versie `2.2.15`, package `nl.cimpro.bugbaas`.
- `npx.cmd expo install --check`: geslaagd.
- Logic smoke-check: 48 duel bugs in rules, pending preplay submit, duelRewardEvents, solo progress Firestore rules, retry UI, auto-resubmit en legacy wave migratie aanwezig.
- `firebase.cmd deploy --only firestore:rules --project <firebase-project-id>`: geslaagd.
- `.\android\gradlew.bat -p android :app:clean :app:assembleRelease --no-daemon --console=plain`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.15.apk`.
- APK grootte: `44,647,974` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `110`, versionName `2.2.15`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `6DF6B09AACEDC72156EE3D2E152905B709D7EA6B6A3134E3E4BEF931DE4769B4`.
- `adb devices`: geen device aangesloten; install-smoke niet uitgevoerd.

## 2.2.14 release

- `npm.cmd run typecheck`: geslaagd.
- `npx.cmd expo config --type public`: geslaagd; versie `2.2.14`, package `nl.cimpro.bugbaas`.
- `npx.cmd expo install --check`: geslaagd.
- Logic smoke-check: duel XP constants, daily pair cap en solo powerup hooks aanwezig.
- `.\android\gradlew.bat -p android :app:clean :app:assembleRelease --no-daemon --console=plain`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.14.apk`.
- APK grootte: `44,644,930` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `109`, versionName `2.2.14`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, gelijk aan `2.2.13`.
- APK SHA256: `DE3A475FDB2DFD7F7B9F12AB6AC9084D87576B114B70D7EEEB83A63373F4EB09`.
- `adb devices`: geen device aangesloten; install-smoke niet uitgevoerd.

## 2.2.4 release

- `npm.cmd run typecheck`: geslaagd.
- `.\android\gradlew.bat -p android :app:clean :app:assembleRelease --no-daemon --console=plain`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.4.apk`.
- APK grootte: `44,422,018` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `99`, versionName `2.2.4`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `0623B590AB30DEFD947A9573ED0270E7FB75F798617DF540948BA5AE3D345BA8`.
- `adb devices`: geen device aangesloten; OnePlus-install niet uitgevoerd.

## 2.2.3 release

- `npm.cmd run typecheck`: geslaagd.
- `.\android\gradlew.bat -p android :app:clean :app:assembleRelease --no-daemon --console=plain`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.3.apk`.
- APK grootte: `44,419,406` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `98`, versionName `2.2.3`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `3C87BB04B1E3D3F010067478940EE24971D2F82B7A5C3F8057B76CF53B0155B4`.
- `adb devices`: geen device aangesloten; OnePlus-install niet uitgevoerd.

## 2.2.2 release

- `npm.cmd run typecheck`: geslaagd.
- `.\android\gradlew.bat -p android :app:assembleRelease --no-daemon --console=plain`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.2.apk`.
- APK grootte: `40,233,921` bytes.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `97`, versionName `2.2.2`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `A76817577E7EACDCB3543ABDE545150D539858B7A370DA56A2C5A8E45A24E78A`.
- Geen ADB-device aangesloten; OnePlus-install niet uitgevoerd.

## 2.2.1 APK optimization test

- `npm.cmd run typecheck`: geslaagd.
- `.\android\gradlew.bat -p android :app:clean :app:assembleRelease --no-daemon --console=plain`: geslaagd.
- APK voor optimalisatietest: `dist/CimPro-BugBaas-2.2.1-optimized-test.apk`.
- Grootte bestaande `2.2.1` APK: `54,923,077` bytes.
- Grootte geoptimaliseerde test-APK: `40,179,645` bytes.
- Besparing: `14,743,432` bytes, ongeveer `26.8%`.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `96`, versionName `2.2.1`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `BE62088700DE015EFAA25271F32DF1B436976F3F1DDD972FDB79B678A65C65AD`.
- OnePlus-install niet uitgevoerd in deze optimalisatierun.

## 2.2.1 release

- `npm.cmd run typecheck`: geslaagd.
- `.\android\gradlew.bat -p android :app:assembleRelease --no-daemon --console=plain`: geslaagd.
- APK gekopieerd naar `dist/CimPro-BugBaas-2.2.1.apk`.
- `aapt2 dump badging`: package `nl.cimpro.bugbaas`, versionCode `96`, versionName `2.2.1`.
- `apksigner verify --print-certs`: geslaagd.
- Signing cert SHA-256 is gelijk aan `2.2.0`: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA256: `90A32935737EE76AC36576C24C224744BEA593830AB54895383EF5472937B2B1`.
- Geen toestelinstall uitgevoerd in deze release-run.

Datum: 2026-06-02

## Gepland

- TypeScript-check.
- Expo start-check.
- Pixel 8 emulator smoke-test wanneer Android tooling beschikbaar is.
- Spark-plan dependency check.

## Resultaat

- `npm run typecheck`: geslaagd.
- `npx expo config --type public`: geslaagd.
- `npx expo install --check`: geslaagd.
- Pixel 8 AVD (`emulator-5554`, 1080x2400): geslaagd via Expo Go.
- Smoke-flow getest:
  - Login in demo-modus.
  - Nieuwe bug aangemaakt.
  - Home ververst punten na nieuwe bug.
  - Buglijst toont bug en filterstatussen.
  - Bugdetail toont beschrijving en reproduceerstappen.
  - Status naar `Gefixt` gezet; punten gingen van 10 naar 25.

## Opmerkingen

- Firebase zelf is niet live getest omdat config placeholders leeg zijn.
- Screenshotopslag gebruikt geen Storage; screenshot-thumbnail wordt in Firestore als data-URL opgeslagen.
- `npm install` meldt 11 moderate dependency vulnerabilities in transitive packages. Niet automatisch gefixt om breaking updates te vermijden.

## Spark-plan update

- Screenshotcompressie toegevoegd: max 640 px, JPEG `0.35`.
- Geen Cloud Functions, Cloud Storage of Blaze-only features toegevoegd.
- Firebase Spark-limieten gedocumenteerd in `FIREBASE_SPARK_PLAN.md`.
- Pixel 8 render-check na Spark-update: geslaagd.
- Gefilterde logcat-check op `FATAL`, `AndroidRuntime`, `ReactNativeJS.*Error`, `TransformError`: geen app-crash gevonden.
- HMR `app/duplicate-app` fout opgelost door bestaande Firebase app te hergebruiken met `getApps()`/`getApp()`.

## Insect UI update

- `npm run typecheck`: geslaagd na insect UI update.
- `npx expo install --check`: geslaagd na insect UI update.
- Pixel 8 render-check: geslaagd.
- Screenshotbewijs: `pixel8-insect-final.png`.
- Gefilterde logcat-check: geen app-crash gevonden.

## Tier update

- `npm run typecheck`: geslaagd na tier-implementatie.
- `npx expo install --check`: geslaagd na tier-implementatie.
- Pixel 8 render-check: geslaagd voor Home, Ranglijst en Profiel.
- Screenshotbewijs: `pixel8-tier-home-final.png`, `pixel8-tier-leaderboard-final.png`, `pixel8-tier-profile-final.png`.
- Gefilterde logcat-check: geen app-crash of React Native JS-fout gevonden.
- UI-fix na test: hero-insect volgt de huidige tier; lopende insecten blijven achter de content.

## Modern UI update

- `npm run typecheck`: geslaagd na modern UI update.
- `npx expo install --check`: geslaagd na modern UI update.
- Pixel 8 render-check: geslaagd voor Login, Home, Ranglijst en Profiel.
- Screenshotbewijs: `pixel8-modern-login.png`, `pixel8-modern-home.png`, `pixel8-modern-leaderboard.png`, `pixel8-modern-profile.png`.
- Gefilterde logcat-check: geen app-crash of React Native JS-fout gevonden.
- Demo-ranking gevuld met lokale voorbeeldspelers; Firebase-data wordt niet aangepast.

## Walking bugs update

- `npm run typecheck`: geslaagd na walking bug update.
- `npx expo install --check`: geslaagd na walking bug update.
- Pixel 8 render-check: geslaagd voor Home en Profiel.
- Screenshotbewijs: `pixel8-walking-bugs-home.png`, `pixel8-walking-bugs.png`.
- Gefilterde logcat-check na schone reproduce: geen app-crash of React Native JS-fout gevonden.
- UI-fix: bewegende bugs gebruiken nu zijaanzicht, lineaire horizontale beweging en poot-stapanimatie in plaats van schuine wobble-rotatie.

## Bottom navigation update

- `npm run typecheck`: geslaagd na bottom navigation update.
- `npx expo install --check`: geslaagd na bottom navigation update.
- Pixel 8 render-check: geslaagd voor Home, Bug melden en Ranglijst.
- Screenshotbewijs: `pixel8-bottomnav-home.png`, `pixel8-bottomnav-newbug.png`, `pixel8-bottomnav-leaderboard.png`.
- Gefilterde logcat-check na schone reproduce: geen app-crash of React Native JS-fout gevonden.
- UI-fix: vaste ondernavigatie toegevoegd voor Home, Bug melden en Ranglijst; Home heeft nu nieuws; Ranglijst toont status en badgechips per speler.

## Clean UI update

- `npm run typecheck`: geslaagd na clean UI update.
- `npx expo install --check`: geslaagd na clean UI update.
- Pixel 8 render-check: geslaagd voor Login, Home, Bug melden en Ranglijst.
- Screenshotbewijs: `pixel8-clean-login.png`, `pixel8-clean-home.png`, `pixel8-clean-newbug.png`, `pixel8-clean-leaderboard.png`.
- Gefilterde logcat-check: geen app-crash of React Native JS-fout gevonden.
- UI-fix: zichtbare demo/uitlegtekst verwijderd; schermen gebruiken kortere labels, plaatjes en functionele knoppen.

## Online-inspired modern UI update

- `npm run typecheck`: geslaagd na online-inspired modern UI update.
- `npx expo install --check`: geslaagd na online-inspired modern UI update.
- Pixel 8 render-check: geslaagd voor Login.
- Screenshotbewijs: `pixel8-modern2-login.png`, `pixel8-modern2-after-login.png`.
- Gefilterde logcat-check na schone check: geen app-crash of React Native JS-fout gevonden.
- Eerdere post-login blokkade was `Firebase: Error (auth/configuration-not-found)`; dit is opgelost in de Firebase live connection update hieronder.
- UI-fix: onderste navigatie heeft een prominente centrale meldknop; Home heeft compacte dashboardtegels, top-ranking preview en moderne donkere header; Ranglijstheader is visueel sterker.

## Firebase live connection update

- Firebase CLI: ingelogd als `thomascimpro@gmail.com`.
- Firebase project: `<firebase-project-id>` actief in `.firebaserc`.
- Firebase Android app: `<firebase-app-id>` gevonden via CLI.
- Firestore database: `(default)` bestaat als `STANDARD` / `FIRESTORE_NATIVE`.
- `firebase deploy --only firestore:rules --project <firebase-project-id>`: geslaagd.
- Auth REST signup met project API key: geslaagd.
- Firebase JS Auth signup: geslaagd.
- Firestore REST met Firebase ID-token:
  - `users` document create/read: HTTP 200.
  - `bugs` document create/update: HTTP 200.
- Live smoke-testdocumenten en Auth-testaccounts zijn na verificatie opgeruimd.
- `npm run typecheck`: geslaagd.
- `npx expo install --check`: geslaagd.
- App-fix: hardcoded loginwaarden verwijderd uit `LoginScreen`.
- Pixel 8: login-scherm rendert met lege velden; ADB-invoer was onbetrouwbaar door Expo Go/back-key gedrag, daarom is de live Firebase-koppeling via SDK/REST geverifieerd.

## Upvote update

- `npm run typecheck`: geslaagd na upvote update.
- `npx expo install --check`: geslaagd na upvote update.
- `firebase deploy --only firestore:rules --project <firebase-project-id>`: geslaagd; rules compileerden en zijn live.
- Firebase rules smoke-test met live Auth tokens:
  - bug create: HTTP 200.
  - upvote toevoegen door andere gebruiker: HTTP 200.
  - upvote verwijderen door dezelfde gebruiker: HTTP 200.
  - statusupdate door reporter: HTTP 200.
- Live smoke-testbug en Auth-testaccounts zijn na verificatie opgeruimd.
- UI-fix: bugkaart toont upvote-teller; bugdetail heeft een `Upvote` knop met toggle-status.
- Pixel 8 render-check na upvote update: geslaagd op schone Login na Expo Go reset.
- Screenshotbewijs: `pixel8-upvote-clean-login.png`.
- Gefilterde logcat-check: geen app-crash of React Native JS-fout gevonden; alleen `uiautomator` runtime-regels door de testtool.

## Walking bug splat update

- `npm run typecheck`: geslaagd na splat update.
- `npx expo install --check`: geslaagd na splat update.
- Pixel 8 render-check: geslaagd op Login.
- Screenshotbewijs: `pixel8-splat-render.png`.
- Gefilterde logcat-check: geen app-crash of React Native JS-fout gevonden.
- UI-fix: bewegende bugs hebben nu een eigen hitbox; tikken toont kort een splat-vlek en laat de bug daarna opnieuw lopen.

## Tier insect upgrade update

- Online asset check gedaan:
  - Kenney All-in-1 heeft veel CC0 assets, maar geen direct passende moderne insect-tier set gevonden.
  - Pixel Gnome Bugs Pack heeft insecticons, maar 16x16 pixel-art past minder goed bij de huidige moderne appstijl.
- Keuze: lokale schaalbare React Native insect-assets verbeterd in bestaande appstijl.
- Elke hogere tier gebruikt nu grotere `bugSize` en hogere `evolutionLevel`.
- Visuals: extra shell-details, aura, vleugels en kroon voor hogere tiers.
- `npm run typecheck`: geslaagd na tier insect upgrade.
- `npx expo install --check`: geslaagd na tier insect upgrade.
- Pixel 8 max-tier render-check: geslaagd op Home.
- Screenshotbewijs: `pixel8-tier-upgrade-home-final.png`.
- Gefilterde logcat-check: geen app-crash of React Native JS-fout gevonden.
- Tijdelijke max-tier testgebruiker is opgeruimd uit Firestore en Auth.

## Firebase final CLI setup

- Firebase CLI versie: `15.19.0`.
- Actief project: `<firebase-project-id>`.
- Android app aanwezig: `<firebase-app-id>`.
- Firestore database aanwezig: `(default)`, `STANDARD`, `FIRESTORE_NATIVE`.
- `firestore.indexes.json` toegevoegd en gekoppeld in `firebase.json`.
- `firebase deploy --only firestore --project <firebase-project-id>`: geslaagd.
- Live Firebase smoke-test met echte Auth tokens:
  - `users` create/read: HTTP 200.
  - `bugs` create/read: HTTP 200.
  - upvote update: HTTP 200.
  - reporter statusupdate: HTTP 200.
- Client-side delete werd terecht door rules geweigerd; cleanup is daarna met Firebase CLI gedaan.
- Smoke-test Auth accounts zijn verwijderd.
- `npm run typecheck`: geslaagd.
- `npx expo install --check`: geslaagd.
- Pixel 8 login-poging is niet representatief afgerond: Expo Go werd door Android low-memory killer gestopt, zonder React Native/Firebase stacktrace.

## Profile access update

- `npm run typecheck`: geslaagd na profieltoegang update.
- `npx expo install --check`: geslaagd na profieltoegang update.
- Home hero heeft nu een `Profiel` knop; profiel, logout, badges en tierdetail zijn bereikbaar.
- Pixel 8 render-check: geslaagd op Login.
- Screenshotbewijs: `pixel8-profile-access-login.png`.
- Gefilterde logcat-check: geen app-crash, React Native JS-fout, FirebaseError of `permission-denied` gevonden; emulator had wel algemene geheugenpressure voor andere apps.

## Pixel 8 memory restart and profile UI update

- Pixel 8 AVD koud herstart.
- 2048 MB AVD-RAM bleef te krap voor Expo Go met Play Store-image; `host.exp.exponent` werd door low-memory killer gestopt.
- Pixel 8 opnieuw gestart met `-memory 4096`; Expo Go bleef daarna actief.
- `npm run typecheck`: geslaagd na profiel UI update.
- `npx expo install --check`: geslaagd na profiel UI update.
- Profielscherm gemoderniseerd met hero, tier-insect, statistieken, statuskaart, badgechips en tierstage.
- Pixel 8 render-check: geslaagd op Login na RAM-herstart.
- Screenshotbewijs: `pixel8-after-ram-restart-profile-update.png`.
- Schone gefilterde logcat-check na herladen: geen app-crash, React Native JS-fout, FirebaseError, `permission-denied` of low-memory kill gevonden.

## Google login update

- `expo-auth-session` en `expo-web-browser` toegevoegd.
- Firebase Google Auth gekoppeld via `GoogleAuthProvider.credential()`.
- Firebase Android app `nl.cimpro.bugbaas` heeft lokale debug SHA-1:
  - `2F:2C:57:B3:01:24:97:19:79:AA:B3:A9:79:2B:92:C2:35:4C:90:37`.
- Android OAuth client toegevoegd:
  - `<google-oauth-client-id>`.
- Expo Go Firebase app `host.exp.exponent` is aangemaakt voor diagnosecontext, maar wordt niet gebruikt door de appconfig. SHA toevoegen faalde terecht met HTTP 409 omdat Expo Go package+cert al in een ander OAuth project bestaat.
- Pixel 8 Expo Go: Google-knop zichtbaar en opent `accounts.google.com`.
- Pixel 8 Expo Go volledige OAuth-login: geblokkeerd door Google `Error 400: invalid_request`; verwacht voor Expo Go. Test volledige login met dev/standalone Android build.
- `npm run typecheck`: geslaagd na Google-login update.
- `npx expo install --check`: geslaagd na Google-login update.
- Pixel 8 render-check: geslaagd op Login.
- Screenshotbewijs: `pixel8-google-login-final.png`.
- Gefilterde logcat-check: geen app-crash, TransformError, FirebaseError, `permission-denied` of low-memory kill gevonden.

## First APK release update

- Native Android project gegenereerd met `npx expo prebuild --platform android`.
- `assembleDebug`: geslaagd.
- APK signing SHA-1 van `android/app/debug.keystore` toegevoegd aan Firebase:
  - `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`.
- Android OAuth client voor deze APK:
  - `<google-android-client-id>`.
- `assembleRelease`: geslaagd met ingebakken JS bundle.
- APK gekopieerd naar `release/CimPro-BugBaas-0.1.0.apk`.
- GitHub Release aangemaakt:
  - `https://github.com/thomascimpro/cimpro-bugbaas/releases/tag/v0.1.0`.
- APK-grootte: circa 58 MB.
- `apksigner verify --print-certs`: geslaagd; SHA-1 matcht Firebase.
- Pixel 8 APK install: geslaagd.
- Pixel 8 standalone launch: geslaagd voor package `nl.cimpro.bugbaas`.
- Pixel 8 e-mail accountcreate via APK: geslaagd; Home laadde gedeelde Firebase-ranking.
- Screenshotbewijs:
  - `pixel8-apk-release-login.png`.
  - `pixel8-apk-release-home.png`.
- Gefilterde logcat-check: geen app-crash, React Native JS-fout, FirebaseError, `permission-denied` of low-memory kill gevonden.

## Bug form draft and screenshot update

- `npm run typecheck`: geslaagd.
- `npx expo install --check`: geslaagd.
- `Opslaan` blijft zichtbaar op `Bug melden` door extra scroll-bottom padding.
- Screenshotpreview heeft nu een `X` knop om de afbeelding te verwijderen.
- Bugmeldingsconcept wordt lokaal opgeslagen bij ingevulde velden of screenshot.
- Bij terugkomen op `Bug melden` verschijnt `Concept gevonden` met `Verder` en `Nieuw`.
- Pixel 8 standalone APK-check:
  - `release/CimPro-BugBaas-0.1.1.apk` geinstalleerd.
  - Standalone launch voor package `nl.cimpro.bugbaas`: geslaagd.
  - Concept met titel gemaakt.
  - Naar Home genavigeerd.
  - Terug naar `Meld` genavigeerd.
  - Prompt `Concept gevonden` verscheen.
  - `Verder` herstelde titel `DraftBug`.
- Screenshotbewijs:
  - `pixel8-v011-launch.png`.
  - `pixel8-v011-newbug.png`.
  - `pixel8-newbug-draft-restore.png`.
  - `pixel8-newbug-draft-applied.png`.
- Gefilterde logcat-check: geen app-crash, React Native JS-fout, FirebaseError, `permission-denied` of low-memory kill gevonden.

## Native Google login and app icon update

- Google-login omgezet van Expo AuthSession browserflow naar native `@react-native-google-signin/google-signin`.
- Oude `expo-auth-session` en `expo-web-browser` dependencies verwijderd.
- Nieuw app-icon gegenereerd met `imagegen` en gekoppeld aan Expo/Android launcher assets.
- `npm run typecheck`: geslaagd.
- `npx expo install --check`: geslaagd.
- `assembleRelease`: geslaagd.
- Pixel 8 APK install: geslaagd.
- Pixel 8 native Google-login: geslaagd; login kwam uit op Home.
- Gefilterde logcat-check: geen `invalid_request`, `DEVELOPER_ERROR`, app-crash, React Native JS-fout, FirebaseError of `permission-denied` gevonden.
- Screenshotbewijs:
  - `pixel8-google-native-final.png`.
  - `pixel8-app-icon-launch.png`.

## Bug save, shared upvote and comments update

- Firestore bug create gefixt: `screenshotDataUrl` wordt niet meer meegeschreven als die `undefined` is.
- Firestore rules gedeployed voor `bugs/{bugId}/comments`.
- Comments/reacties toegevoegd met bug-emoticons.
- Upvote-bonus toegevoegd aan ranglijstscore: `+3 pt` per upvote, afgeleid uit Firestore bugs.
- `npm run typecheck`: geslaagd.
- `npx expo install --check`: geslaagd.
- `firebase deploy --only firestore:rules`: geslaagd.
- `assembleRelease`: geslaagd.
- Pixel 8 twee-account flow:
  - Account A maakte bug zonder screenshot.
  - Account B zag de bug in de buglijst.
  - Account B upvotete de bug.
  - Account B plaatste commentaar met bug-emoticon.
  - Ranglijstscore van account A ging van `45` naar `48`.
- Gefilterde logcat-check: geen `Function setDoc`, `Unsupported field value`, FirebaseError, `permission-denied`, app-crash of React Native JS-fout gevonden.
- Screenshotbewijs:
  - `pixel8-bug-created-noscreenshot-2.png`.
  - `pixel8-account-b-buglist.png`.
  - `pixel8-account-b-upvote-comment.png`.
  - `pixel8-upvote-leaderboard.png`.

## BugDex source-sheet import - 2026-07-17

- Bronselectie: 45 duidelijke, unieke insecten uit `assets/bugdex/new17-17-2026`; een onduidelijk exemplaar is afgekeurd.
- Asset-audit: 45/45 bestanden zijn 512x512 RGBA, niet leeg of dubbel, hebben transparante hoeken en een geldige catalogus- en artwork-koppeling.
- `npm run typecheck`: geslaagd.
- `npm run apk:fast`: geslaagd (`BUILD SUCCESSFUL`, 274 taken).
- Release-APK: `android/app/build/outputs/apk/release/app-release.apk` (83.173.820 bytes).
- Device-smoke: niet uitgevoerd.
# 2026-07-19 Nest and FitnessSyncer release 2.10.11

- `npm run typecheck`: passed before release packaging.
- FitnessSyncer parser tests: 4 passed for accepted activities, rejected summary/manual data, idempotency IDs, and token expiry formats.
- Firebase Functions: all five endpoints active; unauthenticated status request returns HTTP 401.
- Runtime configuration is intentionally incomplete because no FitnessSyncer Client ID, Client Secret, or token encryption key is present.
- Vercel production `dpl_BMZtL6j5ZmsjkrZ5C4Gn7heqUSrL`: `READY`; alias `https://bugbaas.vercel.app` active.
- Production Browser with hidden account: 2.10.11 changelog visible; a real enemy at 64% field height produced immediate `HIT` feedback and the run stayed active; zero app console errors.
- `NODE_ENV=production npm run apk:release`: passed.
- APK: `dist/BugBaas-2.10.11.apk`, 83,890,957 bytes, package `nl.cimpro.bugbaas`, versionCode `191`, versionName `2.10.11`, minSdk 26, targetSdk 36.
- APK Signature Scheme v2 passed; existing debug certificate SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `73201DD771063C62127F9ED284889DA18159DC82697D16C25E0624C965828DB3`.
- Local and production web bundle SHA-256 match: `0467CFA717D7F3154DDF2FDD347294DBA5E4E409B66860A59CD90EA809D32A62`.
- GitHub latest release: `v2.10.11`; APK asset present with exact size 83,890,957 bytes.
- `adb devices -l`: no connected device; physical install and native touch-feel remain unverified.

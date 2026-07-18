# Test Results

## 2026-07-18 release 2.10.6

- `npm run typecheck`, `npm run test:arcade` en `git diff --check`: geslaagd.
- Expo-webexport: geslaagd met 317 assets en bundle `AppEntry-22b7f5df8d5bf4e4e4fc2ca13a476efd.js`.
- Vercel production deployment `dpl_6ko8d3zV32z2E5ow1HjbsQneQexS`: `READY`, alias `https://bugbaas.vercel.app`, root HTTP 200 en geen runtime-errors in het laatste uur.
- Live Chromium-flow mobiel en desktop: Firebase e-maillogin, Bug Tower, Bubble Swarm en Bug Glide geslaagd; Google-popup opent `accounts.google.com` zonder demo-auth of `auth/unauthorized-domain`.
- Android `assembleRelease` met lint, R8 en resource-optimalisatie: geslaagd vanaf releasecommit `ea37b56` met `BUGBAAS_REQUIRE_ENV=1`.
- APK-metadata: package `nl.cimpro.bugbaas`, versionCode `186`, versionName `2.10.6`, minSdk `26`, targetSdk `36`.
- APK-config: echt Firebase-project, alle vijf Firebasevelden en beide Google-clientvelden aanwezig in `assets/app.config`.
- APK-signing: v2-verified, 1 signer, certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Definitieve APK: `dist/BugBaas-2.10.6.apk`, 83.395.437 bytes; SHA-256 `5FFC2F6194947D6F1D5955150A5C6E57023DAE2CF593B0A0540597F21C6C956F`.
- `adb devices -l`: geen aangesloten apparaat; fysieke install/login/feeltest blijft open.

## 2026-07-18 Tower challenge and Bubble power-ups

- `npm run test:arcade`: geslaagd; Tower floor 1 is smaller dan 43% breed, scroll start direct op minimaal `0.03` per tick en is na 90 seconden meer dan tweemaal zo snel.
- Bubble-pressure daalt getest van 17,5 naar 6,5 seconden; veilige missers dalen van 6 naar 3; Bomb wist doel en buren terwijl ondersteunde verre bubbles blijven staan.
- `npm run typecheck` en `npm run site:build`: geslaagd; webbundle `AppEntry-a0e5f39a89259a8c533149b45d15cb0b.js` bevat 317 assets.
- Mobiele Chromium-flow 390x844: Bomb en Freeze zichtbaar en bruikbaar; projectile blijft door meerdere frames zichtbaar, reist meer dan 100 px en houdt eindimpactframes vast vóór plaatsing.
- Desktop Bubble Swarm, Tower touchcontrols en Bug Glide-regressie bleven groen; screenshots zijn visueel gecontroleerd zonder overlap of afkapping.
- Android `apk:fast` vanaf dezelfde gameplaybron: geslaagd met verplichte env-config; package `nl.cimpro.bugbaas`, versionName `2.10.5`, targetSdk 36 en bestaand certificaat `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Lokale kandidaat `dist/BugBaas-2.10.5-gameplay-candidate.apk`: SHA-256 `938867DB20C6D61B5C9483962099FED7F9EAE8D7B15663E59ABC92DDDFB5ABA1`; niet gepubliceerd en niet fysiek op toestel getest.

## 2026-07-18 release 2.10.5 movement and animation

- Root cause authregressie: de eerder gepubliceerde 2.10.5-APK bevatte in `assets/app.config` geen release-env en viel daardoor terug op demo-auth; authbroncode en certificaat waren niet gewijzigd.
- Gecorrigeerde APK opnieuw gebouwd vanaf releasecommit `f6234b7` in een korte fysieke worktree met `BUGBAAS_REQUIRE_ENV=1`; `assets/app.config` bevat aantoonbaar het echte Firebase-project, alle vijf Firebasevelden en beide Google-clientconfigvelden.
- Web apart geverifieerd: bundle `AppEntry-8e44eb855aedf5d494813253aa8a0001.js`; Firebase Authorized Domains bevat `bugbaas.vercel.app`; Chromium opent `accounts.google.com` zonder demo-authmelding of `auth/unauthorized-domain`.
- Icy Tower-bronnen gecontroleerd: het kerngevoel komt uit opgebouwd momentum, multi-floor jumps, muurbehoud van snelheid, smallere vloeren en periodiek versnellende scrollpressure.
- `npm run test:arcade`: geslaagd; tikhoogte 12,05% van het speelveld, volledige charge 63,08%, platformbreedte onder 49% op verdieping 100 en onder 35% op verdieping 200.
- `npm run typecheck` en `git diff --check`: geslaagd.
- `npm run site:build`: geslaagd met 317 assets en bundle `AppEntry-ea9ce32892e82c50828fa9067ab14d92.js`.
- Lokale Chromium-flow mobiel 390x844 en desktop 1280x800: geslaagd; Bubble-projectiel bereikt zijn doel en toont minstens vier stabiele impactframes vóór bordresolutie.
- Vercel production deployment `dpl_2rkr3QriUMbADrHab6Ye7U3oCvJj`: `READY`, alias `https://bugbaas.vercel.app`, root en nieuwe JavaScriptbundle HTTP 200.
- Live Chromium-flow op `https://bugbaas.vercel.app`: Google-popup, Bug Tower, Bubble Swarm, Bug Glide, mobiel en desktop geslaagd zonder auth-domeinfout.
- Android `assembleRelease` met lint, R8 en resource-optimalisatie: geslaagd vanuit een korte fysieke Windows-worktree om CMake-padlimieten te vermijden.
- APK-metadata: package `nl.cimpro.bugbaas`, versionCode `185`, versionName `2.10.5`, minSdk `26`, targetSdk `36`.
- APK-signing: v2-verified met certificaat `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Definitieve gecorrigeerde APK: `dist/BugBaas-2.10.5.apk`, 83.392.853 bytes; SHA-256 `91ABCF8663425C9752BC32EBBFABE3C5F30AE17907AAB53323609058798251F2`.
- GitHub Release `test2` (titel `BugBaas 2.10.5`): APK-asset 83.392.853 bytes met dezelfde SHA-256 digest teruggelezen via de release-API.
- `adb devices -l`: geen aangesloten apparaat; fysieke feeltest blijft open.

## 2026-07-18 faster Bug Tower difficulty

- Balans: volledige platformkrimp verschuift van verdieping 500 naar 360; horizontale offsets, gaten, scrollpressure en bewegingsfrequentie nemen eerder toe.
- `npm run test:arcade`: geslaagd, inclusief eerlijke breedte op 100, nauwkeurige landingen op 200, beweging vanaf 30 en sterkere afwisselende offsets.
- `npm run typecheck`: geslaagd.
- `npm run site:build`: geslaagd met 317 assets en de nieuwe gameplaybundle.
- Chromium mobiel 390x844 en desktop 1280x800: volledige Arcade-flow geslaagd; zichtbare touchzones en charge/release-besturing blijven intact.
- Android `assembleRelease` met lint, R8 en resource-optimalisatie: geslaagd.
- APK-metadata: package `nl.cimpro.bugbaas`, versionCode `184`, versionName `2.10.4`, minSdk `26`, targetSdk `36`.
- APK-signing: v2-verified met het bestaande BugBaas-certificaat `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- Definitieve APK: `dist/BugBaas-2.10.4.apk`, 83.392.789 bytes; SHA-256 `775C04E8AE18CA51590550E1913756D8406390222A97CF75CEC69ACD84FBAD21`.
- `adb devices -l`: geen aangesloten apparaat; fysieke feeltest blijft open.
- Sites-versie 7: productie-deployment geslaagd; live mobiele/desktop Chromium-flow daarna opnieuw geslaagd.
- GitHub Release `v2.10.4`: openbaar teruggelezen als draft `false`, prerelease `false`, met APK-asset van 83.392.789 bytes.

## 2026-07-18 Bug Tower touch overlays

- Implementatie: beide bestaande halfbrede touchzones tonen nu een halftransparante cue met `←`/`→` en `HOLD LEFT`/`HOLD RIGHT`; input- en physicsfuncties zijn ongewijzigd.
- `npm run test:arcade`: geslaagd; Tower- en Bubble-logica blijven groen.
- `npm run typecheck`: geslaagd.
- `npm run site:build`: geslaagd met 317 assets.
- Chromium 390x844: beide pijlen en hold-labels zichtbaar; beide zones blijven ieder minimaal een halve mobiele speelveldbreedte en charge/release-jump blijft werken.
- Screenshot `dist/playtest-2.10.3/bug-tower-charged-mobile.png` visueel gecontroleerd: cues zijn duidelijk maar platforms en character blijven zichtbaar.

## 2026-07-18 release 2.10.3 arcade balance

- `npm run test:arcade`: geslaagd voor geleidelijke Tower-breedte/gaten, latere bewegende platforms, tijdsversnelling, vijf zones, hoogtegebaseerde score, alleen aanwezige Bubble-kleuren en begrensde muurbounce.
- `npm run typecheck`: geslaagd met de nieuwe game-, audio- en browsertestcode.
- Expo-webexport: geslaagd met 317 assets; alle vier nieuwe Tower-zonebeelden zitten in de export.
- Headless Chromium mobiel 390x844: Tower-halfschermbesturing, charge/release-sprong, spinframe, actieve zonenaam en tredennummers zichtbaar gecontroleerd.
- Headless Chromium mobiel: Bubble toont een contrastrijke 15-dot bouncepreview, minimaal 34 ronde 9.7%-bubbles en een projectiel dat tijdens de 440-720 ms vlucht zichtbaar blijft.
- Headless Chromium desktop 1280x800: Bubble-playfield schaalt mee; bestaande Bug Glide-linkerstrookregressie blijft groen.
- Screenshots staan lokaal onder `dist/playtest-2.10.3` en worden niet gecommit.
- Productie-Sites-build: geslaagd; Sites-versie 5 is succesvol gedeployed op `https://bugbaas-web.werkruimte-v-5909.chatgpt.site/`.
- Live Chromium-flow op de productie-URL: geslaagd voor Tower controls/zone/floor labels, Bubble dotted bounce/smooth shot/smaller grid, Bug Glide en mobiele plus desktop-layout.
- De Sites-testheader wordt alleen naar de Sites-origin gestuurd; Firebase-verzoeken ontvangen hem niet.
- Normale Android `assembleRelease` met R8, lint en resource-optimalisatie: geslaagd vanaf de finale bronbasis.
- APK-metadata: package `nl.cimpro.bugbaas`, versionCode `183`, versionName `2.10.3`, minSdk `26`, targetSdk `36`.
- APK-signing: v2-verified, 1 signer, certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`, gelijk aan eerdere BugBaas-releases.
- Definitieve APK: `dist/BugBaas-2.10.3.apk`, 83.392.093 bytes, gebouwd vanaf commit `79f9071a35b89d6d1cac8bc9d2e3061c836950b1`.
- Definitieve APK SHA-256: `591D6C948D508FCDD54C2FDAC005E48B00AAED593FDEE3CA92D15EDCAC963EEB`.
- GitHub Release `v2.10.3`: openbaar gepubliceerd en via de authenticated release-API teruggelezen; draft `false`, prerelease `false`, APK-asset 83.392.093 bytes.
- `adb devices -l`: geen aangesloten apparaat; fysieke controle van geluid en besturingsgevoel blijft open.

## 2026-07-18 fullscreen web shell

- Browserchecks op 390×844, 844×390, 768×1024 en 1280×800 zijn geslaagd zonder pagina-overflow.
- Het iframe en de zichtbare Expo-`#root` waren op alle vier formaten exact even groot als de browserviewport.
- Sites-toegang live gecontroleerd: huidige modus `custom`, alleen de eigenaar toegestaan; beschikbare modi zijn `custom` en `workspace_all`, niet `public`.

## 2026-07-18 release 2.10.2 gameplay and permissions

- `npm run test:arcade`: geslaagd voor hold-duration versus spronghoogte, kleinere platforms, grotere gaten, oplopende scroll, match-3, geen pop bij twee bubbels en vallende unsupported clusters.
- `npm run typecheck`: geslaagd na Tower-, Bubble-, Glide-, Arena- en rules-wijzigingen.
- Expo webexport: geslaagd met 313 assets; Sites-productiebuild: geslaagd.
- Headless Chromium mobiel 390x844: Bug Tower linker/rechter halve touchzones, 560 ms charge en release-jump gecontroleerd; geen tilt- of losse jumpknop aanwezig.
- Headless Chromium mobiel: Bubble Swarm toont minimaal 30 vierkante/ronde bubbelbeelden, verwerkt een drag/release-shot en toont afzonderlijke Ranked/Train-acties.
- Headless Chromium mobiel: tap in de linker Bug Glide-strook komt door, terwijl de volledige characterbox rechts van de 32 px strook blijft.
- Headless Chromium desktop 1280x800: Bubble Swarm-playfield schaalt mee en alle bubbels blijven rond; screenshots staan lokaal onder `dist/playtest-2.10.2` en worden niet gecommit.
- `firebase-tools deploy --only firestore:rules`: regels compileerden en zijn succesvol live uitgebracht op project `thomascimpro-6266f`.
- Productie-APK-build met R8/minify en resource-optimalisatie: geslaagd (`BUILD SUCCESSFUL`).
- APK: `dist/BugBaas-2.10.2.apk`, 75.321.796 bytes; package `nl.cimpro.bugbaas`, versionCode `182`, versionName `2.10.2`, minSdk `26`, targetSdk `36`.
- Signing: APK Signature Scheme v2 geldig, 1 signer, certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `DA247011A669976E658A92FD841E2A514DA7217C1C9482AD5BEC71570888B62B`.
- Device-smoke: niet uitgevoerd; `adb devices` gaf geen aangesloten apparaten.

## 2026-07-18 web and Strava release

- npm run typecheck: geslaagd voor de gedeelde Expo-app.
- site npx tsc --noEmit: geslaagd voor Sites, D1 en vijf Strava-routes.
- Expo webexport: geslaagd met 313 assets en een bundle van circa 2,51 MB.
- Sites-productiebuild: geslaagd; dist/server/index.js, clientassets, hostingconfig en D1-migratie aanwezig.
- D1-migratie gecontroleerd: drie tabellen voor OAuth-states, versleutelde connecties en ontdubbelde activiteiten.
- Weekkilometers zonder activiteit op de huidige dag lopen door het bestaande profielpad en worden niet door de dagwaarde nul geblokkeerd.
- Lokale HTTP-smoke: shell, game-index, gamebundle en bugasset geven 200; Strava-status zonder Firebase-token geeft correct 401.
- Headless Chromium op 1440x900 en iPhone 390x844: shell en game-iframe renderen zonder horizontale overflow of consolefouten.
- Demo-flow: e-maillogin, Home, Arena en actieve gameplay gecontroleerd voor Tap Duel, Web Runner, Nest Defense en Bug Glide; Bug Tower en Bubble Swarm renderden hun trainingsschermen en assets zonder consolefout.
- Echte Firebase-login en Strava OAuth zijn niet live gevalideerd: hiervoor zijn het uiteindelijke Sites-domein, Firebase Authorized Domain en Strava client-ID/secret vereist.

## 2026-07-17 release 2.10.1 implementation

- `npm run typecheck`: geslaagd na Bubble Swarm-, popup-, categorie-, tier- en dagmissiewijzigingen.
- Categorie-audit: 45 nieuwe bug-IDs gevonden, 0 ongecategoriseerd en 0 dubbele IDs binnen een categorie.
- Versiebronnen voorbereid op package/Expo/Android `2.10.1` met Android versionCode `181`.
- Tieraudit: alle 12 puntenbereiken gecontroleerd van `0–39` tot `40000+`; de vier hoge tierbeelden hebben rondom minimaal 20 transparante pixels en worden niet afgeknipt.
- Productiebuild met `NODE_ENV=production` en `BUGBAAS_REQUIRE_ENV=1`: geslaagd (`BUILD SUCCESSFUL` met R8/minify en resource-optimalisatie).
- APK: `dist/BugBaas-2.10.1.apk`, 75.317.168 bytes.
- Metadata: package `nl.cimpro.bugbaas`, versionCode `181`, versionName `2.10.1`, minSdk `26`, targetSdk `36`.
- Signing: APK Signature Scheme v2 geldig, 1 signer, certificaat SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
- APK SHA-256: `AB135BEC6B9A6A922B66F1A45EB6D9E0DD9C20369936707EDC9A4EA5D7FCC87A`.
- Device-smoke: niet uitgevoerd; `adb devices` gaf geen aangesloten apparaten.

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

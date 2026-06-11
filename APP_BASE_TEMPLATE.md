# App Base Template

Herbruikbare basis uit BugBaas voor nieuwe Android-first apps.

Gebruik dit bestand als startchecklist wanneer je een nieuwe app bouwt. Kopieer niet blind alles; kies alleen wat past bij de nieuwe app.

## Hoe Dit Te Gebruiken

Dit is geen blueprint die je 1-op-1 moet kopieren. Gebruik het als keuzemenu:

1. Kies eerst het doel van de nieuwe app.
2. Selecteer alleen de onderdelen die dat doel sneller of beter maken.
3. Kopieer vooral patronen, niet namen, thema, assets of gameplay.
4. Neem release/testing/native lessen altijd mee; die zijn generiek nuttig.
5. Laat BugBaas-specifieke dingen weg als de nieuwe app geen collectie/game/widget nodig heeft.

Altijd nuttig voor bijna elke nieuwe app:

- projectstructuur;
- typed services;
- Firebase/Auth setup;
- changelog en releaseflow;
- version update check;
- Android build/test checklist;
- asset/icon lessons;
- pitfalls.

Alleen gebruiken als het past:

- BugDex/collection;
- rarity/reward economy;
- foreground minigame;
- Android widget;
- Health Connect movement rewards;
- trade system;
- animated ambient layer.

## Niet 1-Op-1 Kopieren

Laat dit meestal achterwege of vertaal het naar het nieuwe domein:

- BugBaas naamgeving, insectenthema, BugDex copy en bug images.
- Exacte reward getallen als ze niet passen bij de nieuwe app.
- 117 collectie-items als een kleinere collectie genoeg is.
- Widget/radar code als de nieuwe app geen home screen widget nodig heeft.
- Health Connect permissions als beweging geen core mechanic is.
- Trade system als users geen collectie-items uitwisselen.
- Firebase project IDs, OAuth clients, SHA-1 details en testaccounts.

Wel hergebruiken:

- het idee van kleine typed service boundaries;
- native bridge voor Android-only features;
- `reason` strings in native/service responses;
- `AlarmManager` + `goAsync()` receiver patroon;
- strict version compare voor update notices;
- release APK verificatie met `aapt` en SHA256.

## Stack

- Expo + React Native + TypeScript voor snelle Android-first ontwikkeling.
- Native Android module in Kotlin wanneer React Native/Expo niet genoeg is.
- Firebase Auth + Firestore voor gedeelde data zonder eigen backend.
- AsyncStorage voor lokale cache, drafts en kleine client state.
- GitHub Releases voor interne APK-distributie.
- Arm64-only APK voor echte telefoons om releasegrootte laag te houden.

## Projectstructuur

- `src/screens`: volledige schermen en hoofdflows.
- `src/components`: herbruikbare UI, overlays, animaties en kleine widgets.
- `src/services`: data access, business logic, Firebase calls, native bridges.
- `src/types.ts`: gedeelde types.
- `src/firebase.ts`: Firebase init, config check en auth persistence.
- `android/app/src/main/java/<package>`: native Android modules, receivers, widgets.
- `android/app/src/main/res`: Android resources, icons, drawables, widget layouts.
- `assets`: app icon, adaptive icon en runtime image assets.
- `dist`: lokaal gebouwde APK's, niet als broncode committen.

## Basisprincipes

- Houd de eerste versie klein: handmatige navigatie is prima als de app weinig schermen heeft.
- Zet gedeelde app-logica in services, niet in componenten.
- Laat schermen vooral state, layout en user actions beheren.
- Maak Firebase optioneel testbaar met een demo/fallback pad waar dat nuttig is.
- Gebruik expliciete statusvelden en kleine typed objects voor data die vaak verandert.
- Houd release notes direct bij in `CHANGELOG.md`.

## Succesvolle Features Uit BugBaas

Deze onderdelen werkten uiteindelijk goed en zijn herbruikbaar als patroon:

- Android-first Expo app met echte APK releases via GitHub.
- Firebase login, shared Firestore data en lokale fallback voor beperkte testbaarheid.
- Home dashboard met compacte statuskaarten, score, rank, weekly missions en progress bars.
- Bug reporting flow met punten, status, upvotes en user ranking.
- BugDex collectie met locked/unlocked states, rarity, weetjes en duplicate handling.
- BugDex rewards gekoppeld aan app-acties, daily login, foreground catches, radar en movement rewards.
- Foreground catch minigame met bewegende insecten, HP-bar, hit feedback en despawn timer.
- Background walking bugs als speelse ambient laag.
- Android home screen widget met radar, real bug image, rarity aura en stacked finds.
- Native widget bridge zodat JS app en Android widget dezelfde radar queue gebruiken.
- Movement rewards via Health Connect, inclusief app claim en periodieke widget claim.
- Update notice via GitHub latest release, met veilige semver-check.
- Arm64-only APK release voor kleinere telefooninstallaties.
- HD image assets voor icon, radar en special rarity visuals.

## Implementatie-Recepten Uit BugBaas

Gebruik deze recepten als startpunt. Pas namen en domeinlogica aan.

### App Shell

Hoe gedaan:

- `App.tsx` beheert globale route/screen state.
- `src/screens/*` bevat schermen, geen zware business logic.
- `src/components/BottomNav.tsx` houdt hoofdnav simpel.
- `src/styles/shared.ts` centraliseert gedeelde styling.

Wanneer hergebruiken:

- Kleine tot middelgrote apps zonder complexe deep navigation.

Wanneer vervangen:

- Grote app met veel nested flows: gebruik dan React Navigation.

### Firebase Data Layer

Hoe gedaan:

- `src/firebase.ts` initialiseert Firebase en exporteert `auth`, `db`, `isFirebaseConfigured`.
- `src/services/*Service.ts` bevat Firestore reads/writes.
- Services hebben demo/fallback gedrag waar dat nuttig is.
- UI roept services aan en refresht daarna state.

Belangrijk:

- Zet Firestore writes niet verspreid in componenten.
- Gebruik transactions voor claims/rewards die niet dubbel mogen.
- Houd security rules en indexes naast de app in git.

### Native Android Module

Hoe gedaan:

- `BugBaasNativeModule.kt` exposeert Android-only functies aan JS.
- `BugBaasNativePackage.kt` registreert de module.
- `MainApplication.kt` voegt package toe aan React Native.
- JS gebruikt `NativeModules.BugBaasNative` in services.

Goed patroon:

- Native functie doet klein, duidelijk werk.
- Native response is een plain object.
- Fouten komen terug als `reason`, niet als onduidelijke crash.
- JS service beslist of fallback of permission prompt nodig is.

### Android Widget

Hoe gedaan:

- `BugRadarWidgetProvider.kt` is de `AppWidgetProvider`.
- `android/app/src/main/res/xml/bug_radar_widget_info.xml` registreert widget metadata.
- `android/app/src/main/res/layout/bug_radar_widget*.xml` bevat RemoteViews layouts.
- Widget state staat in SharedPreferences.
- Widget update gebeurt native met `AppWidgetManager`.

Cruciaal:

- `RemoteViews` is beperkt; test widget build en launcher.
- Gebruik alleen AppWidget-safe views.
- Voor async receiver werk: `goAsync()`, coroutine op IO, altijd `finish()`.
- App en widget delen queue via native helper functies.

### Deep Link Van Widget Naar App

Hoe gedaan:

- Widget click maakt Intent naar `MainActivity`.
- Intent gebruikt custom scheme zoals `bugbaas://radar?bugId=...`.
- `AndroidManifest.xml` registreert scheme/host.
- App leest de launch route en opent exact de juiste foreground flow.

Waarom nuttig:

- Widget kan exacte context doorgeven.
- User hoeft niet eerst door Home te navigeren.

### Movement / Health Connect

Hoe gedaan:

- JS service vraagt progress/claim via native module.
- Native leest Health Connect records.
- Widget gebruikt native movement check zonder dat JS app open is.
- App claim en widget claim enqueue-en allebei radar bugs in dezelfde queue.

Files:

- `MovementRadarNative.kt`
- `BugBaasNativeModule.kt`
- `src/services/movementRadarService.ts`
- `src/screens/HomeScreen.tsx`

Belangrijk:

- Permissions moeten in manifest en in Health Connect request zitten.
- Background read permission is apart.
- Sync vanuit Google Fit/bronapp kan niet door jouw app geforceerd worden.

### Update Notice

Hoe gedaan:

- `src/services/versionService.ts` leest GitHub latest release.
- Native/app versie wordt vergeleken met release tag.
- Notice verschijnt alleen bij strikt nieuwere versie.
- Download actie opent releasepagina.

Belangrijk:

- Blokkeer nooit bij gelijke versie.
- Blokkeer nooit bij API/network parse failure.
- Directe APK asset openen is minder betrouwbaar op sommige Android browsers.

### Release Flow

Hoe gedaan:

- Versie staat in `package.json`, `package-lock.json`, `app.json`, `android/app/build.gradle`.
- `versionCode` wordt elke release verhoogd.
- `CHANGELOG.md` krijgt bovenaan een korte sectie.
- Build is arm64-only voor telefoon APK.
- Git tag en GitHub Release gebruiken dezelfde versie.

Minimum checks:

- `npm.cmd run typecheck`
- `:app:assembleRelease -PreactNativeArchitectures=arm64-v8a`
- `aapt dump badging`
- SHA256 hash

### Assets / HD Visuals

Hoe gedaan:

- Runtime assets staan onder `assets` of Android `res/drawable`.
- Generated previews/contact sheets blijven buiten git tenzij echt nodig.
- App icon/adaptive icon is bitmap-based en vult het frame.
- Widget gebruikt AppWidget-safe bitmap frames/aura images.

Belangrijk:

- Check launcher icon op echte telefoon.
- Check APK size na asset batches.
- Gebruik kleinere runtime variants als full HD bron te zwaar is.

## Gamification Model

Goed herbruikbaar patroon:

- Maak acties klein en frequent belonend.
- Combineer vaste rewards met random drops.
- Gebruik rarity als simpele centrale difficulty/reward-as.
- Toon voortgang altijd compact op Home.
- Maak rewards direct zichtbaar in collectie of popup.
- Geef zeldzame rewards extra visueel gewicht zonder lange uitleg.

BugBaas voorbeelden:

- `Gewoon`, `Zeldzaam`, `Episch`, `Legendarisch`.
- Hogere rarity vraagt meer moeite en krijgt betere visual treatment.
- Daily login kan punten of lage BugDex reward geven.
- Streaks kunnen betere BugDex rewards geven.
- Weekly missions tonen progress en beloning.
- User tiers koppelen punten/bugs aan een titel en visueel insect.

## BugDex / Collection System

Succesvol patroon:

- Maak een vaste masterlijst met entries.
- Geef elke entry:
  - stable `id`;
  - display name;
  - rarity;
  - image asset;
  - korte flavor/fact text;
  - optional gameplay metadata.
- Inventory slaat alleen user-owned state op, niet de volledige entry.
- Locked collectie-items mogen als silhouettes/unknown slots zichtbaar zijn als dat motiverend is.
- Unlock popup moet duidelijk tonen wat je kreeg.
- Duplicates kunnen gebruikt worden voor combineren, ruilen of extra currency.

BugBaas details:

- 117 BugDex entries.
- Alle entries kunnen optioneel spawnen als foreground/radar bug.
- Foreground/radar catch unlockt exact de gevangen BugDex bug.
- Rarity is verdeeld op visuele indruk: kleine/plain bugs lager, grote/glanzende/hoornbugs hoger.
- Unlock popup toont liever een weetje dan generieke tekst zoals `Gewoon`.
- Rarity mag via border, glow, aura of animatie zichtbaar zijn zonder extra tekst.
- Episch/Legendarisch moeten duidelijk premium voelen.

## Foreground Catch Minigame

Wat goed werkte:

- Maak het geen simpele tap, maar een korte catch challenge.
- Gebruik echte bug/insect beelden of duidelijke cartoon insecten.
- Laat bug altijd binnen scherm blijven.
- Gebruik meerdere taps per rarity:
  - Common/Gewoon: 3 taps;
  - Rare/Zeldzaam: 5 taps;
  - Epic/Episch: 7 taps;
  - Legendary/Legendarisch: 9 taps.
- Despawn window rond 30 seconden voelt speelbaar.
- HP-bar zonder tekst is duidelijker dan counters.
- Hit feedback mag shake/pulse/hit flash zijn, maar geen storende cirkel als de user dat niet wil.
- Een ronde despawn timer rond/naast de bug werkt beter dan timertekst.
- Hitbox moet op echte device getest worden; soms is visueel exact te klein, soms te ruim.

Movement lessons:

- Vermijd rechte lijnen en robotachtig heen-en-weer schieten.
- Combineer korte insectachtige stappen, bobbing, kleine pauzes, zigzag/boog en logische rotatie.
- Rotatie moet meevoelen met looprichting, niet fixed ondersteboven blijven.
- Speed mag met rarity omhoog, maar Legendary moet mobiel nog te tappen zijn.
- Gebruik native transform animation waar dat smoother is.

## Background / Ambient Bugs

Herbruikbaar patroon:

- Ambient bewegende bugs maken een app speelser zonder core workflow te blokkeren.
- Geef ze eigen hitbox en tap feedback.
- Laat ze niet layout beinvloeden.
- Houd aantal en snelheid beperkt zodat UI leesbaar blijft.
- Gebruik dezelfde visual language als foreground catches.

## Radar Widget

Wat werkte:

- Full-widget radar visual in plaats van kleine radar in een grote widget.
- Aparte compacte layout voor 1x1 en grotere layout voor 2x2+.
- Bij no find: radar/scanning state zonder veel tekst.
- Bij find: toon echte bug image op de radar.
- Bij meerdere finds: toon stack count, bijvoorbeeld `x3`.
- Gevonden bug blijft staan tot de user tikt.
- Widget tap opent exact die bug als foreground catch.
- Widget en app gebruiken dezelfde native queue.

Rarity visual:

- Geen lelijke simpele gekleurde cirkel als eindresultaat.
- Gebruik AppWidget-safe `ImageView` aura/bitmap voor Episch/Legendarisch.
- Vermijd unsupported widget views; anders toont Android launcher `er is een fout opgetreden`.
- HD bitmap radarframes werken betrouwbaarder dan complexe vector/animated views.

Scheduling:

- Random radar finds mogen via AlarmManager.
- Max 3 random radar finds per dag werkte als rustige default.
- Werkdagen kunnen kantooruren prefereren, maar avond/weekend kans voelt beter.
- Movement rewards staan los van random radar finds.

## Movement Rewards

Succesvolle implementatie:

- Home toont compacte Beweeg radar kaart met dagelijkse doelen.
- Claim knop alleen tonen als `claimableRewards > 0`.
- Widget kan periodiek zelf movement claims klaarzetten.
- App claim en widget claim moeten beide dezelfde radar queue gebruiken.
- Max 5 movement rewards per dag voorkomt overbeloning.

Huidige drempels:

- Lopen: 3 km per radar bug.
- Hardlopen: 4 km per radar bug.
- Fietsen: 6 km per radar bug.
- Stappen kunnen als fallback naar loopafstand worden omgerekend.

Health Connect details:

- Lees `DistanceRecord`, `ExerciseSessionRecord` en `StepsRecord`.
- Gebruik Health Connect permissions plus background permission voor widget periodic checks.
- Native check geeft `reason` terug bij problemen, bijvoorbeeld `health_permission`.
- App kan permission aanvragen, maar niet Google Fit sync automatisch inschakelen.
- Indoor beweging telt alleen als de bron data naar Health Connect schrijft.

## Native Widget Queue Pattern

Goed patroon voor app + widget samenwerking:

- SharedPreferences bewaart actieve IDs.
- Native provider heeft functies om queue te lezen/schrijven.
- JS roept native bridge aan om radar bugs te enqueue-en.
- Widget receiver gebruikt dezelfde enqueue helper.
- Na elke queue wijziging meteen `updateAllWidgets`.
- Bij openen: pop eerste item, update widget, open app met deep link naar exact item.

Belangrijk:

- Houd max queue size vast, bijvoorbeeld 5.
- Filter IDs tegen een masterlijst.
- Maak pending intents uniek genoeg per widget/action.
- Gebruik `applicationContext` in async receiver werk.

## Update / Install Flow

Wat betrouwbaar bleek:

- Check GitHub latest release via API.
- Vergelijk installed version met release tag via defensieve semver parser.
- Toon update notice alleen bij strikt nieuwere versie.
- Gelijke versie, ongeldige tag of network error mag app niet blokkeren.
- Open de GitHub releasepagina, niet direct de APK URL.
- Directe APK asset download kan op sommige OnePlus/Chrome flows blijven hangen.

## Release And APK Size

Praktische keuzes:

- Arm64-only APK is goed voor echte moderne telefoons zoals OnePlus/Pixel.
- x86_64 build blijft nuttig voor emulator/debug.
- Veel PNG/HD assets maken APK snel groot.
- Houd generated previews, screenshots en contact sheets buiten git.
- Gebruik `aapt dump badging` om versie en native-code te controleren.
- Noteer SHA256 in release notes.

## UI Details Die Werkten

- Home moet compact zijn; geen marketing landing page voor een interne tool.
- Progress bars zijn beter dan veel uitlegtekst.
- Nederlandse labels consistent houden.
- Lange namen/titels testen op kleine schermen; gebruik wrapping of kleinere tekst.
- Claim/action knoppen alleen tonen wanneer actie echt kan.
- Icon moet volledige adaptive icon vullen; geen witte rand.
- Rarity en rewardwaarde visueel tonen met border/glow/aura.

## Data / Services Pattern

Herbruikbaar:

- `pointsService`: rules, tiers, score logic.
- `bugDexService`: inventory, drops, rarity, duplicates.
- `movementRadarService`: JS orchestration plus native fallback.
- `notificationService`: in-app/local notification logic.
- `versionService`: GitHub release check.
- `userService`: auth user document, ranking, points mutations.
- `tradeService`: collection item exchange.

Belangrijke service-regels:

- Houd Firestore writes gecentraliseerd.
- Gebruik transactionele claims wanneer dubbele rewards riskant zijn.
- Geef services typed return values met `reason` in plaats van losse exceptions.
- Maak UI na een claim altijd opnieuw refreshen vanuit service state.

## Firebase

Checklist voor nieuwe app:

- Zet Firebase waarden in `app.json` onder `expo.extra`.
- Gebruik `initializeAuth` met AsyncStorage persistence voor React Native.
- Controleer bij start of Firebase config compleet is.
- Maak Firestore rules vroeg; test geen app op open database rules.
- Blijf op Spark/free plan als dat het doel is:
  - geen Cloud Functions;
  - geen Cloud Storage voor grote uploads;
  - geen server-side push afhankelijkheid.

Patroon:

- `firebase.ts` exporteert `auth`, `db` en `isFirebaseConfigured`.
- Services checken `isFirebaseConfigured` voordat ze Firestore gebruiken.
- Demo/local fallback mag alleen voor development of expliciet bedoelde offline flows.

## Auth

Aanbevolen basis:

- Email/password als stabiele test-login.
- Google login alleen als Android package, SHA-1 en Firebase OAuth client kloppen.
- Maak een hidden/test account voor emulator en release smoke tests.
- Documenteer testaccountgebruik zonder wachtwoorden in git te zetten.

Let op:

- Expo Go heeft een ander package id dan standalone APK.
- Google login moet daarom met dev build of echte APK getest worden.

## Native Android Bridge

Gebruik Kotlin native modules voor dingen die JS niet betrouwbaar kan:

- Health Connect;
- Android widgets;
- AlarmManager;
- system intents;
- package/version info;
- foreground/background Android gedrag.

Patroon:

- Maak een `ReactContextBaseJavaModule`.
- Expose kleine `@ReactMethod` functies met Promise results.
- Houd native result objects simpel: booleans, strings, numbers, arrays.
- Gebruik duidelijke `reason` strings voor failure states zoals `health_permission` of `native`.
- Voeg native package toe in `MainApplication.kt`.

## Android Widgets

Belangrijke lessen:

- Widgets gebruiken `RemoteViews`; niet alle normale Android views of styles werken.
- Gebruik simpele layouts, `ImageView`, `TextView`, `FrameLayout`, `LinearLayout`.
- Houd compacte 1x1 layout apart van grotere widget layout.
- Update widgets expliciet na state changes met `AppWidgetManager.updateAppWidget`.
- Voor async werk in een `BroadcastReceiver`: gebruik `goAsync()` en roep altijd `finish()`.
- Bewaar widget state in SharedPreferences, niet in React state.
- Als widget en app dezelfde queue gebruiken, maak een native helper die beide kunnen aanroepen.

Voor periodic checks:

- Gebruik `AlarmManager.setAndAllowWhileIdle`.
- Plan opnieuw na elke receiver-run.
- Houd checks goedkoop en tolerant voor permission failures.
- Verwacht geen exacte timing; Android mag alarms uitstellen.

## Health Connect / Movement Data

Checklist:

- Manifest permissions toevoegen voor alle gelezen record types.
- Permission rationale activity/alias registreren.
- Lees alleen data die echt nodig is.
- Vraag users duidelijk om Health Connect toegang.
- Background reads vragen extra permission:
  - `android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND`
  - `HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND`

Belangrijke beperking:

- De app kan Google Fit sync naar Health Connect niet automatisch aanzetten.
- De app kan permissions aanvragen, maar de gebruiker moet Fit/Health Connect toegang zelf goedzetten.
- Loopband of indoor activity telt alleen als de bron stappen, afstand of activity naar Health Connect schrijft.

## App Icons And Assets

Aanpak:

- Gebruik HD bitmap icons, geen snelle SVG placeholder als eindresultaat.
- Maak adaptive icon zonder witte rand.
- Controleer icon op echte launcher/all-apps screen.
- Houd bronafbeeldingen apart van geoptimaliseerde runtime assets.
- Commit alleen assets die de app echt gebruikt.

Voor veel image assets:

- Gebruik WebP/PNG waar passend.
- Check APK size na grote asset batches.
- Overweeg arm64-only APK voor telefoonrelease.
- Laat `screenshots`, previews en broncontact sheets uit git tenzij bewust nodig.

## Animaties En Gameplay

Lessen uit BugBaas:

- Test tap hitboxes op device; visueel formaat en touch area kunnen uit elkaar lopen.
- Voor bewegende targets: combineer natuurlijke paden, rotatie en snelheid voorzichtig.
- Vermijd te robotachtige lineaire bewegingen.
- Toon feedback bij hits, maar voorkom visuele clutter.
- Timers werken beter als kleine visuele rand/ring dan als tekst.
- Maak difficulty data-driven: rarity, taps, speed, movement pattern.

## Notifications

Spark/free Firebase beperking:

- Firestore listeners werken wanneer de app draait of recent actief is.
- Een volledig gesloten app betrouwbaar wakker maken vraagt server push.
- Zonder Cloud Functions/eigen server: verwacht geen gegarandeerde closed-app notifications.

Basis:

- In-app banner/toast voor live events.
- Local Android notification wanneer app op achtergrond nog actief is.
- Documenteer eerlijk wat wel/niet gegarandeerd is.

## Version Update Check

Aanbevolen patroon:

- Lees GitHub latest release via API.
- Parse semver defensief.
- Toon update notice alleen als latest strikt groter is dan installed version.
- Open bij update liever de GitHub releasepagina dan direct de APK asset.
- Blokkeer de app nooit bij gelijke versie of ongeldige release response.

## Testing Checklist

Altijd:

```powershell
npm.cmd run typecheck
.\android\gradlew.bat -p android :app:assembleDebug -PreactNativeArchitectures=x86_64 --no-daemon --console=plain
```

Voor release:

```powershell
.\android\gradlew.bat -p android :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon --console=plain
```

Device checks:

- `adb devices`
- app start/login;
- belangrijkste flow;
- widget toevoegen en aantikken;
- native permission flow;
- release/update notice;
- APK install over vorige versie.

Als geen device beschikbaar is:

- Meld dat expliciet.
- Vertrouw alleen op typecheck/build, niet op UI-validatie.

## Release Checklist

1. Check status en laatste release:

```powershell
git status --short
git tag --list "v*" --sort=-version:refname | Select-Object -First 5
gh release list --limit 5
```

2. Bump versie overal:

- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

3. Verhoog `versionCode`.

4. Voeg `CHANGELOG.md` sectie toe.

5. Run typecheck en release build.

6. Kopieer APK:

```powershell
New-Item -ItemType Directory -Force -Path dist | Out-Null
Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination dist/AppName-1.0.0-arm64.apk -Force
```

7. Controleer APK:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\37.0.0\aapt.exe" dump badging dist/AppName-1.0.0-arm64.apk
Get-FileHash dist/AppName-1.0.0-arm64.apk -Algorithm SHA256
```

8. Stage alleen relevante files.

9. Commit, tag, push:

```powershell
git commit -m "Release 1.0.0"
git tag -a v1.0.0 -m "AppName 1.0.0"
git push origin master
git push origin v1.0.0
```

10. Maak GitHub release met APK asset.

## Common Pitfalls

- PowerShell: gebruik `npm.cmd`, niet `npm`.
- Java: gebruik moderne JDK; oude Java versies breken Gradle/Expo builds.
- Android SDK path moet kloppen (`ANDROID_HOME`, `ANDROID_SDK_ROOT`, `platform-tools`).
- Widgets kunnen crashen door unsupported views/styles.
- BroadcastReceiver async werk zonder `goAsync()` kan worden afgekapt.
- Health Connect data mist vaak door bron-sync, niet door app-code.
- Direct APK asset openen kan op sommige telefoons blijven hangen; releasepagina is robuuster.
- Commit geen build output, screenshots of generated previews tenzij bewust nodig.

## New App Starter Checklist

- Kies package name en app slug.
- Zet Firebase project op en documenteer Spark/Blaze keuze.
- Maak basis screens: login, home, settings, primary action.
- Maak typed services voor data.
- Voeg `README.md`, `CHANGELOG.md`, `DECISIONS.md`, `ANDROID_RELEASE_RUNBOOK.md` toe.
- Voeg app icon/adaptive icon vroeg toe.
- Maak een hidden test account.
- Richt release flow in voordat de app groot wordt.
- Test op minimaal een emulator en een echte telefoon voordat je breed deelt.

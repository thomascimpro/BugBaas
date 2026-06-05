# Android Release Runbook

Praktische stappen om een nieuwe interne APK en GitHub Release snel te maken.

## Vereiste lokale setup

Gebruik Java 11 of hoger. Voor deze app werkte JDK 21 goed.

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME='C:\Users\thoma.THOMAS\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

Snelle check:

```powershell
java -version
adb devices
```

Let op:

- Als `java -version` Java 8 toont, faalt Gradle met Expo/React Native.
- Als `ANDROID_HOME` leeg is, vindt Gradle de Android SDK niet.
- Als `adb` niet gevonden wordt, staat `platform-tools` niet op `Path`.

## Versie ophogen

Pas dezelfde versie overal aan:

- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

In `android/app/build.gradle` moet ook `versionCode` omhoog.

Voorbeeld:

```gradle
versionCode 26
versionName "1.2.0"
```

## Changelog

Voeg bovenaan `CHANGELOG.md` een nieuwe sectie toe:

```markdown
## 1.2.0

- Korte omschrijving van de belangrijkste wijziging.
- Bugfixes of Android-specifieke verbeteringen.
- Eventuele gameplay/UI wijzigingen.
```

## Checks

```powershell
npm.cmd run typecheck
```

## Release APK bouwen

```powershell
cd android
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME='C:\Users\thoma.THOMAS\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
.\gradlew.bat assembleRelease
cd ..
```

APK kopieren naar `dist`:

```powershell
Copy-Item -LiteralPath 'android\app\build\outputs\apk\release\app-release.apk' -Destination 'dist\CimPro-BugBaas-1.2.0.apk' -Force
```

Metadata en hash controleren:

```powershell
& "$env:ANDROID_HOME\build-tools\37.0.0\aapt2.exe" dump badging 'dist\CimPro-BugBaas-1.2.0.apk' | Select-String -Pattern 'package:'
Get-FileHash -Algorithm SHA256 -LiteralPath 'dist\CimPro-BugBaas-1.2.0.apk'
```

Controleer dat `versionCode` en `versionName` kloppen.

## Git commit en tag

Stage alleen release-relevante bestanden. Laat losse generated assets, screenshots en de `dist` map uit git, tenzij expliciet nodig.

```powershell
git fetch origin master --tags
git rev-list --left-right --count master...origin/master
git tag --list v1.2.0

git add -- CHANGELOG.md android/app/build.gradle app.json package-lock.json package.json src/components/ForegroundCatchBug.tsx src/components/WalkingBugsLayer.tsx
git commit -m "Release 1.2.0"
git tag -a v1.2.0 -m "CimPro BugBaas 1.2.0"
git push origin master
git push origin v1.2.0
```

## GitHub Release maken

```powershell
$notes = @'
## 1.2.0

- Release note 1.
- Release note 2.
- Release note 3.
'@

gh release create v1.2.0 'dist\CimPro-BugBaas-1.2.0.apk' --repo thomascimpro/cimpro-bugbaas --title 'CimPro BugBaas 1.2.0' --notes $notes --latest
```

Controle:

```powershell
gh release list --repo thomascimpro/cimpro-bugbaas --limit 3
gh release view v1.2.0 --repo thomascimpro/cimpro-bugbaas --json tagName,name,url,assets,publishedAt,targetCommitish
```

## Veelvoorkomende vertragingen

- PowerShell blokkeert `npm.ps1`: gebruik `npm.cmd run typecheck`.
- Java 8 staat eerder op `Path`: zet JDK 21 vooraan of stel `JAVA_HOME` expliciet in per build.
- Android SDK env vars ontbreken: zet `ANDROID_HOME` en `ANDROID_SDK_ROOT`.
- `gh release view --json isLatest` werkt niet: gebruik `gh release list` om `Latest` te controleren.

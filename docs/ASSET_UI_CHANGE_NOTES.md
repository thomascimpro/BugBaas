# Asset and UI change notes

Use this note for future BugBaas asset and small UI changes.

## Fast path for image assets

1. Do not embed generated images as data URI strings in React Native.
2. Ask Thomas to place the image file in the project folder first.
3. Preferred folder:

```text
assets/generated/
```

4. Use a normal React Native asset require, for example:

```ts
const soloPowerupSprayImage = require("../../assets/generated/bugspray-hd.png");
```

5. Use the required asset directly in Image:

```tsx
<Image accessibilityIgnoresInvertColors resizeMode="contain" source={soloPowerupSprayImage} style={styles.someImageStyle} />
```

## Avoid this

Do not use generated image data like this:

```ts
source={{ uri: "data:image/png;base64,..." }}
```

It may build, but Android React Native can fail to render it reliably.

## BugBaas compatibility rules

For every change, keep this in mind:

1. Existing users and older app versions must keep working.
2. Do not rename or remove existing Firestore fields.
3. New fields must be optional or have safe fallbacks.
4. Check firestore.rules if a change touches Firebase reads/writes, collections, documents, or user data.
5. Do not deploy Firebase changes without explicit permission.

## Standard test flow

After a UI or asset change:

```bash
npm run typecheck
cd android && ./gradlew.bat :app:assembleRelease --no-daemon --console=plain
adb -s emulator-5554 install -r android/app/build/outputs/apk/release/app-release.apk
adb -s emulator-5554 shell monkey -p nl.cimpro.bugbaas -c android.intent.category.LAUNCHER 1
adb -s emulator-5554 shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp"
```

Expected foreground package:

```text
nl.cimpro.bugbaas/.MainActivity
```

## Bugspray lesson learned

The bugspray image failed when embedded as a data URI. The correct solution was:

1. Thomas placed the file here:

```text
assets/generated/bugspray-hd.png
```

2. The app used a real asset require:

```ts
const soloPowerupSprayImage = require("../../assets/generated/bugspray-hd.png");
```

3. The same asset was used in all relevant locations:
   - solo campaign card
   - in-game powerup button
   - reward card
   - spray click animation

## Response style for this project

Keep answers short, Dutch, direct, and technical. Mention changed files and test result. Always state whether Firebase/rules are impacted.

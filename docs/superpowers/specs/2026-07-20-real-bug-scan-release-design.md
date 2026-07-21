# Real Bug Scan Release Design

## Goal

Promote the hidden real bug photo scan into the official BugBaas app, replace the bottom `Bugs` tab with `BugScan`, keep bug/tip reporting accessible from Home, add a daily mission for one valid real bug scan, reduce avoidable OpenAI spend, and release web plus Android APK.

## Navigation

- Bottom navigation route `bugs` becomes `realBugScan` with label `BugScan`.
- The official scan screen keeps the bottom navigation visible.
- The scan back action returns to Home.
- Existing bug reports and tips remain on route `bugs`.
- Home gets a compact bottom card before the Wiki card that opens the existing bug/tip list.
- The bug/tip list continues to expose the existing new-report action.

## Daily mission

Add daily mission `Spot 1 echte bug`.

Progress counts once per Amsterdam calendar day when the user receives one of these scan results:

- `matched`
- `already_spotted`
- `not_in_catalog`
- `pending_review`

Progress does not count for:

- `rejected_no_bug`
- `rejected_quality`
- API or authentication failures

The scan result writes an immutable per-day progress document. The daily mission reads that document and reports progress `0` or `1`.

## API credit protection

- Keep client image preparation at maximum 768 px and OpenAI image detail `high`.
- Keep maximum three scans per user per Amsterdam day.
- Enforce the limit inside the Vercel API before calling OpenAI, using Firebase REST with the authenticated user's ID token.
- Use a per-user per-day server usage document and optimistic REST update with ETags to prevent parallel requests exceeding the limit.
- Reject duplicate `scanId` values server-side before OpenAI.
- Do not refund rejected images; they still consumed analysis credits.
- Refund only when OpenAI or the upstream identification path fails before returning a classification.
- Add a local SHA-256 image fingerprint cache so the same prepared image is not submitted twice from one device on the same day.
- Remove the gallery/test-photo action from production UI. Keep camera-only capture in the official app.
- Reduce `max_output_tokens` because the JSON schema response is small. Do not lower image detail or image dimensions.

## Security and Firestore

- Users may read their scan usage and daily scan progress.
- Client code may not decrement scan usage.
- The Vercel API owns server usage reservation through Firebase REST authenticated as the user.
- Daily scan progress is create-only and must match the authenticated user and Amsterdam day ID.
- Pending discovery records remain create-only.

## Release

- Bump app version from `2.10.13` to `2.10.14`.
- Verify required Vercel variables before production deployment.
- Deploy Firestore rules.
- Deploy Vercel production.
- Build release APK.
- Run TypeScript, focused scan tests, web export, Android resource processing, and release build checks.
- Stage only files intentionally changed for this feature and release. Never stage local keys, `.env` files, generated asset dumps, or unrelated existing worktree changes.

# FitnessSyncer integration

BugBaas can import measured walking, running, and cycling distance from FitnessSyncer. The mobile and web clients never receive provider tokens. Firebase Functions handles OAuth2 with PKCE, encrypts tokens at rest, reads activity-only data, and records provider-scoped import identifiers.

## Required configuration

1. Create `firebase/functions/.env.thomascimpro-6266f` locally with the non-secret variables from `.env.example`.
2. Store a long random encryption key with `npx firebase-tools functions:secrets:set FITNESSSYNCER_TOKEN_KEY --project thomascimpro-6266f`.
3. Deploy with `npx firebase-tools deploy --only functions --project thomascimpro-6266f`.

Each signed-in user creates a personal OAuth application in FitnessSyncer Developer Accounts and enters its Client ID and Client Secret in BugBaas Settings. BugBaas sends those values directly to an authenticated Firebase Function, encrypts them with `FITNESSSYNCER_TOKEN_KEY`, and never returns the stored secret to the client. Replacing credentials removes existing access and refresh tokens so the user must authorize again.

The OAuth callback remains:
`https://us-central1-thomascimpro-6266f.cloudfunctions.net/fitnessSyncerCallback`

FitnessSyncer documents that personal applications may use a hard-coded first redirect. If FitnessSyncer does not return directly to BugBaas during the first authorization, the user may need to change the redirect destination to the callback above while preserving the `code` and `state` query parameters. This external provider behavior still needs a real-account smoke test.

## Data rules

- OAuth scopes: `source_read source_data_activity_read`.
- Count measured, non-manual walking, running and cycling details plus provider daily activity summaries containing steps.
- Convert steps to distance at 0.75 meter per step only when that exceeds the measured daily distance.
- For each day, keep the strongest phone/watch source totals instead of summing duplicate provider feeds.
- Provider activity identifiers are hashed with their source identifier before storage.
- Existing BugBaas day/week maxima prevent repeat syncs from increasing the same movement twice.
- Disconnect revokes the provider access token when possible and removes stored credentials.

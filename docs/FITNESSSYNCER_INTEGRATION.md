# FitnessSyncer integration

BugBaas can import measured walking, running, and cycling distance from FitnessSyncer. The mobile and web clients never receive provider tokens. Firebase Functions handles OAuth2 with PKCE, encrypts tokens at rest, reads activity-only data, and records provider-scoped import identifiers.

## Required configuration

1. Request a FitnessSyncer application Client ID and Client Secret for this exact callback:
   `https://us-central1-thomascimpro-6266f.cloudfunctions.net/fitnessSyncerCallback`
2. Create `firebase/functions/.env.thomascimpro-6266f` locally with the variables from `.env.example`.
3. Use a long random value for `FITNESSSYNCER_TOKEN_KEY`. Never commit this file.
4. Deploy with `npx firebase-tools deploy --only functions --project thomascimpro-6266f`.

The client integration stays hidden while the backend reports that required configuration is absent. Do not expose the Client Secret or token key through Expo configuration.

## Data rules

- OAuth scopes: `source_read source_data_activity_read`.
- Count only measured, non-summary, non-manual walking, running, and cycling activities with positive `distanceKM`.
- Provider activity identifiers are hashed with their source identifier before storage.
- Existing BugBaas day/week maxima prevent repeat syncs from increasing the same distance twice.
- Disconnect revokes the provider access token when possible and removes stored credentials.

# BugBaas Web

De webversie gebruikt dezelfde Expo/React Native-code en assets als de Android-app. `npm run web:export` schrijft de browserbuild naar `site/public/game`; de vinext-site toont die build schermvullend en levert de Strava API-routes.

## Lokaal gebruiken

Vanaf de repositoryroot:

```powershell
npm run site:build
npm --prefix site run dev
```

Open daarna de exacte lokale URL uit de uitvoer. Wijzig gedeelde gameplay in de normale appcode en wijzig alleen de webschil of web-API's onder `site/`.

## Productie

De actuele Sites-projectkoppeling staat in `.openai/hosting.json`. Publiceer uitsluitend een geslaagde build en volg `WEB_RELEASE_RUNBOOK.md` vanaf de repositoryroot.

De huidige Sites-workspace ondersteunt alleen eigenaar- of workspace-toegang. Voor bezoekers buiten de workspace is publieke hosting via bijvoorbeeld Firebase Hosting, Cloudflare Pages of Vercel nodig.

## Strava

Strava is geen BugBaas-login. De gebruiker kiest in BugBaas voor koppelen en logt uitsluitend op Strava in. Productie vereist server-side `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET` en `STRAVA_TOKEN_ENCRYPTION_KEY`; bewaar deze nooit in Git.

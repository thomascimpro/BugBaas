# BugBaas Web Release Runbook

## Opbouw

1. Expo exporteert dezelfde appcode en assets naar `site/public/game`.
2. `site/app/page.tsx` toont de game schermvullend.
3. vinext bouwt een Cloudflare Worker-compatible Sites-package.
4. D1 bewaart uitsluitend Strava OAuth-state, versleutelde tokens en geïmporteerde activiteit-ID's.
5. Firebase blijft verantwoordelijk voor BugBaas-authenticatie, profielen en gamegegevens.

## Voor iedere webrelease

1. Inspecteer `git status` en behoud onbekende of gebruikersbestanden.
2. Draai `npm run typecheck` wanneer gedeelde appcode wijzigde.
3. Draai `npm run site:build`.
4. Test minimaal 390×844, 844×390, 768×1024 en 1280×800 in een echte browser.
5. Controleer dat de pagina niet scrollt, het iframe exact de viewport vult en `#root` in de game zichtbaar is.
6. Controleer login en gewijzigde flows; noem echte Firebase- of Strava-validatie niet geslaagd zonder live bewijs.
7. Commit alleen de gevalideerde bronbestanden.
8. Push exact die commit naar de Sites-bron, package met de Sites-helper, sla één versie op en deploy die versie.
9. Poll tot `succeeded` en controleer dat de productie-URL onveranderd bereikbaar is.
10. Werk `STATUS.md`, `CHANGELOG.md` en `TESTRESULTS.md` bij met bewezen feiten.

## Toegang

- `custom`: alleen expliciet toegestane workspacegebruikers.
- `workspace_all`: iedereen binnen de gekoppelde workspace.
- `public`: vereist om zonder workspaceaccount te delen.

Als Sites `public` niet als beschikbare modus teruggeeft, claim dan niet dat extern delen werkt. Kies dan bewust publieke hosting en configureer Firebase Authorized Domains en de Strava callback opnieuw voor het publieke domein.

## Fullscreen

De pagina gebruikt standaard de volledige beschikbare viewport. Safari en Chrome verbieden automatisch echt browser-fullscreen; `requestFullscreen()` mag alleen direct na een gebruikersactie worden gestart. Op iOS kan installatie op het beginscherm extra browserchrome verwijderen.

## Geheimen

Beheer Firebase- en Strava-productiewaarden in de hostingomgeving. Plaats geen secrets, OAuth-tokens, bypass-tokens, `.env`-inhoud of service-accountbestanden in commits, documentatie of logs.

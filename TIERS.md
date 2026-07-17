# Tiers

BugBaas gebruikt eigen insect-tiers. Punten komen uit bugmeldingen en statuswijzigingen.

## Tiers

- `Zilvervisje Starter` vanaf 0 punten.
- `Mierenmelder` vanaf 40 punten.
- `Sprinkhaan Speurder` vanaf 120 punten.
- `Lieveheers Fixer` vanaf 260 punten.
- `Duizendpoot Regisseur` vanaf 520 punten.
- `Schorpioen Sentinel` vanaf 900 punten.
- `Neushoorn Commander` vanaf 1.500 punten.
- `Goliath BugBaas` vanaf 2.400 punten.
- `Hercules Vanguard` vanaf 5.000 punten.
- `Juweel Overlord` vanaf 10.000 punten.
- `Maanvleugel Orakel` vanaf 20.000 punten.
- `Kosmische Bugkeizer` vanaf 40.000 punten: hoogste stretch-tier.

## Werking

- Nieuwe bug krijgt punten op basis van urgentie.
- `Bevestigd` en `In behandeling` geven extra punten.
- `Gefixt` geeft hoogste bonus.
- `Afgekeurd` en `Dubbel` zetten bugpunten op 0.
- Profiel, Home en Ranglijst tonen tier, insectbeeld en voortgang.
- Nummer 1 in de ranglijst toont altijd de hoogste tier als leaderboard-label.

## Visuals

- Elke tier heeft eigen insectvariant en kleur.
- Elke hogere tier toont een grotere bug met meer details:
  - grotere body en hit area;
  - extra details en steeds exclusievere frames bij hogere tiers;
  - een kosmisch kroonframe bij `Kosmische Bugkeizer`.
- Insecten zijn lokaal opgebouwd met React Native views.
- Bewegende bugs lopen subtiel over het scherm zonder knoppen te blokkeren.

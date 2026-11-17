# 67: a cat or dog joins the expedition (0.143.15)

## What and why
Owner 17 Nov 2026 (67): "soldiers on an expedition can take in a cat or a dog; it travels with them until they are back home, where it is a stray for a while until I assign it".

## Files and systems
- `DomesticAnimalSystem`: state `party` (cats wander around `partyCenter()` – the living party soldiers and the King – dogs `roam` around it); `joinParty(id)` (only in a zone, only a stray); `partyPets()` → `{kind, name}`; `addPartyPet`; `addHomeStray` (a stray with `leaveAt: null`, so it stays until given a home).
- `zoneMode`: `zone.pets` and `zone.strayRolled`; `setupZone` brings the party's pets and, once per land outside the mine, a stray cat or dog with 60 % (leaves after 3 days); `collectParty` reads the pets; `homeAfterZone` puts them into `party.pets`.
- `ScoutingSystem.home`: the party's pets become strays by the arrival point; `validScouting` accepts `party.pets` (≤ 4, kind cat/dog, name 1–40 characters).
- `CatPanel`: in a zone a stray shows "Take along with the party"; a party pet says it goes with the party.

## Implementation decisions
Party pets are not saved inside a zone (zone games are not saved); the home save keeps them in `scouting.party.pets` until the party is home.

## Save/Load impact
Optional `scouting.party.pets`; no SAVE_VERSION change.

## Testing
tests/party-pets.test.js (join only in a zone, following, home strays that stay, save check, homeAfterZone carries pets); npm test. The full zone round trip in the browser was not run.

## Notes for the next agent
A dog in the party does not fight or track yet; that could use `shield`/`roam` like a Hunter's dog.

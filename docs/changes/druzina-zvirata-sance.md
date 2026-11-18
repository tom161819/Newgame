# Strays join the party by themselves, with a chance by Hunting level

## What and why
Owner 18 Nov 2026: "ať jdou toulavý psi (s nějakou procentní šancí podle nejvyššího lvlu v lovení, i když jsou na mapě jenom vojáci) na mapě přidat ke družině (i kočka) a pak přijdou s družinou na domovskou mapu".

Before, a stray of the land joined only when the player clicked "Take along with the party", and always. Now:
- When anyone of the party (soldiers, the King) comes within 5 tiles of a stray dog or cat, it tries to join once (`DomesticAnimalSystem.partyStrays`, called from `updateZone`).
- The chance (`PARTY_STRAY` in `domesticAnimals.js`): 25 % at Hunting level 1, +5 % a level, at most 90 % – by the best Hunting level in the party (`partyHuntingLevel`). Soldiers have the skill too, so a party of soldiers only gets at least 25 %.
- Success: it joins as before (`joinParty`) and comes home with the party (point 67: at home it is a stray until it is given a home). Failure: a feed message, it stays in the land and never tries again.
- The button in the animal's window makes the same single try and shows the chance and the level.

## Files and systems
- `src/data/domesticAnimals.js` (`PARTY_STRAY`), `src/systems/DomesticAnimalSystem.js` (`partyHuntingLevel`, `joinChance`, `tryJoin`, `partyStrays`), `src/game/zoneMode.js` (`updateZone`), `src/ui/CatPanel.js` (button), i18n en/cs (`pets.joinChance`, `pets.joinRefused`, `pets.joinRefusedNow`, `pets.feed.refused`, `pets.dog.feed.refused`, new `joinHelp` and `landStray` texts).
- Test: `tests/party-pets.test.js`.

## Implementation decisions
- One try per animal (`partyTried`, runtime): otherwise walking around a stray would make it join every time sooner or later.
- `joinParty` stays as the unconditional join (used after a successful try).
- The method name `huntingLevel` was already taken by the dog taming code; the party version is `partyHuntingLevel`.

## Save/Load impact
None. `partyTried` is not saved (it is not part of the exported cat or dog). SAVE_VERSION stays 65.

## Testing
- `node --test tests/party-pets.test.js` and the full suite.

## Notes for the next agent
- A land has a stray at all only in 60 % of visits (point 67, unchanged).

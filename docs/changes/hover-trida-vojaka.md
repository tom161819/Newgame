# Hover over a soldier shows his class

## What and why
Owner 19 Nov 2026: "když najedu myší nad vojáka ať se neukazuje voják, ale třída (např. branec, lučištník.. atd)". The hover label under a person's name showed the occupation, so every soldier read "Voják · lvl 1" whatever he was.

## What changed
- `personHover(unit,{role})` accepts the role name from the caller; without it nothing changes (occupation, King, unemployed).
- `GameScene` passes `militaryRank(scene,unit)` for soldiers – the same label as the army panel and the population sidebar: "Branec" for a recruit, otherwise the trained type (Voják, Lučištník, Šermíř, Rytíř, Halapartník, Královský lučištník, Kušiník, Lehký jezdec).
- The level stays the occupation level (Boj).

## Files and systems
`src/ui/personHover.js`, `src/game/GameScene.js`; test `tests/person-hover-clock.test.js`.

## Implementation decisions
- Reused `militaryRank` so the hover, army panel and sidebar can never disagree.
- A soldier in training still shows "Branec" until the training is done (as in the panels).

## Save/Load impact
None – display only, SAVE_VERSION unchanged.

## Testing
- `tests/person-hover-clock.test.js`: a recruit reads "Recruit · lvl", an archer "Archer · lvl", never "Soldier".
- `npm test`, `npm run build`.

## Notes for the next agent
- Enemy raiders use their own object labels, not `personHover`; untouched.

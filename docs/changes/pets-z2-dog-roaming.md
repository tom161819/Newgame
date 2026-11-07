# Hunting dog roaming (0.27.1)

## What and why
Owner request on plan task m-zvirata-z2-lovecky-pes (7 Nov): the dog should move around its Hunter irregularly within a certain radius, not along a fixed path; when the Hunter is at the lodge, the dog sits there and now and then runs around.

## Files and systems
- `src/data/domesticAnimals.js` – `DOGS.roam` (radius 2.2, new spot every 0.8–3 s, pauses 0–1.2 s, catch-up beyond 3.4 tiles) and `DOGS.atLodge` (Hunter within 2.5 tiles of the lodge door, sit 6–14 s, then 2–4 quick rounds within 2.6 tiles at ×1.7 speed).
- `src/systems/DomesticAnimalSystem.js` – `roam`, `lodgeIdle`, `atLodge`; `lodge()` marks a real lodge (`lodge:true`) so the castle fallback does not count as one.
- `src/game/DomesticViews.js` – sitting pose; an owned dog only animates its legs while it actually moves.
- `tests/hunting-dog.test.js` – roaming stays within the bonus range and visits many spots, catch-up, sitting and rounds at the lodge.
- `scripts/dog-smoke.mjs` – waits for the Hunter list to render instead of reading it once.

## Implementation decisions
- The roam spot is stored as an offset from the Hunter, so the dog keeps a loose formation while he walks and picks a new offset every few seconds; the radius (2.2) stays inside `closeEnough` (3), so the hunting bonus is not lost by roaming.
- Movement state (`mode`, `offset`, `sitting`, `rounds`, `sitFor`) is transient and not saved; after a load the dog simply starts roaming or sitting again.

## Save/Load impact
None (SAVE_VERSION stays 53).

## Testing
`npm test` (923), smokes `--dog` and `--pets`.

## Notes for the next agent
- The sitting pose is drawn provisionally until the dog sprites from g-domaci-zvirata-grafika (which include a sitting animation).

# Animals: random look from the approved variants (plan m-zvirata-nahodny-vzhled)

## What and why
Owner rule 7 Nov 2026 (Studio revision): where several looks of an animal are approved, each animal gets one of them
at random. Until now cats, dogs and rats were provisional drawings and wolves a generic animal figure.

## Files and systems
- `scripts/export-animal-art.mjs`: copies approved looks (walk sheets) and their poses from `art/sprites/<species>/`
  to `public/assets/characters/animals/` and writes `src/data/objects/approvedAnimalArt.js`. A variant with a walk
  sheet is a look; `<look>-<pose>` without one is a pose (sit, run, attack, wounded, pounce).
- `src/game/animalArt.js`: `animalLook(species,id,{young})` (FNV hash of the id → one of the adult looks; kittens use
  `cat-kitten`), `ensureAnimalLook` (loads once per scene), `applyAnimalArt` (walk frame for the facing, or a pose;
  poses face right and are mirrored for left facings).
- `DomesticViews`: cats, kittens, dogs (sit and wounded poses) and rats (round their store) use the looks; the drawings
  stay until the art loads or if it fails.
- `AnimalView`: wolves use the looks (attack pose while attacking when the look has one).

## Implementation decisions
- The look follows the id, so nothing new is saved and a loaded game shows the same animals.
- Poses only where the chosen look has them (e.g. only the hound sits, only the mastiff has a wounded image); other
  looks keep the standing walk frame.
- Run poses and the cat pounce are exported but not used yet (no state that needs them).

## Save/Load impact
None.

## Testing
`tests/animal-looks.test.js` (only approved looks, files present, deterministic and even spread, kittens); browser
smoke `--animal-looks` (cats, kitten, dogs with poses, wolves drawn; looks kept after Load).

## Notes for the next agent
- After a Studio revision of animals run `node scripts/export-animal-art.mjs` and commit the generated files.
- Cats are drawn at the Studio scale (small next to villagers); if the owner wants them bigger, scale in the views.

# Studio: new figures and animals for review

## What and why

This is the second batch of the owner's request to work through all Grafika tasks. It adds people and animals from the
plan items `g-rybarstvi-grafika`, `g-noc-grafika`, `g-deti-naves-grafika` and `g-domaci-zvirata-grafika`.

## Files and systems

- **Figure recipe (`figure.js`):**
  - **New tools:**
    - `rod`: a fishing rod and a creel;
    - `torch`: a lit pitch torch that carries a `torch` light;
    - `loot`: a bulging stolen sack;
    - `firebucket`: a leather fire bucket.
  - **New units:**
    - `fisher` (man and woman);
    - `pitch-maker` (man and woman);
    - `torchbearer` (a spearman and a watchwoman);
    - `thief` (two);
    - `firefighter` (two);
    - `child` (three boys and three girls, 0.7–0.78 units tall).
- **New recipe `animal.js`:**
  - **Animals:**
    - cat: tabby, black, ginger and a kitten; sitting and pouncing on a rat;
    - hunting dog: hound, sheepdog and mastiff; sitting, running and lying wounded with a bandage;
    - rat: grey and brown;
    - wolf: grey and dark; attacking and running.
  - **Poses:** `facing` and `stride` work as in the figure recipe, so the Studio shows and exports walk cycles in eight
    directions.
  - **Stills:** use a three-quarter view (`facing: 1`) so the cards read well.
  - **Wolves:** may overhang their tile like horses.
- **`shapes.rotateParts`:** turns oriented ellipsoids. These are spheres with a `rotation`; spheres without one behave
  as before.
- **`main.js`:**
  - walk cycles and the 8-direction export also cover the animal recipe;
  - a standing animal walks even though its card still has a `facing`.
- **Tests:** the profession list now includes the fisher and the pitch maker. Children, the thief, the fire-bucket
  villager and the torchbearer are not professions. The torch search finds the torchbearer.

## Implementation decisions

- Walk sheets are exported after approval, as for every unit.
- Children are smaller figures. Their head proportions are the adult ones for now.

## Save/Load impact

None.

## Testing

- `npm test` passes.
- `studio:smoke` passes.
- Contact sheets checked.

## Notes for the next agent

- Still to come: the fishing and children's play animations, the terrain textures and the shore transition tiles.

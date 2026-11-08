# Animals 3: bigger cats, "Chance to tame", rats and cats at the Mill, Bakery and Farmhouse (m-zvirata-3)

## What and why
Owner requests 67, 69 and 71 from the 0.50 playtest.
- 67: cats and kittens were too small to see next to people.
- 69: the dog-taming offer showed only a bare number ("Jan · hunting 3 · 44 %").
- 71: rats should also infest the Bakery, Mill and Farmhouse (buildings that hold grain, flour or bread), and a cat
  should be able to live there like at the Granary.

Checked on the current code first: rats already lived in every food location (Granary stock, Starter Stockpile,
and the input/output buffers of recipe buildings), so the Mill (wheat → flour) and the Bakery (flour → bread) could
already get rats and take a cat, but nothing in their panel showed it. The Farmhouse keeps no food of its own
(Farmers carry the harvest to the stores), so it had no rats and could not take a cat.

## Files and systems
- `src/data/domesticAnimals.js`
  - `RAT_BUILDINGS = ['granary','starter_stockpile','mill','bakery','farmhouse']`: the buildings where rats move in
    and a cat can live (besides Houses). Any other building that keeps food in its own store still counts too.
  - `CAT_SIZE = {adult:1.5, kitten:1.5, kittenFigure:.7}` and `catScale({young,drawn})`: the cat sprites are drawn
    1.5× (tomcat side view 26×14 px → 39×21 px, a hound is 41×22 px, so a cat stays smaller than a dog). The kitten
    has its own smaller sprite, so it gets the same 1.5×; the provisional drawn kitten (only before the art loads)
    keeps its extra 0.7.
- `src/systems/DomesticAnimalSystem.js`
  - `ratBuildings()`: complete buildings listed in `RAT_BUILDINGS` plus any other building with a food location.
  - `homes()` (Take in, Reassign, buying a cat from a caravan) now uses `ratBuildings()` + Houses, so the Farmhouse is
    a cat home too.
  - `cap()`: 1 + the camp food store (while it exists) + rat buildings + Houses. Each Mill, Bakery and Farmhouse
    raises the kingdom cat cap by one (the Mill and Bakery already counted before; the Farmhouse is new).
  - Rat rules are unchanged and the same as at the Granary: growth `base + growth × fill`, losses 1 / 3 / 6 % a
    day, wheat and flour eaten first, reserved goods never, a cat clears 25 a day.
- `src/game/DomesticViews.js`: the cat view scale comes from `catScale()`; the stray "?" mark is counter-scaled so
  it keeps its size and height.
- `src/ui/WorkplacePanel.js`: a rat building's workplace panel (Mill, Bakery, Farmhouse) shows the rats line
  (`#workplace-rats`, "Rats: Many · loses 0.5 food a day · cats 1 / 1"), as the Granary's storage panel does.
- `src/i18n/en.js`, `src/i18n/cs.js`: `pets.dog.tameOption` → "{hunter} · hunting {level} · Chance to tame: {chance} %"
  / "{hunter} · lov {level} · Šance na ochočení: {chance} %".
- `scripts/animals-3-smoke.mjs`, registered as `--animals-3` in `scripts/browser-smoke.mjs`.

## Implementation decisions
- The Farmhouse got no food store of its own: that would change the farming logistics (where the harvest goes,
  Haulers), which is a bigger change than this item. Under the Granary rules ("growth by stock") rats therefore
  appear at a Farmhouse only once it holds food; today it is a cat home (cats there also guard the Houses within
  10 tiles against house rats) and raises the cat cap. If the owner wants rats at Farmhouses as such, the next step
  is a small harvest store at the Farmhouse (a Mechaniky item of its own).
- The rat buildings are a data list, but the old generic rule (any building with food in its own store) stays, so no
  existing store loses its rats or cats.
- Cats are scaled in code from data, no new art. At 1.5× the sprites (drawn at about their native size before) look
  slightly soft at high zoom. Acceptable for now; **Grafika task**: export the cat and kitten sprites at 1.5× the
  current size (then set `CAT_SIZE` back to 1).

## Save/Load impact
None. No new save fields; SAVE_VERSION stays 59. Rats in Mill/Bakery buffers were already saved by location id; a
cat living at a Farmhouse is saved as any cat (`buildingId`), validated as before.

## Testing
- `tests/domestic-animals.test.js` (+4): rats in the Mill and Bakery reach Many in about 5 days with full buffers,
  eat flour, never reserved bread; a cat taken in at the Bakery clears it while the Mill keeps its rats; Farmhouse,
  Mill and Bakery each raise the cat cap and are homes; Take in at a Farmhouse, a caravan cat bought for a Bakery,
  Reassign from the Granary to the Mill; the "Chance to tame: 44 %" / "Šance na ochočení: 44 %" text; `catScale`
  from data and smaller than a dog; Save/Load of Bakery rats and cats at a Bakery and a Farmhouse, broken cat home
  rejected.
- `npm test`: 1095 / 1095 pass.
- `npm run build -- --base=/Newgame/`, then each alone: `--animals-3`, `--animals-2`, `--animal-looks`,
  `--approved-art` pass. Screenshot `/tmp/shots/animals-3.png`: the cat (drawn 1.5×) beside a resident, the King
  and a dog is clearly visible and still smaller than the people.

## Notes for the next agent
- Farmhouse rats need a Farmhouse food store (see Implementation decisions); ask the owner before adding one.
- Grafika: bigger cat and kitten sprites (1.5×), then `CAT_SIZE.adult/kitten = 1`.
- Click picking of cats (`atPoint`, 16 px radius) was not changed; it still works for the bigger cat.

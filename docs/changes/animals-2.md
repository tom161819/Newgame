# Animals 2: strays early then rarer, rats that roam and hide, rats in Houses, a mark over strays (m-zvirata-2)

## What and why
Owner requests 7 Nov 2026 (points 29, 34, 38, 52).

## Files and systems
- Frequency (29), `src/data/domesticAnimals.js`: the first stray cat comes on day 1–2 (`CATS.stray.firstDays`), the
  first stray dog on day 2–3 (`DOGS.stray.firstDays`); later strays come about twice as rarely as before – cats
  every ~8 days (4 with Many rats; was 4 / 2), dogs every ~12 (was 6). Caravans still offer cats and dogs.
- Rats (34), `src/game/DomesticViews.js` `ratStep`: each rat runs to random points 1.5–7 tiles from its store
  (`RAT_MOVES`), stops to sniff, dashes on, and now and then hides for 3–8 s. Drawing only (nothing saved), only
  visible rats are drawn, no path finding.
- Strays (38): a small faint "?" over stray cats and dogs; it goes when they are taken in.
- Rats in Houses (52): a finished House with no assigned cat (a cat living in any building) within 10 tiles gets
  rats after 2 days (`HOUSE_RATS`); its residents lose 3 happiness (`NeedsSystem`, together with the cat bonus);
  the event feed says "Rats in a House!" once per infestation. A cat nearby clears it at once. Saved as
  `domestic.houseRats` (validated, optional).

## Implementation decisions
- Houses have no food, so house rats cause no food loss, only the happiness penalty.

## Save/Load impact
Optional `domestic.houseRats {houseId: since}`; SAVE_VERSION stays 58.

## Testing
`tests/domestic-animals.test.js` (first stray, rarer later, house rats with and without a cat nearby, first dog);
browser smoke `--animals-2` (rats wander up to ~7 tiles and hide, the stray mark).

## Notes for the next agent
- The cat-at-home bonus and the house-rat penalty share the `cat` happiness field in the needs breakdown.

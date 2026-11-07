# Studio revision 7 Nov 2026 (second): decisions taken over, five revisions

## What and why

Grafika chat, "spustit revizi". Two jobs: take over the owner's Studio decisions (the first round of "Choose for the
game"), and handle the five revision requests. No game change.

## Files and systems

- `art/approvals.json`: 50 variant decisions and 15 preferred picks taken over (`npm run studio:sync`).

## Implementation decisions

### Decisions taken over

- **Chosen for the game (approved + ★):**
  - barracks-hall-stone, bowyer-stone, hunting-lodge-log, lumber-camp-hut, marketplace-square;
  - quarry-pit, smelter-bloomery, stables-shelter, stone-wall-crenellated, swordsmith-stone;
  - wall-kit-preview-gate, warehouse-store-stone, watchtower-square, wheelwright-yard-shed v2, windmill-tower.
- **Also approved:**
  - armorer-forge;
  - all four wall-gate variants (closed, open, open-y, stair);
  - wall-kit-preview-enclosure.
- **Rejected:**
  - armorer-display and armorer-timber;
  - both armory variants (armory-stone and armory-timber), so the armory has no art yet;
  - the other variants of the assets above, set aside as "Not chosen".
- **Revision requested:** bakery-house-yard-oven, builders-workshop-material-yard v2, farmstead-thatched,
  house-timber, iron-mine-adit.

## Save/Load impact

None.

## Testing

- `studio:sync` dry run: 65 decisions, 5 revisions, nothing ignored.

## Notes for the next agent

- The Studio DB documents are deleted at the versions read, after the Studio with the new manifest is published.
- Wiring the chosen sprites into the game is a Mechaniky job.

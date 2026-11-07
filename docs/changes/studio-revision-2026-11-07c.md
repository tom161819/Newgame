# Studio revision 7 Nov 2026 (third): iron mine and farmstead approved, three small revisions

## What and why

Grafika chat, "spustit revizi". The owner reviewed the previous round, and these decisions are taken over. Three
revision requests are handled. No game change.

## Files and systems

- `art/approvals.json`:
  - 7 decisions taken over (`npm run studio:sync`);
  - the three revised variants moved to their next version in review (`nextRevision`).
- `studio/src/generators/props.js`: new prop `ovenShed`.
- Specs and sprites:
  - bakery-house: footprint now 3×2, bakery-house-yard-oven v3;
  - house: house-timber v3;
  - builders-workshop: builders-workshop-material-yard v4.

## Implementation decisions

### Taken over

- **Approved:**
  - iron-mine-adit v2, the preferred variant, so it is chosen for the game;
  - farmstead-thatched v2 (3×3), the preferred variant, so it is chosen for the game.
- **Rejected:** iron-mine-headframe, farmstead-stone.
- **Revision requested:** bakery-house-yard-oven v2, house-timber v2, builders-workshop-material-yard v3.

### Revisions

- **builders-workshop-material-yard v4:** the owner likes it, but asked twice for no torch. The shed lantern is off,
  nothing else changed.
- **house-timber v3:** "no torch". The door lantern (bracket and torch light) is off; the details stay.
- **bakery-house-yard-oven v3:** the owner's comment was "the stall is nice but not in front of the door; the
  building could be bigger, e.g. 3x2; the baker's oven should be visible somehow".
  - The bakery plot is now 3×2. The house is longer: 1.6 wide, ridge along x, two windows, chimney.
  - The bread oven stands in its own open shed beside the house (prop `ovenShed`): a big stone dome on a plinth, a
    glowing mouth toward the camera with a brazier light, a flue and a tiled roof on four posts.
  - The bread stall moved to the yard corner by the oven, clear of the door.
  - The pretzel sign hangs on the front wall by the door.
  - Baskets, flour sacks, firewood and the peel stay.
  - The other bakery variant (stall) is rendered on the 3×2 plot too, with only more yard.

## Save/Load impact

None.

## Testing

- `npm test`: 909 pass. Tests updated:
  - builder's yard v4 and house v3 have no torch;
  - bakery v3 is 3×2, has the oven shed with a glowing light, and its stall is not in front of the door;
  - art the game uses may have its new version already approved, waiting for Mechaniky to wire it in.
- Sprites checked by eye.

## Notes for the next agent

- **Mechaniky (plan `m-studio-vybrane-do-hry`):**
  - the iron mine v2 and the farmstead v2 are approved;
  - the farmhouse needs footprint 3×3 and a SAVE_VERSION bump when the new sprite goes in;
  - if bakery v3 is approved, the bakery needs 3×2.

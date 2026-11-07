# Studio revision 7 Nov 2026 (second): decisions taken over, five revisions

## What and why

Grafika chat, "spustit revizi". Two jobs: take over the owner's Studio decisions (the first round of "Choose for the
game"), and handle the five revision requests. No game change.

## Files and systems

- `art/approvals.json`:
  - 50 variant decisions and 15 preferred picks taken over (`npm run studio:sync`);
  - the five revised variants moved to their new version in review with `nextRevision`, so the old record is in
    the history.
- `studio/src/generators/workshop.js`:
  - new body kind `mine`;
  - the `shed` body takes `sideWall: 'right' | 'both'` (a plank wall up to the sloping roof, with a small window).
- `studio/src/generators/house.js`: `details` (braces, shutter pairs, flower boxes, door frame and canopy, stone step,
  ridge cap) and optional yard `props`.
- `studio/src/generators/props.js`, new props:
  - mining: `rails`, `minecart`, `oreHeap`, `pickRack`, `pitProps`;
  - builder's yard: `carpenterBench`, `toolBoard`, `gateway`;
  - bakery: `loaf`, `breadStall`, `breadBasket`, `bakerSign`, `peel`;
  - farmstead: `haycock`, `plough`, `farmTools`, `henHouse`.
- The five specs in `art/assets/buildings/*/asset.json`, with their new sprites in `art/sprites/**`.

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

### Revisions (owner's comments → what changed)

- **iron-mine-adit v2** ("nicer, more thematic, should look good on an iron deposit"):
  - the adit is cut into a rocky hill of low-poly boulders, with rust-red ore veins on the slopes, moss and scrub;
  - a dressed-stone face, a dark opening, a timbered portal with a plank hood and a torch;
  - rails out to a loaded mine cart, ore heaps, a pickaxe rack, pit props and a barrel.
- **builders-workshop-material-yard v3** ("closed side wall, a workbench or ponk with tools visible underneath, the
  fence needs an entrance"):
  - the shed side the camera sees is a plank wall with a small window;
  - a carpenter's bench with vise, saw, mallet and plane under the roof, and a tool board on the back wall;
  - a lantern, and a gateway between two fence runs.
- **bakery-house-yard-oven v2** ("look more like a bakery"):
  - a bread stall with a striped awning and loaves;
  - a pretzel sign on an iron bracket, bread baskets, flour sacks;
  - the oven with firewood and a baker's peel.
- **farmstead-thatched v2** ("better look, may be 3x3, more farming tools, sacks, haycocks"):
  - the farmstead footprint is now 3x3 (the stone variant only gains yard space);
  - a bigger thatched farmhouse with two haycocks and a hay stack;
  - a rack with pitchfork, scythe, rake and flail, a plough, a cart, grain sacks, barrels;
  - a hen house with hens, a trough, and a fence with a gap.
- **house-timber v2** ("improve, more detail"):
  - braces, shutter pairs, flower boxes, a framed door with a canopy and a step, a ridge cap and a chimney;
  - a bench, a woodpile with a chopping block and a rain barrel.

## Save/Load impact

None.

## Testing

- `studio:sync` dry run: 65 decisions, 5 revisions, nothing ignored.
- `npm test`: 899 pass. New tests:
  - the revisions answer the comments and stay inside their plots;
  - house details appear only when switched on.
- **Tests updated:**
  - art the game uses may be under revision while the game keeps the exported version, as long as that version is
    in the record's history;
  - C07 variants may be rejected.
- **Studio smoke:** passes. Review checks now use the iron mine, because the wheelwright is decided.
- Each new sprite checked by eye.

## Notes for the next agent

- The Studio DB documents are deleted at the versions read, after the Studio with the new manifest is published.
- Wiring the chosen sprites into the game is a Mechaniky job.
- **Revised art the game uses:** house, farmhouse, bakery and builder's workshop. The game keeps the old approved
  version until the owner approves the new one. Then Mechaniky swaps the sprite.
- **Farmhouse footprint:** the farmhouse is 2x2 in the game. Adopting farmstead-thatched v2 needs `farmhouse`
  changed to 3x3.

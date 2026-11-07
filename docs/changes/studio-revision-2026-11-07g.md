# Studio revision: figures and animals reviewed; dogs, wolves and thief revised; a white cat

## What and why

The owner reviewed the second batch and asked for a revision of all designs.

## Files and systems

### Decisions taken over into `art/approvals.json`

★ marks the variant chosen for the game.

| Asset | Approved | Rejected | Revision requested |
|---|---|---|---|
| Cat | black ★, tabby, ginger, kitten, tabby sitting, ginger pouncing | | |
| Child | all six (★ boy in a red tunic) | | |
| Firefighter | man ★, woman | | |
| Fisher | man ★, woman | | |
| Pitch maker | man ★, woman | | |
| Rat | grey ★, brown | | |
| Torchbearer | spearman ★, watchwoman | | |
| Fisherman's hut | stilt hut v2 ★ | reed cottage, plank smokehouse | |
| Fisherman's hut 3×3 | | both | |
| Pitch kiln | stone oven v2 ★ | turf kiln | |
| Pet icons (Mechaniky) | seated ★ | heads | |
| Dog | | | all six |
| Wolf | | | all four |
| Thief | | | both |

### Revisions

- **Dogs and wolves v2.** The owner asked for "better shapes, more like a real dog / wolf". The animal recipe now has
  an anatomical skeleton for dogs and wolves:
  - the body is a deep chest, a tucked waist and a rump;
  - the neck rises forward to a skull with a tapered muzzle and a nose;
  - the front legs bend at the elbow and wrist, the hind legs at the stifle and hock;
  - **ears:** pointed for wolves, hanging for hounds;
  - **wolves:** an amber-eyed face with pale cheeks, a neck ruff, a dark saddle and a bushy low tail with a dark tip;
  - **hounds:** a saddle on the back;
  - **sheepdogs:** a shaggy coat;
  - **attack pose:** an open jaw with fangs.
  
  Each revised spec has `anatomy: 2`. Cats and rats are unchanged, so their approvals stay valid.
- **Thief v2.** The owner asked for him all in black: hood, tunic, sleeves and hose are now black.
- **New cat `cat-white`.** The owner asked for a white cat with a black tail tip and a black patch on its head.
- **Walk sheets.** The approved figures and animals are exported again, now with their walk sheets and the eight
  facing images.

## Implementation decisions

- The animal recipe stays at version 1 so the approved cats and rats keep their hashes. The new dog and wolf build is
  selected through the variant specs instead.

## Save/Load impact

None.

## Testing

- `npm test` passes.
- Contact sheet of the revised dogs and wolves checked.

## Notes for the next agent

- Taking the chosen designs into the game is a Mechaniky task: the starter stockpile, fisherman's hut, pitch kiln,
  campfire, village green, ornaments, children, workers, cats and rats.
- The fisherman's hut and pitch kiln designs are 3×3, so the game footprints need to change.

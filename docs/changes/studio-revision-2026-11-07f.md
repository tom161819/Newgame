# Studio revision: first batch reviewed, fisherman's hut and pitch kiln revised

## What and why

The owner reviewed the first batch in the shared Studio and wrote „spustit revizi“. This takes the decisions over and
carries out the two revision requests.

## Files and systems

### Decisions taken over into `art/approvals.json`

★ marks the design the owner chose for the game.

| Asset | Approved | Rejected |
|---|---|---|
| Campfire | burning ★, cold | |
| Haystack | haycocks ★ | dome, snow |
| Snowman | bucket ★, scarf | |
| Starter stockpile | tarp camp ★ | pole shed, wagon camp |
| Swing tree | summer ★, autumn, winter | |
| Village green | linden ★, maypole, oak with cross | |
| Well | roofed ★, sweep, roofed in winter | |

### Revisions

- **`fisherman-hut-stilt-net-loft` v2.** The owner asked for a bigger net on the house wall, some fishing rods and a
  water barrel or tub. The hut now has:
  - a big net pegged along its front wall;
  - a rack of fishing rods;
  - a live-fish tub.
- **New asset `fisherman-hut-large` (3×3).** The owner asked for 3×3 versions so that everything fits:
  - **Net house with yard:** nets on two walls, a boat, rods, a tub, two drying racks, a smokehouse, an eel trap,
    baskets and a sign.
  - **Hut on stilts with landing stage:** a long landing stage, a moored boat, a wall net, rods, a water barrel, a net
    rack and drying fish.
- **`pitch-kiln` moved to 3×3.** The owner asked for a bigger building with one tile for the yard.
  - **Stone oven v2:** a long stone pitch house. The yard holds the oven, a cauldron, barrels, torches, stumps and
    billets.
  - **Turf kiln v2:** a large kiln and a bigger lean-to.
- **New props:**
  - `wallNet`: a net hung on a wall;
  - `rodRack`: fishing rods on a rail;
  - `waterTub`: a live-fish tub or a water barrel.

## Implementation decisions

The game's fisherman's hut and pitch kiln are 2×2. Using a 3×3 design means Mechaniky must change the footprint.

## Save/Load impact

None.

## Testing

- `npm test` passes.
- Contact sheet checked.

## Notes for the next agent

Chosen designs (★) still need small Mechaniky tasks to take them into the game. For the 3×3 fisherman hut or pitch kiln, the game footprint changes.

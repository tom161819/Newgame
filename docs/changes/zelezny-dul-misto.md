# m-zelezny-dul-misto – a place for the Iron Mine (playtest 0.83.0 #5)

## What and why

Report 0.83.0 point 5: a first Iron Mine plan on unexplored land was cancelled later ("na místě stavby Železný důl je
překážka", status line only), and at the two nearest Iron Deposits (18 and 23 tiles, world MKW4-155515555555-SU24BGPY)
known land had no valid spot ("potřebuje 3 × 3 volných políček").

**Cause** (probe of that world in the 0.83.0 build, plus the code):
- The world was not short of space. Deposit (35,59) at 18.6 tiles and (66,31) at 23.3 tiles have open grass around them;
  with the area in sight 12–14 anchors per deposit are valid. The large deposit (60,76) has only 5 (rocks and trees).
- The Iron Mine (3 × 3) must stand **beside** the deposit (footprint distance ≤ 4) and must **not** cover it – the
  opposite of the Quarry, which goes on its deposit. The footprint hangs from the cursor tile to the right/down, so
  pointing at the deposit or just above/left of it covers the deposit, and the game answered with the generic "needs
  3 × 3 free tiles". Around a deposit about 30–37 of 144 cursor tiles gave that message against 5–14 valid ones. Deposits
  are placed in stony country (stone weight), so rocks and ridges take more spots.
- The deposit must also be **in current sight** and the whole footprint in sight, otherwise the plan is provisional.
- A provisional plan skipped the mining rule completely (`knownContext` returns no mining errors), so a blind Iron Mine
  was accepted anywhere – far from any deposit, or over it. When the site was seen, `verifyProvisional` ran the full
  `placementError`; any failure cancelled it as "obstacle found", only in the status line.

**Changes:**
1. Generator 5: `MineralSystem.ensureIronMine` (after `ensureStartQuarry`, own stream `start-iron-mine`) checks that the
   Iron Deposit nearest to the Castle has an Iron Mine anchor right beside it (footprint distance ≤ 1, all tiles free,
   clear of the Castle and stockpile, cuts nothing off, building and deposit reachable – `ironMineSite`). If not, it adds
   an ordinary Iron Deposit 12–24 tiles out (nearer than the old nearest) that has one. In a 46-world sweep none needed it.
2. A blueprint cancelled for an obstacle is a notice at once (`buildCancelled`, category construction, 2 game days or
   until closed): "Construction cancelled: House – Rock. Materials returned." A click pans the camera to the site.
3. Iron Mine build mode names the reason: "Iron Mine cannot stand here: Unexplored / On the deposit – the mine stands
   beside it / Rock / Water / Ford / Tree / Building / Something lies here / Someone stands here / Out of deposit range
   (an Iron Deposit within 4 tiles) / Deposit not in sight / Deposit depleted / Deposit already has a mine / Map edge".
   Outside sight an Iron Mine needs a known (seen or remembered) free Iron Deposit in range, else it is refused there.

## Files and systems

- `src/data/minerals.js` (`START_IRON_MINE`), `src/systems/MineralSystem.js` (`ironMineSite`, `ensureIronMine`),
  `src/game/GameScene.js` (call after the start Quarry; build-mode wrappers), `src/data/worldCode.js` (generator 5).
- `src/game/siteObstacles.js` (new): `siteObstacle`, `mineSpotError`, `provisionalMineError`, `knownDepositsInRange`.
- `src/systems/ConstructionSystem.js` – `cancel(site,{obstacle,reason})`, event `constructionCancelled.obstacle`.
- `src/systems/ProductionDiagnostics.js` – `siteCancelled`, `cancelIssues`; `src/data/diagnostics.js` `cancelledDays`.
- `src/ui/noticeText.js`, `src/ui/NoticesPanel.js` (camera), `src/game/WorldCamera.js` (`lookAt`).
- i18n en/cs: `notice.buildCancelled`, `site.mineInvalid`, `site.reason.*`.
- World codes MKW4- → MKW5- in all smokes, `tests/world-code.test.js`, `tests/world-configuration.test.js`.

## Implementation decisions

- Guarantee by **adding** a deposit (like the start Quarry), never by moving or clearing; worlds that already qualify are
  byte-identical to generator 4 apart from the version digit. The bump follows the policy anyway (some seeds change).
- "Beside" = footprint distance ≤ 1 (the rule allows 4): the guaranteed spot is the obvious one.
- Reasons are reworded only for the Iron Mine; the Quarry and other buildings keep their messages. The cancel notice
  uses the same classifier for every building.
- The cancel notice is not saved (like other open rows; only close times are).

## Save/Load impact

SAVE_VERSION stays 61. World generator 4 → 5: a generator-4 code is refused for a New Game; saved games keep their code.

## Testing

- `npm test`: all pass; new `tests/zelezny-dul-misto.test.js` (5 tests: 46-world sweep with the game's placementError,
  the reported world keeps its 18-tile deposit, a walled-in deposit gets a new one, build-mode reasons en/cs incl. fog,
  cancel → notice with reason/tile, not repeated, gone after 2 days).
- Browser smoke `--iron-mine-spot` (new, world MKW5-…-SU24BGPY): PASS. `--world-code` (updated to "version 5"),
  `--big-nature`, main `--current-only`: PASS.

## Notes for the next agent

- The tutorial arrow for the Quarry (report point 3) still targets `stone_deposit` only; not touched here.
- The Iron Mine footprint still hangs from the cursor's top-left tile. A centred footprint for 3 × 3 buildings would make
  placing beside a deposit easier; that touches every building's preview, so it was left out.
- If the generator changes again, bump `WORLD_GENERATOR_VERSION` and replace `MKW5-` in the smokes and tests.

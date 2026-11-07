# Fishing R1: Fisherman's Hut, Fishers, fish and fish stocks (7 Nov 2026)

## What and why
Plan item `m-rybarstvi-r1` (owner-approved concept, brief `zadani-rybarstvi.md` part M). Fishing gives food in winter, makes the new water from #100 worth building next to, and adds a fourth kind of food and a new trade good.

## Files and systems
- `src/data/fishing.js` (new): `FISHING` holds every number in one place:
  - 6 fish per day, a basket of 5, reach 8, trips of at most one game day, 3 XP per fish;
  - depth: shallow ×0.8, deep ×1.2;
  - season: Spring ×1.1, Winter ×0.5;
  - weather: Rainy ×1.1, Frost ×0.8;
  - stock: 4 per water tile, between 40 and 400; 10 % of the missing fish come back per day, half that in winter; full catch above 50 %, proportional below, nothing under 10 %.
  - Helpers: `stockCapacity`, `stockFactor`, `stockState`.
- `src/systems/FishingSystem.js` (new, `scene.fishing`):
  - Water bodies are found by flood fill over the #100 ground layer (`waterBodies`). Ids follow the scan order, so the same map gives the same ids.
  - Fish stock per body, daily recovery, the catch of each hut today and yesterday, and the panel line.
  - Fisher AI: pick a free shore tile within reach (walkable, next to water, reserved as `natural-slot:x,y`), walk there, and fish with task `fish`. Progress is `rate × time`, where rate = perDay / day length × depth × season × weather × stock factor × skill efficiency × staffing.
  - Each fish lowers the stock, emits `fishCaught` (Fishing XP) and counts for the hut.
  - When the basket is full (or the trip is over), the catch becomes the Fisher's cargo. The existing food transport takes it to a Granary, and the Granary's ledger source is "Fishing".
  - When a body becomes Overfished, the event feed reports it once.
  - The state is saved and validated (`validateFishingState`).
- `src/data/objects/buildings.js` `fisherman_hut`:
  - "Fisherman's Hut", 2×2, Food, after the Hunting Lodge, needs a finished Granary.
  - 12 Wood + 4 Stone, `fishing:{radius:8}`.
  - Provisional procedural workplace drawing with a menu icon in `public/assets/buildings/fisherman_hut/fisherman_hut.svg`.
- `src/data/objects/resources.js` `fish`, with a provisional icon in `public/assets/resources/fish/fish.svg`.
- `src/game/buildings.js` `placementError`: the hut must touch water on a side ("Must be built next to water"). It uses the map, so remembered water counts outside sight.
- Profession `fisher` and skill `fishing`:
  - `jobs.js` (skill, job); `workplaces.js` (2 seats); `economy.js` (talent "Natural Fisher", wage 1); `employment.js` (sector food);
  - `experience.js` (`fishCaught`, hut completion 8 XP); `SkillSystem` (`fishCaught` → fishing);
  - `WorkplaceSystem.present` counts task `fish`; `WorkerAI` dispatches Fishers.
- Food and trade: `fish` is in `FOOD_RESOURCE_IDS` (Granary, food camp), `EDIBLE_RESOURCES` (eaten after meat), `RESOURCE_WEIGHTS` (1) and `BASE_PRICES` (3 Gold), and in the Food and General merchants' goods.
- `FoodSystem.recordProduction` writes the "Fishing" ledger line.
- `WorkplacePanel` shows the fishing line: stock state, numbers, today and yesterday, and the season and weather factor.
- Save: `SAVE_VERSION` 43.
- i18n en/cs.
- Tests: `tests/fishing.test.js` (new). Counts were updated in `assets`, `building-categories`, `economy`, `granary-capacity-groups` and `logistics-haulers`.
- Smoke: `scripts/fishing-smoke.mjs` (`--fishing`).

## Implementation decisions
- **No buffer at the hut.** Hunters, woodcutters and miners also carry straight to storage, and no gatherer workplace in the game has a buffer that Haulers empty. The Fisher therefore carries his basket to the nearest Granary himself, through the existing food transport. Adding a buffer would need new storage locations, validation and hauler tasks for no gameplay difference. If the owner wants the brief's buffer, it is a follow-up.
- **Balance.** Most shore tiles touch shallow water, so a Fisher typically catches about 4.8 fish per summer day (7.2 at deep water). Two Fishers make about 10–14 fish per day, half that in winter. I did not measure Hunters for a side-by-side comparison; the values are in `src/data/fishing.js`, so they can be tuned.
- **Shared stock.** Two huts on the same river share one stock (the river is one body). The lake is a separate body.
- **Variety bonus.** Politika v2 P3 (meal variety) is not done yet. Fish is already in `EDIBLE_RESOURCES`, so P3 should use 4 kinds (2 kinds +3, 3 kinds +5, 4 kinds +7, as in the brief).
- **Art.** Studio art (task `g-rybarstvi-grafika`) is not approved yet. The hut is drawn by the procedural workplace renderer, the fish has a simple SVG icon, and Fishers use the procedural villager figure (no `PROFESSION_LOOKS` entry without approved art).

## Save/Load impact
`SAVE_VERSION` 43 (minor release). Saves gain:
- `fishing`: the stocks of every water body, the overfished warnings, the catches per hut and the catch counter;
- the `fishing` skill for every resident;
- Fisher tasks (`fish`: goal, `caught`, `fraction`, `depth`, body).

Validation checks:
- stocks are within capacity and the body count matches the ground;
- catches refer to huts;
- a fish task belongs to a Fisher of a finished hut, on an open tile next to water of the stated depth, with fewer fish than the basket holds.

Games saved by 0.14.x cannot be loaded.

## Testing
- `npm test`: 864 tests pass.
- Smokes pass: `--fishing`, `--ledger`, `--needs`, `--employment` (expected priorities now include `fisher`), `--marketplace`, `--autosave`, `--population`, `--staffing`, `--policy`, `--save-transfer`, `--world` and `--builder-workshop`.

## Notes for the next agent
- When `g-rybarstvi-grafika` is approved, add the hut to `APPROVED_BUILDING_ART`, the Fisher look to `PROFESSION_LOOKS`, and the fish icon.
- There is no water tooltip with the stock state yet; it shows only in the hut panel.
- The brief's later items (jetty, boats, ice fishing, rich spots) are not done.

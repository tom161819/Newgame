# Trade F1.2 – merchant caravan (S14 #59, 7 Nov 2026)

## What and why
Second step of trade F1 (brief `zadani-obchod-f1.md` §2–3, plan item `m-obchod-f1-2-karavana`). A caravan visits a finished Marketplace; trading with it is F1.3.

## Files and systems
- `src/data/trade.js`: `CARAVAN_RULES` (every 2–4 days, stay 0.75 day, wait up to 0.25 day, warning 0.1 day before leaving, 1.6 tiles/s, 100–300 Gold, 8 spawn attempts, route limit) and `MERCHANT_TYPES` with stock ranges (general, food, building_materials, ore_iron, arms).
- `src/systems/CaravanSystem.js`: schedule (starts when a finished Marketplace exists, also on `buildings:changed`), `spawn` (random walkable edge tile + Marketplace with a path; otherwise an event and a retry in 2–4 days), movement with `findPathToAny`/`advanceMovement` on the real map, never entering a tile that became blocked (`canEnterTile`) and replanning, phases arriving → trading → leaving, `deliveryPending` hook for F1.3 (extends the stay by at most 0.25 day), event feed messages, `status()`, `summon()`, export/import.
- `src/game/CaravanViews.js`: provisional procedural wagon with horse, red cover (full) or bare bed (empty) and the merchant on the box; fog-aware, flips with direction.
- `GameScene` creates, updates and destroys both; `GameApplication` sets `globalThis.mkDev.summonCaravan()` for the console.
- `MarketplacePanel`: caravan lines (arriving / here, leaves in m:ss / waiting / leaving / at another Marketplace / next in N days), merchant's goods and Gold; refreshes every second while open.
- Save: `SAVE_VERSION` 38, `caravans: { seq, nextVisitAt, active }` with full validation in `GameStateSerializer`, import in `GameStateLoader`.
- Marketplace sprite: the definition now renders `marketplace.svg` as a sprite (`renderMode:'sprite'`, origin, display size for 3 × 3); the SVG got explicit `width`/`height` because an SVG without them rasterized blank in Phaser.
- i18n `caravan.*`, `market.*`; tests `tests/caravans.test.js`; smoke `scripts/marketplace-smoke.mjs` extended (summon, drive in, panel, leave, next scheduled).

## Implementation decisions
- The caravan is not a worker and not a vehicle of `VehicleSystem` (that one requires the player's horse and a hauler); it uses the same pathfinding and movement helpers, so it gets the paving speed bonus but leaves no trodden-path wear.
- Seeded randomness: the system takes `random` (tests pass a seeded one); the rolled stock, Gold and route are saved, so loading never rolls again.
- If the Marketplace is lost while the caravan is coming or trading, it leaves. If it cannot find any way out it simply disappears (finish), so nothing can get stuck.
- Timer text in the panel uses real minutes:seconds like the day clock in the HUD; the next visit in game days.

## Save/Load impact
New schema 38 (minor release 0.10.0); older saves are rejected with the usual notice. Caravan state is restored exactly (position, path, phase, stock, Gold, timers); stock is never added again.

## Testing
`npm test` passes (827). `npm run smoke -- --current-only --marketplace`, `--building-unlocks` and `--event-feed` pass.

## Notes for the next agent
- F1.3: set `scene.caravans.deliveryPending = caravan => <an order of this caravan is Transporting>`; read/write `active.stock` and `active.gold` there (the panel already shows them). Keep stock changes in the caravan record so they are saved.
- Replace `CaravanViews` textures and `marketplace.svg` when the Grafika task `g-obchod-trziste-povoz` is approved.

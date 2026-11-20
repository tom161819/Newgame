# Defence and attack 5: battle orders (Shield wall, Hedgehog) and terrain

## What and why
Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok". Point 5 of `claude/obrana-utok-plan.md`.

## Files and systems
- `src/data/military.js`: stances `shieldwall` and `hedgehog` (stand like Hold), `BATTLE_ORDERS`
  (Shield wall: ranged ×0.4, melee ×0.8, own ×0.7; Hedgehog: from riders ×0.5, against riders ×2, a charge into it does
  20 to the rider instead), `holdsGround(unit)`, `TERRAIN_COMBAT` (archer one relief level above the target ×1.2;
  target with a tree within 1 tile ×0.7 from shots).
- `src/systems/MilitarySystem.js`: `bonus` also multiplies `orderFactor` and `terrainFactor`; `charge` breaks on a
  Hedgehog; every "is he holding" check uses `holdsGround`.
- `src/systems/MoraleSystem.js`: the morale halving of Hold applies to every holding order.
- `src/ui/UnitSelection.js`: two more stance buttons (🧱 Shield wall, 🦔 Hedgehog) with tips.
- Save: `stance` may be `shieldwall` or `hedgehog` (serializer, validation, loader).
- Tests: `tests/battle-orders.test.js`.

## Implementation decisions
- The orders are stances, so they use the existing stance bar, save field and Hold behaviour; any unit may take them
  (the numbers do not depend on the unit's kit).
- High ground adds damage, not range: the reach check in `CombatSystem` has no access to the relief.
- Trees = `pine_tree` / `oak_tree` resources around the target (bushes are decorations, not counted).
- No new art.

## Save/Load impact
Two new values of the optional `stance` field; older saves load unchanged. SAVE_VERSION unchanged.

## Testing
- `npm test` (new `tests/battle-orders.test.js`).
- Browser: four Swordsmen chosen, the stance bar shows the two new orders; Shield wall set on all four.

## Notes for the next agent
- A small marker over soldiers in an order (shield, spikes) would help; not drawn yet.

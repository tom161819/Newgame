# Defence and attack 6: portcullis, siege tower, pavise

## What and why
Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok". Point 6 of `claude/obrana-utok-plan.md`.

## Files and systems
- `src/data/military.js`: `PORTCULLIS` (half damage from enemy blows and rams; 10 Iron + 6 Wood), `PAVISE` (ranged
  ×0.5), `SIEGE_TOWER` (reach 4 tiles, crossing 1 s).
- Portcullis: `FortDefenses.portcullis(gate)`, a button in the Gate's window (`DemolitionUI`), `EnemyArmy.hit`
  halves the damage on a Gate with it. Save: optional `portcullis: true` on a Gate.
- Pavise: `MilitarySystem.orderFactor` – a Crossbowman (crossbow in his kit) who is not walking takes `PAVISE.ranged`
  of ranged damage.
- Siege tower: enemy unit `enemy_siege_tower` (500 HP, armour 30, slow, wheels, roofed like the ram, never fights).
  It marches with the army; at one of our walls it docks (`animal.docked`, event feed line). An enemy Recruit or
  Swordsman at a wall within 4 tiles of a docked tower crosses in 1 s, and nobody throws him down.
  Provisional drawing `SiegeTowerView` (`BanditView.js`). Test panel: Enemy Siege Tower.
- i18n `defense.*Portcullis*`, `army.siegeTower`, object names; tests in `tests/fort-defenses.test.js`.

## Implementation decisions
- No drawing of the portcullis on the Gate yet (the Gate sprite has no door layer); the window says it is fitted.
- No siege tower for our side yet; no pavise picture (the mechanic only).

## Save/Load impact
Optional `portcullis` on Gate records; older saves load unchanged. SAVE_VERSION unchanged.

## Testing
- `npm test`.
- Browser, Test map: the Gate's window offers the portcullis and fits it; an enemy siege tower and ram drawn.

## Notes for the next agent
- Our own siege tower and the pavise picture are open.

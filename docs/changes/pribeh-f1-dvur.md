# Story F1: the royal court, trust, orders and the punitive expedition

## What and why
Owner, 21 Nov 2026: the story "Vlčí újezd" (plan item `m-pribeh-vlci-ujezd`; project docs `claude/pribeh-vyhnany-princ.md`, `claude/pribeh-cesty-po-volbe.md`). He confirmed the plan and said to build it in phases as I see fit ("když něco nebude sedět, tak to pak předěláme").

Phase F1 is the frame everything else hangs on: the King's trust and orders from court with a deadline, a reward and a penalty. "Po velké nelibosti přijde útok velké armády."

## Files and systems
- `src/data/court.js`: all numbers (`COURT`), `courtBand`, `LORD_TITLES`.
- `src/systems/CourtSystem.js`
  - Trust 0–100, starts at 40. Bands: favour ≥ 70, calm ≥ 40, suspicion ≥ 25, displeasure ≥ 10, wrath below.
  - Orders: the first on day 3, then one every 4 days, at most 2 open. The sequence is delivery, levy, delivery, levy, request.
    - Levy: gold by residents and Castle level, plus any fine.
    - Delivery: a resource the kingdom can make (by Castle level), amount by residents.
    - Request: optional, pays gold, no penalty.
  - Deadline 5–6 days (×1.4 in favour, ×0.7 in suspicion and below), then a grace of half the deadline (late: trust −3).
  - Unmet: trust −10 (levy) or −8 (delivery), and half of the order's gold value is added to the next levy. In suspicion or worse a fifth of that resource's stock is seized.
  - Favour: a gift of gold every 5 days.
  - Displeasure: collectors take a quarter of gold and food once, and a 10-day countdown starts. Atonement (60 gold × Castle level) stops it and sets trust to 25.
  - Countdown over, or wrath: the punitive expedition. Units by Castle level, plus half an enemy soldier for each of ours, ×1.5 for each earlier expedition. It spawns at the map edge and marches on the Castle (`EnemyArmy.march`).
  - Expedition end: all enemies dead → trust at least 20 and 20 days of peace. Castle beaten down to its floor → the army takes half of the stores and leaves (same peace).
- `src/ui/CourtPanel.js`: `#court-trust` in the HUD (bands in the hover text) and the "Orders from court" card in the corner stack with Hand over and Pay atonement buttons.
- `src/game/GameScene.js`: creates and updates the system; the expedition spawn.
- `src/systems/GameStateSerializer.js`, `GameStateLoader.js`: optional `court` field, validated by `validCourtState`.
- `src/ui/UnitPanel.js`: the player's name is "Hynek of Kamenný Brod · <title>".
- `index.html`, `src/style.css`, `src/i18n/en.js`, `cs.js`.
- `tests/court.test.js`.

## Implementation decisions
- The court runs only in a normal game (`scene.kingdomRanks`, not the Test map or Conquest).
- The old Royal tasks stay as they are (they give King skill points); the court is a separate system.
- A fallen Castle means plunder, not the end of the game. The plan said "loss of the fief"; I chose the milder outcome for now, because a game over from one lost fight would be harsh before the rest of the story exists. To be revisited with the endings (F5).
- The army's marching order is not saved (as before); while an expedition is on, enemies without an order are sent again.
- Texts still call the unit "King" elsewhere (Wiki, tips); only the unit panel shows the new name and title. A full rename comes with the chapters.

## Save/Load impact
SAVE_VERSION unchanged. The `court` field is optional: a save without it starts with trust 40 and the first order on the next day.

## Testing
- `npm test` (new `tests/court.test.js`).
- Browser: new game, order card, trust in the HUD, forced expedition (11 men marched on the Castle), snapshot with the court state.

## Notes for the next agent
- Next phases: F2 Smil as rival, F3 evidence, F4 chapters and the choice of side, F5 the four paths.
- Deliveries are handed over by a button; nothing is carried on the map yet.

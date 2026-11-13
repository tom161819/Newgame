# Own caravan from the Marketplace

## What and why
Owner, 12 Nov 2026 (plan 24, answers: risk yes, soldiers do not die yet, everything can be sold): send goods from a
Marketplace with a Horse Wagon and an escort; back in 2–4 days with gold.

## Files and systems
- `src/data/trade.js`: `EXPEDITION` (2–4 days, risk 30 % − 5 % per Recruit, 8 % per Soldier / Swordsman / Archer,
  12 % per Knight, at least 3 %; ambush loss 20–60 % less with a bigger escort; price ± 10 %; gather up to 2 game hours;
  wounds halve HP, at least 1), `expeditionRisk`.
- `src/systems/Expedition.js` (new): `Expedition` (`blocker`, `goods`, `send`, `cancel`, `update`, `depart`, `home`,
  export/import), `wagonLoad` (Hauler load × Horse Wagon), `validExpedition`. Lives in `TradeSystem.expedition`.
- `src/ui/MarketplacePanel.js` `renderExpedition`, section `#marketplace-expedition` in `index.html`: button grey with
  the reason, goods with amounts, load against capacity, escort slider, earnings estimate and ambush risk, Send / Cancel.
- `src/systems/MilitarySystem.js`: escorts walk to the Marketplace; `src/systems/WorkerAI.js`: an escort away is off the
  map (`worker.away`, hidden in `GameScene` too); `src/systems/VehicleSystem.js` / `src/game/VehicleViews.js`: the wagon
  is not used by Haulers and is hidden while away.
- Save: optional `trade.expedition`; the escort flags follow from it on load.

## Implementation decisions
Simplified against the plan:
- The goods leave the stores when the caravan departs (not carried to the wagon by the soldiers yet).
- The wagon stays parked (hidden) while away rather than driving to the map edge; escorts disappear at the Marketplace.
- One caravan at a time; it starts when the escort is at the Marketplace or after 2 game hours.

## Save/Load impact
SAVE_VERSION stays 62; optional `trade.expedition`.

## Testing
- `npm test` (`tests/expedition.test.js`: no wagon → blocked, risk floor, full run with gold and no copies, ambush wounds).
- Browser: the Marketplace window shows the grey reason without a wagon and the form with one (screenshot).

## Notes for the next agent
- Open: soldiers carrying the goods to the wagon, the wagon driving off the map, a minimap mark for the caravan.

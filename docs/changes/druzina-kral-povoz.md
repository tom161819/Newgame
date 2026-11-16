# Party: the King, a Horse Wagon with goods, a dense forest (0.142.1)

## What and why
Owner 16 Nov 2026 after trying 0.142.0: in the land the King stood on one side and the party on the other, and the party died to wolves at once. Asked: let the King go with the party (else he is not on the land's map), the party appears on the side it came from, a Horse Wagon with goods can go along, and a dense forest land has much more forest.

## Files and systems
- `ScoutingSystem`: `send(zone, ids, {king, wagon, cargo})`; `kingFree`, `freeWagon`, `holds`, `wagonAway`, `goods`, `load`, `capacity` (= `wagonLoad()`); the King walks to the edge (re-ordered while idle), then `setKingAway(true)` (hidden, out of fights, not selectable, camera to the Castle); cargo taken from the stores at departure (`takeCargo`, ledger expense) and returned at home (`returnCargo`, overflow dropped by the edge); party fields `king`, `wagonId`, `cargo` validated in `validScouting` (wagon id, resource ids).
- The held wagon is not used by haulers (`VehicleSystem`), the own caravan (`Expedition.freeWagon`) or sold (`TradeSystem.vehiclesForSale`), and is hidden while away (`VehicleViews`).
- `GameScene`: King culling and `canFight` respect `character.away`; trees in a zone × `ZONE_LOOK.trees`, clusters × `ZONE_LOOK.clusters`, forest weight floor .45 in a forest zone. `NaturalResourcesSystem.generate` takes `clusters`.
- `zoneMode.js`: King with the party or `away` (not on the map); a wagon vehicle with the cargo in the zone; wolves within 30 tiles of the entry removed; King's health back home; banner shows the wagon load.
- `WorldPanel`: King tick, wagon tick and goods inputs with the load. `UnitSelection`: an away King cannot be selected.

## Implementation decisions
The wagon stays in the home state (parked, held by the party) instead of a new vehicle state, so the vehicle save format does not change. In the zone the wagon is a plain vehicle (no horse work there yet).

## Save/Load impact
SAVE_VERSION unchanged; optional `scouting.party.king|wagonId|cargo`.

## Testing
tests/scouting.test.js (validation with King and wagon); browser: King + 4 soldiers + wagon with 10 bread to a land and back (King hidden at home, in the land with the party, wagon visible there, bread back in the stores, save check passes at home), dense forest ≈ 1 400 natural objects spread over the land.

## Notes for the next agent
In a zone the wagon has no horse (the horse stays home in the stables state); goods in the wagon cannot be used in the zone yet (step 4: camp, mining, carrying back).

# Caravan return froze the game

## What and why
The owner's save froze on day 98 at 18:11, also after a page refresh. His own caravan came home at that moment. `Expedition.home()` booked the gold in the resource ledger with `type:'trade'`. That type is not in `TRANSACTION_TYPES`, so `ResourceTransactionLedger.record` threw `TypeError: Invalid resource transaction` in every simulation step. The clock never moved on.

## Files and systems
- `src/systems/Expedition.js` – `home()` books the gold with `type:'sale'`.
- `tests/expedition.test.js` – new test with the real ledger.

## Implementation decisions
- `sale` is the right type: the caravan sells goods for gold (same as `Trade Sale`).
- The older tests used a fake scene without a ledger, so the wrong type was never run. The new test uses the real `ResourceTransactionLedger`.
- No try/catch was added around the ledger. A wrong type should fail in tests, not be hidden.

## Save/Load impact
None. Save version stays 62. Saves with a caravan on the road load and the caravan returns normally.

## Testing
- `node --test tests/expedition.test.js` – 4 tests pass.
- The owner's save (day 97, caravan away) run in the browser harness at speed 3 passes the return time.

## Notes for the next agent
- While the game was stuck, `inventory.add('gold')` ran before the throw each frame. Gold lives in the scene only, so a refresh dropped it; saves made before the freeze are clean.
- Any new ledger call must use a type from `src/data/resourceLedger.js`.

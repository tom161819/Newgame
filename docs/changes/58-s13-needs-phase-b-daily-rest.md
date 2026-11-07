# #58 S13 phase B – homes and the daily rest

## What and why
Phase B of Master 13 (`docs/upgrades/13_26_villager_needs_happiness.md`, section 3 "Odpočinek a denní režim" and section 4 "Bydlení"). Phase A derived homes on the fly and recovered Rest whenever a resident was not working. Now homes are stored. Residents walk home in the last quarter of each day and rest there, and homeless residents recover more slowly. The task is tracked on the plan page as `m-58-potreby-zbytek`; C2 (after #103) and the rest of D are still open.

## Files and systems
- `src/data/needs.js`: `DAILY_REST`. Rest time starts at 75 % of the day. A resident counts as tired below 20 and as rested at 60. Recovery per day is 400 in a House, 300 in a settlement base place and 150 when homeless. Soldiers are exempt.
- `src/systems/NeedsSystem.js`:
  - `assignments`: a map of id to `{kind:'house',buildingId}` or `{kind:'settlement'}`.
  - `homes()` keeps valid assignments and moves base-place residents into free House seats, oldest first. Everyone else gets a House seat, then a base place, otherwise nothing. It is deterministic and idempotent, so it runs on every update and on export.
  - `homeOf(worker)`; a `Resting` worker recovers at the rate for his home kind; export and import of `homes`.
- `src/systems/DailyRest.js` (new, `workerSystem.rest`): `isRestTime`, `eligible`, `busy` (workTask, cargo or a Stablehand job), `update`, `start`, `stop`, `goHome`.
  - Goals: `towerNeighbors` of the House, or of the completed Castle for base places.
  - With no reachable goal or no home, the resident rests where he stands.
  - Phases are `restPhase`: `going` (state `Going Home`) and `resting` (state `Resting`).
  - Rest ends when it is no longer rest time and Rest is at least 60.
- `src/systems/WorkerAI.js`: the rest check runs after `foodProduction.handleTransport` and before profession logic, so a delivery in progress is finished first and no new task is picked. A manual command clears the rest phase.
- `src/systems/LogisticsTaskManager.js`: a resting Hauler is not a free Hauler, so producers carry their own supplies instead of waiting.
- Saves: `SAVE_VERSION` 36 → 37.
  - Workers may carry `restPhase`, and `workState` may be `Going Home` or `Resting`.
  - `needs` gets `homes`. Validation: each resident at most once; a House seat only in a completed House and within its capacity; at most `POPULATION.maximum` base places.
- i18n en/cs for the new states and messages.

## Implementation decisions
- Not "cancel the task on the spot": the spec asks for no duplicates and kept reservations. Finishing the task in hand is the safe way, because tasks take seconds and cancelling would cut cargo and reservations across many systems.
- "Enters the house" is shown by standing at the door. Hiding units inside buildings would touch rendering, selection and Fog of War; it is left for later if wanted.
- Houses fill first and base places are a fallback, so building Houses visibly moves people in. The total number of places is unchanged (20 + 5 per House).
- `workplaceReached` is not reset after rest. Residents carry on from where they are, and their uniform is unchanged.
- No night darkening (optional in the spec).

## Save/Load impact
SAVE_VERSION 37 (MINOR release). Older saves are rejected with the incompatible-save notice. Within 37, a save in the middle of going home or resting restores exactly.

## Testing
- `npm test`: 787 pass, including `tests/daily-rest.test.js`:
  - homes, capacity, promotion and loss of a House;
  - walking to the House without teleporting, and faster recovery than without a home;
  - cargo is finished first;
  - early rest when tired;
  - soldiers are exempt and a Hold order wins;
  - Save/Load mid-rest, with malformed homes and phase rejected.
- Adjusted tests:
  - `hauler-idle-stone` allows a second day because the Hauler rests at night;
  - the legacy case in `workers` also drops `needs`, because older saves had no needs.

## Notes for the next agent
- Phase C2 (after #103 taxes and rations) and phase D (economy, saving AI states, strikes in the panel) remain.
- Possible follow-ups: hide residents inside their House while resting, and darken the scene at night.

# Saving next to a ford (m-ulozeni-brod)

## What and why
Playtest 0.76.0, point 1 (high): saving and autosave failed almost all the time from day 12 with "The saved game is damaged…". A Fisher fished from a bank next to a ford. Fishing treats a ford as shallow water (`FishingSystem.isShore`), but the save check compared the raw ground and refused the task.

## Files and systems
- `src/systems/FishingSystem.js`: `fishingGround(g)` (ford → shallow), used by `isShore`.
- `src/systems/GameStateSerializer.js`: the fishing task check uses `fishingGround` for the neighbouring tiles.
- `src/ui/GameApplication.js`: when the check fails while saving, the error is logged and the player sees "The game could not be saved. Play on – the next autosave will try again." instead of the damaged-save text.
- i18n `saves.saveFailed` (en, cs).

## Implementation decisions
- One shared function, so fishing and the save check cannot drift apart again.
- Saving a state that fails the check is still refused (no partial saves); only the message changed.

## Save/Load impact
None. SAVE_VERSION stays 60. Saves made by fishers next to fords now succeed.

## Testing
`tests/fishing.test.js`: a Fisher on a bank of a lake rimmed with fords is saved and loaded. 1119 tests pass.

## Notes for the next agent
Other save checks that compare ground types should use the same helpers as the systems that create the state.

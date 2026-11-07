# E4 · Royal tasks and feedback when a building is finished (report 0.48.0)

## What and why
Plan task m-e4-cile-odmeny. After the tutorial the player had no short-term goals and a finished building passed with
only a status line.

## Files and systems
- `src/data/royalGoals.js`: 8 goals in order (3 Houses, 10 residents, first bread, 20 residents, first wall, 100 gold,
  Warehouse, Barracks) with rewards in gold, wood or stone; 3 are active at a time.
- `src/systems/RoyalGoals.js`: progress from the world (finished buildings, residents, gold) plus counted `foodProduced`
  reports per building type; `check()` marks a goal done before it pays, so a reward is paid once (ledger source
  "Royal Task", id `royal-goal:<goal>:<resource>`). Checked every 500 ms of game time.
- `src/ui/RoyalGoalsPanel.js`: folding card `#royal-goals` above the event feed (hidden while the tutorial bubble is
  active); a finished task flashes the card, plays a chime and adds an event feed line.
- `src/ui/CompletionFlash.js`: golden burst over a finished building (1.2 s, hidden in fog) and a chime.
- `src/ui/sound.js`: synthesized chimes (Web Audio, no files), at most one per 400 ms; Settings → Sound
  (`#settings-sound`, `newgame.sound`, on by default).

## Save/Load impact
New optional field `royalGoals: {done:[goal ids], produced:{buildingType:count}}`, validated. A save without it marks
the goals it already meets as done on the first check, without paying rewards. SAVE_VERSION stays 57.

## Testing
`tests/royal-goals.test.js` (data, order, reward once, bread/population/gold, Save/Load, old save, validation);
browser smoke `--e4`.

## Implementation decisions
- Goal progress comes from the world where it can (buildings, residents, gold), so a loaded game is consistent; only
  baked bread needs a saved counter.
- Chimes are synthesized (no audio files to approve in the Studio); one chime per 400 ms at most.

## Notes for the next agent
- New goals: add a line to `src/data/royalGoals.js` plus `goals.<id>` texts in en/cs; kinds are listed there.
- The card's look is provisional CSS; a designed card can come from the UI Lab.

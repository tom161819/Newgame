# Time of day in the top bar and plain person hover labels

## What and why
Owner, 9 Nov 2026 (Grafika chat):
- Show the time of day (hours and minutes) next to the date in the top bar.
- Hovering over a person shows the name, the profession and the level in that profession ("stavitel lvl 48"), without the ornamental frame.
- A child shows its name and "Dítě" (Child).

The owner also reported a black square seen during play. A 3-minute hunt did not reproduce it: about 4 minutes of Canvas play plus a WebGL run, scanning screenshots. The owner asked to drop the search after 3 minutes.

## Files and systems
- **src/data/dayNight.js:** `clockMinutes(fraction, nightStart)` and `formatClock`:
  - from dawn (fraction 0) to the night start, the clock runs 05:00 + 20 h × fraction;
  - the night fills the remaining hours up to 05:00.
- **index.html:** `#game-clock` in `.hud-clock`.
- **src/game/GameScene.js:**
  - `updateTimeDisplay` writes the clock;
  - hover labels go through `personTooltip`, which writes a name line and a role line;
  - children are now hovered too;
  - the class is removed for drop labels.
- **src/ui/personHover.js** (new): picks the name and the role line. The level is the skill level of the job (`JOBS[profession].skill`). The King shows King with his own level, and an unemployed resident shows the overall level.
- **i18n (en, cs):** `hover.role`, `hover.king`, `hover.child`.
- **src/style.css:**
  - `#object-tooltip.person-tooltip` is plain, overriding the theme frame layer;
  - `#game-clock` uses tabular numbers.
- **tests/person-hover-clock.test.js:** new tests.

## Implementation decisions
- **A piecewise mapping onto a 24-hour clock.** The game's day parts (dawn 0–5 %, night from 62–82 %) are not equal hours. With this mapping the night start reads as a realistic evening and the clock never jumps.
- **The name without the origin suffix.** The label shows the same name the old label showed.

## Save/Load impact
None.

## Testing
- npm test, including the new tests.
- Browser screenshots in Czech: the top bar shows "Den 1 06:01 Jaro · Slunečno", and a resident hover shows "Veronika Broučková / Nezaměstnaný · lvl 1".

## Notes for the next agent
- The black square in the owner's screenshot (a 49 × 49 px screen-aligned square of pure black on a path near the King, by day) is not found. Pure black is the camera background with the fog on (a hole in the ground) or the fog's unknown fill.
- The screen-aligned shape points at a rectangle write, not at a tile diamond. Candidates:
  - `shadeMemory`'s putImageData of a fog patch rectangle from a stale cached source;
  - a sprite whose texture uploaded black under WebGL.

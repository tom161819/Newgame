# Day and night N1: the day cycle, light map, sleep and night sight

## What and why
Plan item `m-noc-n1-den-noc` (brief `zadani-den-noc.md`, part N1, approved by the owner on 7 Nov). The game gets a
visible day and night; sleep follows the night, and at night people see less outside light. The night can be sped up
or skipped. N2 (pitch, torches, night safety) and N3 (wolves, thieves, fire) follow.

## Files and systems
- `src/data/dayNight.js`:
  - `DAY_NIGHT`: dawn 5 %, dusk 10 %, night start per season, the soldiers' rest window, night sight 1/3, the lit
    light types, ambient colour and alphas, moon 8 days, house windows, night speeds;
  - `nightStartFor` (linear between season middles, so there is no jump at season boundaries), `dayPart`,
    `darknessAt`, `moonLight`.
- `src/systems/DayNightSystem.js`:
  - part of the day, darkness, moon, ambient alpha;
  - `lights()`: torch, brazier and campfire lights in tiles; `inLight`; `sightFactor`;
  - `houseWindows`;
  - `speed()`/`skipToDawn()`.
  - It sets `gameTime.restStartFraction`, so daily rest starts with the night.
- `src/systems/DailyRest.js`:
  - `restStart`/`isRestTime` read the night start (without the cycle the old 75 % applies);
  - soldiers (`nightWatch`) rest from 0 to 1/3 of the day instead of being exempt.
- `src/systems/ChildrenSystem.js`: the evening window uses the same rest start.
- `src/systems/FogOfWarSystem.js`: optional `sightScale`, which multiplies the radius of every sight source.
- `src/game/NightOverlay.js`: the light map, i.e. two screen-sized render textures in world space over the camera view:
  - ambient darkness, with erase brushes at the lights;
  - an additive warm glow.
  - It draws only lights in view and nothing by day.
- `src/ui/NightControls.js`:
  - HUD `#day-part` (moon in the tooltip at night), `#skip-to-dawn`, `#night-plans`;
  - Settings `#settings-night-speed` (localStorage `newgame.nightSpeed`, default ×3).
- `src/game/GameScene.js`:
  - creates the day/night pieces;
  - nights run as several simulation steps per frame (stopping at dawn);
  - `attention` = a wild animal attacking.
- `index.html` (HUD and Settings markup); texts in both languages.
- Tests: `tests/day-night.test.js`. `scripts/day-night-smoke.mjs` (`--day-night`).

## Implementation decisions
- **The night start moves gradually through the year:**
  - it is exact at season middles (spring .75, summer .82, autumn .75, winter .62);
  - day 1 of a game (early spring) has night at about 68.5 %;
  - with seasons off it is always summer.
- **Economy impact:**
  - the share of the day spent asleep averages about the same as before (25 %): about 18 % in summer, about 38 % in
    winter;
  - winter, when nothing grows, now also has less working time.
- **Night speed-up:** the simulation runs ×N steps per frame, the same way as the background catch-up, so movement and
  AI keep their normal step size.
  - A fight in which a wild animal attacks stops it. N3 threats will add their own notices.
- **Sight:**
  - at dusk and dawn it shrinks in sixths, so the fog is repainted only a few times;
  - windows do not count as light for sight, only flames do (torch, brazier, later campfire and torches in hand);
  - residents sleeping by the castle stand in its torch light and keep their sight there.
- **House windows:**
  - glow from dusk in lived-in houses;
  - each house goes dark at its bedtime (night start + 0–8 % of a day by house id);
  - the castle windows (gameLights `window`) glow all night.
- **Nothing is saved:** the part of the day and the moon follow from the day; the speed is a browser setting.

## Save/Load impact
None (SAVE_VERSION stays 55).

## Testing
- `npm test` (968 pass), with the new day/night tests:
  - night start per season and smoothness;
  - day parts and darkness, moon;
  - sleep from the night start;
  - the soldiers' watch;
  - sight 1/3 and 1 in light;
  - speed, skip and attention;
  - house windows and bedtime.
- `npm run smoke -- --current-only --day-night`:
  - dawn → day → dusk → night, with the light map and HUD;
  - sight a third away from light;
  - Skip to dawn stops at dawn;
  - about 50 FPS at night in headless Chromium;
  - screenshots `night-dusk.png`, `night-night.png`.

## Notes for the next agent
- N2 adds torches and fuel: give the new light places `lights` (type `torch`) and they will count for sight and light
  the map. For "a light needs fuel", filter in `DayNightSystem.lights()` and in `LightSourceSystem.lights()`.
- The night speed stops on `dayNight.attention()`. N3 threats should make it return true (or call
  `dayNight.skipping=false`).
- The FPS of the old day-only build was not measured on the same machine. The overlay draws only lights in view, so
  the cost is one screen fill per frame.

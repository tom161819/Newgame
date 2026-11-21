# Story F2–F5: chapters, letters, Smil, evidence, the choice of side and the endings

## What and why
Owner, 21 Nov 2026: "dokonči celý úkol zpracování příběhu do hry … udělej to teď tak, jak uznáš za vhodné". Plan item `m-pribeh-vlci-ujezd`; texts follow `claude/pribeh-vyhnany-princ.md` and `claude/pribeh-cesty-po-volbe.md`. F1 (the court) was 0.150.0.

## Files and systems
- `src/data/story.js`: numbers (`STORY`), the events of each chapter (`STORY_EVENTS`), `storyEnding`.
- `src/systems/StorySystem.js`
  - **Chapters.** 1–4 need the Castle level and at least 10 days since the previous one began. Chapter 5 starts with the choice of side; 5–7 last 20 days each; 8 is the epilogue. The year is interpolated inside a chapter (1420 … 1437).
  - **Letters.** An event posts a letter into the inbox when its day in the chapter comes. A letter with choices closes only by a choice; the choice applies effects (trust, gold, flag, side, raid, soldiers).
  - **Smil** (until he falls or the player leaves the Crown): every 7 days, in turn, a raid (chapter 3 hired raiders, chapter 4+ mercenaries), a saboteur (chapter 2+, before the choice: with 2 soldiers he is caught, else a tenth of wood and food is lost) or slander (trust −4).
  - **Evidence.** The first proof: a caught saboteur, or any thief the night guards catch (`NightThreatSystem.caught` is wrapped). The second and third: a beaten raid of Smil's men (second from chapter 3, third from chapter 4). With three, "Accuse Smil" (the King's side only): trust +30 and his schemes stop.
  - **The choice** (chapter 4, day 2) is lasting.
    - Crown: trust +15, toll 4 gold a day × Castle level, Hussite raids every 16 days.
    - Prague union: orders come from the union (trust restarts at 50), trade 6 gold a day × level, royal hosts every 16 days.
    - Tábor: orders from Tábor, 6 soldiers join, royal hosts every 16 days.
    - Own lord: no orders and no trust, toll 8 gold a day × level, a tribute letter every 16 days (pay 35 gold × level, or they attack).
  - **Raids** use the court's spawn; sizes are a share of the punitive expedition for the Castle level. A lost raid (Castle beaten down) costs 30 % of the stores.
  - **Endings**: twelve, by side, flags from choices, proofs and trust. After the epilogue no more orders come; the game goes on.
- `src/ui/StoryPanel.js`: the letter over the game (pauses it), the chapter card with side, proofs, Accuse and the read letters.
- `src/systems/CourtSystem.js`: `enabled` / `active` (off for the own lord and after the epilogue), `patron` (King, Prague union, Tábor) in the texts, `plunder`, waits during a story raid.
- `src/game/GameScene.js`: wiring, reinforcements, year in the time label; `GameStateSerializer.js` / `GameStateLoader.js`: optional `story` field (`validStoryState`).
- `src/i18n/en.js`, `cs.js`: all letters and labels; `src/style.css`.
- `tests/story.test.js`.

## Implementation decisions
- The paths differ by orders, income, attackers and letters with choices. New unit types (flails, war wagons, handguns) are **not** in: they need new art and combat rules. Tábor gives ordinary soldiers instead.
- The great battles (Ústí, Domažlice, Lipany) are letters; the player decides by a choice, not by sending real soldiers away.
- "Military aid" costs gold (a company equipped in the player's name); soldiers do not leave the map.
- Hussite and royal attackers use the existing enemy units and colours.
- A save from before the story gets no prologue; its chapter follows the Castle level at once.
- The story never runs on the Test map or in Conquest.

## Save/Load impact
SAVE_VERSION unchanged; `story` is optional.

## Testing
- `npm test` (story: texts in both languages for every letter and choice, chapters, Smil and evidence, the four sides, tribute, a full run to an ending, save state).
- Browser: prologue on a new game (pauses, closes), the choice letter, choosing Tábor (soldiers joined, orders from Tábor), snapshot.

## Notes for the next agent
- Balance numbers are first guesses (`STORY`, `COURT`).
- Ideas left out: new Hussite units and the war wagon, a rider on the map who brings the letters, soldiers really leaving for battles, residents lured away by Smil, wall-building or trade perks per side.

# Soundtrack composed by code, with a volume slider (owner point 79)

## What and why
Owner, 19 Nov 2026: create a soundtrack, with a volume slider or an off switch in the menu.
There were no audio files, so this is a provisional soundtrack composed by code for the owner to judge.

## Files and systems
- New `src/ui/music.js`
  - `composePhrase` writes one phrase in D Dorian: a soft drone on the chord root, a plucked lute-like line (triangle wave) and in about half of the phrases a recorder-like tune (sine with vibrato), over the chords Dm–C–G–Am–F–Dm.
  - `MusicPlayer` schedules phrases ahead with Web Audio (lookahead 0.6 s), with a breath between phrases now and then, so it never loops exactly.
  - `bindMusic` binds the slider and starts on the first click or key (browsers need one), suspends while the tab is hidden and stops when the scene ends.
- `index.html` — Settings row `#settings-music` (0–100, step 5; 0 = off) under Sound.
- `src/game/GameScene.js` — `this.music=bindMusic(...)` with the sound controller.
- `src/i18n/en.js`, `cs.js` — `music.setting`.

## Implementation decisions
- Volume is stored in this browser only (`newgame.music`, default 35), never in a save. The Sound switch (chimes) stays separate.
- Loudness follows the slider on a curve (volume^1.5) so low values are really quiet.

## Save/Load impact
None.

## Testing
New `tests/music.test.js` (scale, timing, seeds, volume storage, 0 = off). Browser: a key press starts it (AudioContext running), slider 0 stops it, raising it starts it again, no errors.

## Notes for the next agent
If the owner wants real music, replace `MusicPlayer.schedule/note` with an audio file player and keep `bindMusic` and the slider.

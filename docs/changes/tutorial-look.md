# E3 · Look of the tutorial pointer, bubble and speed buttons (g-e3-tutorial-vzhled)

## What and why
Plan task g-e3-tutorial-vzhled: the tutorial (E3) and speed buttons (E2) came with provisional CSS. They now follow the
UI style like the rest of the interface, with two pointer designs to choose from in the UI Lab.

## Files and systems
- `src/style.css`: bubble, tip, tick, pointer, speed buttons and the Royal tasks card use the game variables (`--panel`,
  `--gold`, `--ink`, `--line`…), so the four UI Lab styles restyle them; an accent stripe marks the bubble (green for
  tips). Pointer: golden arrow (default) or pointing hand (`html[data-ui-pointer="hand"]`, SVG mask). Speed buttons
  show icons (pause bars, one to three play triangles); the text and aria-label stay for screen readers.
- `art/ui/uiConfig.js`: token `pointer` (`POINTERS`: arrow, hand) → `data-ui-pointer`; presets and the game config
  carry `pointer: "arrow"`.
- `art/ui/ui-theme.css`: the bubble and the Royal tasks card are themed surfaces (texture, frame, shadow).
- Studio UI Lab: Style → "Tutorial and tips" → Pointer; Window → "Tutorial, tips, speed and Royal tasks" draws a sample
  (map step with bubble and pointer, pointer above the Buildings tab, off-screen pointer at the edge, tick, tip,
  speed buttons, Royal tasks card).

## Implementation decisions
- One set of rules for all four styles instead of four hand-made designs: the styles already define the colours,
  fonts, textures and frames, so the tutorial matches whichever style the owner picks.
- The hand is drawn as an SVG mask so it takes the accent colour of the style.

## Save/Load impact
None.

## Testing
`tests/ui-lab-config.test.js` (pointer token, default, invalid value); smokes `--e2 --tutorial --e4 --ui-theme` and
`npm run studio:smoke`; screenshots of the four styles × two pointers checked.

## Notes for the next agent
- The Studio was not published with this change: the Grafika chat had newer Studio work online that was not in the
  store yet. The next Studio publish from the store includes the UI Lab sample.
- The owner picks the pointer in the UI Lab design marked for the game; taking it over is the usual "převzít UI".

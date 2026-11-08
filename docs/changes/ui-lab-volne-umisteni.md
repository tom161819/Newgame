# UI Lab: free placement of bars (move, snap to edges, resize)

## What and why
Owner, 8 Nov 2026 (Grafika chat): "přepracuj pak ui hub ještě ať můžu všechny ui lišty přemistovat, chytat ke stěnám, zvětšovat atd. ať to jde ladit do detailů". Before, the UI Lab could only dock each bar to a few fixed positions.

## Files and systems
- art/ui/uiConfig.js (shared by the game and the Lab):
  - FREE_REGIONS covers 11 bars and tabs: resource bar, buildings bar, title, settings tab, population tab, kingdom policy, minimap, notices, event feed, camera chips and status line.
  - config.free maps a region to a frame `{ax, ay, x, y, w, h}`. The frame is anchored to the left, centre or right edge and the top, centre or bottom edge, with its distance from that edge in px. w and h are optional px sizes.
  - normalizeFrame validates a frame.
  - frameStyle turns a frame into `position: fixed` styles, set inline with `!important`.
  - applyUiConfig applies frames and undoes them (applyFree).
- studio/ui-lab.html + studio/src/ui-lab/main.js + ui-lab.css add a "Free placement" toggle:
  - Each bar gets a box with 8 resize handles.
  - Dragging moves a bar; edges, centre lines and other bars snap within 10 px. Shift turns snapping off, and pink guide lines show the snap.
  - Keys: arrows nudge 1 px (Shift: 10 px), Alt + arrows resize, Delete docks the bar again.
  - The Layout tab lists the bars with anchor and px fields, "Dock again" and "Dock all bars again", plus a comment field.

## Implementation decisions
- **Frames are anchored to the nearest edge or centre.** This keeps a placed bar in place on every screen size.
- **A moved bar keeps its width.** Fixed position would otherwise shrink-wrap it. Height is set only after a vertical resize.
- **Free placement is in addition to the docked positions.** A bar without a frame stays docked as before.

## Save/Load impact
None (UI config only).

## Testing
- tests/ui-free-placement.test.js covers validation and styles.
- The Studio smoke drags the minimap into the corner (snaps to 0/0, the preview follows), resizes the buildings bar and docks the minimap again.
- A screenshot check of the Lab.

## Notes for the next agent
- The game applies `free` only from art/ui/ui-config.json, which comes from the design taken over with „převzít UI“ (Mechaniky).
- Elements inside transformed ancestors would be positioned relative to that ancestor. None of the current regions has one.

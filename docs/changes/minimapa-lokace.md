# Squares for the neighbouring maps round the minimap (owner point 82)

## What and why
Owner, 19 Nov 2026: small squares around the minimap with "?" or an icon of an explored location; after Castle level 3 and with Barracks they open the party menu; each only a few millimetres wide; while the party is on its way, show the remaining march time to that map.

## Files and systems
- `src/ui/Minimap.js` — `minimapZoneMarks(scene)` (label, title, hours, enabled, screen direction per zone); eight `.minimap-zone` buttons; `updateZones()` refreshes them with the overlay (only when something changed). A click sets `worldPanel.selected` (when no party is out) and opens the World window. The root's pointerdown ignores the squares.
- `src/style.css` — `.minimap-zone` (18 px squares placed by `--zx/--zy` just outside the diamond's tips and edge middles; gold while marching, green when the party is there).
- `src/i18n/en.js`, `cs.js` — `minimap.zoneHours`.

## Implementation decisions
- The label is the hours left (e.g. "6h") while the party is away or returning, "…" while it walks to the edge, else the found icon or "?".
- Locked squares stay visible (the "?" tells there is something to find) but are disabled; the tooltip says why.

## Save/Load impact
None.

## Testing
`tests/minimap-caravans.test.js`: labels, hours, directions, lock. Browser: squares round the minimap, "7h" on the north square, a click opens the World window with the zone picked.

## Notes for the next agent
Icons are the scouting type emoji (`SCOUTING.types`); approved icons can replace them later.

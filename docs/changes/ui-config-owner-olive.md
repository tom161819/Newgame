# UI: the owner's olive design for the game

## What and why

The owner saved a design in the UI Lab and marked it for the game (Studio `ui/olive-current`, `forGame: true`). It
keeps the current olive colours and changes the following:
- **Headings:** Cinzel, in small capitals.
- **Frames:** iron rivets, a 4 px frame line and a 19 px corner radius.
- **Settings:** the rows are in a new order.
- **Employment:** Kingdom policy comes first, and the two help texts swap places.
- **Resource bar details:** the economy overview comes first.

The layout is unchanged.

## Files and systems

- `art/ui/ui-config.json` holds the design, normalised with `normalizeUiConfig` (no problems reported).

## Implementation decisions

- The game does not read this file yet. The one-time wiring is plan task `m-ui-lab-do-hry`. Until then the game looks
  as before.
- **For the wiring step:** the "looks the same as before" check uses `art/ui/presets/olive.json`. `ui-config.json` is
  now the owner's design.

## Save/Load impact

None. The design is a static file, not save data.

## Testing

- `normalizeUiConfig` returns the input unchanged.
- The UI Lab rendered with this config: HUD, settings and employment windows checked.

## Notes for the next agent

- `tests/ui-lab-config.test.js` now checks that `ui-config.json` is valid and already normalised. It no longer requires
  the file to equal the base look. The olive preset is still checked against `BASE_CONFIG`.
- **Stale snapshots:** the Lab's snapshots show v0.13. New windows, such as trade, appear in the Lab only after
  `npm run ui:capture` (Grafika).

## Snapshots refreshed at 0.22.0

- `npm run ui:capture` was run again at 0.22.0. It now captures 13 windows, adding **Marketplace (trade)**: a
  Marketplace placed whole, then `marketplacePanel.open`. Fixtures take `type>panelName`; the default panel is
  `workplacePanel`.
- The Studio smoke test now expects the Lab to open on the style in `ui-config.json`. Before, it expected `olive`.

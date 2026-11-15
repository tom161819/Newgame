# Report a problem and anonymous statistics (0.138.3)

## What and why
Owner 15 Nov: he wants to know how many unique players played, how long and how far (day), without IP addresses, and a "Report a problem" button in the main menu and the game menu. The claude.ai copy cannot reach outside services and its database needs signed-in players, so both work in the GitHub Pages build only.

## Files and systems
- `src/data/telemetry.js`: `TELEMETRY` (hosts, GoatCounter code, milestones, Web3Forms endpoint and access key, limits), `telemetryHost`.
- `src/systems/Telemetry.js`: page view per visit (unique players), events `/game/new|load`, `/day/<n>` once per game, `/time/<n>min` of unpaused play; opt-out in localStorage `mk.telemetry`.
- `src/ui/ReportDialog.js`: dialog, `reportPayload`, `recentReports` (5 an hour); statistics opt-out checkbox.
- `index.html`: buttons `[data-report-open]` in the main menu links and the pause menu, `#report-dialog`. `src/style.css`, i18n cs/en `report.*`, `PanelDismiss` list.
- `src/ui/GameApplication.js`: creates both, ticks the statistics once a second.

## Implementation decisions
- GoatCounter: no cookies, does not store IP addresses; unique players = its visitors of `/play/<version>`.
- Web3Forms access key is public by design: it can only mail the owner.
- The buttons stay hidden off the GitHub Pages host.
- Statistics stay off until `TELEMETRY.goatcounter` is set (owner's GoatCounter code).

## Save/Load impact
None.

## Testing
tests/telemetry.test.js (host and key gates, opt-out, milestones once per game, paused time not counted, report payload and hourly limit). Browser: dialog opens from the game menu, buttons hidden on localhost.

## Notes for the next agent
Set `goatcounter` in src/data/telemetry.js when the owner sends his code.

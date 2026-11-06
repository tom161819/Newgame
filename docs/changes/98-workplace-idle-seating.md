# 98 – Workplace idle seating

## What and why
Idle employees walk to distinct seats outside their own completed workplace, sit without oscillation and stand when real work or a higher-priority command arrives. A basic replaceable porch and derived seated pose make this functional before the final porch art114 is approved.

## Files and systems
WorkerSystem owns WorkplaceSeating, using existing WorkerAI, movement/navigation and TaskReservationSystem. WorkplacePorchRenderer draws cached placeholder boards/benches, HumanView applies a temporary approved-sprite pose and UnitPanel shows rest separately from the original input/storage diagnosis.

## Implementation decisions
Seats keep entrances, paved roads, buildings, resources and vehicles clear, share idle-anchor ownership with existing gathering and have bounded planning/retries. Cargo, work tasks, manual commands, combat, departing residents, Farmer tending and active Stablehand jobs retain priority. The existing Waiting state and shortages stay unchanged; three old release-work assertions now exclude the legitimate seat/idle leases while retaining every resource/production and stock assertion.

## Save/Load impact
SAVE_VERSION remains37: anchors, leases, furniture and pose are derived, not saved. Existing paths/work states and normal current-schema validation stay authoritative; Load safely reacquires seats without ghost owners or new need values.

## Testing
767 full tests, ten focused seating tests,69 production/forestry/mining/smelting/workplace regressions, version policy against workshop0.9.0, changelog validation and production build passed. Native real assignment and stable pose, preserved input diagnosis, actual Hauler input and production preemption, Hold/Resume, current Load, desktop/phone/Fog and demolition passed; screenshots were visually inspected after centering the resized phone camera. The50-workplace/100-NPC native sample measured median66.6ms and p9583.4ms during concurrent browser validation (an earlier isolated run was33.3/50ms); final parent integration is checked before merge.

## Notes for the next agent
Explicit stack185→194→196/#118→98, with actual Pages before every successor merge; expected patch0.9.1 at unchanged schema37. Preserve all meaningful job messages and never draw during scene destruction; final approved art114 must replace the renderer without rewriting the seat policy. No direct Needs/Rest/Happiness writes, extra AI scheduler or final art assets are introduced.

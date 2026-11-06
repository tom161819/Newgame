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
Nine focused seating tests and69 production/forestry/mining/smelting/workplace regressions passed, and a764-test full run passed before the final departing-resident guard. Coverage includes real arrival/stability, input preemption, manual commands, blocked/paved seats, death/reuse, Farmer tending and real Winter calendar, current Load and50 workplaces/100 employees with bounded planning. Native real assignment/pose, transport/production, phone/Fog/Load/demolition and a100-NPC frame benchmark are running; final source integration and release checks remain required.

## Notes for the next agent
Explicit stack185→194→196/#118→98, with actual Pages before every successor merge; expected patch0.9.1 at unchanged schema37. Preserve all meaningful job messages and never draw during scene destruction; final approved art114 must replace the renderer without rewriting the seat policy. No direct Needs/Rest/Happiness writes, extra AI scheduler or final art assets are introduced.

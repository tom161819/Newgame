# 118 – Optional Builder workshop base

## What and why
Builders can share a reachable completed workshop as an optional base, with normal construction speed there and half speed without one. Their movement, carrying, King/Farmer work and demolition stay unchanged.

## Files and systems
The builder_workshop definition reuses the existing procedural workplace renderer and an existing placeholder asset URL. ConstructionSystem owns derived BuilderWorkshopBases and applies the factor only in workSpeed; central idleHomes and existing shared idle reservations supply base waiting without another scheduler.

## Implementation decisions
A Builder chooses a reachable completed base and keeps it while accessible; any number of global Builders can share it, without employee/Hauler slots or stacking bonuses. Unfinished, unreachable and dismantling bases do not qualify; ordinary jobs and manual commands preempt idle paths. Initial values are2x2,6Stone8Wood,25 seconds base work and8 completion XP, audited against existing Hut/Quarry/Wheelwright values and recorded in91 for balancing.

## Save/Load impact
SAVE_VERSION37 admits the new building type, rejecting other schemas before mutation without migrations. Base associations and idle reservations are derived and rebuilt, while the actual building, construction work and material ownership use existing saved models.

## Testing
772 full tests and16 focused workshop/Mill/registry checks passed after integrating main ea34fac, including Claude's approved Mill rotor and Studio/Path Lab changes. Version0.8.1→0.9.0, changelog and production build passed. Renewed native workshop physical supply/construction, measured half/normal rate, current Load, idle arrival/preemption, phone UI and demolition passed together with Mill sails, Needs and C05 commands. No approved workshop art is installed and no test timeout is increased.

## Notes for the next agent
Explicit stack183→185→194/#94→118 with actual Pages before each successor merge; next release is0.9.0/schema37. Final art stays with Claude119 and requires the user's approval; this issue explicitly permits the marked procedural fallback, which changes no approved sprite. Registry counts now include the workshop; the unrelated Castle-income test supplies a completed workshop to keep its normal-speed premise, while the no-base timing test explicitly verifies double work time without increasing any timeout.

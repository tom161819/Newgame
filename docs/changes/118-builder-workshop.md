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
754 unit tests,30 focused workshop/construction/registry checks, changelog validation and production build passed before the final temporary-appearance wording. Coverage includes exact half/normal work, shared/unreachable/unfinished bases, completed physical construction, distinct idle anchors, job preemption, manual commands and current Load. Native actual material supply/workshop construction, measured0.5×/1× rates, partial Load, completed base arrival, immediate job preemption, phone rate UI, real demolition/fallback and completed Load passed; the screenshot was visually inspected. Final0.9.0 release build checks remain required.

## Notes for the next agent
Explicit stack183→185→194/#94→118 with actual Pages before each successor merge; next release is0.9.0/schema37. Final art stays with Claude119 and requires the user's approval; this issue explicitly permits the marked procedural fallback, which changes no approved sprite. Registry counts now include the workshop; the unrelated Castle-income test supplies a completed workshop to keep its normal-speed premise, while the no-base timing test explicitly verifies double work time without increasing any timeout.

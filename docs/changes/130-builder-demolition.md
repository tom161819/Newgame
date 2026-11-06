# 130 – Builder demolition

## What and why
Finished buildings can be dismantled after a separate confirmation, with real Builder work and half the material cost recovered on the ground. This completes #130 after the separate empty Starter Stockpile action in #128.

## Files and systems
DemolitionSystem and DemolitionUI share ConstructionSystem, BuilderAI, TaskReservationSystem and existing detail panels. Atomic buildingRemoval coordinates storage, production, farming, transport, military and Stables lifecycles.

## Implementation decisions
Demolition uses the existing work slots, finite contribution budget and Construction skill. Stored goods and committed production/site inputs remain physical; assigned horses retain real rider/order ownership when their Stables disappears. Castle and unfinished construction retain their protections and existing actions.

## Save/Load impact
SAVE_VERSION34 stores and validates separate demolition progress, assigned Builders and refund budgets. Other schemas are rejected before mutation, without migration, and current in-progress/completed Load is tested.

## Testing
714 unit tests, changelog validation, production build and 24 focused lifecycle checks passed before version-tooling integration. Native demolition plus stockpile, farm links, right-click and current Save/Load passed, including partial work, cancellation, exact refund conservation and actual Hauler recovery. New main184 display/tooling integration requires renewed checks before final merge.

## Notes for the next agent
M3 is released and main c7fad22 includes Needs schema33 and event feed0.5.1; this schema34 release is0.6.0. Main integration preserves Needs, release tagging, mobile minimap and corner-stack styles; renewed full checks are required. Preserve site-owned drop identity and do not weaken current-state validation or remove the empty-only Starter policy.

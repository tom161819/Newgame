# Issue123: independent Granary capacity groups

The initial pure classifier is now integrated with the existing FoodStorageSystem. The Granary registry decides accepted goods; their edible metadata assigns Wheat/Flour to raw and Bread/Meat/Apple to finished food. Each group is limited independently to200. Other stores and buffers keep their previous shared capacity.

`room(locationId,resource)` reports free capacity after stored stock AND incoming reservations for that resource group. All current resource-bearing transport/production/king/military callers pass the resource. Without a resource, `room` reports aggregate free space for display only; reservations always use the resource-aware check. `put` consumes its existing booking and checks stored group capacity, so it does not count its own incoming quantity twice. New unbooked deposits cannot steal reserved space.

FoodStateValidation applies the same group invariant to stock plus incoming reservations. Capacity metadata remains200 (the per-group limit), and legitimate200raw+200food has no legacy overflow. Save schema30 rejects older schemas; there is no migration. Warehouse/fallback/buffer checks are unchanged.

StoragePanel shows separate Raw Materials and Food used/capacity, incoming and free counters. The existing stock/reservation maps remain authoritative; the grouping helpers own no inventory and perform no transfers.

Validation:655/655 tests including three classifier and six integration cases. Cases cover independent limits,201st unit, mixed resources, partial put/release, two-Hauler capacity booking, exact loaded Save/Load and conservation, production output capacity and unchanged other store limits. Updated three old food-production fixtures to fill the relevant group while retaining their production/refund/conservation checks. Changelog:validate/build:pages PASS. Actual browser checks both counters, pending reservations across real Load, two-Hauler booking bounds, exact physical food delivery and rejection of extra units, then restores the original world. The farmer/browser regression also passes.

Actual predecessor PR142 is merged2329087; await its Pages42157299626 success before merging this feature. Current main/schema29 is integrated. Exact-head CI and a new successful Pages deployment are required before Issue123 is done.

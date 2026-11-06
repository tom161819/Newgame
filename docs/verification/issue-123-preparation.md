# Issue123 preparation (not yet runtime-integrated)

The registry-backed classifier and pure stock counter separate accepted Granary raw inputs (Wheat/Flour) from edible finished food (Meat/Bread/Apple). Metadata of future accepted products determines their group. Limits are independent200/200; the counter exposes overfull groups instead of clipping them or borrowing capacity. Three focused tests pass, including invalid/unsupported quantities and registry extension.

Remaining integration: FoodStorageSystem.room must take the transported resource into account, and findDestination/reserve/deposit/put must enforce the same group. All resource-bearing logistics/production callers must pass that resource. Incoming reservations share the matching group; their own put consumes bookings atomically. StoragePanel must show both stored and incoming counters. FoodStateValidation and current-schema Save/Load must enforce both independently. Warehouse/fallback/buffers stay unchanged. No second stock/reservation owner.

No runtime storage behavior or schema is changed by this preparation. Recheck current S12/main and coordination before touching shared logistics/validation. Do not merge or claim Issue123 complete with only this classifier.

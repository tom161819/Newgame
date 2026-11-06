# 132 – Food menu and Hunting Lodge prerequisite

## What and why
Food & Farming starts with Granary and Farmhouse. Hunting Lodge remains visible and locked until a Granary is physically complete, using the existing translated requirement.

## Files and systems
buildingCategories gives only the Food tab its two leading entries, preserving the registry and all other category orders. The Lodge definition uses the existing requiresCompletedBuildings data and BuildingUnlockManager; no second unlock system is added.

## Implementation decisions
Blueprints and delivered materials do not unlock the Lodge. Completion, world changes and current Load refresh the existing UI; removing the last Granary relocks only new placement, preserving already existing Lodges. Worker-only fixtures explicitly model pre-existing Lodges without a Granary, keeping their original cargo/combat assertions; physical placement and unlocks are tested separately.

## Save/Load impact
SAVE_VERSION stays37; no persistent field or validation migration changes. Current saves derive availability from their actual completed buildings, while existing Lodges remain valid without the new prerequisite.

## Testing
25 focused category/unlock/workplace tests passed, including physical Granary construction, rejected placement before payment, current Load, loss/restoration of prerequisite and Czech/English requirement text. Full tests, production/version/changelog checks and actual browser completion/Load/demolition coverage are pending.

## Notes for the next agent
Explicit stack194→196→198→this task, with successful actual Pages before each successor merge; expected patch0.9.2. Final porch art114 and workshop art119 remain outside this task.

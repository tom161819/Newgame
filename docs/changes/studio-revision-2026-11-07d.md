# Studio revision 7 Nov 2026 (fourth): bakery, house and builder's yard approved

## What and why

Grafika chat, "spustit revizi". The owner decided the revised designs and a few older ones. No revision requests this
time. No game change.

## Files and systems

- `art/approvals.json`: 21 variant decisions and 1 preferred pick taken over (`npm run studio:sync`). Nothing ignored.

## Implementation decisions

- **Approved and preferred (chosen for the game):**
  - bakery-house-yard-oven v3 (bakery **3×2**);
  - house-timber v3;
  - builders-workshop-material-yard v4.
- **Also approved:**
  - merchant-caravan-full;
  - ruined-tower-winter and ruined-wall-blender;
  - torch-post-iron;
  - military-directions-4.
- **Rejected:**
  - bakery-house-stall, house-stone, house-wood;
  - builders-workshop open-shed, house-awning and blender;
  - equipment-bow-plain, merchant-caravan-unloading, soldier-female;
  - military-directions 0–3, set aside by "Choose for the game" on facing 4. This is only a reference sheet, so nothing
    is lost.

## Save/Load impact

None.

## Testing

- `npm test` passes.
- `studio:sync`: 22 decisions, nothing ignored.

## Notes for the next agent

- **Mechaniky (`m-studio-vybrane-do-hry`):**
  - house, bakery and builder's workshop now have their new versions approved;
  - the bakery needs footprint 3×2;
  - merchant-caravan-unloading was rejected, so a caravan that is unloading has no sprite of its own (use full or
    empty).

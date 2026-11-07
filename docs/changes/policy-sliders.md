# Kingdom Policy: sliders with level icons (0.36.0)

## What and why
Plan task m-politika-soupatka (owner request, 7 Nov; #103). The tax rate and food rations become sliders with an icon that changes with the level. The same rations slider is also in the Granary window. The game has no other "pantry" building, so the Granary is it.

## Files and systems
- `src/ui/PolicySliders.js`:
  - `POLICY_LEVELS` comes from `TAX_RATES` / `RATIONS` in `src/data/policy.js`, not hard-coded.
  - `policyIcon(kind, level)` draws provisional 40×40 SVG icons. Tax: an empty purse, a few coins, a handful, a heap, an overflowing chest. Rations: a half-empty bowl, a full bowl, a basket with bread, an apple and a fish.
  - `createPolicySlider(scene, kind, {id})` builds a range input with an icon and the level name. Input, wheel and arrow keys (Home/End too) move it one level at a time. It calls `policy.set(kind, level)` (pending from tomorrow, Policy v2 P1), shows the pending level and re-renders on every policy change.
- `index.html` + `src/ui/PolicyPanel.js` – the two selects become slots with sliders. The inputs keep the ids `#policy-tax` / `#policy-rations`, and the effect lines, pending line and Cancel stay.
- `src/ui/StoragePanel.js` – a Granary (a store with food groups) shows the rations slider `#granary-rations`. It is the same kingdom policy, so a change in one place shows at once in the other.
- `src/style.css` – the slider grid (icon left; name and level on top; slider below).
- Tests: `tests/policy-sliders.test.js` (levels from data, a distinct icon per level, more coins for more gold). Smoke `scripts/policy-smoke.mjs`:
  - moves the sliders with the arrow keys (high, generous; very high shows the chest);
  - sets Small rations in a Granary's window and sees the Castle slider follow;
  - still checks pending, Cancel, the next-morning effect, the 60 food cap and the Feast.

## Implementation decisions
- The game captures the arrow keys for the camera, so the slider handles them itself and stops them from reaching the camera while it has focus.
- Icons are provisional SVG. The Studio sets from Grafika (g-ikony-dane-jidlo, store n54: tax-icons, ration-icons) await the owner's review. After approval, replace `policyIcon` with the exported images (one per level, the same level ids).

## Save/Load impact
None.

## Testing
`npm test`, smoke `--policy` (screenshot checked).

## Notes for the next agent
- The left cards task (m-leve-karty-politika-zamestnani) should reuse `createPolicySlider` rather than copy the markup.

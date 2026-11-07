# Studio: tax and ration icons for the Kingdom Policy sliders

## What and why

Plan `g-ikony-dane-jidlo` (#103), for the sliders in `m-politika-soupatka`. Each slider needs a row of icons in which
the amount clearly grows:

- **Taxes (5 levels):** None = an empty purse, Low = 2–3 coins, Normal = a handful, High = a heap of gold, Very high =
  a chest overflowing with gold.
- **Rations (3 levels):** Small = a half-empty bowl or a crust of bread, Normal = a full bowl, Generous = a plate or
  basket with several kinds of food.

There are two looks of each set for the owner to choose from. Nothing in the game changes until one is approved.

## Files and systems

- **New generator `studio/src/generators/icon.js`** (kind `icon`, v1).
  - Each icon is a list of vector shapes on a 40 × 40 grid, the size of the game's resource icons, which show at 22 px
    in the top bar. The same shapes produce the SVG and the canvas drawing.
  - One scale per set (`fitSet`): the largest icon fills the box and all icons share a baseline, so the growth from
    level to level is not evened out.
  - The dark outline keeps the icons readable on light and dark UI styles.
- **New Studio category `ui` (UI icons):**
  - `art/assets/ui/tax-icons/asset.json`: looks **heaps** (Purse, coins and heaps of gold) and **stacks** (Purse and
    coin stacks).
  - `art/assets/ui/ration-icons/asset.json`: looks **bowls** (Bowls and a full plate) and **basket** (Bread crust, bowl
    and basket).
- **Palette (`art/style-guide.json`):** 10 new colours for the icons: `gold`, `gold_light`, `gold_dark`, `outline`,
  `leather_light`, `bread`, `bread_crust`, `porridge`, `meat`, `apple`. The style guide's version is unchanged, so
  existing approvals stay valid.
- **`studio/src/main.js`:**
  - **Each card** shows its set on the panels of the four UI Lab styles at 22 px and at 1×, plus a 2× row.
  - **Icon assets** have no Scene tab.
  - **Export** writes every level on its own.
- **`studio/src/lib/specs.js`:** the `ui` category, validation for kind `icon`, and `spriteIconBase`.
- **`scripts/studio-export.mjs`:** writes the icon files.
- **Exported to `art/sprites/{tax-icons,ration-icons}/`.** For each look, every level is saved as
  `<variant>.v1.<level>.svg`, `.png` (40 × 40) and `@2x.png` (80 × 80). Each look also gets the preview strip
  `<variant>.v1.png` and `.json`; the `.json` lists `icons: [{level, name, size, svg, png, png2x}]`.
- **Tests:**
  - `tests/asset-studio-icons.test.js` (new):
    - the sets and their looks;
    - only palette colours are used, and every icon fits the box;
    - the gold or food area grows strictly with the level, and None has no gold;
    - the exports are present and current.
  - `tests/asset-studio.test.js`: skips icon recipes in the 3D model check.
  - `scripts/studio-smoke.mjs`: new icon-set section.

## Implementation decisions

- **Hand-drawn vector shapes instead of the 3D renderer.** Icons need to stay crisp at 22 px, and an SVG fits the game's
  existing resource icons (`public/assets/resources/*/*.svg`).
- **No change in `src/` and no copy to `public/`.** After approval, Mechaniky takes over the chosen look from
  `art/sprites/...` into the policy UI (`m-politika-soupatka`).

## Save/Load impact

None.

## Testing

- `npm test`: all pass.
- `studio:smoke`: all sections pass, including the new icon section and the phone check.
- Screenshots of all four looks on the four UI styles checked at 22 px, 1× and 2×.

## Notes for the next agent

- For a new icon set, add a look in `LOOKS` in `icon.js` and a variant in its `asset.json`, then run
  `npm run studio:export -- <asset>`. Changing a drawing also needs a new variant `version`, otherwise the approval
  hash stays the same.

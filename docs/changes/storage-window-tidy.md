# Storage window: tidier table with icons, no "Collect with King" (0.35.0)

## What and why
Plan task m-okno-sklad (owner request, 7 Nov; after m-ui-lab-do-hry). The Storage window had a line of text and a "Collect with King" button for every resource a store allows, empty ones included.

## Files and systems
- `src/ui/StoragePanel.js`:
  - Every stock location gets a fill bar ("42 / 200", `<meter>`). The existing "Stored … Free … Reserved incoming" line stays in small text below it. The Granary shows its total over both groups, then its two group lines.
  - `table(l)` builds one table per store. Group headings (`STORAGE_GROUPS`: materials, food, equipment, from `FOOD_RESOURCE_IDS` and `equipmentResources`), then rows of icon, name, amount and reserved.
  - Empty goods (0 stored, 0 reserved) are hidden, with a note "N empty kinds of goods not shown".
  - Icons come from the asset previews the resource bar uses (`assets.previewURL`). A resource without a texture gets a temporary disc with its first letter (`data-missing-icon`).
- The per-resource "Collect with King" buttons are removed. They were the only control for `KingLogistics.startPickup` (the King fetching goods from a store), so that function now has no control in the UI; the code stays for a future control. "Deposit King Cargo" and "Set Down King Cargo" are unchanged.
- `src/style.css` – `.storage-fill`, `.storage-table` (compact rows, tabular digits, small uppercase group headings, grey reserved).
- i18n en/cs: `storage.fill`, `storage.group.*`, `storage.reservedShort`, `storage.empty`, `storage.hiddenEmpty`.
- Smoke `scripts/storage-window-smoke.mjs` (`--storage-window`, part of `--full`). It covers the Starter Stockpile, a Warehouse and a Granary: no collect buttons, an icon on every row, amounts, grey reserved, groups, empty goods hidden and a fill bar, with screenshots in all five styles. `--i18n` passes too (it reads the "Uloženo: x / y" line).

## Implementation decisions
- Empty goods are hidden rather than greyed, to make the list short, as the owner allowed.
- The same table serves every store that uses this panel (Starter Stockpile, Warehouse, Granary, Armory), because they share the code.
- Icons: every resource that a store can hold today has a texture, so no temporary icon appeared in the smoke and none has to be ordered from Grafika.

## Save/Load impact
None.

## Testing
`npm test`, smokes `--storage-window --i18n`.

## Notes for the next agent
- The King's pickup from a store (`kingLogistics.startPickup`) has no button now; if the owner misses it, add one control (for example a single "Take with King…" with a resource choice) instead of a button per row.

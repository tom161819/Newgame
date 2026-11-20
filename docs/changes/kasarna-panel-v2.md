# Barracks window v2: class pictures, "Recruit automatically", compact soldier list

## What and why
Owner 19 Nov 2026 (screenshots of the Barracks window): the training cards should show the same pictures as the selection bar for each class and the same weapon / armour icons; "Automatically employ" should read "Recruit automatically" and stand out (the most important control of the window); the housed soldiers should fold away and be a compact list with name, class, level and current state (patrol, expedition, guard…).

## What changed
- **Training cards**: each card starts with the class's standing picture (cut from its walk sheet, same as the selection bar – `lookPicture`) and the weapon / armour icons (`gearOf` of the class kit, item name on hover). Classes without a sheet show their emoji.
- **Slider**: "Automaticky verbovat: N z M" / "Recruit automatically", in a gold framed box with larger text and slider.
- **Housed soldiers**: a section "Ubytovaní vojáci · N / M", closed by default; one line per soldier – name, class, lvl, state icon + label (👣 Hlídka, 🛡️ Stráž, 🏰 Hradby, 🐺 Lov vlka, 🧭 Na výpravě; 💤 when asleep), the current activity as hover text, ✕ to remove. No "free place" lines; "Workers N/M" and "Delivered" are hidden for the Barracks.
- `ensureLook` moved from `HumanView` to `src/game/lookLoader.js` (no Phaser), so UI code can load a class look; `lookPicture`, `unitTypePicture`, `KIND_ICONS`, `ORDER_ICONS` live in `src/ui/unitPictures.js` (the selection bar and the World window use them too).

## Files and systems
`src/ui/militaryPanel.js`, `src/ui/WorkplacePanel.js`, `src/ui/unitPictures.js` (new), `src/game/lookLoader.js` (new), `src/game/HumanView.js`, `src/ui/UnitSelection.js`, `src/ui/WorldPanel.js`, `src/i18n/cs.js`, `src/i18n/en.js`, `src/style.css`; test `tests/barracks-panel-v2.test.js`.

## Implementation decisions
- The roster replaces the generic worker rows only for the Barracks; other workplaces are unchanged.
- The Recruit / unit lists with Train and Discharge buttons under the cards stay (they are the training controls).
- Catapult and Military Wagon show their crew's picture, as the selection bar does.

## Save/Load impact
None – UI only. SAVE_VERSION unchanged.

## Testing
- `tests/barracks-panel-v2.test.js`: soldier states (away, wolf hunt, walls, patrol, asleep), slider text, fallback icons.
- Headless Chrome (cs), a finished Barracks with 3 soldiers: 10 cards all with pictures and gear icons, gold slider "Automaticky verbovat: 4 z 12", roster closed by default and 3 compact lines when opened; no page errors.
- `npm test`.

## Notes for the next agent
- Browser smoke: yes (done by hand).

# Castle: Upgrade in the building detail; level 2 fills 4 × 4

## What and why
Owner, 15 Nov 2026: the window that opens on a click on the Castle was right, the Upgrade button belongs there. And the level 2 Castle looked smaller than level 1 although both are 4 × 4.

## Files and systems
- `src/ui/castleCard.js` (new): `renderCastleUpgrade`, `clickCastleUpgrade`; used by `src/ui/DemolitionUI.js` (`#building-detail-upgrade`) and `src/ui/EmploymentPanel.js`.
- `src/game/GameScene.js`: a click on any Castle opens the detail again (0.129.1 had closed it for levelled Castles).
- `art/sprites/castle/castle-l2-*.v3.*`, `src/data/castle.js` (`CASTLE_ART.l2`), `art/approvals.json`.

## Implementation decisions
- Level 2 is scaled to fill 4 × 4 (0.4183 instead of 0.3228). Its hall is therefore about 1.3 times bigger than in level 1; the render's own ground is smaller than level 1's, so both cannot match.
- Levels 3 and 4 were already 5 × 5 and 6 × 6.

## Save/Load impact
None.

## Testing
- Browser (headless Chrome): click on a level 1 Castle opens the detail with the button; with Wood in store the click upgrades to level 2 and the window shows level 2. Full suite.

## Notes for the next agent
- Level definitions still carry the old keep's description (hidden in the detail of a levelled Castle).

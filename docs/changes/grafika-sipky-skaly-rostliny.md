# Grafika: medieval tutorial pointers, rocks and deposits, shrubs/orchard/field (drafts for review)

## What and why
Owner, 8 Nov 2026: work through all Grafika tasks. Plan items g-tutorial-sipky (74), g-loziska-skaly (77; owner comment: build on the previous reworks, more detail, fit the game), g-sad-pole-kere (84, 85). All are drafts in the Studio for the owner to pick; wiring into game mechanics is a later Mechaniky task.

## Files and systems
- Tutorial pointers: art/ui/pointers/{forged,manicula,pennant,parchment}.svg, inlined in art/ui/ui-theme.css under html[data-ui-pointer="…"]; animation (tutorial-nudge) in src/style.css; POINTERS in art/ui/uiConfig.js gains the four. Pick in UI Lab → Pointer (Window → Tutorial shows them). Default stays the golden arrow.
- Rocks: studio/src/generators/outcrop.js (new, id outcrop): stone deposits (granite, limestone, slate, mossy), iron deposits (rust veins, red-brown, dark ore with glints), obstacles (boulder, boulders, outcrop, ridge, rock with bushes); mining stages 0–3; winter snow; gravel/soil apron instead of a square. Assets art/assets/nature/{stone,iron}-deposit-{small,medium,large}, rock-obstacles-{small,medium}, rock-ridge (4×2).
- Plants: studio/src/generators/vegetation.js (new, id vegetation): shrubs (hazel, rosehip, juniper, bramble, heather) × 3 sizes and 4 seasons; thickets 2×1, 2×2, 3×2 as one growth; orchard apple-tree tile by phase (young, blossom, green, fruit, harvested, winter); wheat field tile by phase (ploughed, sown, sprouts, green, ripe ×2 wind frames, stubble with sheaves, winter). Assets art/assets/nature/{shrubs,shrubs-seasons,thicket-*,orchard-tree,wheat-field-tile}.
- art/style-guide.json: palette + materials granite*, limestone*, slate*, ore_red*, ore_dark, ore_rust, lichen, gravel, apple.
- art/sprites/<asset>/*.png exported (npm run studio:export).
- studio/vite.config.js: assetsInlineLimit 16 KB (an artifact holds at most 512 files; the Studio was at 458 and these drafts add ~60 sprites; now 225 files).

## Implementation decisions
- Orchard and field are one tile per sprite, matching CropPlotView (ground + per-tile plant).
- Deposits have 3 footprints; larger ones need generator/mining changes (Mechaniky after the owner picks).

## Save/Load impact
None.

## Testing
npm test, asset studio tests (all variants valid and inside footprints, sprites match), studio smoke.

## Notes for the next agent
- Owner picks in the Studio (Nature: stone/iron deposits, rock obstacles, ridge, shrubs, thickets, orchard tree, wheat field tile; UI Lab: Pointer).

# Changelog

All notable released changes to Medieval Kingdom are documented here, following Keep a Changelog and Semantic Versioning.
Ongoing development belongs in Unreleased and is not shown in the player-facing history.

## [Unreleased]

### Added
- Settings → Developer → Show FPS (or F3) shows a small overlay with frames per second, the slowest frame and the number of stutters over 50 ms in the last 5 seconds, plus the renderer and zoom. The choice is kept in this browser only, never in a save, and the overlay costs nothing while it is off.
- Stables (Logistics & Trade, 5×5, 15 Wood + 10 Stone) with a paddock for 4 tamed horses and two Stablehands, who use the Hunting skill. While the Stables have room, a Stablehand finds a wild horse in sight on his own. He reserves it so no one else takes it, tames it in 20 seconds (faster with skill) and leads it into the paddock. The King can tame a wild horse by riding it for 25 seconds; dismounting beside Stables with room leaves it there. Horses in the Stables can no longer be ridden off. A new kingdom has six wild horses. Saves keep tamed horses and taming in progress.
- The Knight can now be trained. He needs Sword, Armor and a free tamed horse in the Stables, which is reserved for the training and becomes his mount; a mounted Knight moves 50 % faster. Cancelling, discharge or death returns the horse to the Stables, or sets it free if they are gone.
- Wheelwright's Workshop (Industry, 3×3, 12 Stone + 15 Wood) with two Wheelwrights, who use the Crafting skill. From 10 Wood and 2 Iron Bars brought in by Haulers they build a Wheelbarrow in 30 seconds of work. The Wheelbarrow is a real object left beside the workshop.
  - An idle Hauler in Auto or Wheelbarrow mode walks to a free Wheelbarrow and takes it, then carries five times as much (200 load units, so 20 Stone per trip).
  - The Hauler's panel has a Transport setting: Auto, By hand or Wheelbarrow. By hand parks the Wheelbarrow where he stands.
  - Death or a new job leaves the Wheelbarrow on the ground for another Hauler, and one Wheelbarrow never has two drivers.
  - Saves keep every Wheelbarrow.
- Workplace panels can disable new employment for one building or for its entire type, including future buildings. Both automatic and manual assignments respect the bans. Existing staff keep their jobs; type bans take priority and local choices remain when a type is re-enabled. These rules are saved with the game.
- Finishing a Mill without a Wheat Field or a Bakery without a Mill shows one informational notice about the missing long-term supply. Existing supplies still work; dismiss the advice or finish the missing link to clear it. Actual production blockers retain priority.
- Stone Pavement (Buildings → Infrastructure), a permanent cobbled surface. Units on it move 25 % faster; this replaces the trodden-path bonus and never adds to it. Routes now prefer a faster paved way.
  - Build tools: Single, Line (default, also diagonal) and Area for courtyards, with a green/red/grey preview, the count of new tiles and the cost. An order costs 1 Stone for every 2 new tiles; already paved or ordered tiles are free.
  - Haulers bring the Stone and Builders (or the King) lay it tile by tile. Blueprints never block the way.
  - Remove clears finished pavement without a refund; cancelling a blueprint follows the usual refund rules.
  - Fog of War shows the last known pavement. Saves keep finished and unfinished pavement.
- Military training in the Barracks panel. Each Soldier working there can be trained as one of four unit types:
  - Soldier: Sword, 5 Gold, 20 s.
  - Swordsman: Sword, 12 Gold, 45 s, Combat 3+. Tougher and better armoured.
  - Archer: Bow, 8 Gold, 30 s. Shoots from 6 tiles, but only with a clear line past trees, walls and rock, and never at unseen game.
  - Knight: Sword and Armor. Locked until Stables with a tamed Horse exist.

  Haulers carry the exact items from an Armory into the Barracks; training starts only when they have arrived. The panel shows the kits in stock and why a type is blocked. Cancelling refunds the Gold. Discharge or death drops the gear for Haulers to return. Trained units earn a higher wage and defend residents and the king near their Barracks.
- House (Housing menu, 2×2, 10 Wood and 4 Stone): each completed House raises the resident limit by 5 above the base 20, so migrants keep arriving. Blueprints give no room until they are built; the Residents counter shows the new limit at once.
- Weapon and armour workshops and the Armory, all under Castle & Defense:
  - Bowyer: 8 Wood make a Bow.
  - Swordsmith: 3 Iron Bars and 2 Wood make a Sword.
  - Armorer: 5 Iron Bars and 2 Wood make metal Armor.
  Each workshop has two workers, physically delivered inputs, Auto Production and the new Crafting skill. Haulers carry finished Bows, Swords and Armor to an Armory, which stores up to 40 pieces and nothing else; Warehouses never take them. The buildings use the approved Asset Studio art.
- Select your subjects with a click or drag a box around a group, then right-click to move them to separate nearby positions and hold there. Hold Here and Resume Previous Job preserve professions and physical cargo while releasing work reservations safely. Escape deselects without resuming work. Manual orders are saved with the game. The king keeps his existing controls.
- Notices in the bottom-right corner warn about lasting problems:
  - a supplied construction site with no Builder;
  - a Mill, Bakery or Smelter that is switched on and staffed but lacks an input.
  Each notice names the real cause: no Farmhouse, no Wheat Field, no Farmer working, or stock that no Hauler can bring. A problem shows once it lasts, repeats at most every 30 game seconds while it lasts, and disappears when solved. Paused production, empty buildings and crops still growing raise nothing. Notices can be dismissed or muted by category, and clicking one opens the building.
- Auto Employment: free workplace seats are filled with Unemployed residents automatically. Clicking the Castle opens Employment Priorities beside the map: set every profession from 1 to 5 (5 is filled first) or pick Balanced, Food First or Production First. Hand edits show as Custom. When several seats are free, the best match goes first: a natural talent for the job, then skill level and XP. Nobody who already works is ever moved. Someone you make Unemployed by hand stays that way until you assign them yourself. Switch it on or off in Settings or in the New Game Setup (on by default). Your choices are saved with the game.
- Blueprints, including wall lines, can be placed on ground outside current sight. The preview turns amber and judges only ground the kingdom has seen; hidden obstacles stay hidden. Once someone sees the site, it is checked for real. If an obstacle turns up, the whole order is cancelled with one message, and its materials and reservations are released. Building starts only after the site is confirmed.
- With Fog of War on, the king can be sent anywhere on the map, including ground nobody has seen yet. The click reveals nothing about what lies there. The king plans the way by what the kingdom knows, walks around obstacles as he discovers them, and stops with a message if the way turns out to be blocked.
- Every subject now has its own sight: with Fog of War on, each living subject lights a circle 15 tiles across (75 % of the king's 20) wherever they walk, and newly seen ground is added to the map memory. A subject who leaves, dies or emigrates takes that sight away, so only the remembered, darker map stays.
- Choose Czech or English in the main menu or in Settings; the game remembers the choice. The main menu, New Game Setup, Save/Load with import and autosave, the pause menu, Settings, the changelog, the version archive, the game HUD (day, season, weather, food, sight, health, level, economy, camera and building bar) and the names and descriptions of all buildings, resources, animals, items, professions and skills are translated, including Czech plural forms. In-game panels are translated too: storage, construction, workplaces and production, crops, trees and deposits, the character sheet, equipment, treasure, food economy, the building menu, missing-worker markers, the resource income/expense tooltip, the Population sidebar and the Asset Library. Gameplay messages in the status bar, residents' work messages, construction and placement messages and notifications follow the chosen language too; saved games stay language-neutral. Switching the language during play updates the HUD at once.
- Autosave: the game saves itself into a separate Autosave slot every 5 minutes of active play (1, 2 or 10 minutes, or off, in Settings). Paused games and hidden tabs do not count, a failed autosave keeps the previous one, Settings shows the time of the last autosave, and the Autosave slot loads from Load Game.
- Move saved games between devices without any server: Download Save in the Save/Load menu stores a save as a JSON file, and Import Save File checks it and adds it as a new save (or replaces the same save after you confirm). Damaged files and saves from other alpha versions are refused without changing anything.
- New Game Setup can stock the Starter Stockpile: under Starting Gold choose Starting Stone, Wood, Iron Ore and Bread in steps of 5, up to its 40-unit capacity in total. The goods are placed in the stockpile at the start; Initial Stones still sets only the loose stones on the map. Saved games from earlier versions cannot be loaded and need a new game.
- Idle Haulers now collect loose stone lying within a set radius of the Castle (default 80 tiles) and carry it to storage. Each Hauler has a Collect loose stone ON/OFF switch and a radius field in the unit panel; real transport jobs always come first. Saved games from earlier versions cannot be loaded and need a new game.

### Fixed
- Finished walls no longer vanish after the camera pans away and back: the wall blocks and their parapets reappear exactly as before.
- Seasonal ground changes finish repainting while the game is paused, so resuming a saved season keeps the same terrain picture. Normal gameplay retains its bounded redraw budget.
- The king waits after collecting loose stone and keeps it in his personal cargo. Use Deliver to storage in the top-left HUD to carry it to a reachable store; changing orders keeps the cargo safe, and full stores never consume it.
- Idle Haulers also collect loose stone within their chosen radius of reachable Warehouses, Starter Stockpiles and physical construction sites. They work without a Castle, keep real deliveries first, and carry each stone to storage using the existing reservations.
- Wandering rabbits, deer and wild boars keep one tile away from solid buildings and physical construction sites, including narrow gaps and diagonal corners. Wildlife spawns respect the same margin; animals retreat when a new structure surrounds them. Hunting and the king’s horse keep their existing movement.
- Ground the king has walked away from no longer stays fully lit when several sight changes happen between two redraws (for example while saving or after a pause); it fades back to the remembered map.
- Haulers now actually carry goods: a resident given the Hauler profession immediately serves every Warehouse, Granary and construction site in the kingdom instead of waiting for a workplace, so new Warehouses fill without the king.
- The Castle no longer covers the king when he stands in front of it, and the starting stockpile now appears in front of the Castle instead of behind it.

### Changed
- Carrying now goes by weight: every resource has a load weight (Stone 10, Iron Ore 10, Wood 5, Iron Bar 5, Armor 8, Sword 4, Bow 3, food 1) and a person carries 40 load units. That is 4 Stone, 8 Wood or 40 food per trip; Haulers gain 2 more units every 5 Logistics levels. This applies to the King, Haulers, Builders and workshop carriers alike, and the unit panel shows the capacity in load units.
- Trampled paths look natural:
  - a single track gently meanders and runs on across tile edges without breaks;
  - turns and junctions are rounded, instead of a star of straight spokes and cross-hatching;
  - wherever trampled ground spreads in two directions (2×2 tiles or more), it becomes one connected earthen patch with a soft, irregular grassy edge.
  Narrow tracks join these patches smoothly. Each wear stage keeps its own colour. Snow, Fog of War and map memory work as before, and faint tile-grid lines no longer show on ground or tracks.
- Assign Worker now lists every resident in three groups: Unemployed (gently highlighted), those employed in another profession, and those already in this profession. Each group shows its count and is sorted by the skill the building needs (level, XP, natural talent). Every row shows the resident's portrait, talent, current job and expected wage. Moving someone away from another job asks for a confirming second click, and people already working here are marked Assigned here.
- Trampled paths now look like the approved Earth track: a narrow, soft-edged earthen trail runs through the grass instead of recolouring whole tiles. The grass around it keeps its seasonal look, and in winter the trail shows as a muddy, snow-covered line. Each of the three wear stages is wider and darker than the last, and the trail continues smoothly through bends, junctions and diagonals.
- The Buildings menu now opens as a wide, low strip: building cards sit side by side, and arrow buttons, the mouse wheel or trackpad, and the Left/Right/Home/End keys scroll through them. On phones the strip scrolls sideways, so the last building can still be selected. Every card keeps its preview, size, cost, missing resources and lock state.
- The Version Archive gives every development snapshot its own Archive build number (for example Archive build 109 · v0.3.0 · 02a3a43), counted along the main history and tied to its commit, and explains that these builds are not release versions. Snapshot headings show the real commit summary once instead of a repeated SemVer label; links, release versions and archived saves are unchanged.
- Construction supplies are delivered automatically: Haulers carry them first, and a Builder fetches them himself when no Hauler is free. The Deliver Materials button is gone; Build with King on an unsupplied site makes the king carry the materials and then start building.
- Warehouses and Granaries no longer have Hauler workplace slots. Saved games from earlier versions cannot be loaded and need a new game.

### Improved
- Smoother play with many residents and Fog of War. Map memory now refreshes only the tiles whose visibility just changed, instead of every tile in sight each frame. Moving the camera no longer re-walks all visible ground, and repaints of changed terrain are spread over several frames. In a test kingdom of 40 residents while panning, this halved the time spent on visibility each frame and cut stutters to a third.
- Stone walls have a new painted look: solid masonry blocks with a pale wall walk that join seamlessly, with merlons only on the outer edges of a wall line, corner or enclosure.
- The grass itself now changes with the seasons: fresh green with flowers in spring, olive grass with fallen leaves in autumn and snow cover in winter. A new season spreads in broad patches during its first day, and no light seams show between tiles.
- Quarries have a new painted look: a stepped stone pit with a timber hoist, stacked blocks and a tool shed. Placing one still outlines its deposit in gold.
- Villagers dress for their job: woodcutters, miners, hunters, builders, farmers, millers, bakers, haulers and soldiers each have their own clothes, headgear and tools, as men and women, facing all eight walking directions with a light walking and working motion.
- Construction sites show painted scaffolding that grows in three stages with the work: a first lift around low stone courses, a second lift (a timber frame for wooden buildings) and a tall third lift, sized to the building.
- Oaks and pines have new painted looks for young and mature trees: oaks blossom in spring, turn ochre and gold in autumn and stand bare with snow on their branches in winter, pines carry snow in winter, and summer oaks come in two crown shapes. Stumps and saplings keep their simple look.
- Farmhouse, Granary, Bakery, Mill, Warehouse, Hunting Lodge, Lumberjack Hut and Smelter have new painted looks with yards that show their trade: hay and a trough, a raised granary with sacks, a bread oven, a windmill, crates and barrels, drying hides, a log pile, and a furnace with a living flame.
- Lusher grass in four interchangeable tile designs with tufts and small flowers, and footpaths that wear from flattened green through dark olive to muted dark earth with soft edges, instead of orange-tan strips.

## [0.3.0] - 2026-11-04
<!-- version: {"title": "M2: Resources, economy and iron", "tag": "v0.3.0", "type": "milestone", "reconstructed": false, "evidence": ["src/systems/NaturalResourcesSystem.js", "src/systems/MineralSystem.js", "src/systems/ResourceTransactionLedger.js", "src/data/objects/smelting.js", "docs/verification/master-10.md"]} -->
### Added
- Build 3×3 Smelters for 12 Stone and 10 Wood. Two Smelter Operators physically process 3 Iron Ore and 2 Wood into 1 Iron Bar in 40 seconds of base work, with existing Haulers, storage, skills, wages and daily accounting.
- Auto Production at a Smelter fills vacant seats with reachable unemployed residents ranked by Smelting skill; employed workers and visitors keep their assignments.
- See each resource’s net change for the last completed game day, with income/expense tooltips and a 30-day economic journal. Mining, harvests, production, construction losses, actual wages and treasure are counted once; carrying and storage transfers are excluded.
- Discover five finite Stone Deposits and four Iron Deposits in new kingdoms. Build Quarries over an accessible assigned rock and Iron Mines within four tiles for 12 Stone and 8 physically delivered Wood; Miners physically extract and deliver Stone or raw Iron Ore until that deposit is depleted.
- Build Lumberjack Huts with three Woodcutter seats and an 18-tile working radius; reserve timber storage, chop and carry actual logs, inspect production and keep hidden tree counts tied to last-known map information.
- Find grouped Oak and Pine forests in new kingdoms, with mature trees ready to harvest and stumps, saplings and young trees that regrow through the game’s seasons.
- Send the king to chop a reserved tree, leave real timber on the ground and carry it into existing storage; interrupted work, growth and rewards survive Save/Load without duplication.
- Remembered trees keep their last-seen shape outside sight.
- Build Braziers in the Infrastructure category for 3 Stone: stone fire bowls with a living flame, ready to light the surroundings once nights arrive.

### Changed
- Save schema 14 preserves Smelting skills, both physical recipe inputs, production progress, Iron Bars and the economic journal alongside the kingdom. This alpha build accepts only its current save schema; other slots remain untouched.
- Saves from another save schema are no longer converted during alpha development. Load Game marks them as incompatible, explains why and offers a new game; the old save stays stored until you delete it.

### Fixed
- Save and load neighbouring Quarries over separate deposits even when a secondary rock edge lies beneath the other building; primary deposit ownership stays unique.
- Saved forestry jobs resume intact, and deposits never regenerate in a loaded kingdom. Cleared stumps can be built over, and trees cannot regrow beneath finished fields or buildings.

### Improved
- Seasons now change gradually: during the first day of a new season the grass tint and the trees turn patch by patch across the map instead of all at once. The change follows game time, so loading a save mid-change shows the same picture, and Seasons OFF stays plain summer.
- Place a Quarry across one or more rock formations with one stable primary deposit; a gold outline identifies that deposit in a valid preview, and depletion never switches mining to another rock.
- Smoothly zoom out to 0.25× with the mouse wheel while keeping accurate map clicks, building previews and Fog of War. Camera limits also adapt safely to tall windows, and saved views retain their actual zoom.
- Try the WebGL renderer by adding ?renderer=webgl to the game address, or ?renderer=auto to use WebGL only with hardware acceleration. Canvas remains the default, and Settings show the active renderer.
- Stone Towers have a new painted look with a burning wall torch. The king still climbs to the top and now stands inside the battlements.
- See more of the kingdom: a slim title bar, a compact floating resource bar with icons and counts (details on hover and under More), camera chips on the map and a one-line status bar. Interface text uses the Figtree and Source Serif 4 fonts with softer panels, buttons and dialogs.
- Building sites puff small clouds of dust while builders are working on them; the clouds fade and stop as soon as work pauses, and are skipped when the system asks for reduced motion.

## [0.2.0] - 2026-11-04
<!-- version: {"title": "M1: Exploration and kingdom management", "tag": "v0.2.0", "type": "milestone", "reconstructed": false, "evidence": ["src/systems/MapMemory.js", "src/ui/PopulationSidebar.js", "src/ui/MissingWorkersIndicators.js", "docs/verification/master-M1.md"]} -->
### Added
- Spot missing staff above completed workplaces: red when empty, orange when partly staffed, with visible-only vacancy details and one-click access to Assign Worker.
- Keep recently deceased residents in a separate read-only list for three complete game days, with saved death dates and safe migration of older kingdoms; their records remain available for unpaid wages without occupying jobs or counting as living residents.
- Search and filter residents, rank them by overall progress or any real skill, and inspect or locate them without interrupting their work or revealing hidden positions.
- Inspect actual villager XP, skills, natural talents, current work and hunger in a scrollable desktop tooltip, with touch-friendly character details on small screens.
- Open a compact Population sidebar with profession-coloured portraits, live resident and employment totals, and a virtual list that stays bounded for large kingdoms.
- Save discovered terrain and last-known static visuals independently of the real world, with safe migration of older kingdoms that reveals only the loaded king’s actual sight.
- Keep muted last-seen copies of static objects, crop stages and construction outside sight; hidden changes appear only when rediscovered, while moving units remain hidden and the actual world continues normally.
- Explore circular areas with black undiscovered ground and dark, desaturated remembered terrain; switch Fog of War and Exploration independently in New Game and Settings without revealing hidden objects or changing discovery history.
- Choose permanent Summer in New Game or Settings while preserving the exact seasonal cycle, daily weather and crop progress for later resumption.
- Browse verified historical milestones and original development snapshots from the main menu, with linked, collapsible release notes and isolated archived saves.
- Inspect available, reserved, carried, on-site, buffered and ground resources, see carried bundles, and physically collect or set down the king's stored supplies.
- Deliver reserved building materials to construction sites with Haulers or the king before builders can begin; the king can supply a site over multiple trips.
- Assign Haulers to Warehouses or Granaries to reserve and carry supplies, earn Logistics experience and increase their load from 20 to 38 units.
- Start with a reachable 40-unit stockpile and build 200-unit Warehouses for construction materials; the king carries collected resources to storage before they become available.
- Experience five-day seasons and daily weather that affect crop growth, with autumn foliage and snow-covered winter landscapes.
- Feed the king and villagers from stored apples, bread and meat; track food supply, hunger and its effects on work and settlement.
- Build Mills, Bakeries and 200-unit Granaries; Millers and Bakers physically collect inputs, share production work and return finished flour and bread to storage.
- Manage automatic production, storage contents and reservations, with 20-unit worker loads, a 30-unit camp fallback and persistent in-transit supplies.
- Build Farmhouses, Wheat Fields and Orchards, and assign up to three Farmers to each Farmhouse.
- Grow wheat through four stages over two game days and fruit over three game days; farmers physically harvest 8 Wheat or 6 Apple within their workplace radius.
- Earn Farming experience for completed harvests, eat apples through the existing food cycle, and save growing crops and reserved work without duplicate harvests.

### Changed
- Group Buildings into themed categories and require a completed Granary for new Farmhouses, then a completed Farmhouse for new Wheat Fields and Orchards; existing structures and valid blueprints remain intact.

### Improved
- Repaint only changed terrain cells as circular sight moves, keeping exploration responsive with twenty residents and avoiding whole-chunk redraws.
- Use circular logical sight with the existing mounted and fortification bonuses; stationary vision is cached and active vision sources can combine without revealing unrelated structures.
- Open numbered version archives on demand, browse descriptive historical milestones and development commits, and keep frozen games out of ordinary source builds.
- Choose faster walking routes over worn paths while keeping diagonal corners safe and avoiding excessive detours.
- Prefer Haulers for production deliveries while letting producers carry their own supplies when no carrier can serve them.
- Preserve existing materials, in-transit loads and collection rewards when loading older kingdoms, without duplicating stock or experience.
- Share cached crop textures while preserving per-tile depth so villagers can walk through fields and among fruit trees smoothly.

### Fixed
- Prevent hidden map clicks, building previews, path-debug details and stone totals from revealing unseen changes; keep undiscovered tile seams completely black.
- Recover outdated delivery instructions on load while preserving cargo, construction allocations and earned experience.

## [0.1.0] - 2026-11-03

<!-- version: {"title": "Initial Alpha", "commit": "e8d41eb8ec75f12d7cb72b6f139becd023b8715d", "type": "initial", "reconstructed": false, "evidence": ["scripts/changelog-lib.mjs", "src/ui/ChangelogPanel.js"]} -->

### Added
- Explore an isometric 100 × 100 kingdom with eight-direction movement, camera controls and zoom.
- Collect stones, hunt wildlife, ride a horse and discover treasure with weapons and armor.
- Build towers, castles, walls and staffed workplaces through blueprints and physical construction.
- Climb fortifications, manage villagers, assign professions and develop individual skills and natural talents.
- Track gold, daily castle income, worker wages and unpaid salaries.
- Configure difficulty, wildlife, treasures, starting resources, fog of war, an optional starting castle, day length and wildlife respawn.
- Save and load multiple kingdoms in the browser, and play historical game builds from the version archive.
- View the released update history from the main menu, with the current game version shown in the menu and Settings.

### Improved
- Villagers carry mined stone and hunted meat back to their workplaces before crediting resources and experience.
- Frequently travelled ground develops paths that recover when unused.

### Fixed
- Loading a game preserves moving units and active timers without duplicating rewards, construction, wages or difficulty bonuses.

## [0.1.0+archive.30] - 2026-11-03

<!-- version: {"title": "Faster archives and clearer version history", "commit": "a4f51ecd936af7678c0822ead4e15c91c0b3e780", "type": "feature", "reconstructed": true, "evidence": ["scripts/archive-source.mjs", "scripts/stage-archive.mjs", "src/ui/VersionArchivePanel.js"]} -->

### Improved
- Open version history only when requested, browse distinct numbered milestones and expandable source commits, and preserve every original playable URL and archived save namespace.

## [0.1.0+archive.29] - 2026-11-03

<!-- version: {"title": "Permanent Summer and resumable seasons", "commit": "1d9dd4610a5690db8348b2743ec376b668266fcf", "type": "feature", "reconstructed": true, "evidence": ["src/systems/SeasonSystem.js", "src/systems/GameTimeSystem.js", "src/ui/SettingsPanel.js"]} -->

### Added
- Turn seasonal changes on or off in New Game and Settings. Permanent Summer preserves the exact remembered season and partial day while weather, food and the economy continue.

## [0.1.0+archive.28] - 2026-11-03

<!-- version: {"title": "Building categories and farm prerequisites", "commit": "5074450fe57321ac71b7ded1cedcaf2281d2f216", "type": "feature", "reconstructed": true, "evidence": ["src/systems/BuildingUnlockManager.js", "src/ui/BuildingBar.js"]} -->

### Changed
- Browse themed building categories. New Farmhouses require a completed Granary, and new fields or orchards require a completed Farmhouse; existing buildings and valid blueprints stay intact.

## [0.1.0+archive.27] - 2026-11-03

<!-- version: {"title": "Version Archive and linked release notes", "commit": "fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265", "type": "feature", "reconstructed": true, "evidence": ["scripts/version-catalog.mjs", "src/ui/VersionArchivePanel.js"]} -->

### Added
- Browse source-verified historical milestones and original development snapshots from the main menu, with linked, collapsible change notes and isolated archived saves.

## [0.1.0+archive.26] - 2026-11-03

<!-- version: {"title": "Physical logistics", "commit": "9e93982740685b0bd18543e1ce7f707b2102b7f1", "type": "feature", "reconstructed": true, "evidence": ["src/systems/LogisticsTaskManager.js", "src/systems/ConstructionMaterialsSystem.js", "src/systems/TransportStateMigration.js"]} -->

### Added
- Use Haulers, Warehouses and royal cargo to deliver reserved supplies, fund construction physically and inspect every resource location.

## [0.1.0+archive.25] - 2026-11-03

<!-- version: {"title": "Seasons, weather and meals", "commit": "ddc9168972667cd3c969fd256e1ec7035f78072a", "type": "feature", "reconstructed": true, "evidence": ["src/systems/SeasonSystem.js", "src/systems/FoodSystem.js"]} -->

### Added
- Grow crops under seasons and daily weather, feed villagers from stored food and track shortages and food economy.

## [0.1.0+archive.24] - 2026-11-03

<!-- version: {"title": "Food production and storage", "commit": "66311391900df17e0755bdac7e51db40a5516d13", "type": "feature", "reconstructed": true, "evidence": ["src/systems/FoodStorageSystem.js", "src/systems/FoodProductionSystem.js"]} -->

### Added
- Mill wheat into flour, bake bread and physically transport food through limited production buffers and granaries.

## [0.1.0+archive.23] - 2026-11-03

<!-- version: {"title": "Farming and orchards", "commit": "339904f717e767cc1af4459e541cbb4b6edb867a", "type": "feature", "reconstructed": true, "evidence": ["src/systems/FarmingSystem.js", "src/data/farming.js"]} -->

### Added
- Grow wheat and apples through distinct stages, assign farmers and preserve growth and harvest tasks in saves.

## [0.1.0+archive.22] - 2026-11-03

<!-- version: {"title": "Advanced world configuration", "commit": "f22ded073c30f1e0fd60dceff2a244bb8f6cb087", "type": "feature", "reconstructed": true, "evidence": ["src/systems/WorldGenerationConfig.js", "src/systems/WildlifeRespawnSystem.js"]} -->

### Added
- Configure an optional starting castle, initial gold, day length and wildlife respawn without changing loaded kingdoms.

## [0.1.0+archive.21] - 2026-11-03

<!-- version: {"title": "New Game Setup", "commit": "ed58610b326ce27743957e9aee83ed2fb683ae72", "type": "feature", "reconstructed": true, "evidence": ["src/ui/NewGameSetup.js", "src/systems/GameSettings.js"]} -->

### Added
- Choose difficulty, wildlife, treasure and initial stone populations before generating a new kingdom.

## [0.1.0+archive.20] - 2026-11-03

<!-- version: {"title": "Playable historical archive", "commit": "e4f092fcc20e93f8a276515fd779732c65bca596", "type": "feature", "reconstructed": true, "evidence": ["scripts/build-archive.mjs", "scripts/archive-lib.mjs"]} -->

### Added
- Launch verified builds from actual Git commits with immutable URLs and isolated browser saves.

## [0.1.0+archive.19] - 2026-11-03

<!-- version: {"title": "Blueprint construction", "commit": "43766dcac74b8c528b6219878a8ee217c796d84b", "type": "feature", "reconstructed": true, "evidence": ["src/systems/ConstructionSystem.js", "src/systems/BuilderAI.js"]} -->

### Added
- Plan blueprints, send the king or builders to construct them and share completion rewards by actual work.

## [0.1.0+archive.18] - 2026-11-03

<!-- version: {"title": "Injured hunter deliveries", "commit": "5636967ecddcc998e4e6cf48ea9e52bd90993ef6", "type": "fix", "reconstructed": true, "evidence": ["src/systems/WorkerAI.js"]} -->

### Fixed
- An injured hunter hands in carried goods on reaching safety before recovering.

## [0.1.0+archive.17] - 2026-11-03

<!-- version: {"title": "Staffed workplaces", "commit": "0af9b89608654944b5fadbdde3d0907fd4a59dd8", "type": "feature", "reconstructed": true, "evidence": ["src/systems/WorkplaceSystem.js", "src/data/workplaces.js"]} -->

### Added
- Assign employees to quarries, hunting lodges and barracks, with real cargo returns and workplace management.

## [0.1.0+archive.16] - 2026-11-03

<!-- version: {"title": "Talents and wages", "commit": "124414727907ac0e082cb225fd2190c9f55882bd", "type": "feature", "reconstructed": true, "evidence": ["src/systems/NaturalTalentSystem.js", "src/systems/WageSystem.js"]} -->

### Added
- Recruit villagers with permanent talents and varied starting skills, and pay prorated wages or track unpaid debt.

## [0.1.0+archive.15] - 2026-11-03

<!-- version: {"title": "Villagers, skills and professions", "commit": "fc979b15a2663298d3a05f65e573579e8bab9d7c", "type": "feature", "reconstructed": true, "evidence": ["src/systems/WorkerSystem.js", "src/systems/SkillSystem.js"]} -->

### Added
- Assign villagers professions, develop individual skills and watch workers mine or hunt on the map.

## [0.1.0+archive.14] - 2026-11-03

<!-- version: {"title": "Individual experience", "commit": "c8a87c72733494f5f312dca09a3c5af99254ed44", "type": "feature", "reconstructed": true, "evidence": ["src/systems/ExperienceSystem.js", "src/data/experience.js"]} -->

### Added
- Earn individual completion experience through fifty levels with persistent safeguards against repeated rewards.

## [0.1.0+archive.13] - 2026-11-03

<!-- version: {"title": "Worn paths", "commit": "29a9cec61de6dd5b3de4f52c154e8ebbabad3907", "type": "feature", "reconstructed": true, "evidence": ["src/systems/PathWearSystem.js", "src/game/movement.js"]} -->

### Added
- Repeated travel wears connected trails into grass, improves walking speed and recovers when unused.

## [0.1.0+archive.12] - 2026-11-03

<!-- version: {"title": "Main menu and saved kingdoms", "commit": "574ef6be24993b0ab8b5efc27320fe562be455c2", "type": "feature", "reconstructed": true, "evidence": ["src/systems/SaveGameManager.js", "src/systems/GameStateSerializer.js"]} -->

### Added
- Save multiple kingdoms in the browser and restore their world, movement and active commands.

## [0.1.0+archive.11] - 2026-11-02

<!-- version: {"title": "Time, gold and treasure", "commit": "cd77265f9fb7ea44df8da58e72bae88872b8c7b4", "type": "feature", "reconstructed": true, "evidence": ["src/systems/GameTimeSystem.js", "src/systems/ProductionSystem.js", "src/systems/TreasureSystem.js"]} -->

### Added
- Track game days, earn castle gold, regenerate health and recover equipment from treasure chests.

## [0.1.0+archive.10] - 2026-11-02

<!-- version: {"title": "Combat and survival", "commit": "a6c29fac54447bcf9147c3ddf961d6d6326debb5", "type": "feature", "reconstructed": true, "evidence": ["src/systems/CombatSystem.js"]} -->

### Added
- Fight using health, damage and armor, face animal retaliation and restart after the king falls.

## [0.1.0+archive.9] - 2026-11-02

<!-- version: {"title": "Castles and connected walls", "commit": "6d189b0ab7f0f13cacbc989ee91ecd8080e9a981", "type": "feature", "reconstructed": true, "evidence": ["src/game/walls.js", "src/game/buildings.js"]} -->

### Added
- Build castles and dragged wall lines, then traverse connected wall tops and descend to ground destinations.

## [0.1.0+archive.8] - 2026-11-02

<!-- version: {"title": "Fog and horseback riding", "commit": "c3614997c019fee254ce02f5efe255dc054d669d", "type": "feature", "reconstructed": true, "evidence": ["src/systems/FogOfWarSystem.js", "src/systems/MountSystem.js"]} -->

### Added
- Toggle fog of war, ride a horse and use the corresponding movement and sight bonuses.

## [0.1.0+archive.7] - 2026-11-02

<!-- version: {"title": "Hunting and meat", "commit": "81ab03ed4c007d30eda7b7ffc793d7c0483ff474", "type": "feature", "reconstructed": true, "evidence": ["src/systems/HuntingSystem.js", "src/systems/FoodSystem.js"]} -->

### Added
- Hunt wandering rabbits, deer and boars, collect meat and consume food over active game time.

## [0.1.0+archive.6] - 2026-11-02

<!-- version: {"title": "Asset Library", "commit": "6ae12dc3e0c07a5b64ef04f14565cae3acdc94cb", "type": "feature", "reconstructed": true, "evidence": ["src/systems/ObjectRegistry.js", "src/systems/AssetManager.js"]} -->

### Added
- Browse a shared object library with validated definitions, reusable graphics and asset fallbacks.

## [0.1.0+archive.5] - 2026-11-02

<!-- version: {"title": "Eight-direction movement", "commit": "2e0974c8dd812c0d77b3bdb2ad1963d1a457419f", "type": "feature", "reconstructed": true, "evidence": ["src/game/pathfinding.js", "src/game/directions.js"]} -->

### Improved
- Walk smooth normalized diagonals with eight facing poses and safe obstacle corners.

## [0.1.0+archive.4] - 2026-11-02

<!-- version: {"title": "Isometric kingdom", "commit": "6714fc5338f101e4bddf6c21033d2754527dbd90", "type": "feature", "reconstructed": true, "evidence": ["src/game/isometric.js", "src/game/GameScene.js"]} -->

### Changed
- Explore a 100-by-100 isometric map with a crowned king, camera movement, zoom and timed stone replenishment.

## [0.1.0+archive.3] - 2026-11-02

<!-- version: {"title": "Towers and traversal", "commit": "162efeb202028e9235e0711e1937a766b7e5a8de", "type": "feature", "reconstructed": true, "evidence": ["src/game/PlayerController.js", "src/game/buildings.js"]} -->

### Added
- Place two-by-two towers for ten stones, preview their footprint and climb up or down.

## [0.1.0+archive.2] - 2026-11-02

<!-- version: {"title": "Stones and inventory", "commit": "f94d77a74ca921d47f50a3f7b86fa5b83eed01d7", "type": "feature", "reconstructed": true, "evidence": ["src/game/stones.js", "src/game/inventory.js"]} -->

### Added
- Click stones to collect them and track the collected resource in the inventory.

## [0.1.0+archive.1] - 2026-11-02

<!-- version: {"title": "Click-to-move prototype", "commit": "7291dc37059af80a0f3c5c801c0c4918206205f2", "type": "initial", "reconstructed": true, "evidence": ["src/game/GameScene.js", "src/game/pathfinding.js"]} -->

### Added
- Move across the first playable map with click-to-move pathfinding.

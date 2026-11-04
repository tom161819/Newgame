# Changelog

All notable released changes to Medieval Kingdom are documented here, following Keep a Changelog and Semantic Versioning.
Ongoing development belongs in Unreleased and is not shown in the player-facing history.

## [Unreleased]

### Added
- Discover five finite Stone Deposits and four Iron Deposits in new kingdoms. Build Quarries over a single accessible rock and Iron Mines within four tiles for 12 Stone and 8 physically delivered Wood; Miners physically extract and deliver Stone or raw Iron Ore until that deposit is depleted.
- Build Lumberjack Huts with three Woodcutter seats and an 18-tile working radius; reserve timber storage, chop and carry actual logs, inspect production and keep hidden tree counts tied to last-known map information.
- Find grouped Oak and Pine forests in new kingdoms, with mature trees ready to harvest and stumps, saplings and young trees that regrow through the game’s seasons.
- Send the king to chop a reserved tree, leave real timber on the ground and carry it into existing storage; interrupted work, growth and rewards survive Save/Load without duplication.
- Remembered trees keep their last-seen shape outside sight.

### Changed
- Saves from another save schema are no longer converted during alpha development. Load Game marks them as incompatible, explains why and offers a new game; the old save stays stored until you delete it.

### Fixed
- Saved forestry jobs resume intact, and deposits never regenerate in a loaded kingdom. Cleared stumps can be built over, and trees cannot regrow beneath finished fields or buildings.

### Improved
- Smoothly zoom out to 0.25× with the mouse wheel while keeping accurate map clicks, building previews and Fog of War. Camera limits also adapt safely to tall windows, and saved views retain their actual zoom.
- Try the WebGL renderer by adding ?renderer=webgl to the game address, or ?renderer=auto to use WebGL only with hardware acceleration. Canvas remains the default, and Settings show the active renderer.

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

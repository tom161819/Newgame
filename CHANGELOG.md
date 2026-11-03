# Changelog

All notable released changes to Medieval Kingdom are documented here, following Keep a Changelog and Semantic Versioning.
Ongoing development belongs in Unreleased and is not shown in the player-facing history.

## [Unreleased]

### Added
- Build Mills, Bakeries and 200-unit Granaries; Millers and Bakers physically collect inputs, share production work and return finished flour and bread to storage.
- Manage automatic production, storage contents and reservations, with 20-unit worker loads, a 30-unit camp fallback and persistent in-transit supplies.
- Build Farmhouses, Wheat Fields and Orchards, and assign up to three Farmers to each Farmhouse.
- Grow wheat through four stages over two game days and fruit over three game days; farmers physically harvest 8 Wheat or 6 Apple within their workplace radius.
- Earn Farming experience for completed harvests, eat apples through the existing food cycle, and save growing crops and reserved work without duplicate harvests.

### Improved
- Share cached crop textures while preserving per-tile depth so villagers can walk through fields and among fruit trees smoothly.

## [0.1.0] - 2026-11-03

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

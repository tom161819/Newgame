# Changelog

All notable released changes to Medieval Kingdom are documented here, following Keep a Changelog and Semantic Versioning.
Ongoing development belongs in Unreleased and is not shown in the player-facing history.

## [Unreleased]

## [0.47.0] - 2026-11-07
<!-- version: {"title":"Kingdom overview in the top bar","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- The empty start of the top bar's second row shows the kingdom at a glance: residents against housing room, the unemployed and the average mood.
  - Hovering, focusing or tapping it opens a panel with the average Happiness, Food, Rest, Housing and Safety, the average mood and the Kingdom Attractiveness with what moves it.
  - While the King carries cargo, the same space shows his cargo controls as before, so the bar never jumps.
- At the start of a game, a slow, softly glowing arrow under the "?" button points to the help. It disappears for good once the help has been opened, or after the first 10 minutes. With reduced motion it stays still.

## [0.46.0] - 2026-11-07
<!-- version: {"title":"Fires and firefighting","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- **Fires:** at night a burning torch post, tower holder, brazier or campfire within 2 tiles of a wooden or thatched building may set it alight.
  - The base chance is 2 % a night: doubled in a drought, much lower in the rain, halved in winter.
  - A fire burns on the roof, grows, and can jump to a wooden neighbour within 2 tiles.
  - Unchecked, it burns the building down in about a quarter of a day. Burnt Ruins remain (approved Studio art) and stored goods are lost.
- **Firefighting:** up to 6 residents within 15 tiles carry buckets from the nearest Well or the shore and put the fire out. A Well close by makes it much quicker, which gives the Well its first use.
- "Fire! … is burning" is reported and stops the night speed-up while it burns.
- Fires can be switched off (Night fires).

## [0.45.0] - 2026-11-07
<!-- version: {"title":"Thieves at night","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- **Thieves:** on a night when a store or the castle has no burning light within 6 tiles, a thief may come.
  - The chance grows with unhappiness, up to 30 % a night below 25 Happiness; with Happiness at 60 or more it is small.
  - He comes from the map edge, takes 10–20 goods from the dark store (or 10–30 Gold from the castle) and runs.
  - A soldier who sees him (in light or with a torch) chases him. A caught thief drops the goods for the Haulers, and Gold returns to the treasury.
  - A thief who gets away is reported in the morning.
- Thieves can be switched off (Night thieves).

## [0.44.0] - 2026-11-07
<!-- version: {"title":"Wolves at night","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- **Wolves:** at night a pack of 2–4 may come from far away at the map edge, most often in winter.
  - They hunt wild animals and people outdoors (residents asleep at home are safe).
  - They never step into the light of a torch, brazier, campfire or the castle; a lone torch in someone's hand does not scare them.
  - They run from three or more soldiers and leave at dawn.
  - Hunters and soldiers can kill them for 2 meat.
- "Wolves near the houses!" is reported once and stops the night speed-up while they stay near.
- Wolves can be switched off (Night wolves).

## [0.43.0] - 2026-11-07
<!-- version: {"title":"Night threat switches and campfire","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- Night threats (wolves, thieves, fires) each have an on/off switch, both in the New Game setup and in Settings during a game. They are on by default; the threats themselves follow in the next versions.
- **Campfire** (Infrastructure):
  - built anywhere a tree or a bush stands within 6 tiles, and costs nothing from the stores;
  - burns for one night, starting at once if it is made at night;
  - leaves ashes for a day and then disappears.
  - A soldier can make one beside him (**Make campfire** in the unit panel).
### Removed
- Saves from older versions no longer load (save version 57).

## [0.42.0] - 2026-11-07
<!-- version: {"title":"Pitch, torches and night safety","type":"feature","reconstructed":false,"saveVersion":56} -->
### Added
- **Pitch Kiln** (Industry, 8 Wood + 4 Stone, 2 Pitch Makers):
  - burns 2 Wood into 1 Pitch, and dips 1 Wood in 1 Pitch for 3 Torches;
  - keeps 20 Torches in the stores first, then makes Pitch.
  - Pitch and Torches can also be bought from merchants.
- **Torch Post** (2 Wood + 1 Stone, approved Studio art):
  - lights about 5 tiles at night and burns 1 Torch a night.
- **Fuel for light places:**
  - the Brazier now burns 1 Wood a night;
  - every tower has two torch holders (2 Torches a night);
  - a place lights up by itself at dusk when it has fuel and goes out in the morning;
  - an empty place stays dark, shows a "No fuel" sign and is reported once each evening.
- **Refilling light places:**
  - Haulers keep them full during the day;
  - when no Hauler is free, a Pitch Maker refills them in the afternoon;
  - a soldier with **Tend torches** ticked (unit panel) refills places near his post.
- **Torches in hand:** soldiers on the night watch take a Torch at dusk, so they see fully and light their surroundings.
- **Tower sight at night:** tower holders give sight only when someone stands within 3 tiles.
- **Dark houses:** at night a house without a burning light within 6 tiles has −30 Safety ("Dark at night").
### Changed
- Pitch and Torches appear in the resource bar only when the kingdom has some.
### Removed
- Saves from older versions no longer load (save version 56).

## [0.41.0] - 2026-11-07
<!-- version: {"title":"Day and night","type":"feature","reconstructed":false,"saveVersion":55} -->
### Added
- Day and night:
  - Every day has a dawn, day, dusk and night. The night starts at 82 % of the day in summer, 75 % in spring and autumn and 62 % in winter, and shifts gradually through the year.
  - The HUD shows the part of the day; at night its tooltip shows the moon.
- At night the world gets dark and bluish. Torches, braziers and the castle light up their surroundings, and house windows glow from dusk until the family goes to bed. A full moon (every 8 days) is a little brighter.
- At night everybody, soldiers too, sees only a third of the usual distance unless they stand in the light of a torch or brazier.
- Nights run three times faster by default (Settings → Speed up nights: Off, ×2, ×3). **Skip to dawn** in the HUD runs the night much faster and stops by itself at dawn. A wild animal attack stops the speed-up.
- At night the HUD shows how many constructions are waiting for the morning.
### Changed
- Residents go to sleep when the night starts, so later in summer and earlier in winter. Soldiers keep the night watch and sleep in the first third of the day instead.

## [0.40.0] - 2026-11-07
<!-- version: {"title":"Workplace porches","type":"feature","reconstructed":false,"saveVersion":55} -->
### Added
- Workplaces have a porch in front of them, drawn with the art approved in the Asset Studio:
  - trade porches for the Mill, Bakery, Quarry, Iron Mine and Smelter;
  - profession porches for the Lumberjack, Farmhouse, smiths and Hunting Lodge;
  - a shared veranda for the other workplaces;
  - the Barracks has none.
- Workers with nothing to do (no input, full storage, nothing to hunt…) sit on the porch and now and then pick their nose. They get up as soon as there is work, at rest time or when given an order.
- The porch stays walkable and the building keeps its size. When something is built on the porch's tiles, the porch moves to another free side.

## [0.39.0] - 2026-11-07
<!-- version: {"title":"Swing Tree, Haystack and Well","type":"feature","reconstructed":false,"saveVersion":55} -->
### Added
- Three small decorations in the Housing menu:
  - **Swing Tree** (4 Wood): houses within 4 tiles get +1 happiness, and children swing on it.
  - **Well** (6 Stone, 2 Wood): houses within 6 tiles get +1 happiness.
  - **Haystack** (2 Wood): only within 6 tiles of a Farmhouse or Wheat Field. Children jump into it; it gives no happiness.
- Decorations cannot be built on a worn path or on paving.
- All bonuses from around a house (Village Green, family, swing, well) together are capped at +8.

## [0.38.2] - 2026-11-07
<!-- version: {"title":"Castle with a bergfried","type":"feature","reconstructed":false,"saveVersion":55} -->
### Changed
- The castle uses the art chosen in the Asset Studio: a fortified castle with a tall keep (bergfried). The King stands on top of the keep behind its battlements. Torches burn at the gate and the windows glow.

## [0.38.1] - 2026-11-07
<!-- version: {"title":"Approved Kingdom Policy icons","type":"feature","reconstructed":false,"saveVersion":55} -->
### Changed
- The Kingdom Policy sliders use the icons chosen in the Asset Studio: coin stacks for taxes (an empty purse up to a full chest) and bowls for food rations.

## [0.38.0] - 2026-11-07
<!-- version: {"title":"Studio art chosen for the game","type":"feature","reconstructed":false,"saveVersion":55} -->
### Changed
- Buildings use the art chosen in the Asset Studio: House v3, Builder's Workshop v4, Farmhouse (thatched farmstead v2) and Bakery v3.
- The Farmhouse is now 3×3 tiles and the Bakery 3×2 tiles to fit the new art.
### Added
- New approved art for the Iron Mine (adit), Barracks (stone hall), Marketplace (square) and Wheelwright's Workshop (yard with a shed).
- Merchant caravans use the approved wagon art, with a full and an empty look.
### Removed
- Saves from older versions no longer load (save version 55).

## [0.37.0] - 2026-11-07
<!-- version: {"title":"Kingdom Policy and Employments cards","type":"feature","reconstructed":false,"saveVersion":54} -->
### Added
- Two more pop-out cards beside Population: Kingdom Policy above it and Employments below it. A tab opens and closes each card, and opening one card closes the others.
  - The Policy card shows the same sliders and overview as the Castle panel; a change in either place shows in the other.
  - The Employments card is the Castle's employment window, so clicking the Castle still opens it.

## [0.36.0] - 2026-11-07
<!-- version: {"title":"Kingdom Policy sliders","type":"feature","reconstructed":false,"saveVersion":54} -->
### Changed
- Kingdom Policy uses sliders.
  - Taxes have five levels (None to Very high), and the icon beside the slider grows from an empty purse to a chest overflowing with gold.
  - Food rations have three levels (Small, Normal, Generous), with an icon from a half-empty bowl to a full basket.
  - Moving a slider sets the policy from tomorrow, as before. You can drag it, use the mouse wheel or the arrow keys.
  - The Granary window has the same rations slider, and both always show the same setting.

## [0.35.0] - 2026-11-07
<!-- version: {"title":"Tidier storage window","type":"feature","reconstructed":false,"saveVersion":54} -->
### Improved
- The Storage window is tidier.
  - Each store shows one compact table: an icon, the name, the amount right-aligned and anything reserved in small grey.
  - Goods are grouped under Materials, Food and Equipment, and empty kinds are hidden.
  - A bar at the top shows how full the store is ("42 / 200").
  - The "Collect with King" buttons are gone.

## [0.34.0] - 2026-11-07
<!-- version: {"title":"UI Lab in the game","type":"feature","reconstructed":false,"saveVersion":54} -->
### Changed
- The game now uses the interface you designed in the Studio's UI Lab: olive colours, Cinzel small-capital headings, iron rivets, thicker frames and rounded corners, with the Settings, Employment and resource details rearranged as you set them. Settings has a new Interface style choice: your design, the four starting styles (Olive, Dark wood and iron, Parchment and ink, Stone castle) or the original look. The choice is stored in this browser only.

## [0.33.0] - 2026-11-07
<!-- version: {"title":"Food menu warnings instead of locks","type":"feature","reconstructed":false,"saveVersion":54} -->
### Changed
- Nothing in the Food menu is locked any more. You can place a Hunting Lodge, Fisherman's Hut or Farmhouse before a Granary, fields before a Farmhouse, a Mill before a Wheat Field and a Bakery before a Mill. Until the earlier building is finished, the menu shows a red warning such as "Needs a Granary to store food" or "Needs a Wheat Field". Other menus keep their locks.

## [0.32.0] - 2026-11-07
<!-- version: {"title":"Fisherman's Hut anywhere","type":"feature","reconstructed":false,"saveVersion":54} -->
### Changed
- A Fisherman's Hut can be built anywhere, not only next to water. Its Fishers walk to the nearest reachable shore, with no 8-tile limit, so a hut far from the water catches less. The build preview shows how far the water is, and the hut's panel says "Water: 12 tiles away". A hut with no reachable water says "No reachable water" and gets a warning sign and a notice.

## [0.31.0] - 2026-11-07
<!-- version: {"title":"Used-up source and full storage notices","type":"feature","reconstructed":false,"saveVersion":54} -->
### Added
- New warnings for a used-up source and for full stores.
  - When a Quarry or Iron Mine has used up its deposit, or a Lumberjack Hut has no trees left in range, you get one event-feed line, a notice, a warning sign over the building and a line in its panel ("No Stone left in range – build a new Quarry near rocks"). They disappear when the source is back or the building is gone.
  - When goods have nowhere to go because every store that takes them is full, the notice names them and the store to build, e.g. "Storage full: Wood has nowhere to go – build a Warehouse". This covers materials, food and equipment. The buildings that are stuck because of it get a sign and the line "Output full – no storage space". The event feed reports it once, and it clears as soon as there is room.

## [0.30.0] - 2026-11-07
<!-- version: {"title":"Employment spreads people out","type":"feature","reconstructed":false,"saveVersion":54} -->
### Changed
- Employment spreads people out. When several buildings have the same priority, new residents go first to the building with the fewest workers. The Quarry and the Hunting Lodge now fill in turns, so one doesn't take everyone. People who already have a job are never moved, and a higher priority still comes first. Partly staffed buildings now show a yellow icon (empty ones stay red).
- Changing a resident's profession by hand puts them straight into a building of that profession with a free seat, the emptiest one first, then the nearest. If no building has room, the unit panel says "No free workplace".
- The Assign Worker list puts people of the building's profession without a workplace first, then everyone else without a workplace, and last those who already work in another building.

## [0.29.1] - 2026-11-07
<!-- version: {"title":"No-builders notice is back","type":"fix","reconstructed":false,"saveVersion":54} -->
### Fixed
- The "no builders" notice is back. As soon as a construction waits and no Builder can work, because there is none or all are on strike, the Notices box shows "No builders – assign a villager to the Builder profession". Clicking it opens Employments. It had stopped appearing because it waited for the construction materials, and in a new game nobody delivers them.

## [0.29.0] - 2026-11-07
<!-- version: {"title":"Children and the Village Green","type":"feature","reconstructed":false,"saveVersion":54} -->
### Added
- Children and the Village Green. Houses with at least two residents have up to three children. Children are not residents: they don't eat, work or count towards the population. By day they play tag, roll hoops and kick balls near their house or on a Village Green, in summer by the water, and in winter about half of them go out to throw snowballs and build snowmen. At rest time they go home, and they run home when a wild boar comes near. The Village Green (Housing, 10 Wood + 6 Stone, after the first House) is a 3×3 grass square people walk across. Houses within 10 tiles get +4 happiness, family houses +2 more. Its placement preview and panel show the reach. In the evening a few neighbours sit there, and during a Feast everyone gathers on the nearest green. Click a House to see its residents and children, or a child to see who it is.

## [0.28.0] - 2026-11-07
<!-- version: {"title":"Walk cycle","type":"feature","reconstructed":false,"saveVersion":53} -->
### Improved
- Villagers and soldiers really walk now: their legs step through the approved walk animation in all eight directions instead of the whole figure bobbing, and they stand still with both feet down when they stop.

## [0.27.1] - 2026-11-07
<!-- version: {"title":"Dogs roam around their Hunter","type":"feature","reconstructed":false,"saveVersion":53} -->
### Improved
- Hunting dogs now roam around their Hunter in an irregular little circle, stopping now and then to sniff, instead of trotting behind him on a fixed line. When the Hunter is at his lodge, the dog sits by the door and every so often runs a few quick rounds before sitting down again.

## [0.27.0] - 2026-11-07
<!-- version: {"title":"Hunting dogs","type":"feature","reconstructed":false,"saveVersion":53} -->
### Added
- Hunting dogs. Every few days a stray dog appears near the castle; click it and send a Hunter to tame it (the chance grows with his hunting skill), and one in three merchant caravans brings a dog you can buy for 120 Gold. A dog follows its Hunter, sniffs out game up to 8 tiles away even under the fog, and while it is close the Hunter moves 30 % faster and deals 50 % more damage. When an animal attacks, the dog takes the blow; an injured dog lies down and heals in a day. If its Hunter changes profession the dog waits for a new master.

## [0.26.0] - 2026-11-07
<!-- version: {"title":"Rats and cats","type":"feature","reconstructed":false,"saveVersion":52} -->
### Added
- Rats and cats. Rats breed in stores with food (Granary, Starter Stockpile, food buildings) and eat 1 %, 3 % or 6 % of the food a day depending on how many there are. Store panels show the rats and the daily loss. Cats keep them down: take in a stray cat (click it), buy one from a Food or General merchant for 30 Gold, or wait for kittens. Assign each cat to a store (one cat per 120 food) or a house, where it gives the residents +3 happiness.

## [0.25.0] - 2026-11-07
<!-- version: {"title":"Rounded shores","type":"feature","reconstructed":false,"saveVersion":51} -->
### Improved
- Rounded shores: rivers, lakes, sandy, muddy and pebbly banks, the desert's edge and the deep channel now curve smoothly instead of following the tile diamonds.

## [0.24.0] - 2026-11-07
<!-- version: {"title":"World generator 2","type":"feature","reconstructed":false,"saveVersion":51} -->
### Changed
- New world generator: a wider river with pools and stony fords you can wade across (more slowly, and nothing can be built on them). The banks change along the river between sand, grass with reeds, mud and pebbles. Trees and bushes gather along the water but leave paths to it, and forests and rocks follow the landscape. Grass varies between meadow, lush, dry, forest floor, flowery and stony patches, with small details such as tufts, flowers, pebbles and autumn leaves. Every start has enough trees, stones, grass and water nearby. World codes now begin with MKW2.
### Added
- Water option for world codes: a river with a tributary (the first digit set to 2).

## [0.23.0] - 2026-11-07
<!-- version: {"title":"World codes","type":"feature","reconstructed":false,"saveVersion":50} -->
### Added
- World codes: each new world comes from a code such as MKW1-155515555555-7KQ9X2, and the same code always makes the same map, including trees, stones, ore, animals and chests. New Game Setup has a World section to paste or copy a code, roll a new seed, and choose Water (Low / Normal / High), Desert (Off / On) and Forest (Sparse / Normal / Dense). The game menu shows the current world's code with a Copy button.

## [0.22.1] - 2026-11-07
<!-- version: {"title":"Archive numbers in time order","type":"feature","reconstructed":false,"saveVersion":49} -->
### Changed
- Version Archive: every development snapshot now has its own number, in time order after the release before it (for example v0.01.01, v0.01.02… after v0.01.00; snapshots before v0.01.00 are v0.00.01…). Hover a heading to see its former label. Links to archived versions are unchanged.

## [0.22.0] - 2026-11-07
<!-- version: {"title":"Run in Background","type":"feature","reconstructed":false,"saveVersion":49} -->
### Added
- Run in Background (Settings, off by default). Browsers pause hidden tabs, so when you come back the kingdom catches up on the missed time (up to 15 minutes per absence) and then shows a "While you were away" summary: time passed, stock changes, finished buildings, new villagers and events. Any time beyond 15 minutes is listed as not simulated.

## [0.21.0] - 2026-11-07
<!-- version: {"title":"Automatic trade","type":"feature","reconstructed":false,"saveVersion":49} -->
### Added
- Automatic trade at the Marketplace (off by default). For each good, choose Auto sell (keep a reserve, sell the rest at a minimum price) or Auto buy (when stock falls below a level, buy up to a target at a maximum price). Buying stays within a budget per caravan. Each good is traded at most once per visit. A warning shows if selling food would leave less than three days of meals.

## [0.20.0] - 2026-11-07
<!-- version: {"title":"Live market prices","type":"feature","reconstructed":false,"saveVersion":48} -->
### Added
- Live market prices: goods the kingdom lacks, or that the caravan carries little of, cost more; plentiful goods cost less. Prices show ▲ or ▼, and hovering explains why.
- Trade statistics in the Marketplace: Gold earned and spent, balance, top goods, recent trades and a price history chart for each good.

## [0.19.1] - 2026-11-07
<!-- version: {"title":"Faster paths","type":"feature","reconstructed":false,"saveVersion":47} -->
### Improved
- Paths are faster to draw: rebuilding paths while you explore takes less time, and each piece of path is painted about twice as fast.

## [0.19.0] - 2026-11-07
<!-- version: {"title":"Varied meals and feasts","type":"feature","reconstructed":false,"saveVersion":47} -->
### Added
- Varied meals: residents now take turns with the kinds of food they eat (apples, bread, meat, fish). Eating 2, 3 or 4 different kinds within three days adds +3, +5 or +7 Happiness, and bread adds +2 more.
- Feasts: the Castle panel has a "Hold a feast" button. A feast costs one portion of food and one Gold per resident and gives everyone +15 Happiness for two days. The next feast can be held five days after the last one began.

### Changed
- Saved games use a new format (47). Games saved by earlier versions cannot be loaded; start a new game.

## [0.18.0] - 2026-11-07
<!-- version: {"title":"Rations and fair taxes","type":"feature","reconstructed":false,"saveVersion":46} -->
### Changed
- Food rations now work through hunger. Small rations keep residents' Food need at 60 at most, which lowers their Happiness by about as much as before. Generous rations give a small "well fed" bonus of +5.
- Unhappy situations now cost Happiness at once, and the reason is shown in the resident's panel:
  - taxes on top of unpaid wages (−10);
  - generous rations promised but not delivered (−10);
  - high taxes while hungry (−5).
- The kingdom policy can now be shown as a resident's main problem.
- Saved games use a new format (46). Games saved by earlier versions cannot be loaded; start a new game.

## [0.17.0] - 2026-11-07
<!-- version: {"title":"Policy from the morning","type":"feature","reconstructed":false,"saveVersion":45} -->
### Added
- The Castle panel now has a Kingdom overview:
  - gold per day (Castle, taxes, trade and wages);
  - food per day and how many days the stores last;
  - where Happiness is heading;
  - how many residents are at risk of a strike.

### Changed
- A new tax rate or new rations take effect the next morning. The panel shows "From tomorrow: …" with a Cancel button, so switching policy around dawn no longer dodges taxes.
- Residents get used to a policy gradually: its effect on Happiness changes by 5 points a day. The resident's Happiness tooltip shows where the effect is heading.
- Saved games use a new format (45) for the pending policy. Games saved by earlier versions cannot be loaded; start a new game.

## [0.16.0] - 2026-11-07
<!-- version: {"title":"Natural paths","type":"feature","reconstructed":false,"saveVersion":44} -->
### Added
- Paths look natural now. Trodden ground is drawn in the owner's chosen "pesinav2" style: paths bend gently and widen into trodden squares, and one wear level fades smoothly into the next.
- A new first stage of wear: trampled grass, a dark green track that appears after a few passes, before the first soil path. It gives no speed bonus yet; the soil stages that follow keep their bonuses.

### Changed
- Saved games use a new format (44) for the four wear levels. Games saved by earlier versions cannot be loaded; start a new game.

## [0.15.0] - 2026-11-07
<!-- version: {"title":"Fishing","type":"feature","reconstructed":false,"saveVersion":43} -->
### Added
- Fishing: build a Fisherman's Hut (Food, 12 Wood + 4 Stone, after a Granary) next to a river or lake. Its two Fishers fish from the shore and carry their baskets of fish to a Granary.
- Fish is a new food. Residents eat it like other food, and caravans buy and sell it for 3 Gold.
- Fishing is a new skill, with the Natural Fisher talent.
- The catch depends on the water and the time of year: deep water gives more than shallow water, Spring and rain help, and frost hurts. Winter halves the catch, but fish still feed the kingdom when the fields don't.
- Every river and lake has its own fish stock, and too much fishing empties it. The hut's panel shows whether fish are Plentiful, Thinning or Overfished, and an overfished water gives nothing until the stock grows back.

### Changed
- Saved games use a new format (43) for fish stocks and the fishing skill. Games saved by earlier versions cannot be loaded; start a new game.

## [0.14.1] - 2026-11-07
<!-- version: {"title":"Builder's Workshop","type":"feature","reconstructed":false,"saveVersion":42} -->
### Added
- Builder's Workshop (Industry, 3 × 3, 20 Wood + 10 Stone): each workshop gives a place to 4 Builders. Builders with a place work at full speed and wait at the workshop when there is nothing to build. Its panel shows how many places are taken.
- The Getting started help now suggests building a Builder's Workshop right after the Warehouse.

### Changed
- Builders without a place in a Builder's Workshop build and dismantle 50 % slower. Their resident panel says so, and the event feed explains it once.

## [0.14.0] - 2026-11-07
<!-- version: {"title":"Rivers, beaches, desert and bushes","type":"feature","reconstructed":false,"saveVersion":42} -->
### Added
- New worlds are more varied: a winding river crosses the whole map, with sandy fords where you can walk across. There is also a lake, sandy beaches along the water and a desert far from your start.
- Bushes grow in clusters on the meadows, and dry scrub grows in the desert.
- Water cannot be walked on or built on, but archers can shoot across it. Shores blend softly into the beach and grass, and the minimap shows water and sand.

### Changed
- Nothing grows on sand: no trees grow on beaches or in the desert, and fields and orchards need grass. Houses and other buildings can still be built on sand.
- Saved games use a new format (42) for the ground and bushes. Games saved by earlier versions cannot be loaded; start a new game.

## [0.13.1] - 2026-11-07
<!-- version: {"title":"Smoother happiness checks","type":"feature","reconstructed":false,"saveVersion":41} -->
### Changed
- Happiness checks for strikes now work out the residents' homes once per check instead of once per resident, so large villages stay smooth (100 residents tested).

## [0.13.0] - 2026-11-07
<!-- version: {"title":"Strikes and emigration","type":"feature","reconstructed":false,"saveVersion":41} -->
### Added
- Strikes: a resident whose Happiness stays below 25 for two whole days goes on strike. He finishes what he is doing, goes home and stops working: no goods, no experience and no wages while on strike, but he keeps his profession and workplace. At Happiness 45 he goes back to work. A red "!" shows over him and the event feed reports it.
- Emigration: a resident below 15 Happiness for three days leaves. He gives up his job, walks to the edge of the map and leaves the kingdom ("A villager has left your kingdom due to poor living conditions."). He is not counted as a death.
- The resident panel shows how many days he has been unhappy, whether he is on strike or leaving, and the effect of the kingdom policy; the population line counts strikers and residents at risk.

### Changed
- Saved games use a new format (41) for strike and emigration counters. Games saved by earlier versions cannot be loaded; start a new game.

## [0.12.0] - 2026-11-07
<!-- version: {"title":"Kingdom policy: taxes and rations","type":"feature","reconstructed":false,"saveVersion":40} -->
### Added
- Kingdom policy in the Castle panel. Tax rate (none, low, normal, high, very high): every permanent resident pays 0 to 1.5 Gold each morning while the Castle stands, shown in the daily income and as Taxes in the resource statistics. Food rations (small ½, normal 1, generous 1½ portions a day) set how much each resident eats. Low taxes and generous rations make residents happier (up to +20 Happiness), high taxes and small rations unhappier (down to −35).

### Fixed
- Getting started opens by itself only for a new game started from the New Game setup, not when a game restarts in other ways.

### Changed
- Saved games use a new format (40) for the kingdom policy. Games saved by earlier versions cannot be loaded; start a new game.

## [0.11.1] - 2026-11-07
<!-- version: {"title":"Gate in the wall","type":"feature","reconstructed":false,"saveVersion":39} -->
### Added
- Gate (Castle & Defense, 4 Stone): a gate in the wall. People walk through it on the ground; the wall walk continues over it, and the opening turns to fit the wall it stands in (temporary picture from the Asset Studio concept).

### Changed
- The King climbs up to the wall walk only at a Gate or where a wall touches a Tower, and comes down only there. Clicking any wall segment sends him to the nearest Gate or Tower stair and along the top to that segment. A wall without a Gate or Tower cannot be climbed.

## [0.11.0] - 2026-11-07
<!-- version: {"title":"Trading with caravans","type":"feature","reconstructed":false,"saveVersion":39} -->
### Added
- Trading with caravans. While a caravan is at the Marketplace, its panel shows a trade table: what the caravan has, what the kingdom has free, the Buy and Sell price, an amount with Max buttons, and Buy / Sell. Before you confirm it shows the total, your Gold, the room in your stores and a rough delivery time, with a warning when it may not be done before the caravan leaves.
- Selling: Haulers carry the goods to the Marketplace; you get the Gold only when the caravan takes them, at the price agreed when you ordered. Buying: the caravan unloads onto the Marketplace and is paid per unloaded unit; Haulers carry the goods into a fitting store (Starter Stockpile, Warehouse, Granary or Armory).
- Orders show their progress (Pending, Transporting, Completed, Partly completed, Cancelled) and can be cancelled. A caravan waits up to a quarter day longer for a running sale. When it leaves, the rest of each order is cancelled: unsold goods go back to the stores and unused Gold stays yours.
- Clear reasons when an order is not possible: not enough Gold or free goods, the merchant is out of stock or of Gold, no room in the stores or on the Marketplace, the caravan is leaving, or the treasury would go over 500 Gold.
- The daily resource statistics show Trade Purchase and Trade Sale.

### Changed
- Saved games use a new format (39) for the Marketplace goods space and trade orders. Games saved by earlier versions cannot be loaded; start a new game.

## [0.10.0] - 2026-11-07
<!-- version: {"title":"Merchant caravans","type":"feature","reconstructed":false,"saveVersion":38} -->
### Added
- Merchant caravans. While a finished Marketplace stands, a caravan comes every 2–4 game days: a merchant with his own horse wagon (red cover) drives in from the edge of the map along the roads, stays at the Marketplace for three quarters of a day and drives away again. Each caravan carries goods of one kind (general goods, food, building materials, ore and iron, or arms) and has its own Gold. Trading with it comes in the next update.
- The Marketplace panel shows the caravan on its way, at the Marketplace with the time until it leaves and what it carries, or when the next one is expected. The event feed reports its arrival, that it will leave soon and its departure, or that a caravan could not reach the Marketplace.
- The Marketplace is drawn with market stalls on a paved square (a temporary picture until the final art).

### Changed
- Saved games use a new format (38) for caravans. Games saved by earlier versions cannot be loaded; start a new game.

## [0.9.5] - 2026-11-07
<!-- version: {"title":"Marketplace and trade prices","type":"feature","reconstructed":false,"saveVersion":37} -->
### Added
- Marketplace (Logistics, 3 × 3, 12 Stone + 8 Wood), unlocked by a finished Warehouse. It has goods space for 80 units and 2 loading spots for the merchant caravans that come in a later update. Its panel shows the goods space, the caravan status and the price list.
- A price list for trade: what a caravan charges and pays for every good, from Wheat (3 / 2 Gold) to Armor (270 / 188 Gold). A caravan sells at 115 % and buys at 80 % of the base price, so buying and selling straight back never makes a profit.

## [0.9.4] - 2026-11-07
<!-- version: {"title":"Building prices in the Asset Library","type":"feature","reconstructed":false,"saveVersion":37} -->
### Added
- The Asset Library can change the price of a building for testing: change an amount, add another resource or remove one (a building always costs at least one resource). Changed amounts are bold, added resources green and removed ones struck through with Restore; the card and the Buildings menu show the new price at once.
- Reset to default for one building, Reset all prices, and Copy prices JSON, which copies the changed prices in the format the development chat uses to make them the game's defaults.

### Changed
- A building keeps the price it was placed with: its site asks for exactly that, and demolition returns half of what was really paid. Changed prices are kept only in this browser, never in a saved game.

### Fixed
- The Starter Stockpile description now says it holds 160 units.

## [0.9.3] - 2026-11-07
<!-- version: {"title":"Getting started help","type":"feature","reconstructed":false,"saveVersion":37} -->
### Added
- A "?" button at the right of the top bar opens Getting started: a checklist of the first buildings (Warehouse, Granary, Farmhouse, Hunting Lodge, Wheat Field, House, Lumberjack Hut), each with a sentence on why. A step ticks itself when its building is finished; the next step is highlighted, and clicking a step opens the Buildings menu on that building.
- A new game opens Getting started once. Until every step is done the "?" button carries a small dot. Loaded games never open it by themselves, and buildings already standing in them show as done.

## [0.9.2] - 2026-11-07
<!-- version: {"title":"Friendlier start of a game","type":"feature","reconstructed":false,"saveVersion":37} -->
### Changed
- A new game now proposes a Castle, 500 Gold and 40 Stone, Wood, Iron Ore and Bread. All of it can still be changed in the setup before starting; together the starting resources can be at most 160.
- The starting stockpile holds 160 resources in total instead of 40, so the proposed start fills it; build a Warehouse for more room. Games saved earlier keep their stockpile of 40.
- Gold is limited to 500. The top bar shows Gold as amount / 500 and a new Stores item with how full the stockpile and warehouses are.
- Only one Castle can stand in the kingdom. When it is built, its button says Already built.

## [0.9.1] - 2026-11-07
<!-- version: {"title":"Wheat Field tool stays selected","type":"fix","reconstructed":false,"saveVersion":37} -->
### Fixed
- The Wheat Field tool stays selected after placing a field, like the Farmhouse and Orchard, so more fields can be ordered with successive clicks. Escape, right click or choosing another building ends the tool.

## [0.9.0] - 2026-11-07
<!-- version: {"title":"Homes and the daily rest","type":"feature","reconstructed":false,"saveVersion":37} -->
### Added
- Residents now have a real home and a daily routine. Each permanent resident is given a seat in a completed House, or one of the settlement's 20 base places, and keeps it; when a House is finished, residents from the base places move in, and if a House is lost its residents look for another place. Residents without any place are homeless.
- In the last quarter of every game day residents finish the task in hand, take no new work and walk home to rest: to their House, to the Castle for the base places, or where they stand without a home. Rest recovers fastest at home, a little slower at the Castle and slowly without a home. A very tired resident (Rest below 20 %) rests earlier. When the night is over and Rest is back, they carry on with their work. Soldiers stay on guard, and a Move or Hold order always comes first.
- The villager panel shows Going Home and Resting with where the resident rests.

### Changed
- Saved games use a new format (37) for homes and the daily rest. Games saved by earlier versions cannot be loaded; start a new game.

## [0.8.2] - 2026-11-07
<!-- version: {"title":"Granary first in the Food menu","type":"feature","reconstructed":false,"saveVersion":36} -->
### Changed
- The Food & Farming menu now starts with the Granary, followed by the Farmhouse, Wheat Field, Orchard, Hunting Lodge, Mill and Bakery.
- A new Hunting Lodge needs a completed Granary first, like the Farmhouse, so meat always has somewhere to go. Hunting Lodges you have already built or placed are not affected.

## [0.8.1] - 2026-11-06
<!-- version: {"title":"Turning mill sails","type":"feature","reconstructed":false,"saveVersion":36} -->
### Added
- The Mill's sails now turn while a Miller is grinding and slow to a stop when no one is. They stop while the game is paused and follow the game speed. The Mill keeps its approved look; only the sails move.

## [0.8.0] - 2026-11-06
<!-- version: {"title":"Manual rock mining with physical stone delivery","type":"feature","reconstructed":false,"saveVersion":36} -->
### Added

- Mark visible rocks by click or drag for free Miners, or cancel their orders. Each rock slowly yields ten physical Stones, then disappears; the Miner carries the output to storage before choosing another rock. Partial work, ground goods and active deliveries survive current Save/Load. Employed Quarry and Iron Mine workers keep their jobs.

## [0.7.2] - 2026-11-06
<!-- version: {"title":"Need tooltips","type":"feature","reconstructed":false,"saveVersion":35} -->
### Improved
- Every need bar in the villager panel now explains its value in a tooltip: Food (fed or missed meals), Rest (falls while working, recovers while waiting), Housing (the home) and Happiness (the weights and any unpaid-wage penalty). Safety lists what adds up to it, for example "Base 45 · Castle +25 · Recent attack −20".

## [0.7.1] - 2026-11-06
<!-- version: {"title":"Steady top bar on stone pickup","type":"fix","reconstructed":false,"saveVersion":35} -->
### Fixed
- Picking up a stone no longer makes the top bar jump. On desktop the King's "Deliver to storage" button and cargo status keep a fixed place in the bar, so Food, the clock and the other items stay where they are when the button appears or disappears. This was most noticeable when zoomed out, where the map itself does not move. The full cargo text is shown as a tooltip when it is too long.

## [0.7.0] - 2026-11-06
<!-- version: {"title":"Castle gathering and arrival uniforms","type":"feature","reconstructed":false,"saveVersion":35} -->
### Added

- Unemployed residents and idle Haulers gather at reachable Castle meeting points without crowding entrances or standing on paved roads. Haulers keep accepting global deliveries while walking there, and use safe nearby waiting when no Castle is reachable.
- New workers keep an unemployed appearance until physically reaching their workplace. Global Haulers change at their Castle meeting point or first real task, and Builders at their work site. Reassignment, manual commands and Save/Load keep the appearance consistent.

## [0.6.1] - 2026-11-06
<!-- version: {"title":"Mood affects work speed and attractiveness","type":"feature","reconstructed":false,"saveVersion":34} -->
### Changed
- A villager's mood now changes how fast they work: Happy residents work 10 % faster, Unhappy and Critical ones 20 % slower. This stacks with skill level and the hunger slowdown. Walking speed and combat are not affected. The villager panel shows the current work speed.
- Kingdom Happiness now affects how attractive the kingdom is to travellers: at least 80 % adds a bonus (it offsets part of the food-shortage penalty), 30–49 % lowers attractiveness and below 30 % lowers it sharply. With no residents there is no effect.

## [0.6.0] - 2026-11-06
<!-- version: {"title":"Builder demolition and physical material recovery","type":"feature","reconstructed":false,"saveVersion":34} -->
### Added

- Finished buildings can be dismantled by Builders after confirmation, with physical work, cancellation and current Save/Load. Completion leaves half their construction materials on the ground, rounded down, and preserves stored goods, production inputs and transport ownership. The Castle is protected; empty Starter Stockpiles keep their separate action.

## [0.5.1] - 2026-11-06
<!-- version: {"title":"Event feed above the minimap","type":"feature","reconstructed":false,"saveVersion":33} -->
### Added
- Event feed above the minimap: short messages about a finished building, a new resident, a death, a resident leaving, an attack on a resident, a new season and a food shortage. At most five are shown, newest on top; each fades after about 8 seconds (12 for important ones) and stays while the game is paused.

### Fixed
- The Notices panel no longer covers the minimap: notices, the event feed and the minimap now stack in one column in the bottom-right corner of the map.
- On phones the minimap is drawn smaller instead of being scaled, so clicking it centres the camera on the right spot.

## [0.5.0] - 2026-11-06
<!-- version: {"title":"Villager needs and Happiness (S13 phase A)","type":"feature","reconstructed":false,"saveVersion":33} -->
### Added
- Villager needs: every permanent resident now has Food, Rest, Housing and Safety (0–100 %), a Happiness score, a mood (Happy, Neutral, Unhappy or Critical) and a main problem. Food follows the existing daily meal, so no food is used twice. Rest falls during active work and recovers while waiting. Housing comes from the settlement's places and completed Houses. Safety rises near a finished Castle, tower, Barracks or soldiers and drops for a day after an attack. Unpaid wages lower Happiness.
- The villager panel shows these needs as bars with the mood, the main problem and the home. The top bar shows Kingdom Happiness; clicking it opens Population, which now summarises hungry, tired and homeless residents and can sort by Happiness.
- Needs are measured and shown only for now: they do not yet change work speed, cause strikes or make villagers leave.

### Changed
- Saved games use a new format (33) for the needs. Games saved by earlier versions cannot be loaded; start a new game.

## [0.4.0] - 2026-11-06
<!-- version: {"title":"M3: Stone pavement, wheelwright, wagons, stables and housing","type":"milestone","reconstructed":false,"saveVersion":32} -->
### Added

- After a Warehouse is built, the empty Starter Stockpile can be dismantled with confirmation once every reservation and transport has finished. Haulers use their existing routes to clear available goods; food waits safely for a Granary. The cleared footprint leaves worn ground that recovers naturally.

- Saving and loading keeps provisional construction orders on unexplored land without revealing it.
- Farmhouses and orchards stay selected after placing a blueprint, so more can be ordered with successive clicks. Escape, right click or selecting another building ends the tool. Invalid or repeated clicks never spend materials.
- Minimap in the bottom-right corner of the map, drawn in the same diamond shape. It shows only what the king knows: unexplored land is grey, remembered land and objects are muted from memory, and the area in sight is in full colour. Fog of War OFF shows the whole map as before. A gold dot marks the king and an outline shows the camera view. Clicking the minimap moves the camera there without revealing anything or ordering anyone.
- A right click on the map closes open panels (unit and building details, storage, construction, Settings, Population and similar). That click does nothing else, so it never sends selected units away; with no panel open, right click orders Move as before. Confirmations, the pause menu and Save/Load are not closed this way.
- Settings → Brightness of explored areas outside sight: a slider from 15 % to 90 % (default 30 %, as before) with a Default button. It immediately brightens or darkens remembered ground, rocks, buildings and objects outside current sight. Unexplored ground stays black and the area in sight is never darkened. The choice is kept in this browser only, never in a save.
- Fields and orchards cost no materials and must be physically established by Farmers of their own Farmhouse. Builders and the King cannot build them. Establishment takes game time and grants Farming XP; growth starts only when the plot is ready, with safe cancellation and in-progress Save/Load. Harvest and cargo keep priority over planting. Farmers physically tending their own plots count as present staff.
- Each Farmhouse serves up to four fields or orchards, including planned plots. New plots connect to the nearest farm with room; farmers only tend and harvest their own plots. Selecting a Farmhouse shows its plot count and visible connection lines beside a clear map, with a bottom inspector on phones. Unconnected plots are marked and can connect when a farm gains room.
- Workplace output follows the number of physically present workers. Quarries produce 20/50/100% with one/two/three workers; other workplaces use linear output unless authored otherwise. The Asset Library developer editor can set places and output curves, import/export authoring data, and safely release excess employees. Workplace panels show current output and missing workers.
- Each Granary stores 200 raw inputs and 200 finished food independently. Wheat and Flour share the raw limit; Bread, Meat and Apple share the food limit. Incoming reservations use their own group, and the storage panel shows both counts and reserved arrivals. Warehouses, the Starter Stockpile and production buffers keep their existing limits.
- Farmers tend and move around reachable fields and orchards during Spring, Summer and Autumn while waiting for harvest. This produces no goods or XP; harvest and cargo delivery take priority. In Winter or without an accessible plot they wait safely at the Farmhouse.
- Stone Pavement can now be laid under a finished building (Single, Line or Area). Builders work from the building's edge and the cost stays 1 Stone for every 2 tiles. The building covers the paved floor, and the floor remains after the building is gone. Fields and orchards cannot be paved.
- Horse Wagon: the Wheelwright's Workshop panel has a Make choice between Wheelbarrow and Horse Wagon (30 Wood, 6 Iron Bars and one tamed horse from the Stables, 90 seconds of work).
  - The Wheelwrights wait until a tamed horse is free, then reserve it before any material is used. A running batch keeps its recipe when the choice changes.
  - The finished wagon stands beside the workshop with the horse harnessed. The horse leaves its paddock place, travels with the wagon and is never used up.
  - A Hauler in Auto mode takes a free Horse Wagon before a Wheelbarrow and carries ten times as much (400 load units, so 40 Stone or 80 Wood per trip). The Transport setting also offers Horse Wagon.
  - If the horse dies, its wagon stays parked and cannot be driven. A demolished workshop gives a reserved horse back to its Stables.
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
- Automated panel controls and construction checks restore their own game state between scenarios.
- Fog of War: remembered rock outcrops outside current sight are now muted like the trees, buildings and ground around them in every renderer, instead of staying fully lit. They follow the brightness setting; rocks in sight keep their full colours.
- A Builder whose chosen side of a construction site is taken by a villager standing still now walks to another free side instead of waiting there forever.
- Villagers are never trapped on their own tile when someone else (for example the King standing in a doorway) shares it; they can always walk away.
- Stablehands no longer lose a horse they have just tamed. If the way to the Stables is briefly blocked, they wait and try again instead of letting the horse go wild and starting over, and the horse they lead no longer blocks their own path.
- Saves no longer reject large single deliveries made with a Wheelbarrow or Horse Wagon.
- Finished walls no longer vanish after the camera pans away and back: the wall blocks and their parapets reappear exactly as before.
- Joined wall segments form one continuous wall: their shadows fall on the ground only and no longer paint dark bands across the neighbouring wall tops and the wall walk (straight lines, corners, T junctions and crossings, Canvas and WebGL).
- Seasonal ground changes finish repainting while the game is paused, so resuming a saved season keeps the same terrain picture. Normal gameplay retains its bounded redraw budget.
- The king waits after collecting loose stone and keeps it in his personal cargo. Use Deliver to storage in the top-left HUD to carry it to a reachable store; changing orders keeps the cargo safe, and full stores never consume it.
- Idle Haulers also collect loose stone within their chosen radius of reachable Warehouses, Starter Stockpiles and physical construction sites. They work without a Castle, keep real deliveries first, and carry each stone to storage using the existing reservations.
- Wandering rabbits, deer and wild boars keep one tile away from solid buildings and physical construction sites, including narrow gaps and diagonal corners. Wildlife spawns respect the same margin; animals retreat when a new structure surrounds them. Hunting and the king’s horse keep their existing movement.
- Ground the king has walked away from no longer stays fully lit when several sight changes happen between two redraws (for example while saving or after a pause); it fades back to the remembered map.
- Haulers now actually carry goods: a resident given the Hauler profession immediately serves every Warehouse, Granary and construction site in the kingdom instead of waiting for a workplace, so new Warehouses fill without the king.
- The Castle no longer covers the king when he stands in front of it, and the starting stockpile now appears in front of the Castle instead of behind it.

### Changed
- Game versions are shown with two-digit minor and patch numbers (for example v0.03.00) in the menu, the changelog and the version archive. Each released update in the changelog now also says whether saved games stay compatible or a new save format starts.
- One click on your villager opens his details at once in a smaller panel docked beside the map, without darkening the scene. Clicking another villager switches the panel, and Escape or Close closes it. Hold Here and Resume Previous Job are compact icon buttons with their names shown on hover or keyboard focus; Hold stays highlighted while the villager holds. Drag selection and group commands are unchanged.
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

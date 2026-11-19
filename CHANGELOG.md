# Changelog

All notable released changes to Medieval Kingdom are documented here, following Keep a Changelog and Semantic Versioning.
Ongoing development belongs in Unreleased and is not shown in the player-facing history.

## [Unreleased]

## [0.148.10] - 2026-11-19
<!-- version: {"title":"Dismiss soldiers","type":"feature","reconstructed":false,"saveVersion":66} -->
### Added
- Chosen soldiers can be dismissed with the door button in the selection bar. The game asks first; dismissed soldiers become ordinary residents and their kit goes back to the store.

## [0.148.9] - 2026-11-19
<!-- version: {"title":"Soundtrack","type":"feature","reconstructed":false,"saveVersion":66} -->
### Added
- A medieval-style soundtrack (provisional, composed by the game itself). Settings → Music sets its volume; 0 turns it off. It starts with your first click or key.

## [0.148.8] - 2026-11-19
<!-- version: {"title":"Neighbouring maps round the minimap","type":"feature","reconstructed":false,"saveVersion":66} -->
### Added
- Small squares round the minimap for the neighbouring maps: "?" or what was found there, the hours left while your party marches, and with a level 3 Castle and Barracks a click opens the party window.

## [0.148.7] - 2026-11-19
<!-- version: {"title":"Party meets at the Barracks","type":"feature","reconstructed":false,"saveVersion":66} -->
### Changed
- A scouting party first meets at the Barracks and then sets off to the map edge together.

## [0.148.6] - 2026-11-19
<!-- version: {"title":"Caravans on the minimap","type":"feature","reconstructed":false,"saveVersion":66} -->
### Added
- Caravans show on the minimap as a small cart that moves with them: a foreign merchant in orange, your own caravan in blue.

## [0.148.5] - 2026-11-19
<!-- version: {"title":"Buildings open in fog","type":"feature","reconstructed":false,"saveVersion":66} -->
### Changed
- Your own buildings and blueprints can be clicked and their windows stay open even in fog.

## [0.148.4] - 2026-11-19
<!-- version: {"title":"Nobody stuck under a blueprint","type":"fix","reconstructed":false,"saveVersion":66} -->
### Fixed
- Soldiers holding a place under a new blueprint now move beside it and keep holding there, and a resident shut inside a blueprint finds a way out, so building can start.

## [0.148.3] - 2026-11-19
<!-- version: {"title":"Caravans wait for their order","type":"feature","reconstructed":false,"saveVersion":66} -->
### Changed
- A foreign caravan with an order still to be loaded waits up to one more day instead of leaving, and leaves as soon as the order is done.

## [0.148.2] - 2026-11-19
<!-- version: {"title":"Faster, fairly shared iron","type":"feature","reconstructed":false,"saveVersion":66} -->
### Changed
- Iron is faster: the Iron Mine digs one Ore in 10 s and the Smelter makes 1 Iron from 2 Ore + 2 Wood in 25 s. A workshop that has waited longer for an input now gets it first, not only the nearest one.

## [0.148.1] - 2026-11-19
<!-- version: {"title":"Training without a combat level","type":"feature","reconstructed":false,"saveVersion":66} -->
### Changed
- Training a unit no longer needs a combat level: any recruit can become any unit with the kit from the Armory (and a horse for the Light Cavalry).

## [0.148.0] - 2026-11-19
<!-- version: {"title":"Terrain sliders and rocks on hills","type":"feature","reconstructed":false,"saveVersion":66} -->
### Added
- New Game and the World Editor have terrain sliders: Hilliness, Hill height, Plains and Bank slope (the World Editor's new Terrain tab). They are part of the world code (generator 6, 16 digits).
### Changed
- Rock outcrops lean towards hills and slopes in new worlds.
- Saved games and World Editor presets from before keep their worlds; their hills stay as they were.

## [0.147.2] - 2026-11-19
<!-- version: {"title":"Fog edge on hills drawn faster","type":"feature","reconstructed":false,"saveVersion":66} -->
### Changed
- The Fog of War edge on hilly ground is drawn about a fifth faster (fewer separate pieces; the picture is the same).

## [0.147.1] - 2026-11-19
<!-- version: {"title":"Diagonal wall sites and remembered diagonal walls","type":"fix","reconstructed":false,"saveVersion":66} -->
### Fixed
- A diagonal Stone Wall under construction already shows its diagonal pieces instead of blocks.
- The remembered map (under the Fog of War) keeps diagonal walls diagonal.

## [0.147.0] - 2026-11-19
<!-- version: {"title":"Analog tax slider","type":"feature","reconstructed":false,"saveVersion":66} -->
### Changed
- Kingdom policy: the tax slider moves smoothly from 0 to 1.50 Gold per resident (steps of 0.05) instead of five fixed levels; Happiness changes gradually between the old levels, and the name and icon show the nearest one.

### Fixed
- Kingdom policy: moving the tax slider updates the Gold per resident, the daily total and the Happiness straight away (marked "from tomorrow" until the change takes effect).

## [0.146.20] - 2026-11-19
<!-- version: {"title":"Diagonal walls","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Diagonal walls: a wall dragged diagonally is one straight line instead of steps, as thick as a straight wall, with merlons along both edges and mitred joints where it meets a straight wall.

## [0.146.19] - 2026-11-19
<!-- version: {"title":"Weavers fetch their own Flax","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- Weaver: weavers fetch Flax from the store themselves right away instead of waiting up to half a day for a Hauler.

## [0.146.18] - 2026-11-19
<!-- version: {"title":"Barracks window v2","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- Barracks window: training cards show each class's picture and weapon / armour icons; "Recruit automatically" is a highlighted slider; housed soldiers are a folded compact list with name, class, level and what they are doing.

## [0.146.17] - 2026-11-19
<!-- version: {"title":"Party picked by soldier class","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- World window: the party is picked by soldier class – a slider per class (e.g. 6 of 10) and an arrow that opens the soldiers by name, each with an icon of what he is doing (text on hover).

## [0.146.16] - 2026-11-19
<!-- version: {"title":"No more black squares on the map","type":"fix","reconstructed":false,"saveVersion":65} -->
### Fixed
- Black squares on the map: Wood, Ore, Iron, Flour and Bread lying on the ground are drawn again.

## [0.146.15] - 2026-11-19
<!-- version: {"title":"Waiting goods notice after a day","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- The notice that goods wait at a workshop while the Haulers carry other things now comes after a whole day (was 2 hours).

## [0.146.14] - 2026-11-19
<!-- version: {"title":"Clearer start guide arrow","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- Start guide: a much bigger, high-contrast arrow; the button it points at glows and blinks together with the arrow; the hint text is bigger and sits in the open map instead of the top bar.

## [0.146.13] - 2026-11-19
<!-- version: {"title":"Soldier class on hover","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- Hovering a soldier shows his class – Recruit, Soldier, Archer, Swordsman, Knight… – instead of the generic "Soldier".

## [0.146.12] - 2026-11-18
<!-- version: {"title":"Faster with many soldiers","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- Faster with many soldiers: soldiers no longer tread paths (they still walk faster on paths others made), and trodden paths are redrawn at most every 2 s.
- Fog of War: soldiers walking inside ground already seen no longer make the ground and the fog edge redraw; with many people in sight the fog edge is redrawn at most 5 times a second.
- The ground takes at most about a fifth of the time for repainting changed pieces, and with relief each repainted piece is uploaded to the graphics card once instead of twice.
- The kingdom bar and the hover check update less often.

## [0.146.11] - 2026-11-18
<!-- version: {"title":"Strays join the party by Hunting level","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- On an expedition a stray dog or cat joins the party by itself when the soldiers come within 5 tiles – with a chance by the best Hunting level in the party (25 % at level 1, +5 % a level, at most 90 %). Each animal tries once; the button in its window makes the same single try. It then comes home with the party.

## [0.146.10] - 2026-11-18
<!-- version: {"title":"Long-range units shoot 50 % further","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- All long-range units shoot 50 % further: Archer and Royal Archer 9 tiles (was 6), Crossbowman 7.5 (was 5), enemy archers 9 (was 6), Catapult 18 (was 12). A lobbed shot over a wall reaches 6 tiles (was 4).

## [0.146.9] - 2026-11-18
<!-- version: {"title":"Weapon and armour icons in the selection panel","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Each unit box in the selection panel shows small icons of the weapon and armour that kind uses; the tooltip names them.

## [0.146.8] - 2026-11-18
<!-- version: {"title":"Right click removes a kind from the selection","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- A right click on a unit box in the selection panel takes that kind of unit out of the selection.

## [0.146.7] - 2026-11-18
<!-- version: {"title":"Enemy army attacks, wall archers, our Gate shuts","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Test map: the new button "Enemy attacks" sends the enemy soldiers against your kingdom. They march on the Castle, fight everyone they meet, break through walls and buildings in their way and attack the buildings around the Castle. The Castle holds at a quarter of its hit points.
- Enemy archers put on an enemy wall, Tower or Gate stand up on it and shoot from there. Swords cannot reach them: break the wall, and the archer falls with it.
- Your Gate shuts while an enemy is near and opens again when he is gone.

## [0.146.6] - 2026-11-18
<!-- version: {"title":"Archers in sieges, fire arrows, unit roles","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Archers and Crossbowmen (and enemy archers) lob a shot over a wall at an enemy within 4 tiles, for half the damage. An archer whose enemy stands behind a wall walks to such a place by himself.
- Fire arrows: archers ordered at a wooden enemy building shoot it from their range until it burns. They still do not shoot at stone.
- The Light Cavalry opens a fight with a charge after a ride of 5 tiles or more (one blow of 35 hit points before armour).
- The Crossbowman's bolt ignores half of the enemy's armour. The Halberdier hits riders half again as hard.
### Changed
- Enemy soldiers wear better armour: Recruit 2 → 5, Swordsman 6 → 20, Knight 10 → 30.
- The Halberdier's armour is 30 instead of 35.

## [0.146.5] - 2026-11-18
<!-- version: {"title":"Attack-move, guard shifts, enemy Gate, night glow","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Attack-move: the new button beside the stances (or Ctrl with the right click) sends soldiers to a place so that they fight every enemy they meet on the way and then go on.
- An enemy Gate shows closed doors. It opens when its melee defenders come out against your people; while it is open, your soldiers can get in. It closes again after the defenders have left it.
- In a night battle the selected soldiers and everybody in a fight have a small pale glow, so you can see where the fighting is.
### Changed
- Soldiers rest in two shifts: one half in the first third of the day, the other half in the second. Somebody is always on watch, and in the evening and at night everybody is.

## [0.146.4] - 2026-11-18
<!-- version: {"title":"Retreat to the Castle, alarm, Catapult supply","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Alarm: when enemy soldiers come near, people who are not soldiers drop their work, run into their House or the Castle and hide until the enemy is gone. The event feed shows where it is.
- The Stones a Catapult has left show over it. An empty Catapult tells you once. A Military Wagon with no Stones left fetches more from the nearest store by itself.
### Changed
- A badly wounded soldier falls back to his Barracks or the Castle instead of running to the edge of the map, and stands and fights there. Enemies give up a chase about 18 tiles from where they stood and walk back.
- Soldiers no longer pull enemy buildings down by themselves after a victory. They attack a building on your order, or break through a wall when an enemy stands behind it. A Catapult shoots by itself only while enemy soldiers are near.
### Balance
- A Catapult's Stone takes 100 hit points (was 60): two Stones bring a wall piece down.
### Fixed
- On the Test map nobody goes hungry any more.

## [0.146.3] - 2026-11-18
<!-- version: {"title":"Walls show their damage","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Walls show how badly they are hit. Under three quarters of their hit points they crack and lose battlements, under a half the top breaks off, under a quarter only a breached stump is left; stones lie at the foot. A repaired wall is whole again. Towers and Gates get cracks and fallen bricks.
- A wall that falls leaves a heap of stones on the ground for a while.

## [0.146.2] - 2026-11-18
<!-- version: {"title":"Sieges with defenders inside, standing soldiers fight","type":"fix","reconstructed":false,"saveVersion":65} -->
### Fixed
- Soldiers no longer stand below an enemy fort while its defenders are inside. Sent at a wall, they hit it. Sent at an enemy behind closed walls, the melee soldiers break through the wall on the way and then go on after him.
- Soldiers standing after a move order fight the enemies who come near (before, only the one being hit struck back) and then walk back to their places. The stance Hold position still keeps them where they are.
- A Military Wagon drives after a Catapult that is running out of Stones.
- A soldier with no free place at an enemy wall takes another wall instead of giving up.

## [0.146.1] - 2026-11-18
<!-- version: {"title":"Attack orders before the morning rest","type":"fix","reconstructed":false,"saveVersion":65} -->
### Fixed
- Soldiers ordered to attack an enemy wall or an enemy went to the Castle to sleep instead when the order came in the morning (from day 2 soldiers rest in the first third of the day). The Catapult drove away the same way instead of coming closer and shooting. An order now comes first: the men wake up and go.
- A soldier from a Barracks no longer walks to his Barracks first after an attack order.
- An enemy coming near sleeping soldiers wakes them. Sleeping soldiers can be chosen from the Army panel and ordered.

## [0.146.0] - 2026-11-18
<!-- version: {"title":"New 3D soldiers: five more units","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- The Soldier, Crossbowman, Halberdier, Royal Archer and Light Cavalry have their own 3D figures from the owner's models, with walking, attack, falling and standing moves. The Crossbowman raises the crossbow to his shoulder and shoots, the Halberdier chops down with the halberd, and the Light Cavalry rides his horse, which trots, tosses its head and paws the ground.
### Changed
- Recruits who have not trained yet wear the Recruit figure; trained Soldiers wear the new Soldier figure.

## [0.145.1] - 2026-11-18
<!-- version: {"title":"Blender bushes and thickets","type":"feature","reconstructed":false,"saveVersion":65} -->
### Changed
- Bushes and thickets use the owner's new Blender models: five shrub species in three shapes, four decoration bushes and hazel, bramble and mixed thickets. Each has its own look in spring, summer, autumn and winter and is seen from one of four sides, so bushes no longer all look the same.

## [0.145.0] - 2026-11-18
<!-- version: {"title":"Catapult, Military Wagon, stock limits","type":"feature","reconstructed":false,"saveVersion":65} -->
### Added
- Catapult. In the Builder's Workshop, "Build a Catapult" (30 Wood, 6 Iron) puts a site beside the workshop and Builders build it. In a Barracks a Recruit trains as its crew, walks to it and rolls it. It throws Stones at enemy walls, Towers, Gates and buildings 3 to 12 tiles away (60 hit points a hit, one Stone each, up to 10 Stones). It never shoots at people. Select it and right-click an enemy building, or it shoots what is in range by itself.
- Military Wagon. In a Barracks a Recruit with a free Horse Wagon (and its horse) becomes a supply wagon. Beside a store it loads 30 Stones, 20 food and 10 Torches. Catapults within 6 tiles get Stones from it; soldiers within 6 tiles eat from it and take their night Torches from it.
- Workshops have "Make up to … in the stores". With a number set, a workshop starts no new batch while the stores hold that many of what it makes. Empty means no limit.
### Changed
- Melee soldiers near an enemy building attack it by themselves when no enemy soldier is around, also when standing where you sent them. Enemy soldiers always come first.

## [0.144.6] - 2026-11-18
<!-- version: {"title":"Enemy buildings on the Test map, melee attacks on walls","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Test map: the Test panel has a "Build for" switch – Kingdom or Enemy. Buildings and walls built for the enemy are steel blue, and enemy Gates stay shut.
- Melee soldiers can attack enemy walls, Towers, Gates and other enemy buildings. Select them and right-click the building: they surround it and hit it until it falls, and the way opens. A bar over the building shows its hit points. Archers do not shoot at stone. On the Test map "Charge" sends the melee at the nearest enemy building when no enemy soldiers are left.

## [0.144.5] - 2026-11-17
<!-- version: {"title":"Fires easier to put out","type":"feature","reconstructed":false,"saveVersion":64} -->
### Balance
- Fires are easier to put out. A fire starts weaker, grows back four times slower, and each bucket puts out more. One resident with a Well 8 tiles away now puts a fire out in about half a minute; before, he never managed. Up to 8 residents within 20 tiles help, up from 6 within 15.
### Changed
- A resident busy with a task drops it to fight a fire. Only someone carrying goods keeps walking.

## [0.144.4] - 2026-11-17
<!-- version: {"title":"Archers on walls shoot and keep their posts","type":"fix","reconstructed":false,"saveVersion":64} -->
### Fixed
- Archers on walls, Towers and Gates shoot every enemy in sight within their range. From the height they reach 2 tiles further and shoot over walls and buildings.
- Soldiers no longer leave their wall posts. Shooting used to make them drop down, and the morning rest and the walk to the Barracks used to pull them off the walls. A soldier on a wall order now stays until you give him another order.

## [0.144.3] - 2026-11-17
<!-- version: {"title":"Goal ring on walls, Towers and Gates","type":"feature","reconstructed":false,"saveVersion":64} -->
### Improved
- Selected soldiers sent to a wall, Tower or Gate show a ring up there where they will stand, like the goal ring on the ground.

## [0.144.2] - 2026-11-17
<!-- version: {"title":"Battle panel only for a real fight","type":"fix","reconstructed":false,"saveVersion":64} -->
### Fixed
- The battle panel no longer stays up without a fight: it counts only enemies within reach of our people and in sight. An enemy chasing someone far away, or one out in the fog, no longer counts.

## [0.144.1] - 2026-11-17
<!-- version: {"title":"Walls, Tower doors and Gates as one network","type":"feature","reconstructed":false,"saveVersion":64} -->
### Changed
- Walls, Towers and Gates form one network. Soldiers get onto the walls only through a Tower door or inside a Gate passage, never straight from the ground. From there they walk along the walls, onto joined Towers and Gates, and from Tower to Tower.
- A Tower is entered only through its door. R turns the Tower while placing, and the gold tiles show where the door is: face it into the castle. A Tower whose door faces outside cannot be climbed from inside. The King uses the same doors and gates.
- Where a wall meets a Tower, a door at wall-walk height shows the way in.
### Fixed
- Soldiers going up a wall pick the way with the shortest total walk, so they no longer run to a far stair first.
- A move order ends a wall post. A soldier on the wall walks to the nearest way down and steps off there, instead of jumping down or getting stuck.
- On the Test map, wall lines are free and stand finished at once, like every other building there.
- When a save fails its nature check, the message now names the object and its tile.

## [0.144.0] - 2026-11-17
<!-- version: {"title":"Cloth: flax, weaver, clothing and the tailor's light armour","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Cloth: a Flax Field (tended from a Farmhouse) grows Flax, the Weaver weaves it into Cloth, kept in a Warehouse.
- Clothing is a new part of Happiness. Clothes wear out in 20 days; each morning Cloth from the stores renews them. Well clothed residents are happier (+4), ragged ones less happy (down to −4). The Kingdom overview shows Clothing.
- The Tailor sews Light Armor from Cloth.
### Changed
- The Swordsman, Royal Archer, Crossbowman and Light Cavalry now need Light Armor to train. Units trained before keep their kit.
- The Armorer no longer makes Light Armor.

## [0.143.17] - 2026-11-17
<!-- version: {"title":"Older saves with an Armory load again","type":"fix","reconstructed":false,"saveVersion":64} -->
### Fixed
- A game saved before 0.143.16 with an Armory, Barracks or Marketplace loads again (their stores now take the new weapons).

## [0.143.16] - 2026-11-17
<!-- version: {"title":"New units: Halberdier, Royal Archer, Crossbowman, Light Cavalry","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Four new units in the Barracks: the Halberdier (halberd and armour, strikes from 2 tiles), the Royal Archer (a bow with the Swordsman's defence), the Crossbowman (crossbow and light armour) and the Light Cavalry (sword and a horse from the Stables). They wear the nearest existing figure until their own look comes.
- The Swordsmith can switch to Halberds, the Bowyer to Crossbows and the Armorer to Light Armor in the building window. The Armory keeps the new items.
### Changed
- The Knight now fights on foot (sword and armour, no horse). A mounted Knight from an older save gives his horse back to the Stables.

## [0.143.15] - 2026-11-17
<!-- version: {"title":"A cat or dog can join the expedition","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- On an expedition a stray cat or dog may roam the land (in about six of ten lands). Click it and choose "Take along with the party": it follows the soldiers to the next map and home, where it waits as a stray – without leaving – until you give it a home (a cat) or a Hunter (a dog).

## [0.143.14] - 2026-11-17
<!-- version: {"title":"Always night in the mine, one torch per ten soldiers","type":"feature","reconstructed":false,"saveVersion":64} -->
### Changed
- Inside the mine it is always night: no daylight, no moon and no night speed-up or Skip to dawn.
- Soldiers no longer all light a torch at night: one in every ten soldiers of a group carries one (the man nearest the group's middle). A torch lasts a day; inside the mine the bearer lights a new one each day, from the stores or, on an expedition, from the Horse Wagon's load – so take torches along with the food. What the wagon still carries comes home.
### Added
- A torch shows as a small flame above the bearer's hand.
- Test map: a "Torch for the chosen" button gives the chosen soldiers a free torch.

## [0.143.13] - 2026-11-17
<!-- version: {"title":"Bodies stay three days, blood stains in fights","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- The dead lie where they fell for three days: soldiers and enemy soldiers play their fall and stay on the ground, other people lie down. Wounds in a fight leave blood stains that fade within two days. Both are kept in saves and hidden under the fog of war.
### Fixed
- Enemy soldiers that had not moved yet sometimes showed the plain placeholder figure instead of their look.

## [0.143.12] - 2026-11-17
<!-- version: {"title":"Barracks hiring slider no longer blinks","type":"fix","reconstructed":false,"saveVersion":64} -->
### Fixed
- The Barracks window's automatic hiring slider no longer blinks or disappears while people are hired; it keeps its place under the heading.

## [0.143.11] - 2026-11-17
<!-- version: {"title":"Soldiers to Towers, Gates and walls by their picture","type":"feature","reconstructed":false,"saveVersion":64} -->
### Fixed
- Right-clicking a Tower, Gate or wall to send chosen soldiers there now works on the building's picture: a click on the tall Tower no longer sends them to the meadow behind it. With the King chosen too, he goes up as well.
### Changed
- Up to four soldiers stand on a Tower's or Gate's platform; the rest take the walls beside it.

## [0.143.10] - 2026-11-17
<!-- version: {"title":"Test map Knights and enemy soldiers, sharper soldiers, closer zoom","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- The Test map has all four of our ranks – the Knight joins (on foot) – and the same four as enemies: Enemy Recruit, Archer, Swordsman and Knight in steel blue. They fight, strike and fall like ours; the Enemy Archer shoots from afar.
### Improved
- Soldiers are drawn with twice the detail, so they stay sharp when you zoom in.
- You can zoom in much closer (up to 3.2× instead of 1.8×).

## [0.143.9] - 2026-11-17
<!-- version: {"title":"Rounder mine caves with rock obstacles, fog of war in the mine","type":"feature","reconstructed":false,"saveVersion":64} -->
### Improved
- Inside the mine the cave walls are rounder and more broken, with only an occasional sharp corner, and the caverns hold rock pillars and outcrops you must walk round, plus boulders, stalagmites, rubble and still puddles.
### Fixed
- Inside the mine the fog of war now covers the rock too: walls and stones you have not seen stay hidden, and those you only remember are dimmed.

## [0.143.8] - 2026-11-17
<!-- version: {"title":"Inside the mine: rock walls and winding tunnels","type":"feature","reconstructed":false,"saveVersion":64} -->
### Changed
- Inside the mine the rock looks like rock: the passages have rough rock walls along their sides, everything beyond them stays black, and the floor is cave stone instead of grass with boulders.
- The mine's tunnels wind between the caverns and narrow and widen along the way, and the caverns are uneven hollows.

## [0.143.7] - 2026-11-17
<!-- version: {"title":"Unit bar out of the Army tab, livelier bandit camp","type":"feature","reconstructed":false,"saveVersion":64} -->
### Changed
- With soldiers chosen, the unit bar opens out of the Army tab, from the left edge of the screen to the tab. The chosen kinds show as larger boxes with the unit's picture and count, and the orders, stances and formations are icons; hovering one shows its name and what it does.
- The bandit camp is a lived-in place: tents round a crackling fire with a cauldron on a tripod, the chief's larger tent with a banner and the chest before it, log seats, crates, barrels and sacks, a weapon rack and bedrolls.
### Improved
- Standing soldiers make their small moves half as often again.

## [0.143.6] - 2026-11-17
<!-- version: {"title":"Formations, Test map lands, standing soldiers move","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Formations: with two or more units chosen, the command bar offers loose, line (two ranks), block and wedge. Holding the right mouse button shows a blueprint of their places; moving the mouse turns it, and letting go sends the men there. Shields and armour stand in front, archers at the back, and on arrival the men face the way you turned the blueprint.
- The Test map first asks which land to open: the home map with the Castle, a dense forest, iron or stone hills, a bandit camp (with its bandits and chest), crumbling ruins, an abandoned mine, or the inside of a mine.
### Improved
- Standing soldiers are no longer frozen alike: each now and then shifts his weight, looks aside, shifts his weapon or straightens his back, at his own random times.

## [0.143.5] - 2026-11-16
<!-- version: {"title":"3D soldiers with animations","type":"feature","reconstructed":false,"saveVersion":64} -->
### Changed
- Soldiers wear the owner's new 3D figures: the Knight, the Archer, the Swordsman and the Recruit with a spear, each in all eight directions (the Knight shows once Knights can be trained).
### Added
- Soldiers are animated: they walk with a real stride, strike in battle (a sword swing, a spear thrust, an archer drawing the bow) and fall when they die, lying a moment before they fade.

## [0.143.4] - 2026-11-16
<!-- version: {"title":"Subtler selection ring","type":"feature","reconstructed":false,"saveVersion":64} -->
### Improved
- The ring under chosen units is thinner, smaller and half transparent, so it no longer covers the units; the ring at their goal is fainter too.

## [0.143.3] - 2026-11-16
<!-- version: {"title":"Unit kinds in the bar, marching in lanes","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- The bar of chosen units shows each kind with an icon and a count (🛡️ Soldiers, 🏹 Archers, ⚔️ Swordsmen, 🐎 Knights, 👑 the King, workers by their job); a click on a kind keeps only that kind chosen.
### Improved
- A group of three or more marches in lanes beside each other along one route instead of one long file: each keeps his place in the formation on the way. 30 soldiers now walk as a block about 12 × 10 tiles instead of a file 27 tiles long.

## [0.143.2] - 2026-11-16
<!-- version: {"title":"Groups walk together","type":"feature","reconstructed":false,"saveVersion":64} -->
### Improved
- A group sent somewhere walks together: residents on an order (and soldiers marching or fighting) pass through our people who are walking or holding a spot, so nobody stands waiting for the ones in front. Only people standing at work still block the way. 30 soldiers now arrive about 10 game seconds sooner and nobody stops on the way.

## [0.143.1] - 2026-11-16
<!-- version: {"title":"Double click chooses the same units","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- A double click on a unit chooses every unit of the same kind in the current view: soldiers of the same type (all Archers, all Swordsmen…), other residents of the same job.

## [0.143.0] - 2026-11-16
<!-- version: {"title":"Test map","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Test map in the main menu (under the World Editor): a new world with the Castle and nobody else, for trying battles and buildings. Every building is free and stands finished at once (no materials, no builders), there is no fog and no night threat, nobody settles or leaves, the King stays out of it and nothing is saved.
- The Test panel on the left: put our Soldiers, Archers and Swordsmen, enemies (Raiders, Bandits, Giant Rats, Wolves) and animals on the map with a click, 1–50 at a time; remove one unit, clear enemies, ours or everything; "Ours attack" sends all our soldiers at the nearest enemy group. Soldiers are commanded as in the game.

## [0.142.6] - 2026-11-16
<!-- version: {"title":"War groundwork: group attack, Raider, test battle","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Dev tool: "Test battle 100 v 100" puts 100 of our soldiers (Soldiers, Archers, Swordsmen; group 9) against 100 Raiders on open ground away from the Castle, gives the attack order and turns on the FPS meter; "Clear the test battle" removes whoever is left.
- A new enemy: the Raider, a soldier of an enemy army (steel-blue tabard, helmet; for wars and sieges later – for now only in the test battle).
### Improved
- An attack order on one enemy is an attack on his whole group: every soldier gets his own enemy (at most three melee fighters on one), so a large army fights along the whole front instead of crowding one enemy, and it clears the whole group before it stops.
- Large battles: damage numbers only on screen and at most 40 at a time; no event-feed line for every soldier who falls back.
### Fixed
- The battle bar counted some of our soldiers as enemies.

## [0.142.5] - 2026-11-16
<!-- version: {"title":"Combat: stances, groups, battle bar, damage numbers","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Soldier stances in the bar of chosen units: Attack (default – they fight enemies within 5 tiles, chase them and take the next one), Defend (only enemies within 3 tiles, no long chase) and Hold position (they do not move; archers shoot what they reach). The stance is saved.
- Groups on the number keys: Shift + 1–9 makes the chosen soldiers group 1–9, the number key chooses the group, pressed twice it moves the camera to it. (Ctrl + number belongs to the browser.) Without such a group the keys 1–3 still set the speed.
- A battle bar at the top while a fight goes on (ours standing / taking part, enemies standing / taking part) and a report in the event feed when it ends (won, lost, who fell).
- Damage numbers over the hit units and visible arrows of archers.
- A badly hurt soldier (below a quarter of his health) falls back behind his comrades until he has healed to half (not when holding position).
### Improved
- Melee fighters spread around their enemy instead of standing on each other; archers shoot the nearest enemy in reach and step back when an enemy gets right next to them; when a group is sent somewhere, archers keep two tiles behind and armoured soldiers one tile ahead.
- After an attack order the soldiers fight on against the rest of the enemies around the place they were sent to, and soldiers help a comrade attacked near them.
- Enemies have a red ring under their feet; bandits wear charcoal with a green sash instead of red, so they no longer look like our soldiers.

## [0.142.4] - 2026-11-16
<!-- version: {"title":"Combat: garrison soldiers obey, soldiers fight on","type":"feature","reconstructed":false,"saveVersion":64} -->
### Fixed
- Garrison soldiers (the starting garrison and a scouting party – soldiers without a Barracks seat) now follow orders: they attack an enemy you right-click, walk with a scouting party or the caravan and defend. Before they only stood "Waiting for workplace" and fought back only when hit themselves.
### Improved
- Soldiers keep fighting after their target falls: each takes the next enemy near him instead of standing idle, a melee soldier picks a free enemy when three are already on his, and an enemy coming within 5 tiles is fought without an order.
- Health bars of enemies (wolves, bandits, rats) are red, our people's green, so a fight is easy to read.

## [0.142.3] - 2026-11-16
<!-- version: {"title":"Party soldiers stay soldiers, groups keep together","type":"feature","reconstructed":false,"saveVersion":64} -->
### Fixed
- Soldiers of a scouting party stay soldiers in the land (they were turned into Unemployed and lost their gear there, because the land has no Barracks).
- The selection box drawn while dragging the mouse stays exactly under the pointer at every zoom.
- Soldiers can be sent at bandits and giant rats with a right click, and soldiers of a party help a party member who is attacked near them.
### Improved
- A selected group sent somewhere keeps together: everyone keeps his place in the group and they walk at the pace of the slowest.

## [0.142.2] - 2026-11-16
<!-- version: {"title":"Bandit camp, ruins and an abandoned mine","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- New lands a scouting party can find: a Bandit camp, Crumbling ruins and an Abandoned mine.
- Bandit camp: bandits guard a chest of gold in the middle of a clearing and attack anyone who comes close. Beat them and take the chest; a beaten camp stays empty.
- Crumbling ruins: broken stone walls with a treasure chest inside.
- Abandoned mine: a rock hill with an entrance. Walk the party to the entrance and press "Enter the mine": the map switches to the inside – dark tunnels and rooms with giant rats, iron and stone deposits and treasure chests in the farthest rooms. "Leave the mine" brings the party back out to the entrance.
- A party member who steps next to a chest takes its gold. The loot is shown in the bar at the top and goes into the treasury when the party gets home. A chest once taken stays empty next time.

## [0.142.1] - 2026-11-16
<!-- version: {"title":"Party: the King, a Horse Wagon, a dense forest","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- The King can go with the scouting party (a tick in the World window). He walks to the map edge with the soldiers and is away from the kingdom until the party comes back; in the land he is with the party and you lead him there too. If he falls, the game ends. Without the King he is not on the land's map at all.
- A free Horse Wagon can go with the party, loaded with goods from the stores (up to the wagon's load). In the land it stands by the party; what is in it comes back to the stores when the party returns home.
### Changed
- A Dense forest land now really is a dense forest: about five times as many trees as a home map, spread over the whole land.
### Fixed
- No wolves wait where the party enters a land, and the King no longer appears alone on the far side of a land he did not go to. The party enters the land on the side facing home.

## [0.142.0] - 2026-11-16
<!-- version: {"title":"Playing a zone with the scouting party","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Play with the scouting party: a party that has reached its land now waits there. In the World window you can send it home, or press "Switch to the party" – the map switches to that land (dense forest, iron or stone deposits, always the same for the same world) and you lead the soldiers there: select them, move them, fight the animals. "Send the party home" in the bar at the top brings you back; the party then walks home for half a day. Soldiers who fall in the land are lost.
- While you are in the land, home waits (its time stands still), and saving saves home with the party in the land. What you change in the land is not kept yet.

## [0.141.1] - 2026-11-16
<!-- version: {"title":"Unit command bar above the build bar","type":"fix","reconstructed":false,"saveVersion":64} -->
### Fixed
- The command bar of a selected unit (the King's Hold Here, Resume, Deselect…) is no longer hidden behind the build bar at the bottom of the screen: it sits above the build bar and the status line.

## [0.141.0] - 2026-11-15
<!-- version: {"title":"Scouting the surroundings and the garrison","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- The World window (🌍 by the minimap): the home map with eight lands around it. With a level 3 Castle and finished Barracks you can send a scouting party of any number of soldiers to a land marked "?". The soldiers walk to the map edge on that side, travel about half a day, report what they found (dense forest, iron deposits or stone deposits – always the same for the same world) and come back after another half day.
- Safety has a new part, Garrison: one soldier at home for every 5 residents gives the full bonus; fewer soldiers (or soldiers away on a scouting party or with the caravan) give less.

## [0.140.1] - 2026-11-15
<!-- version: {"title":"Material notice after a day; soldiers on walls, Gates and Towers","type":"feature","reconstructed":false,"saveVersion":64} -->
### Changed
- The "nobody brings the material" notice comes only after a whole day of waiting (it came after about two hours).
- Soldiers can stand on a Gate (like on a Tower) and climb onto any piece of wall they are sent to, even when no Tower or Gate touches that wall.

## [0.140.0] - 2026-11-15
<!-- version: {"title":"Move a building","type":"feature","reconstructed":false,"saveVersion":64} -->
### Added
- Move a building: the building window has a Move button. Place the building's plan elsewhere – it may cover the building itself – for half the materials of a new one. Builders dismantle the old building (nothing is returned) and build it at the new place; a plan over the old ground is placed once the old building is gone. Cancelling the dismantling cancels the move. Not for the Castle, the Starter Stockpile, walls, towers, gates and fields.

## [0.139.0] - 2026-11-15
<!-- version: {"title":"Castle upgrade by Builders, start layout, build menu order","type":"feature","reconstructed":false,"saveVersion":63} -->
### Changed
- The Castle upgrade is now built by Builders: it is paid when ordered and the new level stands when their work is done (1, 1.5 and 2 minutes of one Builder's work for levels 2–4). The Castle window shows the progress.
- The Castle in the build menu is no longer locked once it stands: its card opens the Castle window with the upgrade.
- New order in the build menu: Food & Farming – Granary, Hunting Lodge, Fisherman's Hut, Farmhouse, Orchard, Wheat Field, Mill, Bakery; Castle & Defense – Castle, Gate, Wall, Tower, Barracks, Armory, weapon makers; Mining & Industry – Lumberjack Hut, Builder's Workshop, Quarry, Iron Mine, Smelter, Pitch Kiln, Wheelwright; Logistics & Trade – Material Yard, Warehouse, Marketplace, Stables.
- A new game puts the King in front of the Castle and the Starter Stockpile at least 2 tiles away from it, so the Castle has room to grow.

## [0.138.8] - 2026-11-15
<!-- version: {"title":"Haulers box on one line","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Population panel: the wanted number of Haulers takes one line; its explanation, the recommended-number button and the Builders line open when the pointer is over it, so the list of residents keeps its room.

## [0.138.7] - 2026-11-15
<!-- version: {"title":"Start guide in every new game","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The start guide (the arrow at the Wiki, then at Getting started) shows at the start of every new game, also when the old tutorial was switched off before.

## [0.138.6] - 2026-11-15
<!-- version: {"title":"Fog edge in WebGL","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- With WebGL the edge of the explored land showed a bright jagged strip outside the dark fog edge. The fog edge is now drawn the same way as with Canvas.

## [0.138.5] - 2026-11-15
<!-- version: {"title":"Start guide, tips and WebGL","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The step-by-step tutorial is gone. A new game starts with a big arrow at the Wiki (information about the game and its mechanics), then one at the Getting started panel; after that tips come one by one (full screen with Alt+Enter, K selects the king, Shift builds several buildings in a row, game speed), each a while after the last.
- Getting started has new tasks: Granary, a Builder, a Hunting Lodge, a Lumberjack Hut, a Material Yard, select the king and explore, find water, a Fisherman's Hut. Clicking a task opens the place where it is done (the build menu, the Population list, the king). The panel goes away when every task is done.
- The game starts with WebGL by default (Canvas when the browser has no WebGL; Settings can still pick Canvas).

## [0.138.4] - 2026-11-15
<!-- version: {"title":"Statistics switched on","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Anonymous play statistics are on in the GitHub Pages version (the author's GoatCounter site).

## [0.138.3] - 2026-11-15
<!-- version: {"title":"Report a problem and anonymous statistics","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Report a problem: a button in the main menu and the game menu sends a message to the author (with the version, day and population). Only in the GitHub Pages version.
- Anonymous play statistics for the author (no cookies, no IP address); the player can turn them off in the report window. Only in the GitHub Pages version, active once the statistics key is set.

## [0.138.2] - 2026-11-15
<!-- version: {"title":"Miner without a quarry","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- A Miner can be chosen in the job menu (and in the tutorial) without a quarry or when the quarry is full. He mines marked rocks.

## [0.138.1] - 2026-11-15
<!-- version: {"title":"Season change without hard edges","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- Season change: the ground no longer shows hard square edges between parts of the view. The next step is prepared for the whole view first and then shown everywhere at once. The change also moves in smaller steps (24 instead of 9).

## [0.138.0] - 2026-11-15
<!-- version: {"title":"Spruces in four seasons","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Spruces in three sizes (young, medium, mature) for all four seasons, each seen from four directions. They move in the wind like the oaks. A spruce looks mature from 14 days of age.

### Changed
- Oaks and spruces are now drawn from shared tree sheets. This saves about 40 files in the game.

## [0.137.1] - 2026-11-15
<!-- version: {"title":"Studio: diagonal wall v5","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Asset Studio: diagonal wall v5 – as thick as the straight wall again, and the straight wall and the diagonal meet in a clean mitre without teeth. Still waiting for approval.

## [0.137.0] - 2026-11-15
<!-- version: {"title":"Oaks move in the wind","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Oaks move in the wind: the trunk stays still, the crown bends a little and the leaves flutter. Each tree moves at its own time, so a forest does not sway in step. Trees far away or off screen stand still.

## [0.136.0] - 2026-11-15
<!-- version: {"title":"Building hit points and repairs","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Every building has hit points now (fortifications as before; other buildings 100 + 8 for each unit of their price). Fields, paving, campfires and ruins have none.
- Fire takes a building's hit points. After the fire is put out the building stays damaged.
- Builders repair damaged buildings on their own. A repair costs half the price of what is missing and is paid from the stores when it starts; the hit points come back as the Builders work.
- The building detail shows the hit points and the repair state.

## [0.135.0] - 2026-11-15
<!-- version: {"title":"Haulers carry twice as much","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Haulers carry twice as much as other subjects (8 Stone, 16 Wood or 80 food by hand).
- A worker in a workshop (mill, bakery, smelter…) now waits up to half a day for a Hauler to bring his inputs, then fetches them himself. Before he went after 3 seconds.

## [0.134.0] - 2026-11-15
<!-- version: {"title":"Oaks in four seasons","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Oaks in all four seasons from the owner's new pictures: light green in spring, dark green in summer, orange in autumn and bare in winter, for the young, the grown and the big old oak, each in four views.

### Changed
- Asset Studio: the diagonal wall is as wide on screen as the straight wall (a full tile). Still waiting for approval.

## [0.133.5] - 2026-11-15
<!-- version: {"title":"Studio: diagonal wall v3","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Asset Studio: diagonal wall v3. The end of a diagonal run is one piece (the block and half the band) with a smooth bend, and battlements run only along the outer edges. Still waiting for approval.

## [0.133.4] - 2026-11-15
<!-- version: {"title":"Studio: diagonal wall pieces v2","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Asset Studio: the diagonal wall pieces are now as thick as the straight wall and reach into the neighbouring blocks, so the joints have no gaps. Still waiting for approval; the game does not use them yet.

## [0.133.3] - 2026-11-15
<!-- version: {"title":"Castle menu shows level 1","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The Castle in the building menu shows its first level (the timber hall, 4 × 4) instead of the old stone keep, and its description explains the four levels.

## [0.133.2] - 2026-11-15
<!-- version: {"title":"Studio: diagonal wall pieces for review","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: two new wall pieces for a wall that runs diagonally (one straight line instead of steps) and two previews of how they join straight walls. They wait for approval; the game does not use them yet.

## [0.133.1] - 2026-11-15
<!-- version: {"title":"Uneven paving edges","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Stone paving no longer ends in a straight cut line. Where it meets grass or path dirt, loose kerb stones of different sizes reach a little over the edge.

### Fixed
- A thin line of ground showed through paving in some places (where two ground pieces meet).

## [0.133.0] - 2026-11-15
<!-- version: {"title":"Old oaks on 2 × 2","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Old oaks on 2 × 2. A grown oak that is old enough and has free land beside it spreads into a big old oak, taller and wider than the others. Where there is no room it stays the middle oak. About half of the oaks can do this, so forests keep both sizes.
- A big old oak gives 10 Wood (a normal oak 6). It can be felled from any side.
- New worlds have small groups of 1–4 oaks standing alone outside the forests, and some forest oaks start big with a gap around them.

## [0.132.0] - 2026-11-15
<!-- version: {"title":"Village Green on 4 × 4 with the new picture","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The Village Green has its new picture: a paved square on 4 × 4 with an old tree and a bench, a bell and a notice board. People walk across it and pass behind the tree, the bell and the board. Greens built earlier stay 3 × 3 with the old drawing.

## [0.131.0] - 2026-11-15
<!-- version: {"title":"New oaks and the new Hunting Lodge","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- New oak pictures: a small young oak and a bigger grown oak. Each oak shows one of four views, so a forest no longer looks like a row of copies.
- Oaks turn light green in spring and orange or yellow-brown in autumn.

### Changed
- The Hunting Lodge has its new picture (a shingled cabin with a porch and a kennel) and stands on 3 × 3. Lodges built earlier stay 2 × 2.

## [0.130.3] - 2026-11-15
<!-- version: {"title":"Caravan return no longer freezes the game","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- The game froze when your own caravan came home with gold (for example on day 98 at 18:11). The caravan now returns, the gold is paid once and booked as a sale.

## [0.130.2] - 2026-11-15
<!-- version: {"title":"Save download inside the Claude page","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- Downloading a saved game inside the Claude page did nothing (the game said the file was downloaded). The page now asks to save the file and saves it.

## [0.130.1] - 2026-11-15
<!-- version: {"title":"Full screen; wider scroll edge","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Full screen: a button in the Settings and the Alt+Enter shortcut.
### Changed
- The view scrolls when the pointer is within 15 px of the window edge (was 4 px), so it works before the pointer leaves for the browser's bars.

## [0.130.0] - 2026-11-15
<!-- version: {"title":"Points 53-58","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- The pointer at the edge of the window moves the view that way.
- A Hauler shows how he carries now – by hand, with a Wheelbarrow or a Horse Wagon – in his window and in the Population list.
### Changed
- The seasons differ more on the ground: spring light green, summer green-yellow, autumn towards orange.
- New games have no rock obstacles close to the start and only a few a little further.
- The automatic hiring slider of the Barracks is at the very top of its window.
### Fixed
- Tamed horses standing in the paddock of the Stables were hidden under the Stables' picture.

## [0.129.3] - 2026-11-15
<!-- version: {"title":"K selects the King","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- The K key selects the King.

## [0.129.2] - 2026-11-15
<!-- version: {"title":"Castle upgrade in the detail; level 2 size","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The Upgrade button of the Castle is in the window a click on the Castle opens (level, what it gives, the next level, the price); it stays in the Castle's Employment card too.
- The level 2 Castle fills its whole 4 × 4 footprint like level 1 (it looked smaller after the upgrade).

## [0.129.1] - 2026-11-15
<!-- version: {"title":"Castle card opens on click","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- A click on the new Castle opened only the building detail without the upgrade. It now opens the Castle's card with the level and the Upgrade button; the detail of an old Castle says where the upgrade is.
- A resident asked to step off a new blueprint no longer waits for good when his way is blocked.

## [0.129.0] - 2026-11-15
<!-- version: {"title":"Castle levels and upgrade","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- The Castle has four levels with new art: a thatched hall (4 × 4), the hall with a tower and palisade (4 × 4), a stone keep with a wall (5 × 5) and a castle with two halls (6 × 6). A new Castle is level 1 (the starting one for free, otherwise 40 Wood). "Upgrade" is in the Castle's card: 70 Wood, 50 Stone, 100 Stone. When the bigger footprint has no room, the card says the ground must be cleared.
- Higher levels give more hit points, room for residents (+2, +4, +6), Safety (+5, +10, +15) and income (7, 10, 14 Gold a day). From level 2 the Castle sees around itself.
### Changed
- A Castle of an older save stays the stone keep the King can climb. It counts as level 1 and can be upgraded to level 2. The new levels cannot be climbed.

## [0.128.3] - 2026-11-15
<!-- version: {"title":"Studio: oak renders","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's renders of the oak in three stages (young about as tall as a person, grown, old on 2 × 2), four views each, wait for review. The game is unchanged.

## [0.128.2] - 2026-11-15
<!-- version: {"title":"Studio: Castle level footprints","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Asset Studio: the four Castle levels are sized for footprints 4 × 4, 4 × 4, 5 × 5 and 6 × 6 (owner's choice to try). The game is unchanged.

## [0.128.1] - 2026-11-14
<!-- version: {"title":"Studio: Castle in four levels","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's renders of the Castle in four levels (thatched hall; hall with tower and palisade; stone keep with wall; castle with two halls), four views each, wait for review. The game is unchanged.

## [0.128.0] - 2026-11-14
<!-- version: {"title":"Season squares fixed; hit points of fortifications","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Fortifications have hit points (Stone Wall 200, Gate 300, Tower 400, Castle 1500), shown in the building detail. Nothing attacks buildings yet.
### Fixed
- Season change: squares of ground stayed in the old season for a long time (at fast speed for good), with hard edges to their neighbours. The ground now catches up within seconds.

## [0.127.0] - 2026-11-14
<!-- version: {"title":"Attack orders, Show links, blueprints over people","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Soldiers attack on command: with soldiers selected, a right click on a wolf sends them at it. The pointer turns into crossed swords over an enemy.
- "Show links" switch in the top right corner of the Buildings panel (explained on hover). While a blueprint is being placed, thin lines run to the buildings it will work with: orange where the worker takes what he needs, blue where he carries what he makes.
### Changed
- A blueprint can be placed over people, animals and goods lying on the ground. The goods are put beside it at once, residents step off it, and building starts when nobody stands there.
- Newcomers walking in from the map edge reveal nothing of the map until they reach the Castle.
- A Gate keeps the direction it was placed with; walls built later no longer turn it. It still turns by itself when placed into an existing wall.
- Stone Pavement starts in the Area mode: drag a rectangle in both directions (Single, Line and Remove are still in the mode bar).

## [0.126.0] - 2026-11-14
<!-- version: {"title":"King selected like other units; profession numbers; save fix","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The King is no longer moved by a left click. Click him (or drag a frame over him) to select him, then use the right button to send him, hunt, pick up, mount, enter a Tower or build. He has a health bar over his head when hurt, fighting or selected.
- A left click on a Tower, Gate, Stone Wall or another building without its own window opens the building detail with demolition.
- A profession whose buildings have no free seat (or none is built) is greyed out and cannot be picked, in the resident's window and in the Population list. Builder and Hauler can always be picked.
- Profession lists show how many residents have the profession and how many places there are, e.g. "Lumberjack (2 / 4)".
- The wanted number of Haulers moved from the Castle's Employment card to the Population panel, above the soldiers.
- Holding Shift while placing a building keeps the same building selected for the next one.
### Fixed
- Saving failed with "check: animals" when an animal was fighting back at another animal (a hunter's dog, a wolf) or at somebody who had already left.

## [0.125.3] - 2026-11-14
<!-- version: {"title":"Studio: Village Green render","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's render of a new Village Green (cobbled round square with a tree and bench, a bell and a notice board; four views, drawn for 4 × 4) waits for review. The game is unchanged.

## [0.125.2] - 2026-11-14
<!-- version: {"title":"Well and Fountain: cut repaired","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- Well and Fountain: the cut of the ground under them is repaired – no missing pieces of stone, joints or ragged rim.

## [0.125.1] - 2026-11-14
<!-- version: {"title":"Studio: Hunting Lodge render","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's render of a new Hunting Lodge (shingled log cabin with a porch and a dog kennel, four views, drawn for 3 × 3) waits for review. The game is unchanged.

## [0.125.0] - 2026-11-14
<!-- version: {"title":"Well art and the Fountain","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Fountain: a new 2×2 building in Housing (20 Stone, 2 Wood, after the first House). Houses within 8 tiles get +2 Happiness (under the +8 cap of everything around a house); its water serves for fighting fires like a Well. It may stand on paths and paving.
### Changed
- The Well has new art: a round stone well with a shingle roof. Its picture and the Fountain's have no dirt patch, so they sit straight on the terrain or paving.

## [0.124.0] - 2026-11-14
<!-- version: {"title":"Kingdom overview: styled info panels","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Kingdom overview: hovering Residents shows how people come (how many a day, with what chance, what stops them) and when they strike or leave; hovering Attractiveness lists everything that moves it now and the rules.
### Changed
- The explanations of the Kingdom overview are panels in the game's style instead of the browser's white hover box.

## [0.123.0] - 2026-11-14
<!-- version: {"title":"Arrivals and departures rework","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Newcomers: a bigger settlement draws more people a day – one, plus one for every ten residents, at most five. Each still settles with the Kingdom Attractiveness chance.
- Unhappy residents act sooner: a strike after two days below Happiness 35 (was 25), leaving after two days below 25 (was three days below 15). A striker returns at Happiness 50 (was 45).
### Fixed
- The building window no longer shows a second, dead "Building store" section left over from the game played before (after loading or starting another game).

## [0.122.1] - 2026-11-14
<!-- version: {"title":"Sight border: slivers and hairlines on lifted ground","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- Bright slivers and thin lines of lit ground along the sight border on sloping ground are gone.

## [0.122.0] - 2026-11-14
<!-- version: {"title":"Walls in eight directions; softer sight border on buildings","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Stone Walls can be dragged in eight directions. A diagonal line is built as steps whose pieces still join, so the wall walk continues and nobody slips through.

### Changed
- The change between lit and dark buildings at the edge of the sight range is now spread over several tiles on both sides of the border, in small steps, like the soft edge on the ground.

## [0.121.2] - 2026-11-14
<!-- version: {"title":"Soft change between lit and remembered buildings","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Buildings at the edge of the sight range no longer switch hard between lit and dark: within 3 tiles of the range they are lit in part, and the change takes a moment.

## [0.121.1] - 2026-11-14
<!-- version: {"title":"Remembered Stone Walls are dimmed like Towers","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- Stone Walls out of sight are now dimmed like Towers and Gates. Before they stayed fully lit, so the Towers next to them looked switched off.

## [0.121.0] - 2026-11-14
<!-- version: {"title":"Stumps on paths, closed walls, ruins inside, soldiers on walls","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Soldiers can be posted on the walls: select them and right-click a finished Stone Wall, Tower or Gate. They climb up and stay there until another order.
- Closed walls give +15 Safety to everyone who stands, lives or works inside them.
- Burnt Ruins inside closed walls lower the kingdom's Attractiveness (5 points each, at most 25).

### Changed
- A stump on a well-worn path disappears after 3 days.

## [0.120.0] - 2026-11-14
<!-- version: {"title":"Approved art: Stables 6 x 8, Lumberjack Hut 4 x 2, Fisherman's Hut, Pitch Kiln","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- New art from the owner's approved pictures: Stables (now 6 × 8 tiles with a paddock), Lumberjack Hut (now 4 × 2 with a saw yard), Fisherman's Hut and Pitch Kiln (both stay 3 × 3). Stables and Lumberjack Huts of older saves keep their old size and show the new picture smaller.

## [0.119.4] - 2026-11-14
<!-- version: {"title":"Asset Studio: Pitch Kiln render for review","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: stone Pitch Kiln with a tiled roof from the owner's renders (4 views) for review. The game still uses the current one.

## [0.119.3] - 2026-11-14
<!-- version: {"title":"Asset Studio: Fisherman's Hut render for review","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: shingled Fisherman's Hut on stilts from the owner's renders (4 views) for review. The game still uses the current hut.

## [0.119.2] - 2026-11-14
<!-- version: {"title":"Asset Studio: Lumberjack Hut with saw yard 4 x 2 for review","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: Lumberjack Hut with a saw yard on 4 × 2 tiles from the owner's renders (4 views) for review. The game still uses the current hut.

## [0.119.1] - 2026-11-14
<!-- version: {"title":"Asset Studio: GPT Stables for review","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: Stables from the owner's sheet (thatched stable with a paddock, 4 views) for review. The game still uses the old Stables.

## [0.119.0] - 2026-11-14
<!-- version: {"title":"Automatic Haulers and Builders; hunger; rebuild ruins; unreachable notice","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- The game now hires Haulers by itself. In the Castle panel (Employments) you set the wanted number; the recommended number is 1 Hauler for every 10 residents and is marked.
- Builders join by themselves once a Builder's Workshop stands (1 Builder for every 2 building sites, at most the workshop places).
- Burnt Ruins have a "Build again" button: the same building is planned on the spot for its full price.
- A notice when nobody can reach a store, pile or building site.

### Changed
- Hunger now costs more Happiness the longer it lasts. After about 4 days hungry residents strike, after about a week they leave.

### Fixed
- The explanations in the Kingdom Overview no longer vanish every time a percentage changes.

## [0.118.0] - 2026-11-13
<!-- version: {"title":"Zoom-out and big-map performance; fire spreads less; walled-in store fix","type":"feature","reconstructed":false,"saveVersion":62} -->
### Fixed
- Zooming out no longer freezes the game, also on big maps: far ground is painted as a quick draft and new ground comes in over a few frames.
- The tip bubble no longer slows every frame while it is open.
- A building site no longer waits for ever when its materials were booked in a store that got walled in by buildings: they are taken from another store.

### Changed
- Fire jumps to a neighbouring building less often (5 % instead of 15 % every 5 seconds).

## [0.117.1] - 2026-11-13
<!-- version: {"title":"Fire immunity after extinguishing; Builders clear Burnt Ruins","type":"feature","reconstructed":false,"saveVersion":62} -->
### Fixed
- A building whose fire was put out is now safe from fire for half a game day, so it no longer catches fire again straight away.

### Added
- Builders can now clear Burnt Ruins: mark them for removal like any other building. Ruins return no materials.

## [0.117.0] - 2026-11-13
<!-- version: {"title":"GPT barracks 4x5; Marketplace 4x4","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- New Barracks picture: a stone barracks with a tower, flag, lanterns and an armoury lean-to. The Barracks is now 4 × 5 tiles.
- The Marketplace is now 4 × 4 tiles, so its stalls are the same size as other buildings.
- Barracks and Marketplaces in older saves keep their 3 × 3 place and show the new picture smaller.

## [0.116.0] - 2026-11-13
<!-- version: {"title":"Approved GPT buildings: Lumberjack Hut, Hunting Lodge, Marketplace, Pitch Kiln, Fisherman's Hut, Mill","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- New pictures approved in the Asset Studio: Lumberjack Hut, Hunting Lodge, Marketplace, Pitch Kiln, Fisherman's Hut and the Mill (its sails still turn).
- The Pitch Kiln and the Fisherman's Hut are now 3 × 3 tiles, so their doors are the same size as on other buildings. Kilns and huts in older saves keep their 2 × 2 place and show the new picture smaller.

## [0.115.7] - 2026-11-13
<!-- version: {"title":"Wooden GPT builder's workshop; stone version in the Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- New Builder's Workshop picture: a timber workshop with a crane, a drafting table and a lantern. A stone version is ready in the Asset Studio for a later choice of material.

## [0.115.6] - 2026-11-13
<!-- version: {"title":"Wooden GPT pantry as the Granary; stone version in the Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- New Granary picture: a wooden pantry with shelves of jars and fruit and a lantern. A stone version is ready in the Asset Studio for a later choice of material.

## [0.115.5] - 2026-11-13
<!-- version: {"title":"GPT market square in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT market square in four views for review.

## [0.115.4] - 2026-11-13
<!-- version: {"title":"GPT pitch works in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT pitch works (Smolárna) in four views for review.

## [0.115.3] - 2026-11-13
<!-- version: {"title":"GPT hunting hut in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT hunting hut in four views for review.

## [0.115.2] - 2026-11-13
<!-- version: {"title":"GPT fishing hut in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT fishing hut in four views for review.

## [0.115.1] - 2026-11-13
<!-- version: {"title":"GPT windmill in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT windmill in four views for review.

## [0.115.0] - 2026-11-13
<!-- version: {"title":"Farmhouse 4x4 with the GPT farmstead","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- New Farmhouse picture: a farmstead with a fenced, paved yard. The Farmhouse is now 4 × 4 tiles, so its doors are the same size as on the houses. Farmhouses in older saves keep their 3 × 3 place and show the new picture a little smaller.

## [0.114.3] - 2026-11-13
<!-- version: {"title":"GPT buildings at one scale; no rim under houses","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Houses, the Bakery and the Armory are drawn at one scale: doors and windows are the same size on every building. The light rim under the houses is gone.

## [0.114.2] - 2026-11-13
<!-- version: {"title":"GPT buildings without the light rim, toned to the game","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The new House, Bakery and Armory pictures sit on the ground without a light rim and are toned down to match the rest of the game.

## [0.114.1] - 2026-11-13
<!-- version: {"title":"GPT logger's cabin in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT logger's cabin in four views for review.

## [0.114.0] - 2026-11-13
<!-- version: {"title":"Four House looks; new Bakery and Armory art","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Four new House looks (with a bench, a woodshed, a porch, a garden). Each new House takes the next look, so neighbouring houses differ.

### Changed
- New Bakery and Armory pictures, approved by the owner in the Asset Studio. The Bakery oven glows at night.

## [0.113.2] - 2026-11-13
<!-- version: {"title":"GPT Bakery views; Armory roof fix in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT-made Bakery in four views for review.

### Fixed
- Asset Studio: the GPT Armory front view (0°) had the roof ridge cut off; v2 shows the whole roof.

## [0.113.1] - 2026-11-13
<!-- version: {"title":"GPT Armory views in the Asset Studio","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Asset Studio: the owner's GPT-made Armory in four views (0°, 90°, 180°, 270°) for review, as imported images next to the Studio designs.

## [0.113.0] - 2026-11-13
<!-- version: {"title":"Castle and Barracks heating, Smelter burns 3 Wood","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- The Castle and the Barracks heat in autumn and winter too. The Castle burns twice a House's Wood and warms the residents who sleep in the settlement; in a cold Barracks soldiers fight 10 % weaker.

### Changed
- The Smelter burns 3 Wood a batch (was 2): 3 Iron Ore + 3 Wood → 1 Iron.

## [0.112.0] - 2026-11-13
<!-- version: {"title":"Winter heating and wood as fuel","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Winter heating: every House has a woodpile for 12 Wood. From summer on, Haulers fill it, and a resident with nothing to do carries Wood to his own House. In autumn an occupied House burns 1 Wood a day, in winter 3 (half again in frost). A warm House gives its residents +6 Happiness (+3 in autumn); a cold one −12 (−6 in autumn) and poorer rest at home.
- Heating notices: "N houses are cold" in winter and a warning at the start of autumn when the stored Wood will not last the winter. The Food Economy window shows Wood for winter; a House's tooltip shows its woodpile and whether it is warm.
- New switch "Winter heating" in New Game and in Settings (on by default; seasons off = no heating).
- Wiki: Winter heating page; the winter guide covers firewood.

### Changed
- The Bakery's oven burns 1 Wood a batch (1 Flour + 1 Wood → 6 Bread). The Smelter's 2 Wood and 1 of the 2 Wood of the Swordsmith and Armorer are now shown as fuel in the workshop window and the Wiki.

## [0.111.2] - 2026-11-13
<!-- version: {"title":"Saving works while the Pitch Kiln switches recipes","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- Saving no longer fails with "check: food" while a Pitch Kiln has finished Torches (or Pitch) waiting and has already switched to its other recipe.

## [0.111.1] - 2026-11-13
<!-- version: {"title":"Pitch Kiln no longer stops after its first batch","type":"fix","reconstructed":false,"saveVersion":62} -->
### Fixed
- The Pitch Kiln no longer stops after its first batch. When it switched between Pitch and Torches, the finished goods of the other recipe stayed in its output and blocked every next batch; the Pitch Maker now carries them out. Haulers also take such leftovers from any workshop.

## [0.111.0] - 2026-11-13
<!-- version: {"title":"Wiki v2: units, animals, how the game works, guides","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Wiki: Units and people (resident, king, recruit, soldier, archer, swordsman, knight, merchant caravan) with their kit, health, attack, armour, range, training cost and wage from the game data.
- Wiki: animals (rabbit, deer, wild boar, wolf, horse, cat) with health, attack and meat.
- Wiki: How the game works – 14 pages: night and threats, seasons and weather, work speed, experience, employment, stores and haulers, paths, forests, deposits, walls and patrols, own caravan, children, fog, map size.
- Wiki: five guides – the first day, bread, weapons and army, surviving winter, defending the night.
- Wiki: "In your kingdom" on building and resource pages – how many stand, are being built, lack workers or report a problem, and how much is in stock.

## [0.110.0] - 2026-11-13
<!-- version: {"title":"Wiki v2: every building, resource and profession explained","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Wiki: every building, resource and profession now explains what it is for, how it works and gives tips and common problems, in English and Czech (62 more pages).

## [0.109.0] - 2026-11-13
<!-- version: {"title":"Wiki v2: sections and production chains","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Wiki: every page now has fixed sections – what it is for, how it works, where it comes from and where it goes, numbers, tips and unlocking.
- Wiki: production chains drawn from the game data on building and resource pages (e.g. Wheat Field → Wheat → Mill → Flour → Bakery → Bread → eaten by the people), and a new All production chains page.
- A "?" in building, unit and nature windows opens the matching Wiki page.
- More numbers on pages: build time, work radius, batch time, mining speed and reach, harvest, stored goods, fuel, light radius, sight.
- The bread chain (Farmhouse, Wheat Field, Mill, Bakery, Granary, Wheat, Flour, Bread, Farmer, Miller, Baker) is fully written up in English and Czech.

### Changed
- Wiki search also finds text inside the pages, not only titles.

## [0.108.0] - 2026-11-13
<!-- version: {"title":"Map size choice","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- New Game: choose the map size – 100 × 100 (as before), 150, 200, 250 or 300 tiles a side. A bigger map has more trees, stones, ore, lakes, rocks and wild animals; the castle stays in the middle. Bigger maps are heavier on performance.

### Changed
- Starting a new world is faster (the check that trees and deposits do not cut off a route is now mostly local).

## [0.107.0] - 2026-11-13
<!-- version: {"title":"Soldiers and Pitch Kiln in their approved art","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Soldiers wear the look of their rank (Soldier, Archer, Swordsman, Knight, approved in the Asset Studio); Recruits keep the plain soldier look.
- The Pitch Maker and the Pitch Kiln have their own approved looks (stone pitch house with a yard, glowing at night).

## [0.106.0] - 2026-11-13
<!-- version: {"title":"Own caravan","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Send your own caravan from the Marketplace: needs a free Horse Wagon (else the button says why). Choose goods (anything, weapons and armour too) up to the wagon's load and how many soldiers escort it; the window shows the estimated earnings and the risk of an ambush. It is away 2–4 days and comes back with gold; after an ambush part of the goods is lost and the escort is hurt (nobody dies).

## [0.105.0] - 2026-11-13
<!-- version: {"title":"Wall patrol","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Army order "Patrol – walls": chosen soldiers climb to the wall walk at a wall beside a Tower or Gate, walk the walls and stop 5–15 s at each Tower and Gate; they see 3 tiles farther from the wall, and Archers shoot from it.

## [0.104.0] - 2026-11-13
<!-- version: {"title":"Gate 2 × 2","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- The Gate is 2 × 2 and joins the walls at its sides; the King climbs to the wall walk from the walls beside it. Gates in saved games stay as they are (1 × 1) and keep working. The new Gate uses provisional art for now.

## [0.103.0] - 2026-11-13
<!-- version: {"title":"The wolf stays, Towers turn, deposits on the minimap","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- A wolf that attacked someone at night does not leave at dawn: it hides in a den 15–25 tiles away for 2–4 days, roams there by day and may hunt again at night. A notice says so, and the Army tab has "Hunt the wolf" for the chosen soldiers.
- R (or Shift + wheel) turns a Tower while placing it, like a Gate.
- Minimap buttons ⛰ and ◈ mark the found Stone and Iron deposits (free ones bright, ones in use dim); a click on a mark goes there.

## [0.102.0] - 2026-11-13
<!-- version: {"title":"Stone ×2, Iron Mine over its deposit, building store","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Workshop and producer windows show the building's own store: input, output or the pile by the building, with amounts, what is on the way and when it is full.

### Changed
- Stone deposits hold twice the stone (160–320, large 400–640); deposits in saved games get twice their remaining stone.
- An Iron Mine is built over its Iron Deposit, like a Quarry. Mines built earlier beside a deposit keep working.
- Saplings do not regrow on a worn path (level 2 and up) or on paving; young trees there wither.

### Fixed
- The automatic trade section of the Marketplace no longer flickers and jumps.
- A building window opened in the grey fog no longer closes at once.

## [0.101.0] - 2026-11-12
<!-- version: {"title":"Saving fixed; stores, Barracks limit, miners and pitch maker","type":"feature","reconstructed":false,"saveVersion":62} -->
### Fixed
- Saving works again. Saves were refused after a Hunter killed a wolf, after a workplace, Fisherman's Hut or house burnt down, after a resident died in his sleep, after a soldier in a squad left the army, and 20 days after the last caravan. Saves with a workshop mid-batch made before the Pitch Kiln change in 0.99.0 load again (the batch finishes as it started).
- A failed save says which part failed and tries again up to 3 times; the Dev tool can download the failed data for a bug report.

### Added
- Stores (Warehouse, Material Yard, Granary, Armory, Starter Stockpile) list what is stored there, also goods at 0, and say when nobody makes a good yet ("Pitch – nobody makes it (build: Pitch Kiln)"), with a line on where other goods belong.
- Barracks: a slider sets how many places automatic employment fills (default 4 of 12). Placing a soldier by hand may go above it; lowering it dismisses nobody.

### Changed
- The Marketplace no longer needs a Warehouse.
- Keys + and − make the game faster or slower (pause, 1×, 2×, 3×).
- Marked rocks come first: Quarry and Mine Miners go to break them, nearest first, as many as there are rocks; one Miner always stays in each workplace. A lent Miner keeps his workplace and wage.
- When a Quarry, Mine or Lumberjack Hut pile is full and no Hauler comes, one of its workers carries a load to the store and works on.
- The Pitch Maker fetches his Wood and carries Pitch and Torches to the store himself; Haulers no longer work for the Pitch Kiln.
- Your own buildings can be opened and hovered also in the grey fog (explored ground out of sight).

## [0.100.0] - 2026-11-12
<!-- version: {"title":"Army squads","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Army squads: with two or more soldiers chosen in the Army panel, a ⚑ at the right of their rows makes them a squad. Squads show as chips under the orders; a click on one chooses all its soldiers (Shift adds them), × dissolves it. A soldier is in one squad at most; squads are saved.

## [0.99.0] - 2026-11-12
<!-- version: {"title":"Hauler priority, faster Pitch Kiln, hunters without range","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Haulers: choose what a Hauler carries first – Anything (as before), Building materials, Food, Workshop inputs, Workshop products, or one good (e.g. only Stone). The choice is in the Hauler's window and, with several Haulers chosen on the map, in the command bar; the Population list shows it. With nothing of that kind to carry the Hauler carries anything else; food for the hungry still comes first.
- A notice when goods wait in a producer's pile for over 2 game hours while the Haulers carry other things.

### Changed
- Pitch Kiln works twice as fast with double batches: 4 Wood → 2 Pitch in 15 s, 2 Wood + 2 Pitch → 6 Torches in 10 s (before 2 → 1 in 30 s and 1 + 1 → 3 in 20 s).
- Hunters hunt anywhere on the known map, nearest to their lodge first (before: within 34 tiles). Fishers already had no range.
- The right mouse button on the map closes the Buildings menu and the Army panel (with soldiers chosen in the Army panel it sends them, as before). Escape closes them too.

## [0.98.0] - 2026-11-12
<!-- version: {"title":"Army tab; lifted terrain fix","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Army tab beside Buildings: every soldier (Recruits and trained units) by Barracks, with rank, health, order and what he is doing. A click moves the camera to the soldier and marks him; Shift + click chooses more. Two orders: Patrol (the default) and Guard (the soldier stands where he is; the right mouse button on the map sends the chosen ones to a guard post).
- Soldiers on Patrol walk a round of the settlement, spread along it, instead of milling around their Barracks.

### Fixed
- Lifted terrain (0.96.0, 0.97.0): tiles were drawn through a crossed outline, which left a black checkerboard on gentle slopes. The outline now goes round the tile.

## [0.97.0] - 2026-11-12
<!-- version: {"title":"Kingdom overview explains its values","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Kingdom overview: every value explains itself on hover – how it is worked out with the current numbers, what moves it now, and one tip when something is low (Residents, Unemployed, Happiness, Food, Rest, Housing, Safety; also on the three chips in the top bar).

## [0.96.0] - 2026-11-12
<!-- version: {"title":"Terrain height: lifted ground","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Terrain height, second part: the ground is drawn lifted by its height, as in the Studio's World Lab – hills rise, valleys with water lie lower. Buildings, people, animals, trees, rocks, fields, piles and markers stand at the height of their place, the pointer picks the tile under the lifted ground, and the fog edge follows the hills. The address `?lift=off` draws the ground flat again (`?lift=on` back); the hills' rules stay either way.

## [0.95.0] - 2026-11-12
<!-- version: {"title":"Approved tasks: woodcutters, pitch kiln, idle residents","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Woodcutters fell mature trees anywhere on the known map, nearest to their hut first (before: within 18 tiles only). A hut 40 or more tiles from its nearest mature tree gets a notice to build a new one closer.
- No bar over a tree being felled; the tree shivers at each blow instead.
- Unemployed residents no longer move and stand all together: everyone waits for a time of their own (3–14 s) and picks one of a few spots at random.
- The King's cargo controls ("Deliver to storage") hang in a small panel under the top bar and no longer replace the kingdom overview.

### Fixed
- Pitch Kiln: the choice between Pitch and Torches now holds (the kiln used to switch back by itself at once). The choice has three options – Automatic, Pitch, Torches – and in Automatic the window says what is made and why, with a slider for the Torch target.

## [0.94.0] - 2026-11-12
<!-- version: {"title":"Terrain height: hills, slopes and their rules","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Terrain height, first part (owner, 12 Nov). Every world now has smooth hills, near-level plains and valleys around water, worked out from the world's ground and seed. Slopes are shaded on the map and on the minimap. Walking uphill is slower (down to half speed on the steepest slopes) and routes go round a steep hill when that is quicker. Buildings need nearly level ground ("The slope is too steep here"); fields and orchards take steeper ground; walls follow the terrain. From a hilltop people see up to 6 tiles further. The ground is not lifted on screen yet – that is the next part.

## [0.93.0] - 2026-11-12
<!-- version: {"title":"Recruits in the Barracks","type":"feature","reconstructed":false,"saveVersion":62} -->
### Added
- Recruits (owner, 9 Nov): everyone hired into a Barracks starts as a Recruit – no weapon, basic combat stats (10 more HP than a resident), patrols near the Barracks and defends residents like a unit, and earns 1 Gold a day. With weapons in an Armory a Recruit trains into a Soldier, Swordsman, Archer or Knight and keeps the place. The Barracks window shows the places used, Recruits with their Train buttons and trained units in two lists; Population shows the rank (Recruit or the unit type).

### Changed
- A Barracks has 12 places (before 5).

## [0.92.0] - 2026-11-12
<!-- version: {"title":"Performance with 30 residents","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Performance with a larger village (owner, 12 Nov: about 6 FPS with 30 residents). The remembered (grey) ground under Fog of War is now drawn by the browser's own image blending instead of a pixel loop, sight changes are applied to the map a few times a second within a small time budget, and only inside the view. When a trodden path changes, only the part of the ground that really differs is painted again; a whole repaint is spread over several frames instead of freezing one.
- The homes of residents are worked out once while residents and houses stay the same (before: many times a step for every resting resident).
- Tips follow the window layout five times a second, the map hover is looked up eight times a second while the pointer rests, and the panels over the map no longer blur the map under them.

### Fixed
- The performance test no longer pauses the game by pressing Escape (since 0.86 Escape opens the pause menu).

## [0.91.0] - 2026-11-10
<!-- version: {"title":"Building table values and fish notice","type":"feature","reconstructed":false,"saveVersion":62} -->
### Changed
- Values from the owner's building table (9 Nov): one worker in the Lumberjack Hut, Hunting Lodge, Fisherman's Hut, Bakery, Bowyer, Swordsmith, Armorer, Wheelwright, Pitch Kiln and Stables; daily wage 2 for Bowyer, Swordsmith and Armorer; Wheat Field yields 10 Wheat, Orchard 8 Apples; Mill turns 4 Wheat into 2 Flour, Bakery 1 Flour into 6 Bread; Barracks equipment store holds 30.

### Fixed
- When residents are hungry, food that reaches a store is eaten at once, so a Fisher's basket could vanish from the stock without a word ("the Fisher brought fish but nothing was added"). The game now says so with a notice ("Hungry residents ate food the moment it reached the stores: Fish 5"), and the resource tooltip in the top bar shows what came in and went out today so far (for example +5 Fishing, −5 Villager Consumption).

## [0.90.0] - 2026-11-09
<!-- version: {"title":"Building windows (Marketplace, Builder's Workshop, storage, house, trees and deposits, food economy) show less text.","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- Building windows (Marketplace, Builder's Workshop, storage, house, trees and deposits, food economy) show less text. Their explanations are behind an "i" icon at the top right and show on hover.

## [0.89.0] - 2026-11-09
<!-- version: {"title":"Building window: - The two employment bans (this building, the whole building type) are two icons at the top right.","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- Building window:
  - The two employment bans (this building, the whole building type) are two icons at the top right. Their explanation shows on hover, and a ban that is on is highlighted.
  - The most important issue (for example "Output is full – no room in storage") is right under the title, with a blinking orange "!".
  - The note about dismantling shows when you hover over the Dismantle button. The refund line stays.

## [0.88.0] - 2026-11-09
<!-- version: {"title":"Night lighting now uses the approved \"lighting v1\" settings from the Light Lab: - A bluish night colour and a warm dusk colour.","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- Night lighting now uses the approved "lighting v1" settings from the Light Lab:
  - A bluish night colour and a warm dusk colour.
  - Each kind of light has its own colour, reach, strength and flicker: torches, lanterns, campfires, braziers, forges and house windows.
  - The light also reaches up walls.
  - Lights switch on one by one as it gets dark.

## [0.87.0] - 2026-11-09
<!-- version: {"title":"The top bar shows the time of day (hours and minutes) next to the day.","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- The top bar shows the time of day (hours and minutes) next to the day. The day starts at dawn at 05:00, and the night begins at 20:00 in spring and autumn, about 21:30 in summer and 17:30 in winter.
- Hovering over a resident shows the name, then the occupation and its level in that occupation (for example "Builder · lvl 48") instead of the overall level. The label is plain, without the frame ornaments. Hovering over a child shows its name and "Child".

## [0.86.0] - 2026-11-09
<!-- version: {"title":"The map now fills the whole window from the left edge to the right edge and down to the bottom.","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- The map now fills the whole window from the left edge to the right edge and down to the bottom. The Buildings bar (Buildings, Mark to clear, Unmark) and the status line float over the map at the bottom.
- The top bar is rearranged. The day and weather are at the top right. The Kingdom overview is at the bottom left of the bar, with the food supply right beside it. The game speed and night controls, More and Wiki are on the right of the second row.
- The King's health and level are no longer shown in the top bar. Click the King to open his panel.
- Getting started is now its own window at the right, under the top bar, instead of a dialog behind the "?" button. The map stays usable while it is open. Click its heading to fold it to one line and to open it again. The browser remembers the choice.

## [0.85.2] - 2026-11-09
<!-- version: {"title":"Fog of War: the edge of sight no longer has a dark line with lighter remembered land behind it.","type":"fix","reconstructed":false,"saveVersion":61} -->
### Fixed
- Fog of War: the edge of sight no longer has a dark line with lighter remembered land behind it. On the default ground the old edge darkening now only fades toward unknown land, and the ground's own soft fade to the remembered grey does the rest.

## [0.85.1] - 2026-11-09
<!-- version: {"title":"Fog of War: the edge of sight is now soft too.","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- Fog of War: the edge of sight is now soft too. Ground fades from full colour to the remembered grey over about two tiles, like the edge of unknown land, instead of switching tile by tile.

## [0.85.0] - 2026-11-09
<!-- version: {"title":"Kingdom bar, smooth seasons and fish, Light Lab and terrain height lab","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- Fish in rivers and lakes no longer pop in and out. They rise slowly from the depth and sink back. While they are up they drift slowly. Now and then a fish touches the surface and one or two light rings spread out. There are no rings under the winter ice.
- Seasons now change gradually over about 3 game days around the turn of the season instead of all at once. Snow comes first in the shade and on stony ground and last by the water. The thaw starts by the water and on sunny meadows. In autumn the grass turns yellow in patches. Flowers, plants, trees and bushes change patch by patch with the ground. A game saved during the change loads at the same point.
- Dev tool: a new "World look" group sets how many game days the season change takes and in how many steps.
- The Kingdom overview now has a fixed place in the bottom-left corner of the map: a permanent bar with residents and housing, the unemployed, the average needs, the mood and the Kingdom Attractiveness. It never covers the "Follow the king" chips, Notices, the minimap or the side buttons. The text is larger and the values are bold.
- The Kingdom overview bar folds to a one-line strip with residents and mood (click its title, or the overview in the top bar). The browser remembers the choice.
- The Buildings menu now opens across the whole width of the window, from the left edge to the right edge. While it is open, the Kingdom overview, "Follow the king" and the minimap with Notices move up above it.
- The Notices bar can be dragged anywhere on the map by its grip (⠿). The browser remembers its place and keeps it on screen when the window size changes. Double-click the grip to put it back in the corner. Slid away, a moved bar folds to the nearer side edge of the map, and its "!" tab stays there.

## [0.84.2] - 2026-11-09
<!-- version: {"title":"The starter stockpile has its approved Studio look: a tarp camp store with sacks, barrels, logs, crates and a lantern.","type":"feature","reconstructed":false,"saveVersion":61} -->
### Changed
- The starter stockpile has its approved Studio look: a tarp camp store with sacks, barrels, logs, crates and a lantern. It was approved on 7 Nov but never wired in.

## [0.84.1] - 2026-11-09
<!-- version: {"title":"Fog of War: land you walk away from turns grey right away.","type":"fix","reconstructed":false,"saveVersion":61} -->
### Fixed
- Fog of War: land you walk away from turns grey right away. It no longer stays in full colour for seconds as squares beyond your sight.
- Bushes that leave sight take their remembered look at once.
- Remembered ground has one even brightness. The soft edge comes from the fog edge layer.

## [0.84.0] - 2026-11-09
<!-- version: {"title":"Woodcutters and forests, iron mine spot, tips off the HUD","type":"feature","reconstructed":false,"saveVersion":61} -->
### Added
- A Lumberjack Hut with no mature tree in its working radius gets the notice "The Lumberjack Hut has nothing to fell – build a new one near a forest". Clicking it moves the camera to the hut. The notice goes away once a tree in range is mature again.
- The Lumberjack Hut window shows the young trees in its working radius and roughly how many days until the next one is mature. The estimate counts the season (nothing grows in winter).
- When a planned building on unexplored ground is cancelled because something blocks the site, it now shows in Notices with the building and the reason, for example "Construction cancelled: House – Rock". Clicking it moves the camera to the spot.
- Dev tool: a new "Forest and wood" group with forest growth, sapling chance after felling (0–100 %, default 50 %), growth near a Lumberjack Hut (×1–×3, default ×1.5), woodcutter radius, chopping time and wood per tree. The values are saved with the game and reset like the others. The economy overview has a line with the mature and young trees around the huts and the wood per day.
### Changed
- Automatic employment no longer sends Woodcutters to a Lumberjack Hut with nothing to fell. It sends no more Woodcutters than the hut has mature trees in range. A Woodcutter who has had nothing to fell for about a game day leaves a hut that has more Woodcutters than mature trees and can take other work.
- Forests grow back faster around Lumberjack Huts. After felling, a Woodcutter plants a sapling on the spot half of the time, so the stump stage is skipped. Stumps and young trees inside a hut's radius grow 1.5 × as fast.
- The kingdom's first Granary and first Lumberjack Hut are built and supplied before other sites. In the tutorial the hut is now ready right after the Granary.
- In build mode the Iron Mine says why a spot is invalid: "Unexplored", "On the deposit – the mine stands beside it", "Rock", "Tree", "Out of deposit range" and so on. On unexplored ground it can only be planned near an Iron Deposit you have already seen, so a blind plan is no longer cancelled later.
- New worlds use world generator 5 (codes MKW5-…). The Iron Deposit nearest to the Castle always has a free spot for an Iron Mine right beside it. Older world codes still work for their saved games, but not for a New Game.
- Tips keep clear of the top bar (resources, speed, day), the side tabs, Settings and the Dev tool, "Follow the king", the bottom bar, the Notices bar and every open window, like the tutorial bubble. They move when the window size changes or a panel opens or closes.
- A tip you leave alone for a game day folds into the Notices bar (the "!" tab). Click it there to read it again, or close it with ×.
- Only one tip shows at a time; the others wait their turn. The night speed-up tip waits too.
- The same notice for several buildings is one row with a count (×2).
- The workplace window tells free places from workers who are away: "4 workers missing, 1 away from the building" instead of "5 workers missing (0 present)".
- The Quarry step of the tutorial also points at large Stone Deposits and prefers a deposit you can see.
- Night speed-up shows a small moon on the held speed button in the icon look too.
### Fixed
- Czech: the Woodcutter's "No mature trees in working radius" and other wait messages of Woodcutters, Miners and Fishermen are translated.
- The construction site window shows the resource name ("Wood: 6 needed …") instead of "wood:".
- Marking for removal says what was marked, with the right number form: "Marked for removal: 4 rocks, 1 thicket." Cancelling uses the right number form too.

## [0.83.2] - 2026-11-09
<!-- version: {"title":"Paths: residents shuffling between waiting spots at the Castle or their workplace no longer wear round patches and short straight trails into the grass within a","type":"fix","reconstructed":false,"saveVersion":61} -->
### Fixed
- Paths: residents shuffling between waiting spots at the Castle or their workplace no longer wear round patches and short straight trails into the grass within a day. Paths now come from real trips.
- Paths: only bare soil (from level 2) forms a flat worn area. A block of merely trampled grass stays thin trodden lines instead of a dark green circle.

## [0.83.1] - 2026-11-09
<!-- version: {"title":"Fog of War: land seen for the first time no longer stays black for seconds, in black jagged notches or as flat grey strips at the edge of sight.","type":"fix","reconstructed":false,"saveVersion":61} -->
### Fixed
- Fog of War: land seen for the first time no longer stays black for seconds, in black jagged notches or as flat grey strips at the edge of sight. This happened with many residents walking at the edge of the known land.

## [0.83.0] - 2026-11-09
<!-- version: {"title":"Thickets, rock ridges and large deposits","type":"feature","reconstructed":false,"saveVersion":61} -->
### Added
- Large nature objects in new worlds, drawn with the approved Studio art:
  - Thickets of 2 × 1, 2 × 2 and 3 × 2 tiles along the water and at forest edges. They are hazel or bramble in spring and summer and have their own autumn and winter looks.
  - Rock ridges (4 × 2) and larger rock obstacles (2 × 2), with a snowy look in winter.
  - Large Stone and Iron Deposits (3 × 3) with about twice the stone or ore. They show the large pile until a third is mined, then the medium and small piles.
- Mark to clear on one tile of a thicket or a rock group marks the whole object. A thicket is cut like its bushes and gives nothing; a rock group gives 10 Stone per tile.
### Changed
- New worlds use world generator 4 (codes MKW4-…). One ordinary Stone and one Iron Deposit fewer make room for the large ones. Older world codes still work for their saved games, not for a New Game.
- Save schema 61. Older saves cannot be loaded.

## [0.82.0] - 2026-11-09
<!-- version: {"title":"Dev tool","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- Dev tool: a wrench icon under Settings opens a menu for tuning the economy. You can hide it in Settings with "Show Dev tool".
  - The first slider sets how fast new residents arrive. Next to it you see "Next resident in ~X h" and what is holding arrival back.
  - More sliders (×0.25–×4) for production, food eaten, wages, taxes and gold income, market buy and sell prices, construction speed, and field and orchard growth.
  - An Advanced section with the per-building multipliers.
  - An economy overview for the last day and a 3-day average.
  - Quick actions: +100 gold, +50 of each resource, advance 1 day, summon a caravan, add a resident.
  - Reset, Copy values, the profiler (F8) and the tooltip delay.
  - A dot on the icon shows when any value is not ×1.
- The Dev tool values are kept in the save. A new game starts at ×1.
### Changed
- Settings now always shows "Show Dev tool". The hidden 5-click unlock is gone.

## [0.81.0] - 2026-11-09
<!-- version: {"title":"Soldiers, notices, tooltips, night","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- Population has a Soldiers group that lists every soldier, including the starting garrison. Clicking a soldier centres the camera on him.
- The Barracks shows what is missing before you can train, for example "Needs an Armory" or "Needs 1 Sword in an Armory. Swordsmith makes Sword from 3 Iron + 2 Wood". Train stays disabled until everything is there. Before, the gold was taken and the order waited forever.
- Building tooltip: hold the mouse over a building for 0.8 s to see its name and state.
  - Workplaces show their workers and production.
  - Stores show their stock.
  - Houses show their residents.
  - Construction sites show what they still need.
  - You can switch it off in Settings. In developer mode the delay can be tuned.
- New Settings option "Auto speed-up at night". It is off by default. When on, nights run at ×3, the speed indicator shows ☾3×, and the earlier speed returns at dawn. After one year a tip offers to turn it on.
### Changed
- Notices:
  - The same notice shows only once. Repeats only update it.
  - After you close it, it comes back no sooner than 4 game days later. Danger is never held back.
  - The closed state is kept in saves.
  - A notice whose details change, for example from "run out" to "exhausted", is redrawn.
- The folded notice bar slides into a small icon at the right edge, with an arrow and "!". A new notice slides out as one line for 4 s and goes back.
- Tutorial:
  - The arrow no longer covers the Population tab.
  - The arrow and bubble follow window resizes and opening panels.
  - Every build step now ends when you place its blueprint, including the House.
### Fixed
- Soldiers no longer fall asleep in the Castle right after the start of a new game.

## [0.80.1] - 2026-11-09
<!-- version: {"title":"UI designs can place every bar and tab freely, anchored to the nearest screen edge and resized.","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- UI designs can place every bar and tab freely, anchored to the nearest screen edge and resized. The game applies such a design once it is chosen for the game.

## [0.80.0] - 2026-11-09
<!-- version: {"title":"Performance","type":"feature","reconstructed":false,"saveVersion":60} -->
### Changed
- The game runs much faster in a bigger village. Measured in a browser without a graphics card, at ×3 with 25 residents:

  | | Before | After |
  |---|---|---|
  | FPS at ×3 | 7 | about 31 |
  | FPS at night | 8 | 26–36 |

  The ground is repainted in turns instead of all at once, and on the Canvas renderer it is drawn as one image. Paths are found with fewer allocations and give up early on closed-in goals. Tree growth checks are shared, and the night glow is drawn only around the lights.
- Ground that leaves your sight may turn grey a few hundred milliseconds later. New footpaths may appear up to about ¾ s later.
### Added
- Developer mode has a frame profiler. Press F8 or use the Profiler button in the Balance panel to see the time per frame for each system, the drawing, the fog, the minimap and the UI.

## [0.79.0] - 2026-11-08
<!-- version: {"title":"New approved nature art: stone and iron deposits shrink as they are mined, snow-covered in winter.","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- New approved nature art: stone and iron deposits shrink as they are mined, snow-covered in winter. There are new rock obstacles and five shrub species with seasonal looks. Wheat fields go from sown to ripe, and orchard apple trees go from blossom to fruit.
### Changed
- Paths use the owner's new style from the Path Lab: wider, more winding paths with a ragged edge and more visible soil.
### Fixed
- Fishers walking to the storage now have their own approved look instead of the old drawn figure.

## [0.78.1] - 2026-11-08
<!-- version: {"title":"Four medieval tutorial pointers to choose from in the UI design (forged iron arrow, gloved hand, red pennant, gilded parchment arrow); the golden arrow stays th","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- Four medieval tutorial pointers to choose from in the UI design (forged iron arrow, gloved hand, red pennant, gilded parchment arrow); the golden arrow stays the default.

## [0.78.0] - 2026-11-08
<!-- version: {"title":"Balance and fixes from the 0.76 playtest","type":"feature","reconstructed":false,"saveVersion":60} -->
### Changed
- Wood:
  - The tutorial asks for the Lumberjack Hut right after the Granary.
  - Woodcutters fell a tree in 7 s instead of 15 s.
  - The normal start has 110 wood and 160 bread.
- Food:
  - Hunters search further and bring about 30 % more meat.
  - Game respawns near Hunting Lodges.
  - Fishers catch 9 fish a day instead of 6, and more on plentiful water.
  - Fields and orchards grow 20 % faster.
  - A Bakery batch gives 5 bread.
  - Portions are smaller: Small 0.4, Normal 0.8, Generous 1.2.
  - The days-of-food readout counts real portions.
- Every new world has a Stone Deposit for a Quarry 8–16 tiles from the castle. The tutorial's stone step points to it. World codes are now MKW3; old codes still load in saves but not for a new game.
- Windows:
  - The tutorial bubble and tips keep clear of open menus and panels.
  - The Royal tasks card moves above the open Build menu.
  - Long event lines wrap.
  - The King or resident panel and the Policy / Employments cards close each other.
  - Opened from its tab, Employments no longer shows the Kingdom policy section.
  - The King panel fits its window.
- Czech: number forms ("10 kamenů", "na 2 dny"), "zemřel/zemřela" by sex, "Více" instead of "More", and "Materiál" instead of "Sklady" with a tooltip.
- The Speed tutorial step stays done.
- The stump message shows only for wood the King chopped.
### Added
- A hidden developer mode: click the version in Settings 5 times. Its Balance panel has 11 sliders (0.25–3×) for output, portions, immigration, wages and taxes, plus Reset, Copy values and a live overview. The values stay in the browser only.

## [0.77.2] - 2026-11-08
<!-- version: {"title":"Save next to a ford","type":"fix","reconstructed":false,"saveVersion":60} -->
### Fixed
- The game can be saved again while a Fisher fishes next to a ford. Before, saving and autosave failed with a "damaged save" message.
- If saving ever fails, the message now says the game could not be saved and that the next autosave will try again.

## [0.77.1] - 2026-11-08
<!-- version: {"title":"World Editor: the close-up zooms with the mouse wheel (or + and -), moves with the arrow keys, WASD or by dragging, and is as tall as the map preview.","type":"feature","reconstructed":false,"saveVersion":60} -->
### Changed
- World Editor: the close-up zooms with the mouse wheel (or + and -), moves with the arrow keys, WASD or by dragging, and is as tall as the map preview.

## [0.77.0] - 2026-11-08
<!-- version: {"title":"Paths are now part of the new ground: trampled grass, bare soil that shows through with wear, soil that matches what it lies on (earth, sand, mud), pebbles, and","type":"feature","reconstructed":false,"saveVersion":60} -->
### Changed
- Paths are now part of the new ground: trampled grass, bare soil that shows through with wear, soil that matches what it lies on (earth, sand, mud), pebbles, and packed snow in winter, without tile lines or flat colour patches.
- Trodden areas only form where the ground is worn on all sides; two paths side by side no longer turn into squares.

## [0.76.0] - 2026-11-08
<!-- version: {"title":"Flower noise","type":"feature","reconstructed":false,"saveVersion":60} -->
### Changed
- Flowers now vary across the map. About a quarter of the land is a rich meadow, most is normal, and about a third is almost bare grass. The pattern comes from the world seed. The World Editor's Plants tab has two new sliders: Flowers – area scale and Flowers – contrast. Contrast 0 looks as before.

## [0.75.0] - 2026-11-08
<!-- version: {"title":"World Editor","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- A World Editor screen, opened from the main menu under Load Game or from New Game → Custom settings → World.
  - Every generator slider and the ground-look options (patches, zone transitions, flowers, shrubs, stones, reeds, river look), on tabs.
  - A map of the whole world and an isometric close-up drawn with the game's ground, with a preview season.
  - Presets saved in this browser, with Load and Delete.
  - Default resets everything; ↺ resets one tab.
  - Copy world code, New seed and Start game.
- New Game offers the editor's last settings with a fresh seed. A game started with a custom ground look keeps it in its save.

## [0.74.1] - 2026-11-08
<!-- version: {"title":"While exploring, newly seen squares no longer flash bright in the dark beyond the soft Fog of War edge.","type":"fix","reconstructed":false,"saveVersion":60} -->
### Fixed
- While exploring, newly seen squares no longer flash bright in the dark beyond the soft Fog of War edge.

## [0.74.0] - 2026-11-08
<!-- version: {"title":"Rivers flow: light streaks drift with the current, and three duck families paddle on the water; in spring and summer ducklings follow them.","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- Rivers flow: light streaks drift with the current, and three duck families paddle on the water; in spring and summer ducklings follow them.
- Settings → Renderer lets you choose Canvas, WebGL or Auto (the page reloads).
### Fixed
- Fog of War with the new ground: the land around the king no longer stays dark, remembered land is evenly grey without grid lines, and nothing peeks out of unexplored black.
- The game runs much faster with the new ground: the ground is painted once and kept, and a season change rolls over the map instead of freezing it.
- The World generator sliders are described in your language.

## [0.73.1] - 2026-11-08
<!-- version: {"title":"Explored land out of sight no longer shows light lines and stripes along a large grid; it is evenly greyed again.","type":"fix","reconstructed":false,"saveVersion":60} -->
### Fixed
- Explored land out of sight no longer shows light lines and stripes along a large grid; it is evenly greyed again.

## [0.73.0] - 2026-11-08
<!-- version: {"title":"New Game setup has a World generator: sliders for rivers, lakes, forest, desert and more, with a preview of the whole map.","type":"feature","reconstructed":false,"saveVersion":60} -->
### Added
- New Game setup has a World generator: sliders for rivers, lakes, forest, desert and more, with a preview of the whole map. The world code follows your choices, so you can share it.
### Changed
- The ground is now one continuous landscape: grass, sand, mud and river banks blend smoothly instead of showing tile squares, with flowers, thistles, shrubs, tall grass and stones that change with the seasons, and reeds, water lilies and stones in the river shallows.

## [0.72.0] - 2026-11-08
<!-- version: {"title":"Farmhouse store","type":"feature","reconstructed":false,"saveVersion":60} -->
### Changed
- Farmhouses have their own store for Wheat and Flour (200). Farmers bring the harvest there; if every Farmhouse is full it goes to the Starter Stockpile. Haulers take Wheat to the Mill, bring the Flour back and supply the Bakery from there. The Granary no longer stores Wheat or Flour, and the Farmhouse panel shows its store. Rats can now appear in a Farmhouse, and a cat clears them.
- Happiness of 75 (was 80) already gives the +15 attractiveness bonus.
- Saves from older versions cannot be loaded (save version 60).

## [0.71.0] - 2026-11-08
<!-- version: {"title":"Fisherman's Hut art","type":"feature","reconstructed":false,"saveVersion":59} -->
### Changed
- The Fisherman's Hut uses the approved Studio look (a hut on stilts with a net loft) instead of the temporary drawing. While it is being built, it shows a timber scaffold like other wooden buildings.

## [0.70.0] - 2026-11-08
<!-- version: {"title":"Children play","type":"feature","reconstructed":false,"saveVersion":59} -->
### Added
- Children play the approved game animations from the Studio: tag, hoop, ball, swing, snowball, snowman and the jump into the hay. Each loop is drawn for one child look, so only children with that look animate. Other children keep their current look.

## [0.69.0] - 2026-11-08
<!-- version: {"title":"Animals 3","type":"feature","reconstructed":false,"saveVersion":59} -->
### Changed
- Cats are 1.5× bigger. They are easier to see next to people but still smaller than a dog.
- The dog taming choice shows "Chance to tame: 44 %".
- The Mill, Bakery and Farmhouse panels show their rats. A cat can be taken in, reassigned or bought from a caravan for any of them. Each one raises the kingdom's cat limit by one.

## [0.68.0] - 2026-11-08
<!-- version: {"title":"Tutorial v2 and economy fixes","type":"feature","reconstructed":false,"saveVersion":59} -->
### Added
- New tutorial order: King, Builder, Hauler, Granary, Hunting Lodge, then optional Fisherman / Farmhouse / Mill / Bakery steps with a Next button, Lumberjack Hut ("even the King can build"), Stone (the arrow points at a rock to mark), Miner, House, Material Yard, Speed. All texts were rewritten. Arrows no longer cover the Population panel.
- Depleted mines: when an Iron Mine or Quarry runs out, it becomes a darker "Depleted" building with no workers. Its Miners move to another mine or become free. A single notice says so. It can be demolished for a refund.
- Notices can be folded with a button. While folded, a new notice shows briefly and the button counts unread notices. Advice on missing links in production chains ("Wheat is piling up – build a Mill") appears at most every 3 days.
### Changed
- The Food need comes from rations (Small 30 %, Normal 60 %, Generous 80 %) plus 5 % for each kind of food eaten in the last 3 days. The Generous and Varied meals happiness bonuses are gone.
- The same notice returns at most once per game day (warnings every half day). The low-food advice lists every food source, including the Fisherman's Hut.
- Haulers with a Wheelbarrow or Wagon fill a Mill or Bakery with several batches in one trip.
- Haulers and Builders no longer appear as "without a workplace" in the worker picker.
- Building squares show only while placing or when the building is selected.
- The normal start has 5 residents and 90 wood.
### Fixed
- The tutorial stone and house steps now advance.

## [0.67.0] - 2026-11-08
<!-- version: {"title":"Approved art","type":"feature","reconstructed":false,"saveVersion":59} -->
### Added
- The fisherman now plays the approved fishing animation: he casts, waits, twitches, then bites, reels and puts each fish in his basket.
### Changed
- The game now uses all graphics approved in the Studio:
  - Horses come in 10 colours, the King's horse has a saddle and tamed horses wear a harness.
  - Horse wagons and wheelbarrows show their cargo, and caravans come in 4 styles with an unloading look.
  - Deer, boar and hares have new looks.
  - Children have new looks and play poses.
  - The world has new grass zones, shore ground and shore transitions.
  - Fires use the Fire Lab flames.
  - Night icons now appear over unlit lights and in the event feed.

## [0.66.0] - 2026-11-08
<!-- version: {"title":"King skills","type":"feature","reconstructed":false,"saveVersion":59} -->
### Added
- Royal tasks give the King 1–3 skill points. Spend them in the King panel: + on any of his skills (Combat too) or on two new royal skills.
- Leadership: residents in the King's sight work 3 % faster per level (up to 5).
- Stewardship: 4 % more taxes per level (up to 5), with no effect on happiness.

## [0.65.0] - 2026-11-08
<!-- version: {"title":"Material Yard","type":"feature","reconstructed":false,"saveVersion":59} -->
### Added
- Material Yard: an open 4×2 yard for wood, stone, iron ore and iron, holding 400 in total. Each good has its own field, and its pile grows as goods arrive.
- Quarries, Iron Mines and Lumberjack Huts put what they produce on a small pile (20) beside the building. Haulers carry it to the nearest Material Yard. When the pile is full, the workers wait. With no Hauler, a notice offers to hire one.
### Changed
- The Warehouse no longer stores wood, stone, iron ore or iron; it keeps crafted goods. The starter tasks and royal goals now ask for a Material Yard. The Starter Stockpile can be removed once a Material Yard stands.
- Saves from older versions cannot be loaded (save version 59).

## [0.64.0] - 2026-11-08
<!-- version: {"title":"UI windows and minimap","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- Right-clicking inside any window or card closes or folds it, like Population already did. Text fields keep the browser's menu, and save or confirm dialogs stay open.
- The minimap has + and − buttons that change its size in 4 steps. The size is remembered in the browser.
- The Notices panel can be folded.

## [0.63.0] - 2026-11-08
<!-- version: {"title":"World look 2","type":"feature","reconstructed":false,"saveVersion":58} -->
### Changed
- The edge of the fog of war is now a soft fade instead of tile-by-tile steps.
- Water with fish shows small fish shadows swimming, and now and then a ring on the surface. More fish show where the water is plentiful, almost none where it is overfished.
### Fixed
- The Marketplace no longer floats above the ground, and the Smelter is no longer drawn too tall. Both stand on their 3×3 footprint at Studio scale.

## [0.62.0] - 2026-11-08
<!-- version: {"title":"Residents 3","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- Residents have a surname and a home village ("Jaroslav Flaška z Pičína", or "Walter Thatcher of Wetwang" in English). Women's surnames take the female form. No name repeats, so there is no more "Pavel 2". Children take their family's surname. The detail shows the full name; lists show the short one.
- At night residents go inside their House, or the Castle if they have none, and come out in the morning. The House panel shows who is inside. Locate on a sleeper shows his House. Sleepers are woken if their House catches fire.
### Changed
- Everyone walks 25 % slower: residents, the King, soldiers, animals, caravans and vehicles. Walk animations slow down to match. Jobs with a lot of walking, such as hunting and hauling, produce less per day.
### Fixed
- Two residents blocking each other no longer keep stepping aside the same way forever.

## [0.61.0] - 2026-11-08
<!-- version: {"title":"Walls 2","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- A Gate or Tower can be placed on a wall and replaces the wall segments under it. A finished segment gives back part of its stone, using the demolition rule.
- While placing a Gate, R (or Shift+wheel) turns it. On a wall line the Gate follows the wall.
### Changed
- Walls, Towers and Gates stay selected after placing, so you can keep building. Esc or right click ends it.
- A Well can be built on paths and paving too.

## [0.60.0] - 2026-11-08
<!-- version: {"title":"Marking and walls over obstacles","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- The marking tool ("Mark to clear") also marks trees and bushes. Woodcutters take marked trees first, wherever they stand. Marked bushes and saplings are cut down and give nothing.
- Walls, towers and gates can be planned over trees, bushes and rocks. Whatever is in the way is marked automatically, and the wall is built once the spot is clear. If no miner is free, one miner leaves his workplace to clear the rocks for the plan and then goes back.
- Cancelling the plan removes only the marks the plan made.
### Changed
- Marks are small and faint during normal play and stand out only while marking or unmarking.

## [0.59.0] - 2026-11-08
<!-- version: {"title":"Fires","type":"feature","reconstructed":false,"saveVersion":58} -->
### Changed
- Fires: when residents come to put a fire out, the building is saved 9 times in 10. One time in 10 the fire is too strong and the building burns down despite the buckets. The feed says when villagers start putting a fire out.
- Burnt ruins say what burnt, for example "Burnt House".
### Fixed
- A game with burnt ruins on the map can be saved and loaded again.

## [0.58.0] - 2026-11-08
<!-- version: {"title":"Event messages and danger marks","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- Clicking a message in the event feed moves the camera to where it happened (a building, an attack, a fire, wolves, a stray animal, a caravan) and marks the spot with a short golden ring.
- A red danger mark stays for a while where a resident was attacked or killed, where a fire broke out or where wolves were seen.
- Every death has a cause (wounds or the attacker). The feed says it, and the Population panel has a folding Deceased list with the last 50 dead, their job, cause and day. The list is kept in saves.

## [0.57.0] - 2026-11-08
<!-- version: {"title":"Wiki","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- A Wiki next to the ? button, with search and categories. Buildings, resources and professions have pages built from the game's data. Hand-written pages cover rats and cats, hunting dogs, fire, needs and happiness, taxes, trade, winter and builders.
- Messages and notices about these topics have a small i that opens the matching Wiki page.
- When rats first appear, a tip suggests getting a cat.


## [0.56.0] - 2026-11-08
<!-- version: {"title":"Animals 2","type":"feature","reconstructed":false,"saveVersion":58} -->
### Changed
- The first stray cat comes on day 1–2 and the first stray dog on day 2–3. After that, strays come about half as often as before.
- Rats scurry further around their store, stop to sniff and sometimes hide.
- Stray cats and dogs show a small faint ? until they are taken in.

### Added
- Rats move into Houses that have no cat living within 10 tiles. Residents of those houses are a little less happy.


## [0.55.0] - 2026-11-08
<!-- version: {"title":"Trade improvements","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- Automatic trade has a Keep between mode: buy when you have less than one amount, sell when you have more than another.
- Caravans bring porters who carry goods to the Marketplace, and guards. Richer caravans have more guards. Caravans carry more Gold and goods as the game goes on (up to 1000 Gold).
- Parked Wheelbarrows and Horse Wagons can be sold to the merchant.

### Changed
- A Wheelbarrow takes 10 times longer to build.


## [0.54.0] - 2026-11-08
<!-- version: {"title":"Resource overview","type":"feature","reconstructed":false,"saveVersion":58} -->
### Added
- The top bar groups resources into lightly tinted groups: gold, materials, food ingredients, food and equipment.
- Resting the pointer on a store, on the map or on the store gauge in the top bar, shows what it holds: used and total space, then each good with its icon and amount.
- The Marketplace shows an icon for each good, with the same group tints.
- The New Game settings have a switch for the starting garrison.


## [0.53.0] - 2026-11-08
<!-- version: {"title":"Start 2: bread, room for 10, garrison","type":"feature","reconstructed":false,"saveVersion":58} -->
### Changed
- A new game starts with 200 Bread. The Starter Stockpile now holds 300.
- The Castle has room for 10 residents, and each House adds more. The event feed says when the settlement is full.
- A new game starts with 2 Soldiers and 2 Archers at the Castle. They count towards the 10 residents and need no Barracks.


## [0.52.0] - 2026-11-07
<!-- version: {"title":"Bigger Granary, unlimited gold, one Iron","type":"feature","reconstructed":false,"saveVersion":58} -->
### Changed
- A Granary holds 1000 raw food goods and 1000 finished food.
- Gold has no upper limit.
- Iron Bars and Iron are now one resource, Iron, smelted from Iron Ore and Wood. Swords, armour and carts use it. Saves from older versions cannot be loaded; start a new game.


## [0.51.0] - 2026-11-07
<!-- version: {"title":"Employment 2","type":"feature","reconstructed":false,"saveVersion":57} -->
### Changed
- A job picked in the resident's window sticks on the first click.
- Remove worker works while the worker is busy. Switching employment off for a building or a building type sends its workers away at once.
- Staffing signs over buildings: nobody working is a yellow warning, some workers missing is grey, and a building with employment switched off shows a dark red stop sign.


## [0.50.1] - 2026-11-07
<!-- version: {"title":"Tutorial look follows the UI style","type":"feature","reconstructed":false,"saveVersion":57} -->
### Changed
- The tutorial bubble, pointer, tips, speed buttons and Royal tasks card follow the chosen interface style. The speed buttons show icons. The UI Lab offers a golden arrow or a pointing hand as the tutorial pointer.


## [0.50.0] - 2026-11-07
<!-- version: {"title":"Animals in their approved looks","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- Cats, kittens, dogs, rats and wolves use the approved looks from the Asset Studio. Each animal gets one of the approved looks at random and keeps it after loading. Dogs sit and limp when wounded, wolves bare their teeth when they attack.


## [0.49.0] - 2026-11-07
<!-- version: {"title":"Easier start, tutorial and royal tasks","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- A notice says when a construction site's materials are in the stores but nobody brings them. Its Builders then carry them themselves.
- "No builders" and the waiting-materials notice have a button that gives the job to the best unemployed resident.
- If the kingdom has no wood and no Lumberjack Hut, one Lumberjack Hut can be built for free.
- A tutorial leads a new game one step at a time: an arrow shows where to click and a bubble says why. Each step ticks itself when it is done; there is Show me, Skip, and a switch in Settings.
- Pause and 1×, 2×, 3× speed in the top bar, also with the keys P and 1–3. While paused you can still build and look around.
- The main menu has Continue, which loads the newest save. A new game can start from three quick starts: Calm start, Normal or Challenge.
- The top bar shows how many days the food lasts. A notice warns when it is less than 3 days.
- One-time tips explain new things after the tutorial, with an arrow. They can be turned off in Settings.
- Royal tasks: a small card shows three goals at a time (for example 3 Houses or the first bread). Each pays a reward of gold, wood or stone once.
- A finished building flashes golden and plays a short chime. Settings has a Sound switch.

### Changed
- Browser smoke: `--keep-going` lists every failing scenario in one run.
- Basic buildings are built from wood: Granary, Farmhouse, Hunting Lodge, Fisherman's Hut, Lumberjack Hut, House and Builder's Workshop. Other prices follow the owner's settings from the Asset Studio, for example the Stone Tower and the Castle cost 20 Stone and the Quarry 15 Wood.
- A new game starts with 60 Wood and no Iron Ore.
- Newcomers stop arriving while food lasts less than 2 days or more than 3 residents have no work. The kingdom overview says why.
- Wolves, thieves and fires begin once the kingdom has 5 Houses or in the second year. The first spark only warns.
- The camera label, the cancelled-building message and the Brazier description are translated properly.
- The top bar always shows Gold, Stone and Wood. Other resources appear once the kingdom has had some.
- The time reads "Day 3" and "Spring · Sunny"; the hours and the day of the season are in the tooltips.
- The Asset Library, older versions and the camera and sight details moved into More. The Version Archive and Changelog are small links in the main menu.
- The Getting started list under ? follows the tutorial order and no longer opens over the map at the start.
- The New Game settings are folded under Custom settings. The Buildings menu opens on Food & Farming, then on the category used last.

## [0.48.0] - 2026-11-07
<!-- version: {"title":"Quick job choice in the Population list","type":"feature","reconstructed":false,"saveVersion":57} -->
### Added
- Each resident in the Population list has a job button between the name and Locate. The unemployed get a highlighted "Assign job" button, everyone else a quieter "Change job" one.
  - It opens a menu of professions with the free places in their buildings, for example "Woodcutter (2 free)". Professions with no free place are greyed out with "(full)" but can still be chosen.
  - The current job is ticked. Employed residents can also be dismissed with "Unemploy".
  - After a choice the resident goes to a building of that profession with a free place, exactly as when the job is changed in the resident's panel.

## [0.47.1] - 2026-11-07
<!-- version: {"title":"Fields of planned Farmhouses","type":"feature","reconstructed":false,"saveVersion":57} -->
### Changed
- Fields drawn next to a planned Farmhouse (a blueprint or one still being built) are connected to it right away and no longer report "no Farmhouse has room". They wait for the Farmhouse and its Farmer; the field's panel says so.
- Fields that no Farmhouse has room for give one summary notice with their count instead of one notice per field. Clicking it shows the first field.
- Advice to build a missing producer (for example a Mill for a Bakery, or a field for a Farmhouse chain) is no longer given once that building is planned.

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

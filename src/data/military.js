// C08: military unit types trained in a Barracks. Central, tunable data: the UI and systems read everything from here.
// A unit is an employed Soldier (Barracks seat) who has been trained and equipped with real items from an Armory.
// Stats are modifiers on top of the resident's own stats (60 HP, 6 DPS, armor 0, range 1) and the equipped items
// (Sword +100 % attack, Bow +40 % attack, Armor +30 armor; see militaryEquipment.js). Values are first proposals
// derived from the current combat numbers, not historical facts.
export const UNIT_TYPES=Object.freeze({
  soldier:Object.freeze({equipment:Object.freeze({weapon:'sword'}),modifiers:Object.freeze({maxHP:20}),trainingTime:20000,goldCost:5,wageBonus:1}),
  // Owner 19 Nov 2026 ("ty požadavky na vycvičení teď zruš"): no combat level is needed to train any unit any more
  // (requiredCombatLevel removed); a recruit needs only the kit, the gold and – for the Light Cavalry – a horse.
  // p71 (owner 17 Nov 2026): the Swordsman, Royal Archer, Crossbowman and Light Cavalry wear Light Armor from the Tailor.
  swordsman:Object.freeze({equipment:Object.freeze({weapon:'sword',armor:'light_armor'}),modifiers:Object.freeze({maxHP:60,attackBonus:50,armor:15}),trainingTime:45000,goldCost:12,wageBonus:2}),
  archer:Object.freeze({equipment:Object.freeze({weapon:'bow'}),modifiers:Object.freeze({maxHP:10,attackRange:8}),trainingTime:30000,goldCost:8,wageBonus:1}),
  // p70 (owner 17 Nov 2026): the Knight now fights on foot (sword and armour, no horse); the mounted unit is the
  // Light Cavalry below. A Knight from an older save gives his horse back to the Stables on load.
  knight:Object.freeze({equipment:Object.freeze({weapon:'sword',armor:'armor'}),modifiers:Object.freeze({maxHP:100,attackBonus:50,armor:10}),trainingTime:60000,goldCost:25,wageBonus:4}),
  // p70 new units. Halberdier: halberd and armour, strikes from 2 tiles (still a melee fighter, see isRanged).
  halberdier:Object.freeze({equipment:Object.freeze({weapon:'halberd',armor:'armor'}),modifiers:Object.freeze({maxHP:60,attackRange:1}),bonusVs:Object.freeze({mounted:1.5}),trainingTime:50000,goldCost:15,wageBonus:3}),
  // Royal Archer: a bow and the Swordsman's defence (+60 HP, armour 15) and Light Armor.
  royal_archer:Object.freeze({equipment:Object.freeze({weapon:'bow',armor:'light_armor'}),modifiers:Object.freeze({maxHP:60,attackBonus:20,armor:15,attackRange:8}),trainingTime:45000,goldCost:14,wageBonus:2}),
  // Crossbowman: crossbow and Light Armor.
  crossbowman:Object.freeze({equipment:Object.freeze({weapon:'crossbow',armor:'light_armor'}),modifiers:Object.freeze({maxHP:30,attackRange:6.5}),pierce:.5,trainingTime:40000,goldCost:12,wageBonus:2}),
  // Light Cavalry: sword and a tamed horse from the Stables, fast. His own look comes later (owner's art).
  light_cavalry:Object.freeze({equipment:Object.freeze({weapon:'sword',armor:'light_armor'}),mount:'horse',charge:Object.freeze({run:5,damage:35}),modifiers:Object.freeze({maxHP:50,attackBonus:30}),trainingTime:50000,goldCost:20,wageBonus:3}),
  // Owner 18 Nov 2026: a Catapult crew (a Recruit and a finished Catapult from the Builder's Workshop) and a Military
  // Wagon (a Recruit and a Horse Wagon with its horse). `vehicle`: the vehicle the unit takes; no Armory items.
  // speedFactor: a Catapult rolls slowly, the Wagon at the horse's pace.
  catapult:Object.freeze({equipment:Object.freeze({}),vehicle:'catapult',speedFactor:.55,modifiers:Object.freeze({maxHP:20}),trainingTime:20000,goldCost:5,wageBonus:1}),
  // Owner 20 Nov 2026 (defence list, point 3): a battering ram crew – a Recruit with a finished Ram from the Builder's Workshop.
  ram:Object.freeze({equipment:Object.freeze({}),vehicle:'ram',speedFactor:.5,modifiers:Object.freeze({maxHP:90,armor:25}),trainingTime:20000,goldCost:5,wageBonus:1}),
  military_wagon:Object.freeze({equipment:Object.freeze({}),vehicle:'horse_wagon',speedFactor:1.25,modifiers:Object.freeze({maxHP:10}),trainingTime:15000,goldCost:3,wageBonus:1}),
});
// Battle test 18 Nov 2026 (unit balance, roles): `bonusVs.mounted` – damage multiplier against riders (the Halberdier,
// whose armour came down from 35 to 30, the Swordsman's: his reach is his strength); `pierce` – share of the target's armour his shot
// ignores (the Crossbowman); `charge` – a rider who has ridden `run` tiles since his last blow opens the next fight
// with one blow of `damage` hit points (before armour).
// kasarna-branci (owner 9 Nov 2026): everyone employed in a Barracks starts as a Recruit – no equipment, basic combat
// stats (the resident's own 60 HP and 6 DPS plus `modifiers`), patrols and defends near the Barracks like a unit, and
// earns BASE_DAILY_WAGES.recruit. With items in an Armory a Recruit trains into one of UNIT_TYPES and keeps the seat.
// A Recruit is any resident with the `soldier` profession who is not (yet) a trained unit; nothing extra is saved.
export const RECRUIT=Object.freeze({modifiers:Object.freeze({maxHP:10})});
// m-start-v2 (owner 7 Nov 2026): a new game starts with this garrison at the Castle, with its own equipment.
export const START_GARRISON=Object.freeze([Object.freeze({type:'soldier',count:2}),Object.freeze({type:'archer',count:2})]);
export const UNIT_TYPE_IDS=Object.freeze(Object.keys(UNIT_TYPES));
// A mounted unit (Light Cavalry) rides a tamed horse from the Stables: it is reserved for the training and kept by the rider.
export const KNIGHT_SPEED=1.5;
// Owner 18 Nov 2026: siege engines and supply. A Catapult throws one Stone every `reload` ms at an enemy building between
// `minRange` and `range` tiles, `damage` hit points a hit, holding up to `ammo` Stones. The Military Wagon loads at a store
// it stands near (`loadRadius`) up to `load` of each supply and hands it to units within `supplyRadius`.
// Owner 18 Nov 2026: all long-range units shoot 50 % further – Archer and Royal Archer 6 → 9 tiles, Crossbowman 5 → 7.5,
// enemy archers 6 → 9, the Catapult 12 → 18 (and the lobbed shot over a wall 4 → 6, CombatSystem LOB).
export const CATAPULT=Object.freeze({range:18,minRange:3,reload:5000,damage:100,ammo:10,cost:Object.freeze({wood:30,iron:6}),constructionTime:40000});
// Owner 20 Nov 2026 (defence list, point 3): the battering ram. Its crew rolls it to an enemy Gate, wall, Tower or building
// and strikes it every `reload` ms for `damage` (Gates and walls; `otherShare` of it for other buildings). Under its roof
// arrows and bolts do only `arrowShare` of their damage. It never fights people. A Moat stops it (wheels).
export const RAM=Object.freeze({reload:2500,damage:70,otherShare:.5,arrowShare:.25,cost:Object.freeze({wood:40,iron:4}),constructionTime:35000,fortTypes:Object.freeze(['gate','wall_gate','wall','tower'])});
// Owner 20 Nov 2026 (defence list, point 3): ladders of enemy Recruits and Swordsmen (EnemyArmy.ladder), in ms and tiles.
export const LADDER=Object.freeze({raise:4000,climb:2500,push:2000,guard:2.5,fall:20,again:2500});
// followRadius: a free Wagon drives after a Catapult short of Stones this near.
export const WAGON_SUPPLY=Object.freeze({load:Object.freeze({stone:30,food:20,torch:10}),loadRadius:4,supplyRadius:6,followRadius:40,every:1000});
// Fire arrows (battle test, point 3): archers ordered at a wooden enemy building shoot it from their range for
// `damageShare` of their attack; after `igniteAfter` archer-seconds it catches fire. `every` ms between drawn arrows.
export const FIRE_ARROWS=Object.freeze({damageShare:.35,igniteAfter:20,every:1100});
export const vehicleUnit=type=>UNIT_TYPES[type]?.vehicle??null;
export const MILITARY_RULES=Object.freeze({refugeRadius:3,retreatMax:14,dutyCheck:500,holdLeash:9,cutOffFor:5000,guardRadius:12,retarget:600,kitCapacityPerOrder:2,followRadius:10,spreadRadius:6,crowd:3,engageRadius:5,retreatBelow:.25,retreatUntil:.5,retreatSafe:8,orderRadius:12,groupLink:5});
// Combat 16 Nov 2026: soldier stances (worker.stance, saved; aggressive when missing). engage = fights an enemy this
// near without an order; follow = takes the next enemy this near after his target falls; leash = gives up a chase this
// far from himself; hold = never moves to fight; retreat = steps back when badly hurt.
export const STANCES=Object.freeze({
  aggressive:Object.freeze({engage:5,follow:10,leash:0,hold:false,retreat:true}),
  defensive:Object.freeze({engage:3,follow:4,leash:6,hold:false,retreat:true}),
  hold:Object.freeze({engage:0,follow:0,leash:0,hold:true,retreat:false}),
  // Owner 20 Nov 2026 (defence list, point 5): two battle orders that stand like Hold. Shield wall: shields up – arrows do
  // `ranged`, blows `melee` of their damage, they strike back with `own`. Hedgehog: weapons out against riders – a rider
  // does `vsRider` to them and takes `riderBonus` from them; a charge into it breaks on the points (BATTLE_ORDERS).
  shieldwall:Object.freeze({engage:0,follow:0,leash:0,hold:true,retreat:false}),
  hedgehog:Object.freeze({engage:0,follow:0,leash:0,hold:true,retreat:false}),
});
export const BATTLE_ORDERS=Object.freeze({shieldwall:Object.freeze({ranged:.4,melee:.8,own:.7}),hedgehog:Object.freeze({vsRider:.5,riderBonus:2,chargeBack:20})});
export const holdsGround=unit=>!!STANCES[unit?.stance]?.hold;
// Terrain (same point): an archer standing `highStep` (relief height) above his target shoots `highDamage` harder; a target
// standing among trees (a tree or bush within 1 tile) takes `forestCover` of arrow damage.
export const TERRAIN_COMBAT=Object.freeze({highStep:1,highDamage:1.2,forestCover:.7});
// The items one unit type needs, as {itemId: count}.
// p71: units trained before Light Armor joined their kit keep the kit they got (validation and Save/Load accept it).
export const legacyKit=type=>{const e=UNIT_TYPES[type]?.equipment;return e?.armor==='light_armor'&&type!=='crossbowman'?{[e.weapon]:1}:null;};
export function unitKit(type){const kit={};for(const id of Object.values(UNIT_TYPES[type].equipment))kit[id]=(kit[id]??0)+1;return kit;}

// m-zalozka-vojsko (owner, 12 Nov): soldiers on Patrol walk a round of the settlement – a ring `margin` tiles outside the
// box of all finished buildings, a waypoint every `step` tiles – instead of milling around their Barracks. A settlement
// smaller than `minBuildings` keeps the old patrol near the Barracks.
export const PATROL=Object.freeze({margin:2,step:4,minBuildings:3,reach:3});

// m-kasarna-limit-zamestnani (owner, 12 Nov): how many places of a Barracks automatic employment fills (default 4, the
// player raises it with a slider up to the Barracks' places). Placed by hand a soldier may go above it.
export const BARRACKS_AUTO_HIRE_DEFAULT=4;
export const barracksAutoHire=(building,capacity)=>Math.max(0,Math.min(capacity,Number.isInteger(building?.autoHire)?building.autoHire:BARRACKS_AUTO_HIRE_DEFAULT));

// Owner 20 Nov 2026 ("zpracuj postupně všechny ty návrhy", point: flank and rear attacks). A blow into the side of a
// fighter (his face turned to someone else) does `side` times the damage, into his back `rear` times.
export const FLANK=Object.freeze({side:1.25,rear:1.5,sideCos:.3,rearCos:-.5});
// Morale (same request). Every soldier on both sides has 0–100. A comrade falling within `deathRadius` costs `death`,
// fighting while badly hurt (under half his hit points) `wounded` a second, facing twice as many enemies as friends
// within `crowdRadius` `outnumbered` a second. A leader (our Knight or the King, the enemy Knight) within
// `leaderRadius` halves the losses. Out of the fight he recovers `calm` a second, beside a leader `steady` even in it.
// Under `rout` he flees (ours to the Barracks or Castle, enemies away from us) and fights again from `rally`.
export const MORALE=Object.freeze({max:100,death:14,deathRadius:6,wounded:4,outnumbered:3,crowdRadius:5,leaderRadius:6,leaderFactor:.5,calm:5,steady:1.5,enemyRadius:6,rout:20,rally:55,holdFactor:.5});
// Owner 20 Nov 2026 (defence list, point 4). Boiling pitch: one of ours up on our Gate or Tower pours a pot on every
// enemy touching it (`damage`, armour does not help) every `reload` ms, for one Pitch from the stores.
// Ballista: a Tower with a mounted ballista (`cost`, bought in the Tower's window) shoots while one of ours is up on it:
// a bolt every `reload` ms at the nearest enemy within `range` (rams and riders first), `damage`, half the armour ignored.
export const BOILING_PITCH=Object.freeze({damage:45,reload:12000,pitch:1,fortTypes:Object.freeze(['gate','tower','wall_gate'])});
export const BALLISTA=Object.freeze({range:14,reload:6000,damage:60,pierce:.5,cost:Object.freeze({wood:20,iron:4})});

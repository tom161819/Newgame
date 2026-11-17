// C08: military unit types trained in a Barracks. Central, tunable data: the UI and systems read everything from here.
// A unit is an employed Soldier (Barracks seat) who has been trained and equipped with real items from an Armory.
// Stats are modifiers on top of the resident's own stats (60 HP, 6 DPS, armor 0, range 1) and the equipped items
// (Sword +100 % attack, Bow +40 % attack, Armor +30 armor; see militaryEquipment.js). Values are first proposals
// derived from the current combat numbers, not historical facts.
export const UNIT_TYPES=Object.freeze({
  soldier:Object.freeze({equipment:Object.freeze({weapon:'sword'}),modifiers:Object.freeze({maxHP:20}),trainingTime:20000,goldCost:5,wageBonus:1,requiredCombatLevel:1}),
  swordsman:Object.freeze({equipment:Object.freeze({weapon:'sword'}),modifiers:Object.freeze({maxHP:60,attackBonus:50,armor:15}),trainingTime:45000,goldCost:12,wageBonus:2,requiredCombatLevel:3}),
  archer:Object.freeze({equipment:Object.freeze({weapon:'bow'}),modifiers:Object.freeze({maxHP:10,attackRange:5}),trainingTime:30000,goldCost:8,wageBonus:1,requiredCombatLevel:1}),
  // p70 (owner 17 Nov 2026): the Knight now fights on foot (sword and armour, no horse); the mounted unit is the
  // Light Cavalry below. A Knight from an older save gives his horse back to the Stables on load.
  knight:Object.freeze({equipment:Object.freeze({weapon:'sword',armor:'armor'}),modifiers:Object.freeze({maxHP:100,attackBonus:50,armor:10}),trainingTime:60000,goldCost:25,wageBonus:4,requiredCombatLevel:4}),
  // p70 new units. Halberdier: halberd and armour, strikes from 2 tiles (still a melee fighter, see isRanged).
  halberdier:Object.freeze({equipment:Object.freeze({weapon:'halberd',armor:'armor'}),modifiers:Object.freeze({maxHP:60,armor:5,attackRange:1}),trainingTime:50000,goldCost:15,wageBonus:3,requiredCombatLevel:3}),
  // Royal Archer: a bow and the Swordsman's defence (+60 HP, armour 15). Light armour joins his kit with the cloth chain (p71).
  royal_archer:Object.freeze({equipment:Object.freeze({weapon:'bow'}),modifiers:Object.freeze({maxHP:60,attackBonus:20,armor:15,attackRange:5}),trainingTime:45000,goldCost:14,wageBonus:2,requiredCombatLevel:3}),
  // Crossbowman: crossbow and light armour (made by the Armorer until the cloth chain, p71, gets its own workshop).
  crossbowman:Object.freeze({equipment:Object.freeze({weapon:'crossbow',armor:'light_armor'}),modifiers:Object.freeze({maxHP:30,attackRange:4}),trainingTime:40000,goldCost:12,wageBonus:2,requiredCombatLevel:2}),
  // Light Cavalry: sword and a tamed horse from the Stables, fast. His own look comes later (owner's art).
  light_cavalry:Object.freeze({equipment:Object.freeze({weapon:'sword'}),mount:'horse',modifiers:Object.freeze({maxHP:50,attackBonus:30}),trainingTime:50000,goldCost:20,wageBonus:3,requiredCombatLevel:3}),
});
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
export const MILITARY_RULES=Object.freeze({guardRadius:12,retarget:600,kitCapacityPerOrder:2,followRadius:10,spreadRadius:6,crowd:3,engageRadius:5,retreatBelow:.25,retreatUntil:.5,retreatSafe:8,orderRadius:12,groupLink:5});
// Combat 16 Nov 2026: soldier stances (worker.stance, saved; aggressive when missing). engage = fights an enemy this
// near without an order; follow = takes the next enemy this near after his target falls; leash = gives up a chase this
// far from himself; hold = never moves to fight; retreat = steps back when badly hurt.
export const STANCES=Object.freeze({
  aggressive:Object.freeze({engage:5,follow:10,leash:0,hold:false,retreat:true}),
  defensive:Object.freeze({engage:3,follow:4,leash:6,hold:false,retreat:true}),
  hold:Object.freeze({engage:0,follow:0,leash:0,hold:true,retreat:false}),
});
// The items one unit type needs, as {itemId: count}.
export function unitKit(type){const kit={};for(const id of Object.values(UNIT_TYPES[type].equipment))kit[id]=(kit[id]??0)+1;return kit;}

// m-zalozka-vojsko (owner, 12 Nov): soldiers on Patrol walk a round of the settlement – a ring `margin` tiles outside the
// box of all finished buildings, a waypoint every `step` tiles – instead of milling around their Barracks. A settlement
// smaller than `minBuildings` keeps the old patrol near the Barracks.
export const PATROL=Object.freeze({margin:2,step:4,minBuildings:3,reach:3});

// m-kasarna-limit-zamestnani (owner, 12 Nov): how many places of a Barracks automatic employment fills (default 4, the
// player raises it with a slider up to the Barracks' places). Placed by hand a soldier may go above it.
export const BARRACKS_AUTO_HIRE_DEFAULT=4;
export const barracksAutoHire=(building,capacity)=>Math.max(0,Math.min(capacity,Number.isInteger(building?.autoHire)?building.autoHire:BARRACKS_AUTO_HIRE_DEFAULT));

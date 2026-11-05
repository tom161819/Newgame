// C08: military unit types trained in a Barracks. Central, tunable data: the UI and systems read everything from here.
// A unit is an employed Soldier (Barracks seat) who has been trained and equipped with real items from an Armory.
// Stats are modifiers on top of the resident's own stats (60 HP, 6 DPS, armor 0, range 1) and the equipped items
// (Sword +100 % attack, Bow +40 % attack, Armor +30 armor; see militaryEquipment.js). Values are first proposals
// derived from the current combat numbers, not historical facts.
export const UNIT_TYPES=Object.freeze({
  soldier:Object.freeze({equipment:Object.freeze({weapon:'sword'}),modifiers:Object.freeze({maxHP:20}),trainingTime:20000,goldCost:5,wageBonus:1,requiredCombatLevel:1}),
  swordsman:Object.freeze({equipment:Object.freeze({weapon:'sword'}),modifiers:Object.freeze({maxHP:60,attackBonus:50,armor:15}),trainingTime:45000,goldCost:12,wageBonus:2,requiredCombatLevel:3}),
  archer:Object.freeze({equipment:Object.freeze({weapon:'bow'}),modifiers:Object.freeze({maxHP:10,attackRange:5}),trainingTime:30000,goldCost:8,wageBonus:1,requiredCombatLevel:1}),
  knight:Object.freeze({equipment:Object.freeze({weapon:'sword',armor:'armor'}),mount:'horse',modifiers:Object.freeze({maxHP:100,attackBonus:50,armor:10}),trainingTime:60000,goldCost:25,wageBonus:4,requiredCombatLevel:4,lockedUntil:'stables'}),
});
export const UNIT_TYPE_IDS=Object.freeze(Object.keys(UNIT_TYPES));
export const MILITARY_RULES=Object.freeze({guardRadius:12,retarget:600,kitCapacityPerOrder:2});
// The items one unit type needs, as {itemId: count}.
export function unitKit(type){const kit={};for(const id of Object.values(UNIT_TYPES[type].equipment))kit[id]=(kit[id]??0)+1;return kit;}

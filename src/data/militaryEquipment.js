// C06 integration contract for military equipment (C07 production, C08 units, Stage 12 Stables). C08 implements the
// units in data/military.js and MilitarySystem. See docs/contracts/military-equipment.md.

// Equipment slots a unit can fill. weapon/armor already exist on the king (EquipmentSystem); mount holds an animal id,
// never an inventory item.
export const EQUIPMENT_SLOTS=Object.freeze(['weapon','armor','mount']);

// Producible items (C07). They are stored goods (category resource, resourceCategory equipment) so the physical
// logistics carries them like any material; only an Armory stores them. The king's treasure Sword and Armor
// (basic_sword, basic_armor) stay separate equipment; C08 equips units from these goods with the same modifiers.
export const MILITARY_ITEMS=Object.freeze({
  sword:Object.freeze({itemId:'sword',slot:'weapon',recipe:Object.freeze({iron:3,wood:2}),workshop:'swordsmith',modifiersFrom:'basic_sword'}),
  armor:Object.freeze({itemId:'armor',slot:'armor',recipe:Object.freeze({iron:5,wood:2}),workshop:'armorer',modifiersFrom:'basic_armor'}),
  bow:Object.freeze({itemId:'bow',slot:'weapon',recipe:Object.freeze({wood:8}),workshop:'bowyer',modifiers:Object.freeze({attackBonus:40}),range:6}),
});

// Unit roles C08 recruits from Soldiers. One weapon per role; armor optional unless required; Knights need a mount
// from real Stables, so they stay locked until Stage 12 builds them.
export const UNIT_ROLES=Object.freeze({
  soldier:Object.freeze({profession:'soldier',weapon:'sword',armor:'optional',mount:null}),
  swordsman:Object.freeze({profession:'soldier',weapon:'sword',armor:'optional',mount:null}),
  archer:Object.freeze({profession:'soldier',weapon:'bow',armor:'optional',mount:null}),
  knight:Object.freeze({profession:'soldier',weapon:'sword',armor:'required',mount:'horse',lockedUntil:'stables'}),
});

// How a physical item moves (implemented by C08, MilitarySystem): a training order makes Haulers carry the unit's
// items from an Armory into the Barracks kit store (`kit-<barracksId>`); training takes them from there. Discharge or
// death drops them where the unit stands as collectible drops, which Haulers return to an Armory. Saves keep each
// unit's slots by item id in `military.units`.
export const EQUIPMENT_FLOW=Object.freeze({reservationKey:'kit-<barracksId>',onUnequip:'drop',onDeath:'drop',returnedBy:'hauler',saved:'military.units'});

// Horses: only tamed horses kept by Stables can be reserved for a Knight (`horse.reservedBy = workerId`); wild horses
// stay free for the king to ride and are never assigned.
export const HORSE_CONTRACT=Object.freeze({animal:'horse',source:'stables',reservation:'horse.reservedBy',wildHorsesAssignable:false});

// Audit (2026-11-05, main 185f9e5): what exists now. Stables, Wheelwright and the Horse Wagon belong to Stage 12.
export const MILITARY_AUDIT=Object.freeze({
  stables:'implemented (S12 phase C: Stablehands and the King tame wild horses)',wheelwright_workshop:'implemented (S12 phase B: Wheelbarrow; phase D: Horse Wagon)',horse_wagon:'implemented (S12 phase D: Wheelwright recipe with a harnessed tamed horse)',
  iron:'implemented (Smelter)',barracks:'implemented (C08: trains Soldier, Swordsman and Archer from Armory equipment; Knight locked until Stables)',horse:'implemented (wild; king mount only)',
  equipment:'implemented for the king (weapon and armor slots)',
});

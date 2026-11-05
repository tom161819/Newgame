// C06 integration contract for military equipment (C07 production, C08 units, Stage 12 Stables). Data only: nothing
// here is used by the running game yet. See docs/contracts/military-equipment.md.

// Equipment slots a unit can fill. weapon/armor already exist on the king (EquipmentSystem); mount holds an animal id,
// never an inventory item.
export const EQUIPMENT_SLOTS=Object.freeze(['weapon','armor','mount']);

// Producible items. A produced Sword and Armor are the very items the king already equips (no duplicates, the
// treasure keeps giving them); the Bow is new and C07 adds it to src/data/objects/equipment.js.
export const MILITARY_ITEMS=Object.freeze({
  sword:Object.freeze({itemId:'basic_sword',slot:'weapon',recipe:Object.freeze({iron_bar:1}),workshop:'swordsmith',exists:true}),
  armor:Object.freeze({itemId:'basic_armor',slot:'armor',recipe:Object.freeze({iron_bar:2}),workshop:'armorer',exists:true}),
  bow:Object.freeze({itemId:'bow',slot:'weapon',recipe:Object.freeze({wood:2}),workshop:'bowyer',exists:false,
    modifiers:Object.freeze({attackBonus:40}),range:6}),
});

// Unit roles C08 recruits from Soldiers. One weapon per role; armor optional unless required; Knights need a mount
// from real Stables, so they stay locked until Stage 12 builds them.
export const UNIT_ROLES=Object.freeze({
  swordsman:Object.freeze({profession:'soldier',weapon:'basic_sword',armor:'optional',mount:null}),
  archer:Object.freeze({profession:'soldier',weapon:'bow',armor:'optional',mount:null}),
  knight:Object.freeze({profession:'soldier',weapon:'basic_sword',armor:'required',mount:'horse',lockedUntil:'stables'}),
});

// How a physical item moves. Items are stored goods (counted in storage like any resource) until a unit is equipped:
// a reservation `equipment:<workerId>:<slot>` holds one item in a store, the unit (or a Hauler) carries it, and only
// then does it leave the stock and fill the slot. Unequip or death puts it back: dropped where the unit stands as a
// collectible drop, which Haulers return to storage. Saves keep each unit's slots by item id.
export const EQUIPMENT_FLOW=Object.freeze({reservationKey:'equipment:<workerId>:<slot>',onUnequip:'drop',onDeath:'drop',returnedBy:'hauler',saved:'worker.equipment'});

// Horses: only tamed horses kept by Stables can be reserved for a Knight (`horse.reservedBy = workerId`); wild horses
// stay free for the king to ride and are never assigned.
export const HORSE_CONTRACT=Object.freeze({animal:'horse',source:'stables',reservation:'horse.reservedBy',wildHorsesAssignable:false});

// Audit (2026-11-05, main 185f9e5): what exists now. Stables, Wheelwright and the Horse Wagon belong to Stage 12.
export const MILITARY_AUDIT=Object.freeze({
  stables:'not implemented yet (Stage 12)',wheelwright:'not implemented yet (Stage 12)',horse_wagon:'not implemented yet (Stage 12)',
  iron_bar:'implemented (Smelter)',barracks:'implemented (Soldiers patrol, no equipment)',horse:'implemented (wild; king mount only)',
  equipment:'implemented for the king (weapon and armor slots)',
});

import { recalculateStats } from './UnitStats.js';

export class EquipmentSystem {
  constructor(unit,registry,inventory,onChange=()=>{}){
    Object.assign(this,{unit,registry,inventory});this.onChange=()=>{};this.slots={weapon:null,armor:null};this.recalculate();this.onChange=onChange;
  }
  equip(id){
    const definition=this.registry.get(id),slot=definition?.equipment?.slot;
    if(definition?.category!=='equipment'||!Object.hasOwn(this.slots,slot)||this.inventory.count(id)<1)return false;
    this.slots[slot]=id;this.recalculate();return true;
  }
  unequip(slot){if(!Object.hasOwn(this.slots,slot))return false;this.slots[slot]=null;this.recalculate();return true;}
  owned(slot){return this.registry.byCategory('equipment').filter(d=>d.equipment.slot===slot&&this.inventory.count(d.id)>0);}
  recalculate(){
    const total={};
    for(const id of Object.values(this.slots))if(id){
      const modifiers=this.registry.require(id).equipment.modifiers;
      for(const [key,value]of Object.entries(modifiers))total[key]=(total[key]??0)+value;
    }
    this.unit.statModifiers.equipment=total;recalculateStats(this.unit);this.onChange();
  }
}

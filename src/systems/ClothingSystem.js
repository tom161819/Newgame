import { CLOTHING,clothingHappiness } from '../data/clothing.js';
import { t } from '../i18n/index.js';

// p71: the kingdom's Clothing level (see data/clothing.js). Saved: the level and whether the low warning was given.
export class ClothingSystem {
  constructor(scene){
    this.scene=scene;this.level=1;this.warned=false;this.listeners=new Set();
    this.unsubscribe=scene.gameTime?.onNewDay?.(day=>this.newDay(day));
  }
  get storage(){return this.scene.foodStorage;}
  onChange(l){this.listeners.add(l);return()=>this.listeners.delete(l);}
  changed(){for(const l of this.listeners)l();}
  // Only with the physical stores (an older world without them has no Cloth to take).
  active(){return !!this.storage?.physicalMaterials&&!!this.scene.objectRegistry?.get?.(CLOTHING.resource);}
  residents(){return this.scene.needs?.residents?.().length??0;}
  newDay(day){
    if(!this.active())return;const people=this.residents();if(!people)return;
    this.level=Math.max(0,this.level-1/CLOTHING.wearDays);
    const want=Math.floor((1-this.level)*people+1e-9),have=Math.floor(this.storage.available(CLOTHING.resource)),take=Math.min(want,have);
    if(take>0&&this.storage.spend(CLOTHING.resource,take)){this.level=Math.min(1,this.level+take/people);this.scene.resourceLedger?.expense?.(CLOTHING.resource,take,'Clothing',{id:`clothing:${day}`});this.scene.updateInventory?.();}
    if(this.level<CLOTHING.warnBelow){if(!this.warned){this.warned=true;this.scene.eventFeed?.push?.(`clothing-low-${day}`,t('clothing.low'),{important:true});}}
    else if(this.level>=.5)this.warned=false;
    this.changed();
  }
  percent(){return Math.round(this.level*100);}
  // Happiness of every resident from Clothing (0 when the chain does not apply).
  happiness(){return this.active()?clothingHappiness(this.level):0;}
  // Cloth a day the residents wear out now.
  dailyNeed(){return this.residents()/CLOTHING.wearDays;}
  exportState(){return {level:this.level,...(this.warned?{warned:true}:{})};}
  importState(data){if(!data)return;this.level=data.level;this.warned=!!data.warned;this.changed();}
  destroy(){this.unsubscribe?.();this.listeners.clear();}
}
export function validClothingState(data){
  return !!data&&typeof data==='object'&&!Array.isArray(data)&&Number.isFinite(data.level)&&data.level>=0&&data.level<=1&&(data.warned===undefined||data.warned===true)&&Object.keys(data).every(k=>['level','warned'].includes(k));
}

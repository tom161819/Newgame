import { createExperience,getXPRequired,totalXPForLevel,XP_REWARDS } from '../data/experience.js';
export { getXPRequired } from '../data/experience.js';
export function importCharacterExperience(character,data){if(character.definition.category==='character')character.experience=data?structuredClone(data):createExperience(character.definition);}

export class ExperienceSystem {
  constructor(activities){this.activities=activities;this.processed=new Set();this.listeners=new Map();this.unsubscribe=activities.on(event=>this.onActivity(event));}
  initialize(character){if(!character?.definition)return null;if(!character.experience)character.experience=createExperience(character.definition);return character.experience;}
  on(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);return()=>this.listeners.get(type)?.delete(listener);}
  emit(type,...data){for(const listener of this.listeners.get(type)??[])listener(...data);}
  getXPRequired(level){return getXPRequired(level);}
  getLevelProgress(character){const e=this.initialize(character);return e?{...e,ratio:e.level>=e.maxLevel?1:e.currentXP/e.xpToNextLevel}:null;}
  onActivity(event){
    const reward=XP_REWARDS[event.type]?.[event.objectType];if(!reward)return 0;
    const quantity=event.type==='buildingCompleted'?(event.quantity??1):1;
    if(!Number.isSafeInteger(quantity)||quantity<1)return 0;
    return this.addXP(event.actor,reward*quantity,{eventId:event.id,type:event.type,objectType:event.objectType});
  }
  addXP(character,amount,source=null){
    if(!character||!Number.isFinite(amount)||amount<=0)return 0;
    const e=this.initialize(character);if(!e||!e.enabled||character.isAlive===false)return 0;
    const id=source?.eventId;if(id){if(this.processed.has(id))return 0;this.processed.add(id);}
    if(e.level>=e.maxLevel)return 0;
    const multiplier=e.gainMultiplier*Object.values(e.modifiers).reduce((factor,value)=>factor*value,1);
    const accepted=Math.min(amount*multiplier,totalXPForLevel(e.maxLevel)-e.totalXP);if(accepted<=0||!Number.isFinite(accepted))return 0;
    const oldLevel=e.level,oldTotal=e.totalXP;e.currentXP+=accepted;e.totalXP+=accepted;this.checkLevelUp(character);
    const added=e.totalXP-oldTotal;this.emit('xp',character,added,{source,levelsGained:e.level-oldLevel});return added;
  }
  checkLevelUp(character){
    const e=this.initialize(character);if(!e)return;
    while(e.level<e.maxLevel&&e.currentXP>=getXPRequired(e.level)-1e-8){
      e.currentXP=Math.max(0,e.currentXP-getXPRequired(e.level));e.level++;e.xpToNextLevel=e.level<e.maxLevel?getXPRequired(e.level):0;
      if(e.level===e.maxLevel)e.currentXP=0;
      e.totalXP=totalXPForLevel(e.level)+e.currentXP;this.emit('levelUp',character,e.level);
    }
  }
  setModifier(character,key,multiplier){
    if(!key||['__proto__','constructor','prototype'].includes(key)||!Number.isFinite(multiplier)||multiplier<0)throw new TypeError('Neplatný XP modifikátor.');
    const e=this.initialize(character);if(e)e.modifiers[key]=multiplier;
  }
  exportState(){return {nextEventId:this.activities.nextId,processedEventIds:[...this.processed]};}
  importState(data){this.activities.nextId=data?.nextEventId??1;this.processed=new Set(data?.processedEventIds??[]);}
  importCharacter(character,data){importCharacterExperience(character,data);}
  destroy(){this.unsubscribe();this.listeners.clear();this.processed.clear();}
}

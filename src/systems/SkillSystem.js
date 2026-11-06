import { FARMING_RULES } from '../data/farming.js';
import { SKILL_IDS,WORK_RULES } from '../data/jobs.js';
import { PRODUCTION_RECIPES } from '../data/production.js';
import { createProgress } from '../data/experience.js';
import { recalculateStats } from './UnitStats.js';
import { talentXPMultiplier } from './NaturalTalentSystem.js';

export class SkillSystem {
  constructor(scene){
    this.scene=scene;this.damageAwards=new Map();this.unsubscribers=[
      scene.experienceSystem.on('activity',(event,reward)=>this.completed(event,reward)),
      scene.activities.on(event=>{if(event.type==='combatDamage')this.damageEvent(event);}),
    ];
  }
  initialize(actor){if(actor.definition.category!=='character')return null;actor.skills??={};for(const id of SKILL_IDS)actor.skills[id]??=createProgress();actor.activitySkill??=null;actor.statModifiers.activitySkill??={};return actor.skills;}
  importCharacter(actor,data){if(actor.definition.category!=='character')return;actor.skills=data?structuredClone(data):null;this.initialize(actor);}
  efficiency(actor,skill){const skills=this.initialize(actor);return 1+((skills?.[skill]?.level??1)-1)*WORK_RULES.efficiencyPerLevel;}
  workEfficiency(actor,skill){return this.efficiency(actor,skill)*(this.scene.foodSystem?.workMultiplier(actor)??1);}
  addXP(actor,skill,amount){
    const skills=this.initialize(actor);if(!skills?.[skill]||actor.isAlive===false||actor.experience?.enabled===false)return 0;
    return this.scene.experienceSystem.addTrackXP(skills[skill],amount*talentXPMultiplier(actor,skill),()=>{if(actor.activitySkill===skill)this.refreshModifier(actor);});
  }
  completed(event,reward){
    const skill=event.type==='resourceCollected'&&event.objectType==='stone'?'mining':event.type==='depositMined'?'mining':event.type==='treeChopped'?'woodcutting':event.type==='animalKilled'?'hunting':event.type==='buildingCompleted'?(FARMING_RULES.crops[event.objectType]?'farming':'construction'):event.type==='cropHarvested'?'farming':null;
    const productionSkill=event.type==='transportDelivered'?'logistics':event.type==='foodProduced'?PRODUCTION_RECIPES[event.objectType]?.skill:null;
    if(skill??productionSkill)this.addXP(event.actor,skill??productionSkill,reward);
  }
  attachCombat(combat){
    this.unsubscribers.push(combat.on('attack',(actor,target)=>{
      if(actor.definition.category!=='character')return;
      actor.activitySkill=actor.profession==='soldier'?'combat':target.definition?.gameplay?.huntable?'hunting':'combat';this.refreshModifier(actor);
    }),combat.on('attackStopped',actor=>{if(actor.definition.category==='character'){actor.activitySkill=null;this.refreshModifier(actor);}}));
  }
  refreshModifier(actor){
    actor.statModifiers.activitySkill=actor.activitySkill?{attackMultiplier:this.efficiency(actor,actor.activitySkill)}:{};recalculateStats(actor);
  }
  creditDamage(actor,target,damage){
    if(!actor||actor.definition.category!=='character'||actor.isAlive===false||actor.experience?.enabled===false||!Number.isFinite(damage)||damage<=0)return;
    const key=`${actor.id}:${target.id}`,amount=Math.min(damage*WORK_RULES.combatXPPerDamage,WORK_RULES.combatXPPerTarget-(this.damageAwards.get(key)??0));
    if(amount>1e-10)this.scene.activities.emit('combatDamage',{actor,targetId:target.id,objectType:target.type,amount});
  }
  damageEvent(event){
    if(!this.scene.experienceSystem.claimEvent(event.id))return;
    const key=`${event.actor.id}:${event.targetId}`,amount=Math.min(event.amount,WORK_RULES.combatXPPerTarget-(this.damageAwards.get(key)??0));
    if(amount<=0)return;this.damageAwards.set(key,(this.damageAwards.get(key)??0)+amount);this.addXP(event.actor,'combat',amount);
    // Damage z lovu rozvíjí Combat; celkový level odměňuje až dokončený lov.
  }
  exportState(){return {damageAwards:Object.fromEntries(this.damageAwards)};}
  importState(data){this.damageAwards=new Map(Object.entries(data?.damageAwards??{}));}
  destroy(){for(const unsubscribe of this.unsubscribers)unsubscribe();this.damageAwards.clear();}
}

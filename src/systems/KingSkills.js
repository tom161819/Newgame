import { KING_SKILLS,KING_SKILL_IDS,KING_POINT_COST } from '../data/kingSkills.js';
import { ROYAL_GOALS } from '../data/royalGoals.js';
import { SKILL_IDS } from '../data/jobs.js';
import { getXPRequired,totalXPForLevel } from '../data/experience.js';
import { visibilityProfile } from './VisibilityModifiers.js';
import { t } from '../i18n/index.js';

// m-kral-odmeny-xp (owner request 39): a finished Royal task gives the King skill points (goal.skillPoints). The player
// spends them in the King panel: one point = one level of an ordinary King skill (SkillSystem, Combat included) or of
// Leadership / Stewardship. Unspent points and the two royal levels are saved under `kingSkills`; ordinary skill levels
// live in the King's own `skills` like any XP.
export class KingSkills {
  constructor(scene,goals=scene.royalGoals){
    this.scene=scene;this.points=0;this.levels=Object.fromEntries(KING_SKILL_IDS.map(id=>[id,0]));this.revision=0;this.sight=null;
    this.off=goals?.on?.((type,goal)=>{if(type==='completed')this.award(goal.skillPoints??0,goal.id);})??(()=>{});
  }
  get king(){return this.scene.character;}
  award(n,source='goal'){
    if(!Number.isSafeInteger(n)||n<=0)return 0;this.points+=n;this.revision++;
    this.scene.eventFeed?.push?.(`king-points:${source}`,t('kingSkills.earned',{count:n}),{important:true});
    return n;
  }
  // What a point buys for `id`; null when it cannot be spent (no point, max level, unknown skill, dead King).
  canSpend(id){
    if(this.points<KING_POINT_COST||this.king?.isAlive===false)return false;
    if(Object.hasOwn(KING_SKILLS,id))return this.levels[id]<KING_SKILLS[id].maxLevel;
    const skill=SKILL_IDS.includes(id)?this.scene.skillSystem?.initialize?.(this.king)?.[id]:null;
    return !!skill&&skill.level<skill.maxLevel;
  }
  spend(id){
    if(!this.canSpend(id))return false;this.points-=KING_POINT_COST;
    if(Object.hasOwn(KING_SKILLS,id))this.levels[id]++;
    else{
      const king=this.king,e=king.skills[id];e.level++;
      if(e.level>=e.maxLevel){e.level=e.maxLevel;e.currentXP=0;e.xpToNextLevel=0;}else e.xpToNextLevel=getXPRequired(e.level);
      e.totalXP=totalXPForLevel(e.level)+e.currentXP;if(king.activitySkill===id)this.scene.skillSystem?.refreshModifier?.(king);
    }
    this.revision++;return true;
  }
  // Leadership: the King's sight this frame (the same circle as the fog of war, night shrink included).
  sightNow(){
    const king=this.king,stamp=this.scene.gameTime?.totalElapsed;
    if(this.sight&&stamp!==undefined&&this.sight.stamp===stamp)return this.sight.value;
    let value=null;
    if(king&&king.isAlive!==false&&king.definition?.gameplay?.baseSight&&king.position){
      const profile=visibilityProfile(king),scale=this.scene.fog?.sightScale?.();
      value={center:profile.center,radius:profile.radius*(scale?scale(profile.center):1)};
    }
    this.sight={stamp,value};return value;
  }
  inSight(actor){const sight=this.sightNow();return !!sight&&!!actor?.position&&Math.hypot(actor.position.x-sight.center.x,actor.position.y-sight.center.y)<=sight.radius;}
  leadershipBonus(level=this.levels.leadership){return level*KING_SKILLS.leadership.workBonusPerLevel;}
  stewardshipBonus(level=this.levels.stewardship){return level*KING_SKILLS.stewardship.taxBonusPerLevel;}
  // Multiplies SkillSystem.workEfficiency: residents only (never the King himself), only inside his sight.
  workModifier(actor){
    if(!this.levels.leadership||!actor||actor===this.king||this.scene.workerSystem?.workers?.get?.(actor.id)!==actor)return 1;
    return this.inSight(actor)?1+this.leadershipBonus():1;
  }
  taxMultiplier(){return 1+this.stewardshipBonus();}
  exportState(){return {points:this.points,...Object.fromEntries(KING_SKILL_IDS.map(id=>[id,this.levels[id]]))};}
  importState(data){this.points=data?.points??0;for(const id of KING_SKILL_IDS)this.levels[id]=data?.[id]??0;this.sight=null;this.revision++;}
  destroy(){this.off?.();}
}
// Strict check of a saved `kingSkills`: exact keys, whole numbers in range, and never more points (spent on royal
// skills or unspent) than the finished Royal tasks gave.
export function validKingSkillState(data,doneGoals=[],goals=ROYAL_GOALS){
  if(!data||typeof data!=='object'||Array.isArray(data))return false;
  if(Object.keys(data).sort().join()!==['points',...KING_SKILL_IDS].sort().join())return false;
  if(!Number.isSafeInteger(data.points)||data.points<0)return false;
  for(const id of KING_SKILL_IDS)if(!Number.isSafeInteger(data[id])||data[id]<0||data[id]>KING_SKILLS[id].maxLevel)return false;
  const done=new Set(doneGoals),earned=goals.filter(g=>done.has(g.id)).reduce((sum,g)=>sum+(g.skillPoints??0),0);
  return data.points+KING_SKILL_IDS.reduce((sum,id)=>sum+data[id]*KING_POINT_COST,0)<=earned;
}

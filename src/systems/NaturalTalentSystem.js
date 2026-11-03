import { SKILL_IDS } from '../data/jobs.js';
import { STARTING_SKILLS,TALENT_XP_BONUS,TALENTS } from '../data/economy.js';
import { createProgress } from '../data/experience.js';

// Starší poddaní dostanou stabilní talent podle identity, bez přelosování skillů.
export function initializeNaturalTalent(worker,{random=Math.random,legacy=false}={}){
  if(worker.naturalTalent)return;
  if(legacy){
    const hash=[...worker.id].reduce((value,c)=>(value*31+c.charCodeAt(0))>>>0,0);
    const talents=Object.keys(TALENTS);worker.naturalTalent=talents[hash%talents.length];
  }else{
    const choose=items=>items[Math.floor(random()*items.length)];
    const level=(min,max)=>min+Math.floor(random()*(max-min+1));
    worker.naturalTalent=choose(Object.keys(TALENTS));
    const secondary=choose(SKILL_IDS.filter(id=>id!==worker.naturalTalent));
    worker.skills=Object.fromEntries(SKILL_IDS.map(id=>[id,createProgress({initialLevel:id===worker.naturalTalent
      ?level(STARTING_SKILLS.talentMin,STARTING_SKILLS.talentMax):id===secondary?level(STARTING_SKILLS.secondaryMin,STARTING_SKILLS.secondaryMax):1})]));
  }
  worker.initialSkills=structuredClone(worker.skills);
}
export function talentXPMultiplier(worker,skill){return worker.naturalTalent===skill?1+TALENT_XP_BONUS:1;}

import { localized,workMessageLabel } from '../i18n/names.js';
import { t } from '../i18n/index.js';
import { JOBS,SKILLS,SKILL_IDS } from '../data/jobs.js';
import { HUMAN_APPEARANCE } from '../data/humanAppearance.js';
import { TALENTS } from '../data/economy.js';

export const POPULATION_ROW_HEIGHT=60;
export const POPULATION_SORTS=Object.freeze(['level','xp','name','profession','happiness',...SKILL_IDS.map(id=>`skill:${id}`)]);
const names=new Intl.Collator('cs',{numeric:true,sensitivity:'base'});
export function populationPreferences(input){return {sortBy:POPULATION_SORTS.includes(input?.sortBy)?input.sortBy:'level',direction:input?.direction==='asc'?'asc':'desc',profession:input?.profession==='all'||Object.hasOwn(JOBS,input?.profession)?input.profession:'all'};}
export function readPopulationPreferences(storage){try{return populationPreferences(JSON.parse(storage.getItem('newgame.population')??'null'));}catch{return populationPreferences();}}
export function writePopulationPreferences(storage,value){try{storage.setItem('newgame.population',JSON.stringify(populationPreferences(value)));}catch{/* Preferences are optional when browser storage is unavailable. */}}
const fold=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('cs');
export function sortedPopulation(workers,preferences,query='',{includeDead=false,happiness=null}={}){
  const p=populationPreferences(preferences),direction=p.direction==='desc'?-1:1,search=fold(query.trim()),skill=p.sortBy.startsWith('skill:')?p.sortBy.slice(6):null;
  return [...workers].filter(w=>(includeDead||w.isAlive)&&w.isSubject!==false&&(p.profession==='all'||w.profession===p.profession)&&fold(w.name).includes(search)).sort((a,b)=>{
    let primary=0;
    if(skill)primary=(a.skills[skill]?.level??1)-(b.skills[skill]?.level??1)||(a.skills[skill]?.currentXP??0)-(b.skills[skill]?.currentXP??0)||a.experience.level-b.experience.level;
    else if(p.sortBy==='level')primary=a.experience.level-b.experience.level||a.experience.totalXP-b.experience.totalXP;
    else if(p.sortBy==='xp')primary=a.experience.totalXP-b.experience.totalXP||a.experience.level-b.experience.level;
    else if(p.sortBy==='name')primary=names.compare(a.name,b.name);
    else if(p.sortBy==='happiness')primary=(happiness?.(a)??0)-(happiness?.(b)??0);
    else primary=names.compare(JOBS[a.profession]?.name??a.profession,JOBS[b.profession]?.name??b.profession)||a.experience.level-b.experience.level;
    return primary*direction||names.compare(a.name,b.name)||names.compare(a.id,b.id);
  });
}
export function populationSummary(workers){
  const residents=[...workers].filter(worker=>worker.isAlive&&worker.isSubject!==false),employed=residents.filter(worker=>worker.profession!=='idle').length;
  return {residents,total:residents.length,employed,unemployed:residents.length-employed};
}
export function populationWindow(total,scroll,height,overscan=3){
  scroll=Math.max(0,Math.min(scroll,Math.max(0,total*POPULATION_ROW_HEIGHT-height)));
  const start=Math.max(0,Math.floor(scroll/POPULATION_ROW_HEIGHT)-overscan),end=Math.min(total,Math.ceil((scroll+height)/POPULATION_ROW_HEIGHT)+overscan);
  return {start:Math.min(start,total),end};
}
export const professionColor=profession=>JOBS[profession]?.portraitColor??JOBS.idle.portraitColor;
export function residentWarnings(scene,worker){
  if(!worker.isAlive)return [{icon:'☠',text:t('population.deceased')}];
  const warnings=[];
  if(scene.foodSystem?.residents.get(worker.id)?.hungry)warnings.push({icon:'⚠',text:t('population.hungry')});
  if(worker.currentHP<worker.maxHP*.3)warnings.push({icon:'!',text:t('population.lowHealth')});
  if(worker.profession==='idle')warnings.push({icon:'◇',text:JOBS.idle.name});
  return warnings;
}
export function populationDetails(scene,worker){
  const experience=worker.experience,workplace=scene.workplaceSystem?.building(worker);
  return {name:worker.fullName??worker.name,profession:JOBS[worker.profession]?.name??worker.profession,level:experience.level,currentXP:experience.currentXP,totalXP:experience.totalXP,xpToNextLevel:experience.xpToNextLevel,maxLevel:experience.maxLevel,
    job:localized(`work.state.${worker.workState}`,worker.workState),task:worker.workMessage?workMessageLabel(worker.workMessage):t('population.noTask'),workplace:worker.profession==='hauler'?t('unit.wholeKingdom'):worker.profession==='builder'?(scene.builderWorkshops?.workshopFor(worker)?.definition?.name??t('unit.wholeKingdom')):workplace?.definition.name??t('unit.notAssigned'),
    talent:TALENTS[worker.naturalTalent]?localized(`talent.${worker.naturalTalent}`,TALENTS[worker.naturalTalent]):t('population.none'),hasTalent:!!TALENTS[worker.naturalTalent],warnings:residentWarnings(scene,worker),
    skills:Object.entries(SKILLS).filter(([id])=>worker.skills[id]).map(([id,name])=>{const skill=worker.skills[id];return {id,name,level:skill.level,currentXP:skill.currentXP,xpToNextLevel:skill.xpToNextLevel,maxLevel:skill.maxLevel,talented:id===worker.naturalTalent};})};
}
export function humanPortrait(){
  const colors=Object.fromEntries(Object.entries(HUMAN_APPEARANCE).map(([key,value])=>[key,`#${value.toString(16).padStart(6,'0')}`]));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="${colors.tunic}" d="M5 48v-9q3-8 19-8t19 8v9z"/><path fill="${colors.belt}" d="M5 44h38v4H5z"/><path fill="${colors.skin}" d="M20 27h8v9h-8z"/><ellipse cx="24" cy="20" rx="11" ry="13" fill="${colors.skin}"/><path fill="${colors.hair}" d="M12 20V11q3-8 12-8t12 8v9l-5-8-4 3-9-3z"/><g fill="${colors.eyes}"><circle cx="20" cy="20" r="1.3"/><circle cx="28" cy="20" r="1.3"/></g><path d="M21 27q3 2 6 0" fill="none" stroke="${colors.belt}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

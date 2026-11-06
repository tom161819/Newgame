import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';

// S13 (#58): needs bars for the unit panel and the Kingdom Happiness indicator in the HUD.
const NEED_IDS=['food','rest','housing','safety'];
export const homeLabel=home=>!home?t('needs.home.none'):home.kind==='house'?t('needs.home.house',{id:home.buildingId}):t('needs.home.settlement');
export const problemLabel=problem=>problem?t(`needs.problem.${problem}`):t('needs.problem.none');
// #58 phase D: each bar's tooltip says what moves the value, so the reason for dissatisfaction is visible.
const signed=v=>v>0?`+${v}`:String(v).replace('-','−');
export function needTooltip(id,status){
  if(id==='food')return t(status.hungry?'needs.tip.foodLow':'needs.tip.food');
  if(id==='rest')return t('needs.tip.rest');
  if(id==='housing')return t('needs.tip.housing',{home:homeLabel(status.home)});
  if(id==='safety')return (status.safetyFactors??[]).map(([k,v],i)=>`${t(`needs.safety.${k}`)} ${i?signed(v):v}`).join(' · ');
  return t('needs.tip.happiness')+(status.unpaidPenalty>0?` · ${t('needs.unpaidLine',{penalty:status.unpaidPenalty})}`:'');
}
export function renderNeeds(root,status){
  if(!status){root.hidden=true;return;}
  root.hidden=false;
  const bar=(id,value)=>{const row=element('div',`need-row need-${id}`);row.dataset.need=id;row.title=needTooltip(id,status);const meter=element('meter');meter.min=0;meter.max=100;meter.low=40;meter.high=70;meter.optimum=100;meter.value=value;meter.setAttribute('aria-label',t(`needs.${id}`));row.append(element('span','',t(`needs.${id}`)),meter,element('b','',`${value} %`));return row;};
  const mood=element('p','need-mood',t('needs.moodLine',{mood:t(`needs.mood.${status.mood}`),happiness:status.happiness}));mood.dataset.mood=status.mood;
  // Phase C: the mood's effect on work speed, so the player sees why work is faster or slower.
  const work=element('p','need-work',t('needs.workLine',{factor:status.workModifier.toFixed(2)}));work.dataset.work=String(status.workModifier);
  const lines=[element('h3','',t('needs.title')),...NEED_IDS.map(id=>bar(id,status[id])),bar('happiness',status.happiness),mood,work,element('p','need-problem',t('needs.problemLine',{problem:problemLabel(status.mainProblem)})),element('p','need-home',t('needs.homeLine',{home:homeLabel(status.home)}))];
  if(status.unpaidPenalty>0)lines.push(element('p','need-unpaid',t('needs.unpaidLine',{penalty:status.unpaidPenalty})));
  root.replaceChildren(...lines);
}
export class KingdomHappinessIndicator {
  constructor(scene,{document:doc=globalThis.document}={}){
    this.scene=scene;this.button=doc.querySelector('#kingdom-happiness');this.revision=null;
    this.button?.addEventListener('click',()=>scene.populationSidebar?.setOpen(true));
  }
  update(){
    const needs=this.scene.needs;if(!this.button||!needs)return;
    const key=`${needs.revision}|${this.scene.workerSystem?.liveSubjects?.().length??0}`;if(key===this.revision)return;this.revision=key;
    const value=needs.kingdomHappiness;this.button.textContent=value==null?t('needs.kingdomEmpty'):t('needs.kingdom',{value});
    this.button.title=t('needs.kingdomHint');this.button.dataset.mood=value==null?'':value>=70?'happy':value>=40?'neutral':value>=25?'unhappy':'critical';
  }
}

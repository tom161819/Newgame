import { HEATING,HEATED_BUILDINGS } from '../data/heating.js';
import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { buildingName } from '../game/depletedMine.js';
import { moodFor } from '../data/needs.js';
import { BUILDING_TOOLTIP,BUILDING_TOOLTIP_ICONS,BUILDING_TOOLTIP_MOODS,BUILDING_TOOLTIP_STORE_KINDS } from '../data/buildingTooltip.js';
import { storeContents } from './StorePreview.js';

// m-budovy-tooltip (owner point 86): what the building tooltip says, as plain data (the DOM is drawn by StorePreview).
// {title, icons:[{id,icon,label}], lines:[{kind:'text',text} | {kind:'stock',items,used,capacity}]}; the title plus
// the lines are at most BUILDING_TOOLTIP.maxLines.
const nameOf=(scene,id)=>scene.objectRegistry?.get?.(id)?.name??id;
const list=(scene,entries)=>entries.map(([id,n])=>t('buildingTooltip.amount',{count:n,name:nameOf(scene,id)})).join(', ');
export function storeLocations(scene,building){
  return [...(scene.foodStorage?.locations?.values?.()??[])].filter(l=>l.buildingId===building.id&&BUILDING_TOOLTIP_STORE_KINDS.includes(l.kind));
}
function hasRats(scene,b){
  const d=scene.domestic;if(!d)return false;
  if(d.houseHasRats?.(b))return true;
  return !!d.ratBuildings?.().some(r=>r.id===b.id)&&(d.status?.(b.id)?.level??'none')!=='none';
}
function constructionLines(scene,b){
  const c=b.construction,lines=[{kind:'text',text:t('buildingTooltip.construction',{percent:Math.floor(c?.progress??0)})}];
  const missing=(scene.constructionSystem?.materials?.summary?.(b)??[]).filter(r=>r.missing>0).map(r=>[r.resource,r.missing]);
  if(missing.length)lines.push({kind:'text',text:t('buildingTooltip.needs',{list:list(scene,missing)})});
  return lines;
}
// A recipe workplace: "Bread – 60 %", "Waiting for Flour", or paused.
function productionLine(scene,b,addIcon){
  const fp=scene.foodProduction,record=fp?.records?.get(b.id);if(!record)return null;
  const recipe=fp.recipe?.(b);if(!recipe)return null;
  if(!record.auto){addIcon('notWorking');return t('buildingTooltip.paused');}
  const cycle=record.cycle,output=Object.keys(recipe.output??{})[0];
  if(cycle){const percent=Math.floor(100*Math.min(1,(cycle.workDone??0)/Math.max(1,cycle.requiredWork??1)));return t('buildingTooltip.producing',{name:nameOf(scene,output),percent});}
  const input=scene.foodStorage?.locations?.get(`input-${b.id}`)?.stock??{},missing=Object.entries(recipe.input??{}).filter(([id,n])=>(input[id]??0)<n);
  if(missing.length){addIcon('missingInput');return t('buildingTooltip.waitingFor',{list:missing.map(([id])=>nameOf(scene,id)).join(', ')});}
  return null;
}
function houseLine(scene,b,d){
  const homes=scene.needs?.homes?.()??new Map(),ids=[...homes].filter(([,h])=>h?.kind==='house'&&h.buildingId===b.id).map(([id])=>id);
  const workers=ids.map(id=>scene.workerSystem?.workers?.get(id)).filter(Boolean),values=workers.map(w=>scene.needs?.status?.(w,homes)?.happiness).filter(Number.isFinite);
  const happiness=values.length?Math.round(values.reduce((n,v)=>n+v,0)/values.length):null,mood=happiness==null?null:moodFor(happiness).id;
  return {kind:'text',text:t('buildingTooltip.residents',{count:ids.length,capacity:d.housing.capacity}),...(mood?{mood,icon:BUILDING_TOOLTIP_MOODS[mood]??'',moodLabel:t(`needs.mood.${mood}`),happiness}:{})};
}
export function buildingTooltipContent(scene,b){
  const d=buildingDefinition(b),icons=[],lines=[],seen=new Set();
  const addIcon=id=>{if(seen.has(id))return;seen.add(id);icons.push({id,icon:BUILDING_TOOLTIP_ICONS[id],label:t(`buildingTooltip.status.${id}`)});};
  if(scene.nightThreats?.burning?.(b))addIcon('fire');
  if(hasRats(scene,b))addIcon('rats');
  if(!buildingIsComplete(b))lines.push(...constructionLines(scene,b));
  else{
    if(d.workplace&&!b.depleted&&scene.workplaceSystem){
      const summary=scene.workplaceSystem.summary(b);lines.push({kind:'text',text:t('buildingTooltip.workers',{count:summary.count,capacity:summary.capacity})});
      if(!summary.count||scene.employment?.blockReason?.(b))addIcon('notWorking');
      const production=productionLine(scene,b,addIcon);if(production)lines.push({kind:'text',text:production});
    }
    if(b.depleted)addIcon('notWorking');
    if(scene.diagnostics?.buildingIssue?.(b.id))addIcon('notWorking');
    if(d.housing)lines.push(houseLine(scene,b,d));
    // m-topeni-domu: the woodpile and whether the House is warm today (only while heating runs).
    if(HEATED_BUILDINGS.includes(b.type)&&scene.heating?.active?.()&&(scene.heating.status.has(b.id)||scene.heating.need()>0||scene.heating.stock(b)>0)){const st=scene.heating.status.get(b.id);lines.push({kind:'text',text:t('heating.tooltip',{stock:scene.heating.stock(b),capacity:HEATING.capacity,state:st?t(`heating.state.${st}`):'—'})});if(st==='cold')addIcon('cold');}
    const locations=storeLocations(scene,b);
    if(locations.length){const {used,capacity,items}=storeContents(scene,locations);lines.push({kind:'stock',items:[...items].sort((x,y)=>y.count-x.count).slice(0,BUILDING_TOOLTIP.maxItems),used,capacity});}
  }
  return {title:buildingName(b),icons,lines:lines.slice(0,BUILDING_TOOLTIP.maxLines-1)};
}
// Plain text of the tooltip, one string per line (tests and smokes).
export function buildingTooltipText(content){
  return [[content.title,...content.icons.map(i=>i.icon)].join(' '),...content.lines.map(l=>l.kind==='stock'?[...l.items.map(i=>`${i.definition?.name??i.id} ${i.count}`),`${l.used} / ${l.capacity}`].join(' · '):l.icon?`${l.text} ${l.icon}`:l.text)];
}

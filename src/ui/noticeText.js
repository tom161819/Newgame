import { t } from '../i18n/index.js';
import { JOBS } from '../data/jobs.js';
import { buildingDefinition } from '../game/buildings.js';
import { foodSources } from '../data/productionChains.js';

// The text of a work or production notice (Notices box, EventFeed, a building's panel). Pure: no DOM.
export function noticeText(scene,issue){
  const s=scene,building=s.buildings?.find(b=>b.id===issue.entityId),name=building?buildingDefinition(building).name:'',p=issue.params??{},resName=id=>s.objectRegistry?.get?.(id)?.name??id;
  if(issue.reason==='storageFull')return t('notice.storageFull',{list:(p.groups??[]).map(g=>t('notice.storageFullGroup',{resources:g.resources.map(resName).join(', '),building:resName(g.helper)})).join('; ')});
  const resource=p.resource?resName(p.resource):'',producer=p.producer?resName(p.producer):'',profession=p.profession?JOBS[p.profession]?.name??p.profession:'';
  if(issue.reason==='foodLow')return t('notice.foodLow',{days:p.days??0,sources:foodSourceList(s)});
  const lower=id=>id?resName(id).toLocaleLowerCase():'';
  if(issue.reason==='missingChainSource')return t('notice.missingChainSource',{name,resource:lower(p.resource),producer});
  if(issue.reason==='chainNoConsumer')return t('notice.chainNoConsumer',{resource,consumer:resName(p.consumer),output:lower(p.output)});
  const key=issue.reason==='noFarm'&&(p.count??1)>1?'noFarmMany':issue.reason==='depleted'&&p.exhausted?'mineExhausted':issue.reason;
  return t(`notice.${key}`,{name,resource,producer,profession,count:p.count??1,source:p.source?t(`notice.source.${p.source}`):''});
}
// Request 66: every way to food, from the building data (buildings that make an edible resource, processed food as
// its whole chain): "Orchard (Farmhouse), Hunting Lodge, Fisherman's Hut near water or Wheat Field → Mill → Bakery".
export function foodSourceList(scene){
  const r=scene.objectRegistry,name=d=>r?.get?.(d.id)?.name??d.name??d.id;if(!r?.buildables)return '';
  const one=d=>d.fishing?t('notice.foodSource.water',{name:name(d)}):d.crop&&d.recommendsCompletedBuildings?.[0]?t('notice.foodSource.farm',{name:name(d),farm:r.get?.(d.recommendsCompletedBuildings[0])?.name??d.recommendsCompletedBuildings[0]}):name(d);
  const items=foodSources(r.buildables()).map(chain=>chain.length===1?one(chain[0]):chain.map(name).join(' → '));
  return items.length>1?`${items.slice(0,-1).join(', ')}${t('notice.or')}${items.at(-1)}`:items[0]??'';
}
// The longer line in the building's own panel (with advice), or null when the issue has none.
export function buildingIssueLine(scene,issue){
  if(!issue)return null;const building=scene.buildings?.find(b=>b.id===issue.entityId),name=building?buildingDefinition(building).name:'',p=issue.params??{};
  if(issue.reason==='depleted')return t('notice.depletedLine',{resource:scene.objectRegistry?.get?.(p.resource)?.name??p.resource,name,source:t(`notice.source.${p.source}`)});
  if(issue.reason==='outputFull')return t('notice.outputFullLine');
  return noticeText(scene,issue);
}

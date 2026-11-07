import { t } from '../i18n/index.js';
import { JOBS } from '../data/jobs.js';
import { buildingDefinition } from '../game/buildings.js';

// The text of a work or production notice (Notices box, EventFeed, a building's panel). Pure: no DOM.
export function noticeText(scene,issue){
  const s=scene,building=s.buildings?.find(b=>b.id===issue.entityId),name=building?buildingDefinition(building).name:'',p=issue.params??{},resName=id=>s.objectRegistry?.get?.(id)?.name??id;
  if(issue.reason==='storageFull')return t('notice.storageFull',{list:(p.groups??[]).map(g=>t('notice.storageFullGroup',{resources:g.resources.map(resName).join(', '),building:resName(g.helper)})).join('; ')});
  const resource=p.resource?resName(p.resource):'',producer=p.producer?resName(p.producer):'',profession=p.profession?JOBS[p.profession]?.name??p.profession:'';
  return t(`notice.${issue.reason}`,{name,resource,producer,profession,count:p.count??1,source:p.source?t(`notice.source.${p.source}`):''});
}
// The longer line in the building's own panel (with advice), or null when the issue has none.
export function buildingIssueLine(scene,issue){
  if(!issue)return null;const building=scene.buildings?.find(b=>b.id===issue.entityId),name=building?buildingDefinition(building).name:'',p=issue.params??{};
  if(issue.reason==='depleted')return t('notice.depletedLine',{resource:scene.objectRegistry?.get?.(p.resource)?.name??p.resource,name,source:t(`notice.source.${p.source}`)});
  if(issue.reason==='outputFull')return t('notice.outputFullLine');
  return noticeText(scene,issue);
}

import { validHaulPriority } from '../data/logistics.js';
import { t } from '../i18n/index.js';
// m-nosic-priorita: a Hauler's choice as a <select> value ('any', 'build', …, 'resource:stone') and back.
export const haulPriorityValue=p=>!p||p.kind==='any'?'any':p.kind==='resource'?`resource:${p.resource}`:p.kind;
export function haulPriorityFromValue(value){const v=String(value??'any');if(v.startsWith('resource:'))return {kind:'resource',resource:v.slice(9)};return {kind:v};}
// Sets (or, for 'any', clears) a Hauler's choice; an unknown value is refused. Asks the Hauler to plan again at once.
export function setHaulPriority(worker,priority){
  if(!worker||worker.profession!=='hauler'||!validHaulPriority(priority))return false;
  if(priority.kind==='any')delete worker.haulPriority;else worker.haulPriority={...priority};worker.aiCooldown=0;return true;
}
export const haulPriorityLabel=(scene,p)=>!p||p.kind==='any'?t('haul.priority.any'):p.kind==='resource'?(scene.objectRegistry?.get?.(p.resource)?.name??p.resource):t(`haul.priority.${p.kind}`);

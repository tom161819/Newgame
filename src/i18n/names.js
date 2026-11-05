import { t,hasKey,language } from './index.js';

// Object, profession and skill texts live in the dictionaries under `object.<id>.name`,
// `.description`, `job.<id>` and `skill.<id>`; the data text is only the last
// fallback, so a new object without keys still shows its data name, never a raw key.
export function localized(key,english){return hasKey(key,language())?t(key):english;}
function getter(target,property,key,english){Object.defineProperty(target,property,{get:()=>localized(key,english),enumerable:true,configurable:true});}
// Called on the registry's private copy before it is frozen; the getters stay live.
export function localizeDefinition(definition){
  if(typeof definition.name==='string')getter(definition,'name',`object.${definition.id}.name`,definition.name);
  if(typeof definition.description==='string')getter(definition,'description',`object.${definition.id}.description`,definition.description);
  return definition;
}
export function localizeJobs(jobs){return Object.fromEntries(Object.entries(jobs).map(([id,job])=>{const copy={...job};getter(copy,'name',`job.${id}`,job.name);return [id,Object.freeze(copy)];}));}
export function localizeSkills(skills){const result={};for(const [id,name]of Object.entries(skills))getter(result,id,`skill.${id}`,name);return result;}

import { t,hasKey,language,LANGUAGES } from './index.js';

// Object, profession and skill texts live in the dictionaries under `object.<id>.name`,
// `.description`, `job.<id>` and `skill.<id>`; the data text is only the last
// fallback, so a new object without keys still shows its data name, never a raw key.
export function localized(key,english){return hasKey(key,language())?t(key):english;}
function getter(target,property,key,english){Object.defineProperty(target,property,{get:()=>localized(key,english),enumerable:true,configurable:true});}
// Called on the registry's private copy before it is frozen; the getters stay live.
export function localizeDefinition(definition){
  if(typeof definition.name==='string')getter(definition,'name',`object.${definition.id}.name`,definition.name);
  // Inventory shows a plural label where one exists (Stones, Iron Bars), otherwise the name.
  if(typeof definition.inventoryLabel==='string')Object.defineProperty(definition,'inventoryLabel',{get:()=>hasKey(`object.${definition.id}.plural`,language())?t(`object.${definition.id}.plural`):definition.name,enumerable:true,configurable:true});
  if(typeof definition.description==='string')getter(definition,'description',`object.${definition.id}.description`,definition.description);
  return definition;
}
export function localizeJobs(jobs){return Object.fromEntries(Object.entries(jobs).map(([id,job])=>{const copy={...job};getter(copy,'name',`job.${id}`,job.name);return [id,Object.freeze(copy)];}));}
export function localizeSkills(skills){const result={};for(const [id,name]of Object.entries(skills))getter(result,id,`skill.${id}`,name);return result;}

// "3 stones" / "3 kameny": a count form where the dictionary has one, otherwise "3 Name".
export function countName(definition,count){const key=`object.${definition.id}.count`;return hasKey(key,language())?t(key,{count}):`${count} ${definition.name}`;}
// Saved data (ledger and transaction sources) stays language-neutral: always the English name.
export function dataName(definition){const key=`object.${definition.id}.name`;return LANGUAGES.en.dictionary[key]??Object.getOwnPropertyDescriptor(definition,'name')?.value??definition.id;}
// Display of a saved ledger source: fixed sources have keys, "<Building> Construction" and
// similar are rebuilt from the English building name; anything unknown is shown as stored.
const SOURCE_SUFFIXES=['Cancellation Loss','Construction','Production','Income'];
export function ledgerLabel(source){
  if(hasKey(`ledger.${source}`,language()))return t(`ledger.${source}`);
  const suffix=SOURCE_SUFFIXES.find(s=>source.endsWith(` ${s}`));if(!suffix)return source;
  const name=source.slice(0,-suffix.length-1),entry=Object.entries(LANGUAGES.en.dictionary).find(([key,value])=>value===name&&/^object\.[\w]+\.name$/.test(key));
  return entry?t(`ledger.suffix.${suffix}`,{name:t(entry[0])}):source;
}

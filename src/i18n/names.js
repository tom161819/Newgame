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
// A stored English object name or id back to the current language ("Warehouse" or "stone").
function storedName(value){
  const entry=Object.entries(LANGUAGES.en.dictionary).find(([key,text])=>text===value&&/^object\.\w+\.name$/.test(key));
  if(entry)return t(entry[0]);return hasKey(`object.${value}.name`,'en')?t(`object.${value}.name`):value;
}
// Work messages are saved in English; they are translated only for display.
const WORK_PATTERNS=[
  [/^Collecting (\d+) (\w+)$/,'work.collecting',m=>({count:m[1],resource:storedName(m[2])})],
  [/^Carrying (\d+) (\w+)$/,'work.carrying',m=>({count:m[1],resource:storedName(m[2])})],
  [/^Chopping (.+) (\d+)%$/,'work.chopping',m=>({name:storedName(m[1]),percent:m[2]})],
  [/^Mining (\d+)%$/,'work.mining',m=>({percent:m[1]})],
  [/^Establishing (.+)$/,'work.establishing',m=>({name:storedName(m[1])})],
  [/^Building (.+)$/,'work.building',m=>({name:storedName(m[1])})],
  [/^Harvesting (.+)$/,'work.harvesting',m=>({name:storedName(m[1])})],
  [/^Hunting (.+)$/,'work.hunting',m=>({name:storedName(m[1])})],
  [/^Producing (.+)$/,'work.producing',m=>({resource:storedName(m[1])})],
  [/^Travelling to (.+)$/,'work.travelling',m=>({name:storedName(m[1])})],
  [/^Walking to (.+)$/,'work.walking',m=>({name:storedName(m[1])})],
  [/^Waiting for Hauler delivery of (.+)$/,'work.waitingHauler',m=>({resource:storedName(m[1])})],
  [/^Waiting for delivered (.+)$/,'work.waitingDelivered',m=>({resource:storedName(m[1])})],
  [/^Waiting for (.+)$/,'work.waitingFor',m=>({resource:storedName(m[1])})],
];
export function workMessageLabel(message){
  if(!message)return '';if(hasKey(`work.message.${message}`,language()))return t(`work.message.${message}`);
  for(const [pattern,key,params]of WORK_PATTERNS){const m=message.match(pattern);if(m)return t(key,params(m));}
  return message;
}

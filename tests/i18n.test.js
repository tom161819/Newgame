import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync,statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';
import { t,setLanguage,readLanguage,language,LANGUAGES,DEFAULT_LANGUAGE } from '../src/i18n/index.js';

// N07 (#38): one key-based translation system for Czech and English.
const root=fileURLToPath(new URL('../',import.meta.url));
const placeholders=value=>[...new Set((typeof value==='string'?[value]:Object.values(value)).flatMap(v=>[...v.matchAll(/\{(\w+)\}/g)].map(m=>m[1])))].sort();
function sources(dir){return readdirSync(dir).flatMap(name=>{const file=path.join(dir,name);return statSync(file).isDirectory()?sources(file):file.endsWith('.js')?[file]:[];});}

test('both languages have exactly the same keys, placeholders and plural categories',()=>{
  assert.deepEqual(Object.keys(cs).sort(),Object.keys(en).sort());
  for(const key of Object.keys(en)){
    assert.equal(typeof cs[key],typeof en[key],key);assert.deepEqual(placeholders(cs[key]),placeholders(en[key]),key);
    if(typeof en[key]==='object'){assert.ok(en[key].one&&en[key].other,key);assert.ok(cs[key].one&&cs[key].few&&cs[key].other,`${key}: Czech needs one/few/other`);}
    else{assert.ok(en[key].trim()&&cs[key].trim(),key);}
  }
});
test('every key used in the markup and in code exists, including the dynamic families',()=>{
  const html=readFileSync(path.join(root,'index.html'),'utf8'),used=new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m=>m[1]));
  for(const m of html.matchAll(/data-i18n-attr="([^"]+)"/g))for(const pair of m[1].split(';'))used.add(pair.split(':')[1]);
  for(const file of sources(path.join(root,'src')))for(const m of readFileSync(file,'utf8').matchAll(/\bt\('([\w.]+)'/g))used.add(m[1]);
  for(const family of [['difficulty',['easy','normal','hard']],['setup.respawn',['off','slow','normal','fast']],['setup.wildlife',['rare','normal','abundant']],['resource',['stone','wood','iron_ore','bread']],['changelog.category',['added','changed','improved','fixed','balance','removed']],['setup.day',['60','120','240']],['season',['Spring','Summer','Autumn','Winter']],['weather',['Sunny','Rainy','Drought','Frost']],['tree.stage',['0','1','2','3']],['crop.wheat_field.stage',['0','1','2','3']],['crop.orchard.stage',['0','1','2','3']],['construction.phase',['Completed','Blueprint','Foundations','Structure','Nearly complete']],['buildingCategory',['all','defense','housing','food','industry','logistics','infrastructure']],['population.sort',['level','xp','name','profession']],['talent',['woodcutting','mining','hunting','construction','farming','combat']],['category',['terrain','resource','building','character','decoration','animal','equipment','treasure']]])for(const v of family[1])used.add(`${family[0]}.${v}`);
  const missing=[...used].filter(key=>!Object.hasOwn(en,key));assert.deepEqual(missing,[]);assert.ok(used.size>140,`${used.size} keys in use`);
});
test('parameters, plurals and fallbacks never produce undefined',()=>{
  setLanguage('en',{persist:false});
  assert.equal(t('setup.summary.chests',{count:1}),'1 chest');assert.equal(t('setup.summary.chests',{count:3}),'3 chests');assert.equal(t('autosave.interval',{count:5}),'5 minutes');
  assert.equal(t('no.such.key'),'no.such.key');assert.equal(t('saves.rowDay',{day:4}),'Day 4 · Played ');
  setLanguage('cs',{persist:false});
  assert.equal(t('setup.summary.chests',{count:1}),'1 truhla');assert.equal(t('setup.summary.chests',{count:3}),'3 truhly');assert.equal(t('setup.summary.chests',{count:5}),'5 truhel');
  assert.equal(t('autosave.interval',{count:2}),'2 minuty');assert.equal(t('autosave.interval',{count:10}),'10 minut');assert.equal(t('saves.load'),'Načíst');
  for(const lang of Object.keys(LANGUAGES)){setLanguage(lang,{persist:false});for(const key of Object.keys(en))for(const count of [0,1,2,5])assert.doesNotMatch(t(key,{count}),/undefined|null|\{\w+\}/,`${lang} ${key}`);}
  setLanguage(DEFAULT_LANGUAGE,{persist:false});
});
test('the choice is remembered per browser; the browser language is the first default',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  assert.equal(readLanguage(storage,'cs-CZ'),'cs');assert.equal(readLanguage(storage,'de-DE'),'en');assert.equal(readLanguage(storage,undefined),'en');
  setLanguage('cs',{storage});assert.equal(data.get('newgame.language'),'cs');assert.equal(readLanguage(storage,'en-US'),'cs');assert.equal(language(),'cs');
  assert.equal(setLanguage('xx',{storage}),false);assert.equal(language(),'cs');
  assert.equal(readLanguage({getItem(){throw new Error('blocked');}},'cs'),'cs');
  setLanguage(DEFAULT_LANGUAGE,{persist:false});
});
test('every object, profession and skill has a name in both languages, and data names follow the language',async()=>{
  const {objectRegistry}=await import('../src/systems/ObjectRegistry.js'),{JOBS,SKILLS}=await import('../src/data/jobs.js');
  for(const d of objectRegistry.all()){assert.ok(Object.hasOwn(en,`object.${d.id}.name`),d.id);if(d.description!==undefined)assert.ok(Object.hasOwn(en,`object.${d.id}.description`),d.id);}
  for(const id of Object.keys(JOBS))assert.ok(Object.hasOwn(en,`job.${id}`),id);for(const id of Object.keys(SKILLS))assert.ok(Object.hasOwn(en,`skill.${id}`),id);
  setLanguage('cs',{persist:false});assert.equal(objectRegistry.require('warehouse').name,'Sklad');assert.equal(JOBS.hauler.name,'Nosič');assert.equal(SKILLS.mining,'Těžba');assert.equal(objectRegistry.require('stone').name,'Kámen');
  setLanguage('en',{persist:false});assert.equal(objectRegistry.require('warehouse').name,'Warehouse');assert.equal(JOBS.hauler.name,'Hauler');assert.equal(SKILLS.mining,'Mining');assert.equal(objectRegistry.require('stone').name,'Stone');
  assert.equal(Object.isFrozen(objectRegistry.require('warehouse')),true,'definitions stay frozen');
  setLanguage(DEFAULT_LANGUAGE,{persist:false});
});
test('saved ledger sources stay English and are translated only for display',async()=>{
  const {dataName,ledgerLabel}=await import('../src/i18n/names.js'),{objectRegistry}=await import('../src/systems/ObjectRegistry.js');
  setLanguage('cs',{persist:false});assert.equal(dataName(objectRegistry.require('warehouse')),'Warehouse');
  assert.equal(ledgerLabel('Warehouse Construction'),'Stavba: Sklad');assert.equal(ledgerLabel('Worker Wages'),'Mzdy pracovníků');assert.equal(ledgerLabel('Unknown Thing'),'Unknown Thing');
  setLanguage('en',{persist:false});assert.equal(ledgerLabel('Warehouse Construction'),'Warehouse Construction');assert.equal(ledgerLabel('Worker Wages'),'Worker Wages');
  setLanguage(DEFAULT_LANGUAGE,{persist:false});
});
test('work messages stay English in saves and are translated for display, including names and resources',async()=>{
  const {workMessageLabel}=await import('../src/i18n/names.js');
  setLanguage('cs',{persist:false});
  assert.equal(workMessageLabel('Waiting for transport'),'Čeká na přepravu');assert.equal(workMessageLabel('Building Warehouse'),'Staví: Sklad');
  assert.equal(workMessageLabel('Carrying 12 stone'),'Nese 12 × Kámen');assert.equal(workMessageLabel('Waiting for Hauler delivery of wheat'),'Čeká, až nosič doručí: Pšenice');
  assert.equal(workMessageLabel('Chopping Oak 40%'),'Kácí Dub 40 %');assert.equal(workMessageLabel('Something new'),'Something new');assert.equal(workMessageLabel(''),'');
  setLanguage('en',{persist:false});assert.equal(workMessageLabel('Building Warehouse'),'Building Warehouse');assert.equal(workMessageLabel('Carrying 12 stone'),'Carrying 12 Stone');
  setLanguage(DEFAULT_LANGUAGE,{persist:false});
});

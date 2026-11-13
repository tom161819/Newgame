import { JOBS,SKILLS } from '../data/jobs.js';
import { WIKI_TOPICS,WIKI_PAGE_LINKS,WIKI_CATEGORIES,WIKI_TEXT_PARTS,WIKI_SINKS,WIKI_ENTRIES,wikiTextKey } from '../data/wiki.js';
import { UNIT_TYPES,RECRUIT,MILITARY_RULES } from '../data/military.js';
import { BASE_DAILY_WAGES } from '../data/economy.js';
import { resourceGroup } from '../data/resourceGroups.js';
import { buildingOutputs,buildingInputs } from '../data/productionChains.js';
import { EDIBLE_RESOURCES } from '../data/seasons.js';

// m-wiki-napoveda: the Wiki's pages. Buildings, resources and professions come from the registry and JOBS (name,
// description, price, size, workers, what it makes and uses, storage), topics from WIKI_TOPICS with their texts in
// i18n. A page: {id, category, title, definition?, facts:[[label,value]], body, links:[pageId]}.
// m-wiki-v2 (plan 36): every page also has `sections` in a fixed order – why (what it is for), how (how it works),
// chain (where its inputs come from and where its output goes, drawn as rows of steps), numbers (the facts, read
// from the data), tips, unlock. "Why", "how" and "tips" are hand-written texts in i18n (wikiTextKey); the rest is
// generated, so it follows the data. A chain row: [{page|sink, label}], left to right.
const amounts=(registry,t,map)=>Object.entries(map??{}).map(([id,n])=>`${n} ${registry.get(id)?.name??id}`).join(', ');
const seconds=ms=>Math.round(ms/100)/10;
const recipesOf=d=>[d.recipe,...Object.values(d.recipes??{})].filter(Boolean).filter((r,i,all)=>all.findIndex(o=>JSON.stringify(o)===JSON.stringify(r))===i);

// What a building takes in besides its recipe: fuel for its fire, kit for its soldiers.
const KIT_RESOURCES=Object.freeze(['sword','armor','bow']);
export function buildingNeeds(d){
  return [...new Set([...buildingInputs(d),...(d.fuel?.resource?[d.fuel.resource]:[]),...(d.kit?KIT_RESOURCES:[])])];
}
// The production graph read from the building data: who makes and who takes each resource, and where it ends
// (food is eaten by the people, building materials go into new buildings).
export function wikiGraph(registry){
  const buildings=registry.all().filter(d=>d.category==='building'&&d.buildable!==false);
  const makers=new Map(),takers=new Map(),push=(map,k,v)=>{if(!map.has(k))map.set(k,[]);if(!map.get(k).includes(v))map.get(k).push(v);};
  for(const d of buildings){for(const r of buildingOutputs(d))push(makers,r,d.id);for(const r of buildingNeeds(d))push(takers,r,d.id);}
  const sinks=new Map();
  for(const r of EDIBLE_RESOURCES)push(sinks,r,'people');
  for(const d of buildings)for(const r of Object.keys(d.cost??{}))push(sinks,r,'construction');
  for(const d of buildings)for(const r of recipesOf(d))if(r.vehicle)for(const id of Object.keys(r.output??{}))push(sinks,id,'haulers');
  return {buildings,makers,takers,sinks,isRaw:id=>!buildingInputs(registry.get(id)).length};
}
// The steps that lead to `resource`, raw source first (bread: Wheat Field → wheat → Mill → flour → Bakery → bread).
// Follows a raw producer when there is one, else the first; stops on a loop.
export function chainInto(graph,resource,seen=new Set()){
  if(seen.has(resource))return null;seen.add(resource);
  const makers=graph.makers.get(resource)??[];const maker=makers.find(graph.isRaw)??makers[0];if(!maker)return [{resource}];
  if(graph.isRaw(maker))return [{building:maker},{resource}];
  const first=buildingInputs(graph.buildings.find(d=>d.id===maker))[0],before=first?chainInto(graph,first,seen):null;
  return [...(before??[]),{building:maker},{resource}];
}
// Where `resource` goes from here, up to `depth` workshops on (flour → Bakery → bread → people).
export function chainFrom(graph,resource,depth=3,seen=new Set([resource])){
  const takers=graph.takers.get(resource)??[];
  if(!takers.length||depth<=0)return (graph.sinks.get(resource)??[]).slice(0,1).map(sink=>[{sink}]);
  return takers.map(id=>{
    const d=graph.buildings.find(b=>b.id===id),out=buildingOutputs(d).find(r=>!seen.has(r));
    if(!out)return [{building:id}];
    const rest=chainFrom(graph,out,depth-1,new Set([...seen,out]));return [{building:id},{resource:out},...(rest[0]??[])];
  });
}
// Rows for a building's page: one per input (from its raw source to here), one per output (from here onwards).
export function buildingChain(graph,d){
  const rows=[];
  for(const r of buildingNeeds(d)){const into=chainInto(graph,r);if(into)rows.push({kind:'in',steps:[...into,{building:d.id,here:true}]});}
  for(const r of buildingOutputs(d)){const from=chainFrom(graph,r);for(const tail of (from.length?from:[[]]))rows.push({kind:'out',steps:[{building:d.id,here:true},{resource:r},...tail]});}
  return rows;
}
export function resourceChain(graph,id){
  const into=chainInto(graph,id).map(s=>s.resource===id?{...s,here:true}:s),from=chainFrom(graph,id);
  return (from.length?from:[[]]).map(tail=>({kind:'through',steps:[...into,...tail]}));
}
// "All chains": one row for each good that ends somewhere (eaten, worn, burnt, driven or built with).
export function allChains(graph){
  const rows=[],keys=new Set();
  for(const [resource] of graph.makers){
    const takers=graph.takers.get(resource)??[],ends=takers.filter(id=>!buildingOutputs(graph.buildings.find(d=>d.id===id)).length);
    const sink=(graph.sinks.get(resource)??[])[0];
    if(takers.length&&!ends.length&&!(sink==='people'))continue;
    const into=chainInto(graph,resource);if(!into||into.length<2)continue;
    const tails=ends.length?ends.map(id=>[{building:id}]):sink?[[{sink}]]:[[]];
    for(const tail of tails){const steps=[...into,...tail],key=steps.map(s=>s.building??s.resource??s.sink).join('>');if(keys.has(key))continue;keys.add(key);rows.push({kind:'all',steps});}
  }
  return rows.sort((a,b)=>a.steps.length-b.steps.length||String(a.steps.at(-1).sink??a.steps.at(-1).building).localeCompare(String(b.steps.at(-1).sink??b.steps.at(-1).building)));
}

export function buildWikiPages(registry,t,{has=key=>t(key)!==key}={}){
  const pages=new Map(),add=page=>pages.set(page.id,{links:[],facts:[],body:'',sections:[],...page,links:[...new Set([...(page.links??[]),...(WIKI_PAGE_LINKS[page.id]??[])])]});
  const buildings=registry.all().filter(d=>d.category==='building'&&(d.buildable||d.storage||d.id==='castle'));
  const graph=wikiGraph(registry),name=id=>registry.get(id)?.inventoryLabel??registry.get(id)?.name??id;
  // A chain step as the panel draws it: a label and the page it opens (sinks have no page).
  const step=s=>s.sink?{label:t(`wiki.sink.${s.sink}`),sink:s.sink}:s.building?{label:registry.get(s.building)?.name??s.building,page:`building:${s.building}`,here:!!s.here}:{label:name(s.resource),page:`resource:${s.resource}`,here:!!s.here,resource:true};
  const rows=list=>list.map(r=>({kind:r.kind,steps:r.steps.map(step)}));
  // Hand-written parts (why / how / tips) when the text exists; the data description stands in for "why".
  const sectionTitle=(pageId,part)=>{const kind=String(pageId).split(':')[0],special=`wiki.section.${part}.${kind}`;return has(special)?t(special):t(`wiki.section.${part}`);};
  const texts=(pageId,fallback='')=>WIKI_TEXT_PARTS.map(part=>{const key=wikiTextKey(pageId,part);return has(key)?{key:part,title:sectionTitle(pageId,part),text:t(key)}:part==='why'&&fallback?{key:part,title:t('wiki.section.why'),text:fallback}:null;}).filter(Boolean);
  const sectionsOf=(pageId,{fallback,chain,facts,unlock})=>{
    const [why,how,tips]=WIKI_TEXT_PARTS.map(part=>texts(pageId,fallback).find(s=>s.key===part));
    return [why,how,chain?.length?{key:'chain',title:t('wiki.section.chain'),rows:chain}:null,facts?.length?{key:'numbers',title:t('wiki.section.numbers'),facts}:null,tips,unlock?{key:'unlock',title:t('wiki.section.unlock'),text:unlock}:null].filter(Boolean);
  };
  for(const d of buildings){
    const facts=[],links=[];
    if(d.cost&&Object.keys(d.cost).length)facts.push([t('wiki.fact.cost'),amounts(registry,t,d.cost)]);else facts.push([t('wiki.fact.cost'),t('wiki.free')]);
    if(d.width)facts.push([t('wiki.fact.size'),`${d.width} × ${d.height}`]);
    if(d.constructionTime)facts.push([t('wiki.fact.buildTime'),t('wiki.seconds',{n:seconds(d.constructionTime)})]);
    if(d.workplace){facts.push([t('wiki.fact.workers'),`${d.workplace.capacity} × ${JOBS[d.workplace.profession]?.name??d.workplace.profession}`]);links.push(`profession:${d.workplace.profession}`);}
    if(d.workRadius)facts.push([t('wiki.fact.radius'),t('wiki.tiles',{n:d.workRadius,count:d.workRadius})]);
    const recipes=recipesOf(d);
    if(recipes.length){facts.push([t('wiki.fact.uses'),recipes.map(r=>amounts(registry,t,r.input)||'—').join(' / ')],[t('wiki.fact.makes'),recipes.map(r=>amounts(registry,t,r.output)).join(' / ')],[t('wiki.fact.duration'),recipes.map(r=>t('wiki.seconds',{n:seconds(r.duration)})).join(' / ')]);
      for(const r of recipes)for(const id of [...Object.keys(r.input??{}),...Object.keys(r.output??{})])links.push(`resource:${id}`);}
    if(d.mining){facts.push([t('wiki.fact.mines'),t('wiki.mining',{resource:name(d.mining.resource),n:seconds(d.mining.duration)})]);links.push(`resource:${d.mining.resource}`);if(d.mining.range)facts.push([t('wiki.fact.reach'),t('wiki.tiles',{n:d.mining.range,count:d.mining.range})]);}
    if(d.crop){facts.push([t('wiki.fact.crop'),t('wiki.crop',{n:d.crop.yield,resource:name(d.crop.resource),days:d.crop.growthDays})]);links.push(`resource:${d.crop.resource}`);}
    for(const r of buildingOutputs(d))if(!recipes.length&&!d.mining&&!d.crop){facts.push([t('wiki.fact.gathers'),name(r)]);links.push(`resource:${r}`);}
    if(d.storage?.capacity){facts.push([t('wiki.fact.storage'),String(d.storage.capacity)]);if(d.storage.resources?.length)facts.push([t('wiki.fact.accepts'),d.storage.resources.map(name).join(', ')]);for(const r of d.storage.resources??[])links.push(`resource:${r}`);}
    if(d.bufferCapacity)facts.push([t('wiki.fact.ownStore'),String(d.bufferCapacity)]);
    if(d.housing?.capacity)facts.push([t('wiki.fact.residents'),String(d.housing.capacity)]);
    if(d.kit?.capacity)facts.push([t('wiki.fact.kit'),String(d.kit.capacity)]);
    if(d.horseCapacity)facts.push([t('wiki.fact.horses'),String(d.horseCapacity)]);
    if(d.trade?.capacity)facts.push([t('wiki.fact.tradeLoad'),String(d.trade.capacity)]);
    if(d.fuel){facts.push([t('wiki.fact.fuel'),t('wiki.fuel',{n:d.fuel.perNight,resource:name(d.fuel.resource),capacity:d.fuel.capacity})]);links.push(`resource:${d.fuel.resource}`);if(d.fuel.radius)facts.push([t('wiki.fact.lightRadius'),t('wiki.tiles',{n:d.fuel.radius,count:d.fuel.radius})]);}
    if(d.visibility?.multiplier>1)facts.push([t('wiki.fact.sight'),`× ${d.visibility.multiplier}`]);
    if(d.decoration?.range)facts.push([t('wiki.fact.effect'),t('wiki.decoration',{n:d.decoration.range,happiness:d.decoration.happiness??0})]);
    if(d.lights?.length&&!d.fuel)facts.push([t('wiki.fact.light'),t('wiki.yes')]);
    const needs=(d.requiresCompletedBuildings??[]).map(id=>registry.get(id)?.name??id),advised=(d.recommendsCompletedBuildings??[]).map(id=>registry.get(id)?.name??id);
    for(const id of [...(d.requiresCompletedBuildings??[]),...(d.recommendsCompletedBuildings??[])])links.push(`building:${id}`);
    const unlock=[needs.length?t('wiki.unlock.requires',{names:needs.join(', ')}):'',advised.length?t('wiki.unlock.advised',{names:advised.join(', ')}):''].filter(Boolean).join(' ');
    const chain=d.buildable!==false?rows(buildingChain(graph,d)):[];
    for(const row of chain)for(const s of row.steps)if(s.page)links.push(s.page);
    const id=`building:${d.id}`;
    add({id,category:'buildings',title:d.name,definition:d,facts,body:d.description??'',links,sections:sectionsOf(id,{fallback:d.description,chain,facts,unlock})});
  }
  const producers=id=>buildings.filter(d=>buildingOutputs(d).includes(id)).map(d=>`building:${d.id}`),users=id=>buildings.filter(d=>buildingNeeds(d).includes(id)).map(d=>`building:${d.id}`);
  for(const d of registry.byCategory('resource').filter(d=>d.collectible)){
    const facts=[[t('wiki.fact.group'),t(`wiki.group.${resourceGroup(d,registry)}`)]],made=producers(d.id),used=users(d.id);
    if(made.length)facts.push([t('wiki.fact.madeIn'),made.map(id=>pages.get(id)?.title).join(', ')]);if(used.length)facts.push([t('wiki.fact.usedIn'),used.map(id=>pages.get(id)?.title).join(', ')]);
    const stores=buildings.filter(b=>b.storage?.resources?.includes(d.id)).map(b=>`building:${b.id}`);if(stores.length)facts.push([t('wiki.fact.storedIn'),stores.map(id=>pages.get(id)?.title).join(', ')]);
    if(EDIBLE_RESOURCES.includes(d.id))facts.push([t('wiki.fact.food'),t('wiki.yes')]);
    const id=`resource:${d.id}`,chain=(made.length||used.length)?rows(resourceChain(graph,d.id)):[];
    add({id,category:'resources',title:d.inventoryLabel??d.name,definition:d,facts,body:d.description??'',links:[...made,...used,...stores],sections:sectionsOf(id,{fallback:d.description,chain,facts})});
  }
  for(const [id,job] of Object.entries(JOBS)){
    if(id==='idle')continue;const places=buildings.filter(d=>d.workplace?.profession===id).map(d=>`building:${d.id}`),facts=[];
    if(job.skill)facts.push([t('wiki.fact.skill'),SKILLS[job.skill]??job.skill]);if(places.length)facts.push([t('wiki.fact.worksIn'),places.map(p=>pages.get(p)?.title).join(', ')]);
    const body=places.length?t('wiki.professionBody',{job:job.name,places:places.map(p=>pages.get(p)?.title).join(', ')}):t('wiki.professionFree',{job:job.name}),pageId=`profession:${id}`;
    add({id:pageId,category:'professions',title:job.name,facts,body,links:places,sections:sectionsOf(pageId,{fallback:body,facts})});
  }
  for(const topic of WIKI_TOPICS){const body=t(`wiki.topic.${topic.id}.body`);add({id:`topic:${topic.id}`,category:topic.category,title:t(`wiki.topic.${topic.id}.title`),body,links:[...topic.links],sections:[{key:'text',title:'',text:body}]});}
  // m-wiki-v2 part (c): units, animals, systems and guides – hand-written, units and animals with numbers from the data.
  const BASE_HP=60,BASE_DPS=6,WEAPON={sword:100,bow:40};
  for(const entry of WIKI_ENTRIES){
    const [kind,key]=entry.id.split(':'),facts=[];
    if(kind==='unit'&&(key==='recruit'||UNIT_TYPES[key])){
      const u=key==='recruit'?{modifiers:RECRUIT.modifiers,equipment:{}}:UNIT_TYPES[key],m=u.modifiers??{};
      const kit=[...Object.values(u.equipment??{}),...(u.mount?[u.mount]:[])];
      facts.push([t('wiki.fact.kitNeeded'),kit.length?kit.map(id=>name(id)).join(', '):t('wiki.none')]);
      facts.push([t('wiki.fact.hp'),String(BASE_HP+(m.maxHP??0))]);
      const attack=(WEAPON[u.equipment?.weapon]??0)+(m.attackBonus??0);facts.push([t('wiki.fact.attack'),attack?`${BASE_DPS} + ${attack} %`:String(BASE_DPS)]);
      if(m.armor||u.equipment?.armor)facts.push([t('wiki.fact.armor'),String((m.armor??0)+(u.equipment?.armor?30:0))]);
      facts.push([t('wiki.fact.range'),t('wiki.tiles',{n:m.attackRange??1,count:m.attackRange??1})]);
      if(u.trainingTime)facts.push([t('wiki.fact.training'),t('wiki.training',{n:seconds(u.trainingTime),gold:u.goldCost})]);
      if(u.requiredCombatLevel)facts.push([t('wiki.fact.combatLevel'),String(u.requiredCombatLevel)]);
      facts.push([t('wiki.fact.wage'),t('wiki.perDay',{n:key==='recruit'?BASE_DAILY_WAGES.recruit:BASE_DAILY_WAGES.soldier+(u.wageBonus??0)})]);
      if(key==='recruit')facts.push([t('wiki.fact.guard'),t('wiki.tiles',{n:MILITARY_RULES.guardRadius,count:MILITARY_RULES.guardRadius})]);
    }
    if(kind==='animal'){const d=registry.get(key);if(d?.stats){facts.push([t('wiki.fact.hp'),String(d.stats.maxHP)]);if(d.stats.attackDPS)facts.push([t('wiki.fact.attack'),String(d.stats.attackDPS)]);}
      if(d?.gameplay?.meatDrop)facts.push([t('wiki.fact.meat'),String(d.gameplay.meatDrop)]);if(d?.gameplay?.movementSpeed)facts.push([t('wiki.fact.speed'),`× ${d.gameplay.movementSpeed}`]);}
    const pageId=entry.id;
    add({id:pageId,category:entry.category,title:t(`wiki.title.${kind}.${key}`),definition:kind==='animal'?registry.get(key)??undefined:undefined,facts,body:'',links:[...entry.links],sections:sectionsOf(pageId,{facts})});
  }
  // m-wiki-v2: the page with every production chain.
  {const chain=rows(allChains(graph)),links=[...new Set(chain.flatMap(r=>r.steps.map(s=>s.page).filter(Boolean)))];
    add({id:'topic:chains',category:'chains',title:t('wiki.chains.title'),body:t('wiki.chains.body'),links:[],sections:[{key:'text',title:'',text:t('wiki.chains.body')},{key:'chain',title:t('wiki.section.allChains'),rows:chain}],chainLinks:links});}
  // Links only to pages that exist; a topic also appears in the category of each page that links to it.
  for(const page of pages.values()){page.links=page.links.filter(id=>pages.has(id)&&id!==page.id);for(const s of page.sections)for(const row of s.rows??[])for(const st of row.steps)if(st.page&&!pages.has(st.page))delete st.page;}
  return pages;
}
// m-wiki-v2: how complete the hand-written parts are (the test lists what is still missing).
export function wikiTextCoverage(pages,has){
  const missing=[];for(const p of pages.values()){if(!/^(building|resource|profession|unit|animal|system|guide):/.test(p.id))continue;for(const part of WIKI_TEXT_PARTS)if(!has(wikiTextKey(p.id,part)))missing.push(wikiTextKey(p.id,part));}
  return missing;
}
export function wikiCategories(pages){
  const out=new Map(WIKI_CATEGORIES.map(c=>[c,[]]));for(const p of pages.values())out.get(p.category)?.push(p);
  for(const list of out.values())list.sort((a,b)=>a.title.localeCompare(b.title));return out;
}
// Search: titles first, then any text of the page (the hand-written sections and the facts).
const pageText=p=>[p.body,...p.sections.map(s=>s.text??''),...p.facts.map(([k,v])=>`${k} ${v}`)].join(' ').toLowerCase();
export function searchWiki(pages,query){
  const q=String(query??'').trim().toLowerCase();if(!q)return [];
  return [...pages.values()].filter(p=>p.title.toLowerCase().includes(q)||pageText(p).includes(q)).sort((a,b)=>Number(!a.title.toLowerCase().includes(q))-Number(!b.title.toLowerCase().includes(q))||Number(!a.title.toLowerCase().startsWith(q))-Number(!b.title.toLowerCase().startsWith(q))||a.title.localeCompare(b.title)).slice(0,30);
}
export { WIKI_SINKS };

import { JOBS,SKILLS } from '../data/jobs.js';
import { WIKI_TOPICS,WIKI_PAGE_LINKS,WIKI_CATEGORIES } from '../data/wiki.js';
import { resourceGroup } from '../data/resourceGroups.js';

// m-wiki-napoveda: the Wiki's pages. Buildings, resources and professions come from the registry and JOBS (name,
// description, price, size, workers, what it makes and uses, storage), topics from WIKI_TOPICS with their texts in
// i18n. A page: {id, category, title, definition?, facts:[[label,value]], body, links:[pageId]}.
const amounts=(registry,t,map)=>Object.entries(map??{}).map(([id,n])=>`${n} ${registry.get(id)?.name??id}`).join(', ');
export function buildWikiPages(registry,t){
  const pages=new Map(),add=page=>pages.set(page.id,{links:[],facts:[],body:'',...page,links:[...new Set([...(page.links??[]),...(WIKI_PAGE_LINKS[page.id]??[])])]});
  const buildings=registry.all().filter(d=>d.category==='building'&&(d.buildable||d.storage||d.id==='castle'));
  const recipeOf=d=>d.recipe??null;
  for(const d of buildings){
    const facts=[],links=[];
    if(d.cost&&Object.keys(d.cost).length)facts.push([t('wiki.fact.cost'),amounts(registry,t,d.cost)]);else facts.push([t('wiki.fact.cost'),t('wiki.free')]);
    if(d.width)facts.push([t('wiki.fact.size'),`${d.width} × ${d.height}`]);
    if(d.workplace){facts.push([t('wiki.fact.workers'),`${d.workplace.capacity} × ${JOBS[d.workplace.profession]?.name??d.workplace.profession}`]);links.push(`profession:${d.workplace.profession}`);}
    const r=recipeOf(d);if(r){facts.push([t('wiki.fact.uses'),amounts(registry,t,r.input)||'—'],[t('wiki.fact.makes'),amounts(registry,t,r.output)]);for(const id of [...Object.keys(r.input??{}),...Object.keys(r.output??{})])links.push(`resource:${id}`);}
    if(d.storage?.capacity)facts.push([t('wiki.fact.storage'),String(d.storage.capacity)]);
    if(d.housing?.capacity)facts.push([t('wiki.fact.residents'),String(d.housing.capacity)]);
    add({id:`building:${d.id}`,category:'buildings',title:d.name,definition:d,facts,body:d.description??'',links});
  }
  const producers=id=>buildings.filter(d=>recipeOf(d)?.output?.[id]).map(d=>`building:${d.id}`),users=id=>buildings.filter(d=>recipeOf(d)?.input?.[id]).map(d=>`building:${d.id}`);
  for(const d of registry.byCategory('resource').filter(d=>d.collectible)){
    const facts=[[t('wiki.fact.group'),t(`wiki.group.${resourceGroup(d,registry)}`)]],made=producers(d.id),used=users(d.id);
    if(made.length)facts.push([t('wiki.fact.madeIn'),made.map(id=>pages.get(id)?.title).join(', ')]);if(used.length)facts.push([t('wiki.fact.usedIn'),used.map(id=>pages.get(id)?.title).join(', ')]);
    add({id:`resource:${d.id}`,category:'resources',title:d.inventoryLabel??d.name,definition:d,facts,body:d.description??'',links:[...made,...used]});
  }
  for(const [id,job] of Object.entries(JOBS)){
    if(id==='idle')continue;const places=buildings.filter(d=>d.workplace?.profession===id).map(d=>`building:${d.id}`),facts=[];
    if(job.skill)facts.push([t('wiki.fact.skill'),SKILLS[job.skill]??job.skill]);if(places.length)facts.push([t('wiki.fact.worksIn'),places.map(p=>pages.get(p)?.title).join(', ')]);
    add({id:`profession:${id}`,category:'professions',title:job.name,facts,body:places.length?t('wiki.professionBody',{job:job.name,places:places.map(p=>pages.get(p)?.title).join(', ')}):t('wiki.professionFree',{job:job.name}),links:places});
  }
  for(const topic of WIKI_TOPICS)add({id:`topic:${topic.id}`,category:topic.category,title:t(`wiki.topic.${topic.id}.title`),body:t(`wiki.topic.${topic.id}.body`),links:[...topic.links]});
  // Links only to pages that exist; a topic also appears in the category of each page that links to it.
  for(const page of pages.values())page.links=page.links.filter(id=>pages.has(id)&&id!==page.id);
  return pages;
}
export function wikiCategories(pages){
  const out=new Map(WIKI_CATEGORIES.map(c=>[c,[]]));for(const p of pages.values())out.get(p.category)?.push(p);
  for(const list of out.values())list.sort((a,b)=>a.title.localeCompare(b.title));return out;
}
export function searchWiki(pages,query){
  const q=String(query??'').trim().toLowerCase();if(!q)return [];
  return [...pages.values()].filter(p=>p.title.toLowerCase().includes(q)||p.body.toLowerCase().includes(q)).sort((a,b)=>Number(!a.title.toLowerCase().startsWith(q))-Number(!b.title.toLowerCase().startsWith(q))||a.title.localeCompare(b.title)).slice(0,30);
}

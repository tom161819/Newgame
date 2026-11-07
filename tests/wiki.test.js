// m-wiki-napoveda: the Wiki covers every building, resource and profession; every mapping points to a page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { JOBS } from '../src/data/jobs.js';
import { buildWikiPages,searchWiki,wikiCategories } from '../src/systems/Wiki.js';
import { WIKI_TOPICS,WIKI_FEED_TOPICS,WIKI_NOTICE_TOPICS,WIKI_PAGE_LINKS,wikiTopicForFeed } from '../src/data/wiki.js';
import { TIPS } from '../src/data/tips.js';
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';

const t=(key,params={})=>String(en[key]??key).replace(/\{(\w+)\}/g,(_,k)=>params[k]??'');
test('every buildable building, collectible resource and profession has a page; links lead to pages',()=>{
  const pages=buildWikiPages(objectRegistry,t);
  for(const d of objectRegistry.buildables())assert.ok(pages.has(`building:${d.id}`),d.id);
  for(const d of objectRegistry.byCategory('resource').filter(d=>d.collectible))assert.ok(pages.has(`resource:${d.id}`),d.id);
  for(const id of Object.keys(JOBS).filter(id=>id!=='idle'))assert.ok(pages.has(`profession:${id}`),id);
  for(const p of pages.values())for(const l of p.links)assert.ok(pages.has(l),`${p.id} → ${l}`);
  for(const [id,links] of Object.entries(WIKI_PAGE_LINKS)){assert.ok(pages.has(id),id);for(const l of links)assert.ok(pages.has(l),l);}
  const granary=pages.get('building:granary');assert.ok(granary.links.includes('topic:rats'));assert.ok(granary.facts.length>=2);
  const bakery=pages.get('building:bakery');assert.ok(bakery.facts.some(([k,v])=>k==='Makes'&&/Bread/.test(v)));
  assert.ok(wikiCategories(pages).get('animals').length>=2);assert.equal(searchWiki(pages,'granary')[0].id,'building:granary');
});
test('topics are written in both languages; feed and notice mappings name existing topics; the rats tip opens the Wiki',()=>{
  const ids=new Set(WIKI_TOPICS.map(x=>x.id));
  for(const id of ids)for(const lang of [en,cs]){assert.ok(lang[`wiki.topic.${id}.title`]);assert.ok(lang[`wiki.topic.${id}.body`].length>80);}
  for(const topic of [...Object.values(WIKI_FEED_TOPICS),...Object.values(WIKI_NOTICE_TOPICS)])assert.ok(ids.has(topic),topic);
  assert.equal(wikiTopicForFeed('rats:house:12:3'),'rats');assert.equal(wikiTopicForFeed('built:7'),null);
  const tip=TIPS.find(x=>x.id==='rats');assert.equal(tip.wiki,'rats');assert.ok(en['tips.rats']&&cs['tips.rats']);
});

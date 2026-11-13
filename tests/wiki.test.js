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

const t=(key,params={})=>{const v=en[key]??key;return String(typeof v==='object'?v.other:v).replace(/\{(\w+)\}/g,(_,k)=>params[k]??'');};
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

// m-wiki-v2 (plan 36): pages have sections in a fixed order, production chains come from the data, the "?" in
// window headings points at existing dialogs, and the hand-written texts are tracked in both languages.
import { readFileSync } from 'node:fs';
import { wikiTextCoverage,wikiGraph,allChains } from '../src/systems/Wiki.js';
import { WIKI_HELP_DIALOGS } from '../src/ui/WikiPanel.js';
import { WIKI_TEXT_PARTS,wikiTextKey } from '../src/data/wiki.js';
test('wiki v2: sections, chains and the All chains page',()=>{
  const pages=buildWikiPages(objectRegistry,t,{has:k=>k in en});
  const order=['why','how','chain','numbers','tips','unlock'];
  for(const p of pages.values()){const keys=p.sections.map(s=>s.key).filter(k=>order.includes(k));assert.deepEqual(keys,[...keys].sort((a,b)=>order.indexOf(a)-order.indexOf(b)),p.id);
    for(const s of p.sections)for(const row of s.rows??[])for(const st of row.steps){assert.ok(st.label,p.id);if(st.page)assert.ok(pages.has(st.page),`${p.id} → ${st.page}`);}}
  const bakery=pages.get('building:bakery'),chain=bakery.sections.find(s=>s.key==='chain');
  const line=row=>row.steps.map(s=>s.page??s.sink).join('>');
  assert.ok(chain.rows.some(r=>line(r)==='building:wheat_field>resource:wheat>building:mill>resource:flour>building:bakery'));
  assert.ok(chain.rows.some(r=>line(r)==='building:bakery>resource:bread>people'));
  assert.ok(bakery.sections.find(s=>s.key==='numbers').facts.some(([k,v])=>k==='One batch takes'&&v==='30 s'));
  const tower=pages.get('building:tower');assert.ok(tower.sections.find(s=>s.key==='chain').rows.some(r=>r.steps.at(-2)?.page==='resource:torch'));
  const all=pages.get('topic:chains').sections.find(s=>s.key==='chain').rows.map(line);
  for(const want of ['building:wheat_field>resource:wheat>building:mill>resource:flour>building:bakery>resource:bread>people','building:hunting_lodge>resource:meat>people'])assert.ok(all.includes(want),want);
  assert.ok(all.some(l=>l.endsWith('resource:sword>building:barracks')));assert.equal(new Set(all).size,all.length);
  assert.ok(allChains(wikiGraph(objectRegistry)).length>=10);
  assert.ok(searchWiki(pages,'Farmhouse store').some(p=>p.id==='building:mill'),'search reads the sections');
});
test('wiki v2: every building, resource and profession is written in both languages; the "?" buttons point at real dialogs',()=>{
  const bread=['building:farmhouse','building:wheat_field','building:mill','building:bakery','building:granary','resource:wheat','resource:flour','resource:bread','profession:farmer','profession:miller','profession:baker'];
  for(const id of bread)for(const part of WIKI_TEXT_PARTS)for(const lang of [en,cs])assert.ok(lang[wikiTextKey(id,part)]?.length>10,`${id} ${part}`);
  // Texts must not exist for pages that do not exist, and the coverage report lists what is still missing.
  const pages=buildWikiPages(objectRegistry,t,{has:k=>k in en});
  for(const key of Object.keys(en).filter(k=>k.startsWith('wiki.text.'))){const [, ,kind,id]=key.split('.');assert.ok(pages.has(`${kind}:${id}`),key);assert.ok(cs[key],`cs ${key}`);}
  const missing=wikiTextCoverage(pages,k=>k in en&&k in cs);assert.deepEqual(missing,[],'every building, resource and profession page is written in both languages');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');for(const id of Object.keys(WIKI_HELP_DIALOGS))assert.ok(html.includes(`id="${id}"`),id);
});

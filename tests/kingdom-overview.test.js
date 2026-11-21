import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { kingdomOverview,HelpArrow,helpSeen } from '../src/ui/KingdomOverview.js';
import { KingdomAttractivenessSystem } from '../src/systems/KingdomAttractivenessSystem.js';
globalThis.document??={querySelector:()=>({textContent:''})};

test('the overview counts residents against housing room and the unemployed, and averages the needs, mood and attractiveness', () => {
  const s=workerScene(undefined,{workplaces:true});s.attractiveness=new KingdomAttractivenessSystem(s);
  const people=[0,1,2].map(i=>s.workerSystem.create({x:40+i,y:40}));s.workerSystem.jobs.assign(people[0],'hauler');s.needs.update?.(0);
  const o=kingdomOverview(s);assert.equal(o.population,3);assert.equal(o.capacity,s.workerSystem.capacity());assert.equal(o.unemployed,2);
  for(const k of ['happiness','food','rest','housing','safety'])assert.ok(Number.isInteger(o[k])&&o[k]>=0&&o[k]<=100,k);
  assert.ok(['happy','neutral','unhappy','critical'].includes(o.mood));assert.equal(o.attractiveness,Math.round(s.attractiveness.value));
  Object.defineProperty(s.foodSystem,'shortage',{get:()=>true,configurable:true});assert.ok(kingdomOverview(s).factors.some(([id,v])=>id==='food'&&v===-40),'a food shortage shows as a factor');
});

test('the help arrow shows until the help is opened once (kept) or the first 10 minutes are over', () => {
  const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  const listeners=[],arrow={hidden:true},button={hidden:false,addEventListener:(type,fn)=>listeners.push(fn)},doc={querySelector:id=>id==='#help-arrow'?arrow:id==='#help-toggle'?button:null};
  const scene={gameTime:{totalElapsed:0}},help=new HelpArrow(scene,{document:doc,storage});assert.equal(arrow.hidden,false,'shown at the start');
  scene.gameTime.totalElapsed=11*60000;help.update();assert.equal(arrow.hidden,true,'gone after 10 minutes');
  scene.gameTime.totalElapsed=0;help.update();assert.equal(arrow.hidden,false);listeners[0]();assert.equal(arrow.hidden,true,'opening the help hides it');assert.equal(helpSeen(storage),true);
  const again=new HelpArrow({gameTime:{totalElapsed:0}},{document:doc,storage});void again;assert.equal(arrow.hidden,true,'and it never comes back (e.g. after Load)');
});

test('m-prehled-procenta-tooltip: every percentage explains itself – how it is worked out, what moves it now, one tip; the parts add up to Happiness', async () => {
  const { overviewExplain } = await import('../src/ui/KingdomOverview.js');const { setLanguage } = await import('../src/i18n/index.js');
  const s=workerScene(undefined,{workplaces:true});const people=[0,1,2,3].map(i=>s.workerSystem.create({x:40+i,y:40}));s.needs.update?.(0);
  for(const w of people)s.needs.records.set(w.id,{food:100,rest:100,attackedAt:null});s.needs.records.get(people[0].id).food=5;s.needs.records.get(people[1].id).rest=10;
  const o=kingdomOverview(s),d=o.detail;
  assert.equal(d.parts.food+d.parts.rest+d.parts.housing+d.parts.safety+d.other,o.happiness,'the listed parts add up to the shown Happiness');
  assert.equal(d.hungry,1);assert.equal(d.tired,1);assert.equal(d.housed+d.unhoused,4);assert.equal(d.residents,4);
  setLanguage('en',{persist:false});const lines=overviewExplain(o);
  for(const k of ['residents','unemployed','happiness','food','rest','housing','safety'])assert.ok(lines[k].length>=1&&lines[k].every(l=>typeof l==='string'&&(l.length>10||l.includes('\t'))&&!l.includes('{')&&!l.startsWith('explain.')),k);
  assert.match(lines.happiness[0],new RegExp(`Happiness ${o.happiness} % = the average of all 4 residents`));assert.match(lines.happiness[1],/^Food \(weight 35 %\)\t\+\d+$/);assert.match(lines.happiness[5],/^Other \(taxes, wages, feast, surroundings\)\t[+\u2212-]?\d+$/);
  assert.match(lines.food[1],/1 of 4 go hungry/);assert.ok(lines.food.some(l=>l.startsWith('Tip:')));assert.match(lines.housing[0],new RegExp(`Housing ${o.housing} % = ${d.housed} of 4 have a home`));assert.equal(lines.housing.some(l=>l.startsWith('Tip:')),d.unhoused>0);
  assert.equal(lines.happiness.filter(l=>l.startsWith('Tip:')).length,1,'at most one tip');
  setLanguage('cs',{persist:false});assert.match(overviewExplain(o).housing[0],/Bydlení \d+ % = \d z 4 má kde bydlet/);setLanguage('en',{persist:false});
});

test('owner 21 Nov 2026: a "label<TAB>value" line is a row with its value on the right, green or red by sign', async () => {
  const {tipParts}=await import('../src/ui/KingdomOverview.js');
  const p=tipParts('Title\nFood (weight 35 %)\t+24\nOther\t\u22123\nBase\t50\nTip: build');
  assert.deepEqual(p.lines.slice(0,3).map(l=>[l.row,l.tone]),[[['Food (weight 35 %)','+24'],'good'],[['Other','\u22123'],'bad'],[['Base','50'],'']]);assert.equal(p.lines[3].tip,true);
});

test('m-prehled-info-panely: a hover text splits into a heading, factor lines and the tip', async () => {
  const {tipParts}=await import('../src/ui/KingdomOverview.js');
  const p=tipParts('Attractiveness 75 %\nBase: +100\nFood shortage: -40\nSome rule.\nTip: build a farm.');
  assert.equal(p.title,'Attractiveness 75 %');assert.deepEqual(p.lines.map(l=>[l.tip,l.number]),[[false,true],[false,true],[false,false],[true,false]]);
  assert.deepEqual(tipParts(''),{title:'',lines:[]});
});

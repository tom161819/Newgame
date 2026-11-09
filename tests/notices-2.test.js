import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
import { DIAGNOSTICS,NOTICE_REPEAT_DAYS,CHAIN_ADVICE,noticeRepeatDays,noticeSeverity } from '../src/data/diagnostics.js';
import { foodSources,chainLinks } from '../src/data/productionChains.js';
import { noticeText } from '../src/ui/noticeText.js';
import { NOTICE_BAR,NoticeBarState,readCollapsed,writeCollapsed } from '../src/ui/noticeBar.js';
import { setLanguage } from '../src/i18n/index.js';

// m-notice-bar-hlasky (owner requests 66, 70, 72); the repeat rules and the bar were replaced in notices 3
// (m-hlasky-jednou 79, m-notice-bar-zasunuti 80) – these tests keep their intent with the new rules.
globalThis.document??={querySelector:()=>({textContent:''})};
const advance=(s,ms)=>{for(let t=0;t<ms;t+=DIAGNOSTICS.checkInterval){s.gameTime.totalElapsed+=DIAGNOSTICS.checkInterval;s.diagnostics.update();}};
function scene(){const s=workerScene(undefined,{construction:true,foodProduction:true});s.diagnostics=new ProductionDiagnostics(s);s.diagnostics.foodIssues=()=>[];s.log=[];s.feed=[];s.eventFeed={push:(key,text)=>{s.feed.push({key,text});return true;}};s.activities.on(e=>{if(e.type==='productionIssue')s.log.push(e);});return s;}
function building(s,type,x,y,{blueprint=false}={}){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const[id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);if(blueprint)s.constructionSystem.plan(r.building);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;}

test('repeat rules come from data by severity: info and warning 4 days after a close, danger unlimited; chain advice the same',()=>{
  assert.deepEqual({...NOTICE_REPEAT_DAYS},{info:4,warning:4,danger:0});
  assert.equal(noticeSeverity('depleted'),'info');assert.equal(noticeRepeatDays('depleted'),4);
  assert.equal(noticeSeverity('noBuilder'),'warning');assert.equal(noticeRepeatDays('foodLow'),4);assert.equal(noticeRepeatDays('noBuilder','danger'),0);
  assert.equal(noticeRepeatDays('chainNoConsumer'),4);assert.equal(noticeRepeatDays('missingChainSource'),4);assert.equal('repeatDays' in CHAIN_ADVICE,false);
});

test('the same notice does not come again while open, even when the problem flickers: one row with a count, one feed line',()=>{
  // A finite quarry whose deposit runs out, refills a little and runs out again ("the mine ran out of stone").
  const feed=[],deposit={natural:{remaining:0}},quarry={id:1,type:'quarry',x:10,y:10,quarryMode:'finite',depositId:'d1'};
  const s={buildings:[quarry],naturalResources:{byId:new Map([['d1',deposit]])},gameTime:{totalElapsed:0,paused:false,dayDuration:120000},
    eventFeed:{push:(key,text)=>{feed.push({key,text});return true;}},workerSystem:{liveSubjects:()=>[]},objectRegistry:null,activities:null,needs:null};
  s.diagnostics=new ProductionDiagnostics(s);
  const rows=()=>s.diagnostics.active().filter(i=>i.reason==='depleted');
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.equal(rows().length,1);assert.equal(feed.length,1);
  for(let i=0;i<5;i++){deposit.natural.remaining=3;advance(s,DIAGNOSTICS.checkInterval*2);assert.equal(rows().length,0,'gone while there is stone');deposit.natural.remaining=0;advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);}
  assert.equal(feed.length,1,'no new feed line');assert.equal(rows().length,1,'one row');assert.equal(rows()[0].count,6,'with a count of the times it came');
  // Closed stays closed when the same problem comes back within 4 days of the close.
  const closedAt=s.gameTime.totalElapsed;s.diagnostics.dismiss(rows()[0].key);deposit.natural.remaining=3;advance(s,DIAGNOSTICS.checkInterval*2);deposit.natural.remaining=0;advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.equal(rows().length,0);
  advance(s,closedAt+4*s.gameTime.dayDuration-s.gameTime.totalElapsed-DIAGNOSTICS.checkInterval);assert.equal(rows().length,0,'not within 4 days');
  advance(s,DIAGNOSTICS.checkInterval);assert.equal(rows().length,1,'back 4 days after the close');assert.equal(rows()[0].count,1,'as a new notice');assert.equal(feed.length,2,'with a fresh feed line');
});

test('low food advice lists every food source from data, the Fisherman\'s Hut included',()=>{
  const s=scene(),defs=s.objectRegistry.buildables(),chains=foodSources(defs).map(c=>c.map(d=>d.id).join('>'));
  for(const id of ['hunting_lodge','fisherman_hut','orchard','wheat_field>mill>bakery'])assert.ok(chains.includes(id),`${id} in ${chains}`);
  setLanguage('en',{persist:false});const text=noticeText(s,{reason:'foodLow',entityId:0,params:{days:1}});
  assert.match(text,/Fisherman's Hut near water/);assert.match(text,/Hunting Lodge/);assert.match(text,/Orchard/);assert.match(text,/Wheat Field → Mill → Bakery/);
  setLanguage('cs',{persist:false});try{assert.match(noticeText(s,{reason:'foodLow',entityId:0,params:{days:1}}),/u vody/);}finally{setLanguage('en',{persist:false});}
});

test('a Wheat Field without a Mill: one info notice, once while open and 4 days after a close; a Bakery without a Mill asks for flour',()=>{
  setLanguage('en',{persist:false});
  const links=chainLinks(scene().objectRegistry.buildables(),CHAIN_ADVICE.resources);assert.deepEqual(links.find(l=>l.resource==='wheat')?.consumers,['mill']);assert.deepEqual(links.find(l=>l.resource==='flour')?.producers,['mill']);
  const s=scene();building(s,'wheat_field',40,52);
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
  const mills=()=>s.log.filter(e=>e.reason==='chainNoConsumer');assert.equal(mills().length,1);
  const issue=s.diagnostics.active().find(i=>i.reason==='chainNoConsumer');assert.equal(noticeText(s,issue),'Wheat is piling up – build a Mill to make flour.');
  advance(s,s.gameTime.dayDuration*5);assert.equal(mills().length,1,'not again while open');
  // A Mill planned and cancelled again does not bring a new notice either: the row comes back quietly.
  const planned=building(s,'mill',54,45,{blueprint:true});advance(s,DIAGNOSTICS.checkInterval);assert.equal(s.diagnostics.active().some(i=>i.reason==='chainNoConsumer'),false,'a planned Mill is enough');
  s.buildings.splice(s.buildings.indexOf(planned),1);s.constructionSystem.sites.delete(planned.id);advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.equal(mills().length,1);
  const row=s.diagnostics.active().find(i=>i.reason==='chainNoConsumer');assert.equal(row?.count,2,'back quietly with a count');
  s.diagnostics.dismiss(row.key);advance(s,s.gameTime.dayDuration*4-DIAGNOSTICS.checkInterval);assert.equal(mills().length,1,'closed: not within 4 days');
  advance(s,DIAGNOSTICS.checkInterval);assert.equal(mills().length,2,'back once 4 days have passed since the close');
  const b=scene(),bakery=building(b,'bakery',54,45);b.activities.emit('buildingCompleted',{objectIds:[bakery.id]});
  assert.equal(noticeText(b,b.diagnostics.active().find(i=>i.reason==='missingChainSource')),'The Bakery needs flour from a Mill.');
});

test('the Notices bar remembers sliding away in the browser and counts unread notices while away',()=>{
  const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
  assert.equal(readCollapsed(storage),false,'out by default');assert.equal(writeCollapsed(true,storage),true);assert.equal(store.get(NOTICE_BAR.storageKey),'1');assert.equal(readCollapsed(storage),true);
  const broken={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};assert.equal(readCollapsed(broken),false);assert.equal(writeCollapsed(true,broken),false,'no storage: still works');
  assert.deepEqual([NOTICE_BAR.peekMs,NOTICE_BAR.slideMs],[4000,300]);
  const bar=new NoticeBarState({collapsed:true}),a={key:'1:noBuilder',lastNotified:10},b={key:'0:foodLow',lastNotified:20};
  assert.equal(bar.observe([a]),null,'what is there when the page opens does not slide out');assert.equal(bar.unread,0);
  assert.equal(bar.observe([a,b])?.issue,b,'a new notice slides out');assert.equal(bar.unread,1);assert.equal(bar.observe([a,b]),null,'the same render again is not new');
  assert.equal(bar.observe([{...a,lastNotified:70},b])?.issue.key,a.key,'a re-shown notice is new again');assert.equal(bar.unread,2);
  bar.setCollapsed(false);assert.equal(bar.unread,0,'sliding out clears the mark');
  assert.equal(bar.observe([a,b,{key:'5:noHauler',lastNotified:90}]),null,'out: nothing peeks');assert.equal(bar.unread,0);
});

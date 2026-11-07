import test from 'node:test';
import assert from 'node:assert/strict';
import { CaravanSystem,edgeTiles,rollMerchant } from '../src/systems/CaravanSystem.js';
import { CARAVAN_RULES,MERCHANT_TYPES } from '../src/data/trade.js';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

const DAY=120000;
function world({market=true,complete=true,enclosed=false}={}){
  const map=Array.from({length:100},()=>Array(100).fill(0)),buildings=[],feed=[];
  if(market){const b={id:7,type:'marketplace',x:50,y:50,...(complete?{}:{construction:{state:'planned'}})};b.tiles=[];for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++){b.tiles.push({x:50+dx,y:50+dy});map[50+dy][50+dx]=1;}buildings.push(b);}
  if(enclosed)for(let y=45;y<=57;y++)for(let x=45;x<=57;x++)if(y===45||y===57||x===45||x===57)map[y][x]=1;
  const scene={map,buildings,gameTime:{totalElapsed:0,dayDuration:DAY},eventFeed:{push:(key,text)=>feed.push(key)}};
  let seed=7;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  return {scene,feed,system:new CaravanSystem(scene,{random})};
}
const step=(w,ms,dt=100)=>{for(let left=ms;left>0;left-=dt){w.scene.gameTime.totalElapsed+=dt;w.system.update(dt);}};

test('caravans come only while a finished Marketplace exists, every 2–4 days', () => {
  let w=world({market:false});w.system.update(100);assert.equal(w.system.nextVisitAt,null);
  w=world({complete:false});w.system.update(100);assert.equal(w.system.nextVisitAt,null,'an unfinished Marketplace gets no caravans');
  for(let i=0;i<20;i++){w=world();w.scene.gameTime.totalElapsed=i*1000;w.system.random=()=>i/19;w.system.update(100);const wait=w.system.nextVisitAt-i*1000;assert.ok(wait>=2*DAY-1e-6&&wait<=4*DAY+1e-6,String(wait));}
});

test('a merchant has a type, goods, 100–300 Gold on day 1 and up to 1000 later, with an escort by the gold', () => {
  let r=1;const random=()=>{r=(r*48271)%2147483647;return r/2147483647;};
  for(let i=0;i<200;i++){const m=rollMerchant(random),spec=MERCHANT_TYPES[m.type];assert.ok(spec);assert.ok(Object.keys(m.stock).length>=1);
    // m-obchod-vylepseni: goods grow with the gold (×1 at 100 Gold … ×2 at 1000).
    const grow=1+(m.gold-100)/900;for(const [id,n]of Object.entries(m.stock)){const [min,max]=spec.stock[id];assert.ok(n>=Math.max(1,Math.round(min))&&n<=Math.round(max*grow),`${m.type} ${id} ${n}`);}assert.ok(m.gold>=100&&m.gold<=300,'day 1: 100–300');
    assert.ok(m.escort.porters>=0&&m.escort.porters<=2);assert.equal(m.escort.guards,m.gold<200?0:Math.min(6,Math.max(1,Math.round(m.gold/170))));}
  // Richer later: by day 30 the gold reaches up to 1000 and the escort grows with it.
  let top=0;for(let i=0;i<300;i++){const m=rollMerchant(random,31);assert.ok(m.gold>=100&&m.gold<=1000);top=Math.max(top,m.gold);assert.ok(m.escort.guards<=6);}
  assert.ok(top>700,`rich caravans later (${top})`);
});

test('a caravan drives from a map edge to the Marketplace, trades 0.75 day, warns, leaves and the next one is scheduled', () => {
  const w=world();w.system.update(100);w.scene.gameTime.totalElapsed=w.system.nextVisitAt;w.system.update(0);
  const c=w.system.active;assert.ok(c);assert.equal(c.phase,'arriving');assert.ok(c.entry.x===0||c.entry.y===0||c.entry.x===99||c.entry.y===99,'starts on an edge');
  assert.ok(edgeTiles(w.scene.map).some(p=>p.x===c.entry.x&&p.y===c.entry.y));
  let last={...c.position},maxStep=0;
  for(let i=0;i<4000&&w.system.active.phase==='arriving';i++){step(w,100);const p=w.system.active.position;maxStep=Math.max(maxStep,Math.hypot(p.x-last.x,p.y-last.y));last={...p};}
  assert.equal(w.system.active.phase,'trading');assert.ok(maxStep<=CARAVAN_RULES.speed*.1+1e-9,'no teleport');
  const t=w.system.active.tile;assert.ok(t.x>=49&&t.x<=53&&t.y>=49&&t.y<=53&&w.scene.map[t.y][t.x]===0,'stands next to the Marketplace');
  const arrivedAt=w.scene.gameTime.totalElapsed;assert.equal(w.system.active.departAt,arrivedAt+.75*DAY);
  assert.equal(w.system.summon(),false,'never two caravans');
  step(w,.66*DAY,1000);assert.equal(w.system.active.phase,'trading');assert.ok(w.feed.some(k=>k.endsWith(':leavingSoon')));
  step(w,.1*DAY,1000);assert.equal(w.system.active.phase,'leaving');
  for(let i=0;i<4000&&w.system.active;i++)step(w,100);
  assert.equal(w.system.active,null);const wait=w.system.nextVisitAt-w.scene.gameTime.totalElapsed;assert.ok(wait>=2*DAY-200&&wait<=4*DAY);
  for(const event of ['arriving','arrived','leavingSoon','left'])assert.ok(w.feed.some(k=>k.endsWith(`:${event}`)),event);
});

test('a pending delivery keeps the caravan at most 0.25 day longer', () => {
  const w=world();w.system.update(100);w.system.summon();for(let i=0;i<4000&&w.system.active.phase==='arriving';i++)step(w,100);
  w.system.deliveryPending=()=>true;step(w,.75*DAY,1000);assert.equal(w.system.active.phase,'trading');assert.equal(w.system.active.waiting,true);
  step(w,.2*DAY,1000);assert.equal(w.system.active.phase,'trading');step(w,.06*DAY,1000);assert.equal(w.system.active.phase,'leaving','leaves after the extra quarter day');
  const v=world();v.system.update(100);v.system.summon();for(let i=0;i<4000&&v.system.active.phase==='arriving';i++)step(v,100);
  let pending=true;v.system.deliveryPending=()=>pending;step(v,.76*DAY,1000);assert.equal(v.system.active.waiting,true);pending=false;step(v,1000,1000);assert.equal(v.system.active.phase,'leaving','leaves once the delivery is done');
});

test('an unreachable Marketplace costs a few attempts, a notice and a later retry, never a loop', () => {
  const w=world({enclosed:true});w.system.update(100);w.scene.gameTime.totalElapsed=w.system.nextVisitAt;
  const before=w.system.nextVisitAt;w.system.update(0);assert.equal(w.system.active,null);assert.ok(w.feed.some(k=>k.startsWith('caravan:unreachable')));
  assert.ok(w.system.nextVisitAt>before+2*DAY-1);
});

test('a demolished Marketplace sends the caravan away; a road blocked meanwhile is replanned', () => {
  const w=world();w.system.update(100);w.system.summon();step(w,2000);
  const c=w.system.active,ahead=c.path[3];w.scene.map[ahead.y][ahead.x]=1;
  for(let i=0;i<60;i++){step(w,100);const a=w.system.active;assert.ok(!(a.tile.x===ahead.x&&a.tile.y===ahead.y)&&!(a.nextTile?.x===ahead.x&&a.nextTile?.y===ahead.y),'never enters the blocked tile');}
  assert.equal(w.system.active.phase,'arriving');assert.ok(!w.system.active.path.some(p=>p.x===ahead.x&&p.y===ahead.y),'replanned around the new obstacle');
  w.scene.buildings.length=0;w.system.update(100);assert.equal(w.system.active.phase,'leaving');
});

test('Save/Load in the middle of a visit continues without duplicating the merchant’s goods', () => {
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.caravans=new CaravanSystem(s);
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;s.foodStorage.deposit(starter,'stone',22);s.foodStorage.deposit(starter,'wood',12);
  for(const [type,x,y] of [['warehouse',58,40],['marketplace',44,48]]){const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:s.objectRegistry.require(type)});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(r.building.definition,r.building));}
  assert.equal(s.caravans.summon(),true);for(let i=0;i<30;i++)s.caravans.update(100);
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.caravans.active.phase,'arriving');
  const bad=structuredClone(saved);bad.caravans.active.type='pirates';assert.throws(()=>validateGameState(bad));
  const bad2=structuredClone(saved);bad2.caravans.nextVisitAt=5;assert.throws(()=>validateGameState(bad2),'a scheduled visit and an active caravan never coexist');
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.caravans=new CaravanSystem(r);loadGameState(r,saved);
  assert.deepEqual(r.caravans.exportState(),saved.caravans);assert.deepEqual(serializeGameState(r).caravans,saved.caravans);
  const before=JSON.stringify(r.caravans.active.stock);for(let i=0;i<20;i++)r.caravans.update(100);assert.equal(JSON.stringify(r.caravans.active.stock),before);
});

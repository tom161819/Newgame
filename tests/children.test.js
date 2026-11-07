import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { ChildrenSystem } from '../src/systems/ChildrenSystem.js';
import { CHILDREN,VILLAGE_GREEN,childCount,allocateChildren } from '../src/data/children.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

function seq(seed=11){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function world({random=seq(),seasons=false}={}){
  const s=workerScene(undefined,{seasons});for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);s.eventFeed={pushed:[],push(key,text){this.pushed.push({key,text});return true;}};
  s.childrenSystem=new ChildrenSystem(s,{random});
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);
    // Wild animals roam the test map: nudge the anchor a little until the spot is free.
    let r=null;for(const [dx,dy]of [[0,0],[1,0],[0,1],[1,1],[-1,0],[0,-1],[2,0],[0,2]]){r=placeBuilding({map:s.map,anchor:{x:x+dx,y:y+dy},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});if(!r.error)break;}
    assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;};
  const people=n=>Array.from({length:n},(_,i)=>s.workerSystem.create({x:30+i,y:70}));
  const tick=(ms,step=100)=>{for(let t=0;t<ms;t+=step){s.gameTime.update(step);s.childrenSystem.update(step);}};
  // Morning of day 1 is the default; this jumps to a given part of the current day.
  const at=fraction=>{const g=s.gameTime,target=g.dayDuration*fraction;if(g.elapsed>target)g.update(g.dayDuration-g.elapsed+target);else g.update(target-g.elapsed);};
  return {s,c:s.childrenSystem,place,people,tick,at};
}

test('children per family: 2 residents 0–1, 3–4 residents 1–2, 5 residents 1–3, the same house always the same; at most 40 spread evenly', () => {
  for(let id=1;id<200;id++){assert.equal(childCount(id,1),0);const two=childCount(id,2),four=childCount(id,4),five=childCount(id,5);
    assert.ok(two>=0&&two<=1);assert.ok(four>=1&&four<=2);assert.ok(five>=1&&five<=3);assert.equal(childCount(id,4),four,'deterministic');}
  const many=Array.from({length:30},(_,i)=>({houseId:i+1,count:3})),out=allocateChildren(many);
  assert.equal([...out.values()].reduce((n,v)=>n+v,0),CHILDREN.max);assert.ok(Math.max(...out.values())-Math.min(...out.values())<=1,'evenly');
});

test('a family house gets children who are not residents: no population, no food, no homes; one resident means no children', () => {
  const {s,c,place,people,tick}=world(),house=place('house',40,40),lone=place('house',60,40);people(3);
  s.needs.homes();tick(200);
  const kids=c.childrenOf(house.id);assert.ok(kids.length>=1&&kids.length<=2,`1–2 children (${kids.length})`);
  assert.equal(s.workerSystem.liveSubjects().length,3,'children are not residents');assert.equal(s.needs.residents().length,3);
  assert.ok(kids.every(k=>!s.workerSystem.workers.has(k.id)&&!s.foodSystem.residents?.has?.(k.id)));
  assert.equal(c.childrenOf(lone.id).length,0,'nobody (or one resident) – no children');
  tick(20000);assert.ok(kids.some(k=>k.state==='out'),'by day they come out to play');
  assert.ok(kids.every(k=>k.state!=='out'||Math.hypot(k.x-41,k.y-41)<=CHILDREN.homeRadius+3),'they play near their house');
});

test('when the family moves out the children go with them; at rest time they go in, in the morning they come out again', () => {
  const {s,c,place,people,tick,at}=world(),house=place('house',40,40),folk=people(3);s.needs.homes();tick(20000);
  const kids=c.childrenOf(house.id);assert.ok(kids.length>=1);
  at(.8);tick(15000);assert.ok(kids.every(k=>k.state==='inside'),'evening: everyone inside');
  at(.05);tick(15000);assert.ok(kids.some(k=>k.state==='out'),'morning: out again');
  for(const w of folk.slice(1))w.isAlive=false;s.needs.homes();tick(20000);assert.equal(c.childrenOf(house.id).length,0,'family gone – children gone');
});

test('a wild boar within 10 tiles sends the children home for a quarter of a day, one notice a day; nobody targets children', () => {
  const {s,c,place,people,tick}=world(),house=place('house',40,40);people(4);s.needs.homes();tick(25000);
  const kids=c.childrenOf(house.id),out=kids.filter(k=>k.state==='out');assert.ok(out.length,'someone is outside');
  const boar={id:'boar-test',isAlive:true,definition:{id:'wild_boar'},position:{x:out[0].x+4,y:out[0].y}};s.animalSystem.animals.set(boar.id,boar);
  tick(600);assert.ok(out.every(k=>['fleeing','inside'].includes(k.state)),'they run home');
  assert.equal(s.eventFeed.pushed.filter(p=>p.key.startsWith('children-boar')).length,1);
  tick(8000);assert.ok(kids.every(k=>k.state==='inside'));s.animalSystem.animals.delete(boar.id);
  tick(s.gameTime.dayDuration*CHILDREN.danger.hideDays*.6);assert.ok(kids.every(k=>k.state==='inside'),'they stay in for a while');
  tick(s.gameTime.dayDuration*CHILDREN.danger.hideDays*.6+10000);assert.ok(kids.some(k=>k.state==='out'),'and then come out again');
  assert.equal(s.eventFeed.pushed.filter(p=>p.key.startsWith('children-boar')).length,1,'still one notice');
});

test('Village Green: +4 for houses within 10 tiles, +2 more for families, nothing outside, no stacking; children play there', () => {
  const {s,c,place,people,tick}=world(),family=place('house',40,40),far=place('house',75,75);const folk=people(6);s.needs.homes();
  const green=place('village_green',44,44);let homes=s.needs.homes();
  assert.deepEqual(c.greenBonus(family,homes),{near:VILLAGE_GREEN.happiness,family:VILLAGE_GREEN.familyBonus});assert.deepEqual(c.greenBonus(far,homes),{near:0,family:0});
  const inFamily=folk.find(w=>homes.get(w.id)?.buildingId===family.id),st=s.needs.status(inFamily);assert.equal(st.green,4);assert.equal(st.greenFamily,2);
  place('village_green',36,44);assert.deepEqual(c.greenBonus(family,s.needs.homes()),{near:4,family:2},'two greens do not add more');
  assert.equal(s.objectRegistry.require('village_green').walkable,true);assert.equal(s.map[45][45],0,'people walk across the green');
  tick(60000);assert.ok(c.housesInRange(green).some(h=>h.id===family.id));
  let seen=0;for(let i=0;i<40;i++){tick(1000);seen=Math.max(seen,c.playingAt(green.id)+c.playingAt(s.buildings.find(b=>b.type==='village_green'&&b!==green).id));}assert.ok(seen>0,'children come to play on the green');
});

test('evening: a few neighbours in reach sit on the green; during a Feast everyone gathers on the nearest green', () => {
  const {s,c,place,people,at}=world(),house=place('house',40,40),house2=place('house',40,46);people(8);s.needs.homes();const green=place('village_green',44,44);
  assert.equal(c.eveningSeat(s.workerSystem.liveWorkers()[0]),null,'by day nobody sits there');
  at(.78);const seated=s.workerSystem.liveWorkers().filter(w=>c.eveningSeat(w));assert.equal(seated.length,VILLAGE_GREEN.eveningSeats);
  const tiles=new Set();for(let y=44;y<47;y++)for(let x=44;x<47;x++)tiles.add(`${x},${y}`);assert.ok(seated.every(w=>tiles.has(`${c.eveningSeat(w).x},${c.eveningSeat(w).y}`)));
  at(.95);assert.ok(s.workerSystem.liveWorkers().every(w=>!c.eveningSeat(w)),'later they go home');
  s.policy={feastBonus:()=>5};s.gameTime.update(s.gameTime.dayDuration*.83);const housed=[...s.needs.homes().keys()];assert.ok(housed.length>=8);assert.ok(housed.every(id=>c.eveningSeat(s.workerSystem.workers.get(id))),'Feast: everyone with a home on the green');
  assert.ok(house&&house2&&green);
});

test('at most 40 children on the map', () => {
  const {s,c,tick}=world();for(let i=0;i<20;i++){const x=10+(i%5)*12,y=10+Math.floor(i/5)*12;const d=s.objectRegistry.require('house');for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);
    placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});}
  for(let i=0;i<100;i++)s.workerSystem.create({x:5+(i%90),y:90});s.needs.homes();tick(200);
  assert.equal(c.children.size,CHILDREN.max);const per=new Map();for(const k of c.children.values())per.set(k.houseId,(per.get(k.houseId)??0)+1);assert.ok(Math.max(...per.values())-Math.min(...per.values())<=2);
});

test('winter: about half of the children go out, snowballs and snowmen, which melt in spring', () => {
  const {s,c,place,people,tick}=world({seasons:true});for(let i=0;i<4;i++)place('house',20+i*8,40);people(20);s.needs.homes();
  while(s.seasons.season!=='Winter')s.gameTime.update(s.gameTime.dayDuration);s.gameTime.update(s.gameTime.dayDuration*.05);tick(30000);
  const all=[...c.children.values()],out=all.filter(k=>k.state==='out');assert.ok(all.length>=4);assert.ok(out.length<all.length,'some stay in');
  assert.ok(out.every(k=>!k.activity||['snowball','snowman'].includes(k.activity.kind)));
  c.snowmen.push({id:'snowman-x',x:30,y:44,variant:0});while(s.seasons.season==='Winter')s.gameTime.update(s.gameTime.dayDuration);tick(1200);assert.equal(c.snowmen.length,0,'melted');
});

test('children, hidden houses and snowmen survive a save; the same children come back where they were', () => {
  const {s,c,place,people,tick}=world(),house=place('house',40,40);people(5);s.needs.homes();tick(20000);
  c.hidden.set(house.id,s.gameTime.totalElapsed+5000);c.snowmen.push({id:'snowman-1',x:41.5,y:44.5,variant:1});c.seq=1;
  const before=[...c.children.values()].map(k=>({id:k.id,x:Math.round(k.x*100)/100,y:Math.round(k.y*100)/100}));
  const state=validateGameState(serializeGameState(s));assert.equal(state.children.kids.length,before.length);
  const r=workerScene(undefined,{starter:false});r.childrenSystem=new ChildrenSystem(r);loadGameState(r,structuredClone(state));
  assert.deepEqual([...r.childrenSystem.children.values()].map(k=>({id:k.id,x:k.x,y:k.y})),before);
  assert.equal(r.childrenSystem.hidden.get(house.id),c.hidden.get(house.id));assert.equal(r.childrenSystem.snowmen.length,1);
  const bad=structuredClone(state);bad.children.kids[0].state='flying';assert.throws(()=>validateGameState(bad));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placementError,towerNeighbors } from '../src/game/buildings.js';
import { NightThreatSystem,validNightThreatState,hasLocalWood } from '../src/systems/NightThreatSystem.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { LightFuelSystem } from '../src/systems/LightFuelSystem.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

function world(settings){
  const s=workerScene(undefined,{logistics:true,workplaces:true});for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);
  s.bushes=new Map([['50,50',0]]);s.dayNight=new DayNightSystem(s);s.lightFuel=new LightFuelSystem(s);s.nightThreats=new NightThreatSystem(s,settings);
  const at=fraction=>{const g=s.gameTime,target=g.dayDuration*fraction;g.update(target>g.elapsed?target-g.elapsed:g.dayDuration-g.elapsed+target);s.nightThreats.update();};
  const error=(x,y)=>placementError(s.map,{x,y},{has:k=>s.resourceOccupancy.has(k),naturalContext:{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:()=>false},scene:s}},[],s.objectRegistry.require('campfire'),s.buildings);
  return {s,n:s.nightThreats,at,error};
}

test('night threats are on by default; the New Game setup and Settings switch each one off', () => {
  assert.deepEqual(new NightThreatSystem({}).enabled,{wolves:true,thieves:true,fires:true});
  const settings=gameSettings({nightWolves:false});assert.equal(settings.nightWolves,false);assert.throws(()=>gameSettings({nightFires:'yes'}));
  const {n}=world(settings);assert.equal(n.enabled.wolves,false);n.setEnabled('fires',false);assert.deepEqual(n.enabled,{wolves:false,thieves:true,fires:false});
});

test('a campfire costs nothing from the stores but needs a tree or a bush within 6 tiles', () => {
  const {s,error}=world();assert.deepEqual(s.objectRegistry.require('campfire').cost,{});
  assert.equal(hasLocalWood(s,{x:54,y:50}),true);assert.equal(error(54,50),null);
  assert.equal(hasLocalWood(s,{x:70,y:70}),false);assert.match(error(70,70),/6/);
});

test('a campfire burns one night (at once if made at night), lies as ashes for a day and then goes', () => {
  const {s,n,at}=world();const soldier=s.workerSystem.create({x:52,y:51});
  at(.3);const fire=n.makeCampfire(soldier);assert.ok(fire,'made next to the soldier');assert.equal(s.lightFuel.isLit(fire),false,'by day it waits for the evening');
  at(s.dayNight.nightStart()+.02);assert.equal(s.lightFuel.isLit(fire),true,'burns at night');
  at(.3);assert.equal(s.lightFuel.isLit(fire),false);assert.equal(n.campfireAshes(fire),true,'ashes in the morning');
  at(.3);assert.equal(s.buildings.includes(fire),false,'gone a day later');
  at(s.dayNight.nightStart()+.05);const late=n.makeCampfire(soldier);assert.equal(s.lightFuel.isLit(late),true,'made at night: burns at once');
  s.bushes.clear();const far=s.workerSystem.create({x:80,y:80});assert.equal(n.makeCampfire(far),null,'no local wood');
});

test('save: threat switches and campfires (schema 57)', () => {
  const {s,n,at}=world();n.setEnabled('thieves',false);at(s.dayNight.nightStart()+.02);const fire=n.makeCampfire(s.workerSystem.create({x:52,y:51}));
  const state=validateGameState(serializeGameState(s));assert.deepEqual(state.nightThreats.enabled,{wolves:true,thieves:false,fires:true});assert.deepEqual(state.nightThreats.campfires.map(c=>c.id),[fire.id]);
  assert.equal(validNightThreatState({enabled:{wolves:true,thieves:true},campfires:[]},new Set()),false);
  const r=new NightThreatSystem({});r.importState(state.nightThreats);assert.equal(r.enabled.thieves,false);assert.equal(r.campfireBurning(fire),true);
});

import { animalInitialCount } from '../src/systems/GameSettings.js';
import { objectRegistry as registry } from '../src/systems/ObjectRegistry.js';
const night=(s,extra=.05)=>{const g=s.gameTime,target=g.dayDuration*(s.dayNight.nightStart()+extra);g.update(target>g.elapsed?target-g.elapsed:g.dayDuration-g.elapsed+target);};
const tick=(s,ms,step=50)=>{for(let t=0;t<ms;t+=step){s.gameTime.update(step);s.animalSystem.update(step);s.combat?.update?.(step);}};

test('wolves never come with the world or the wildlife respawn; at night a pack of 2–4 comes from the map edge, far away and out of light', () => {
  const wolf=registry.require('wolf');assert.equal(animalInitialCount(wolf,{wildlifePopulation:'abundant'}),0);assert.equal(wolf.gameplay.nightPredator,true);
  const {s,n}=world();n.random=()=>0;night(s);n.update();
  const pack=n.wolves();assert.ok(pack.length>=2&&pack.length<=4,`pack of ${pack.length}`);
  const cols=s.map[0].length,rows=s.map.length;assert.ok(pack.every(w=>Math.min(w.tile.x,w.tile.y,cols-1-w.tile.x,rows-1-w.tile.y)<=6),'at the edge');
  n.update();assert.equal(n.wolves().length,pack.length,'one pack a night');
  const off=world();off.n.setEnabled('wolves',false);off.n.random=()=>0;night(off.s);off.n.update();assert.equal(off.n.wolves().length,0,'switched off');
});

test('a wolf hunts people outdoors, never steps into a burning light, flees from three soldiers and leaves at dawn', () => {
  const {s,n}=world();n.random=()=>.99;night(s);n.update();const def=registry.require('wolf');
  const wolf=s.animalSystem.create(def,{x:70,y:70});const victim=s.workerSystem.create({x:74,y:70});victim.restPhase=null;
  tick(s,6000);assert.ok(Math.hypot(wolf.position.x-victim.position.x,wolf.position.y-victim.position.y)<2,'reaches the resident');
  assert.equal(s.combat.attacks.get(wolf),victim,'and attacks');
  // A torch post burns by the next resident: the wolf gives him up.
  const other=s.workerSystem.create({x:85,y:70});s.combat.stopAttack(wolf);victim.isAlive=false;
  s.dayNight.flameLights=()=>[{x:85.5,y:70.5,radius:5}];wolf.wolf.target=null;tick(s,4000);
  assert.ok(Math.hypot(wolf.position.x-85.5,wolf.position.y-70.5)>5,'stays out of the light');void other;
  // Three soldiers: the wolf runs.
  s.dayNight.flameLights=()=>[];const near=[0,1,2].map(i=>{const w=s.workerSystem.create({x:wolf.tile.x+1,y:wolf.tile.y+i-1});w.profession='soldier';return w;});
  const before=Math.hypot(wolf.position.x-near[0].position.x,wolf.position.y-near[0].position.y);tick(s,3000);
  assert.ok(Math.hypot(wolf.position.x-near[0].position.x,wolf.position.y-near[0].position.y)>before,'runs from the soldiers');
  // Dawn: gone.
  const g=s.gameTime;g.update(g.dayDuration-g.elapsed+g.dayDuration*.02);tick(s,45000,100);assert.equal(s.animalSystem.animals.has(wolf.id),false,'left at dawn');
});

test('wolves near the houses: one notice and the night speed-up stops; the wolf state survives Save', () => {
  const {s,n}=world();n.random=()=>.99;const house=s.objectRegistry.require('house');
  night(s);n.update();const wolf=s.animalSystem.create(registry.require('wolf'),{x:40,y:40});s.buildings.push({id:999,type:'house',definition:house,x:42,y:40,tiles:[{x:42,y:40},{x:43,y:40},{x:42,y:41},{x:43,y:41}]});
  s.eventFeed={pushed:[],push(key,text){this.pushed.push({key,text});return true;}};n.update();assert.equal(n.wolvesNear,true);assert.equal(s.eventFeed.pushed.length,1);n.update();assert.equal(s.eventFeed.pushed.length,1,'once');
  s.buildings.pop();void wolf;
  const state=validateGameState(serializeGameState(s));assert.equal(state.nightThreats.wolfDay,s.gameTime.day);
});

test('a 0.43.0 save (schema 57 without wolfDay) still loads', () => {
  assert.equal(validNightThreatState({enabled:{wolves:true,thieves:true,fires:true},campfires:[]},new Set()),true);
  assert.equal(validNightThreatState({enabled:{wolves:true,thieves:true,fires:true},campfires:[],wolfDay:'x'},new Set()),false);
});

test('thieves: no chance with lit stores; with a dark store and an unhappy kingdom a thief comes, steals and runs; a soldier who sees him gets the loot back', () => {
  const {s,n}=world();n.random=()=>0;const store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l));store.stock.wood=30;
  night(s);s.dayNight.flameLights=()=>[{x:store.x+.5,y:store.y+.5,radius:6}];assert.equal(n.thiefTargets().length,0,'lit store');assert.equal(n.thiefChance(),0);
  s.dayNight.flameLights=()=>[];s.needs.summary=()=>({happiness:20});const targets=n.thiefTargets();assert.ok(targets.length>=1);assert.ok(Math.abs(n.thiefChance(targets)-.3)<1e-9,'unhappy and dark: 30 %');
  s.needs.summary=()=>({happiness:80});assert.ok(n.thiefChance(targets)<.1,'happy: small');
  s.needs.summary=()=>({happiness:20});n.thiefDay=null;const thief=n.spawnThief(s.gameTime.day);assert.ok(thief);assert.equal(thief.isSubject,false,'not a resident');
  // Put him next to the store: he steals and runs.
  const b=s.buildings.find(x=>x.id===store.buildingId),spot=towerNeighbors(b).find(t=>s.map[t.y]?.[t.x]===0);
  thief.tile={...spot};thief.position={x:spot.x+.5,y:spot.y+.5};thief.path=[];thief.nextTile=null;n.thieves.get(thief.id).repath=0;
  n.updateThieves(50);const st=n.thieves.get(thief.id);assert.equal(st.state,'escaping');assert.equal(st.loot.resource,'wood');assert.ok(st.loot.amount>=10&&st.loot.amount<=20);assert.equal(store.stock.wood,30-st.loot.amount);
  // A soldier with a torch right beside him: seen, chased, caught; the goods lie on the ground for the Haulers.
  const soldier=s.workerSystem.create({x:thief.tile.x+1,y:thief.tile.y});soldier.profession='soldier';s.lightFuel.hands.add(soldier.id);
  for(let i=0;i<40&&n.thieves.has(thief.id);i++){n.updateThieves(100);n.pursue(soldier);soldier.update(100);thief.update(100);}
  assert.equal(n.thieves.has(thief.id),false,'caught');assert.ok([...s.dropSystem.drops.values()].some(d=>d.resource==='wood'&&d.amount===st.loot.amount),'loot dropped');
});

test('a thief who gets away is reported in the morning; switched-off thieves never come', () => {
  const {s,n}=world();n.random=()=>0;const store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l));store.stock.wood=30;s.needs.summary=()=>({happiness:20});s.dayNight.flameLights=()=>[];
  night(s);const thief=n.spawnThief(s.gameTime.day);n.thieves.get(thief.id).loot={resource:'wood',amount:12,from:'Granary'};n.thieves.get(thief.id).state='escaping';n.thieves.get(thief.id).since=-1e9;
  n.updateThieves(50);assert.equal(n.thieves.size,0,'gone');s.eventFeed={pushed:[],push(key,text){this.pushed.push({key,text});return true;}};
  const g=s.gameTime;g.update(g.dayDuration-g.elapsed+g.dayDuration*.3);n.update(0);assert.match(s.eventFeed.pushed.map(p=>p.text).join('|'),/12 Wood/);
  const off=world();off.n.setEnabled('thieves',false);off.n.random=()=>0;off.s.needs.summary=()=>({happiness:10});off.s.dayNight.flameLights=()=>[];night(off.s);assert.equal(off.n.spawnThief(off.s.gameTime.day),null);
});

test('save in the middle of a theft: the thief, his loot and the night are kept', () => {
  const {s,n}=world();n.random=()=>0;const store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l));store.stock.wood=30;s.needs.summary=()=>({happiness:20});s.dayNight.flameLights=()=>[];
  night(s);const thief=n.spawnThief(s.gameTime.day);n.thieves.get(thief.id).loot={resource:'wood',amount:11,from:'Granary'};n.thieves.get(thief.id).state='escaping';
  const state=validateGameState(serializeGameState(s));assert.deepEqual(state.nightThreats.thieves.map(t=>[t.id,t.state,t.loot.amount]),[[thief.id,'escaping',11]]);
  assert.ok(state.workers.some(w=>w.id===thief.id&&w.isSubject===false),'the thief is a visitor, not a resident');
});

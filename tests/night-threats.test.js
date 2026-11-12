import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placementError,towerNeighbors } from '../src/game/buildings.js';
import { gridToWorld } from '../src/game/isometric.js';
import { NightThreatSystem,validNightThreatState,hasLocalWood } from '../src/systems/NightThreatSystem.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { LightFuelSystem } from '../src/systems/LightFuelSystem.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

function world(settings){
  const s=workerScene(undefined,{logistics:true,workplaces:true});for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);
  s.bushes=new Map([['50,50',0]]);s.dayNight=new DayNightSystem(s);s.lightFuel=new LightFuelSystem(s);s.nightThreats=new NightThreatSystem(s,settings);
  // These scenes test the threats themselves: the kingdom is past the quiet start and has had its first fire warning.
  s.nightThreats.started=()=>true;s.nightThreats.fireWarned=true;
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

test('fires: a burning flame near a wooden building may set it alight at night; residents with buckets put it out, faster with a Well; unchecked it burns down to ruins', () => {
  const {s,n}=world();const place=(type,x,y)=>{const d=s.objectRegistry.require(type);const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles:[]};for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++){b.tiles.push({x:x+dx,y:y+dy});s.map[y+dy][x+dx]=1;}s.buildings.push(b);return b;};
  const house=place('house',60,60),castle=s.buildings.find(b=>b.type==='castle');assert.equal(n.flammable(house),true);if(castle)assert.equal(n.flammable(castle),false);
  const seasons=s.seasons;s.seasons={season:'Summer',weather:'Drought',enabled:true};assert.ok(Math.abs(n.fireRisk()-.04)<1e-9,'Drought doubles the risk');s.seasons.weather='Rainy';assert.ok(n.fireRisk()<.01);s.seasons=seasons;
  s.lightSources={lights:()=>[{type:'torch',...gridToWorld(62.5,61),radius:100}]};n.random=()=>0;night(s);n.igniteFires(s.gameTime.day);assert.equal(n.burning(house),true,'set alight by the torch post');
  // Two residents with a Well right next to the house put it out (the 90 % roll).
  n.random=()=>.5;place('well',63,63);const helpers=[0,1].map(i=>s.workerSystem.create({x:64+i,y:64}));
  for(let i=0;i<1200&&n.burning(house);i++){for(const w of helpers){if(!n.firefight(w,50))void 0;w.update(50);}n.updateFires(50);}
  assert.equal(n.burning(house),false,'put out');assert.ok(s.buildings.includes(house),'still standing');
  // Nobody helps: it burns down to ruins and its goods burn.
  n.ignite(house);for(let i=0;i<2000&&n.burning(house);i++)n.updateFires(100);
  assert.equal(s.buildings.includes(house),false,'burnt down');assert.ok(s.buildings.some(b=>b.type==='burnt_ruins'&&b.x===60&&b.y===60),'ruins left');
  const ruin=s.buildings.find(b=>b.type==='burnt_ruins');assert.equal(ruin.burntFrom,'house');assert.equal(ruin.definition.name,'Burnt House','the ruins say what burnt');
  const off=world();off.n.setEnabled('fires',false);off.s.lightSources={lights:()=>[{type:'torch',...gridToWorld(62.5,61),radius:100}]};off.n.random=()=>0;assert.deepEqual(off.n.igniteFires(1),[],'switched off');
});

test('E1: threats wait for 5 finished Houses or the second year; the first spark only warns',async()=>{
  const {NightThreatSystem:N}=await import('../src/systems/NightThreatSystem.js');
  const houses=n=>Array.from({length:n},(_,i)=>({id:i+1,type:'house'}));
  const make=({n=0,year=1,seasons=true,day=1}={})=>new N({buildings:houses(n),seasons:seasons?{enabled:true,calendar:{year}}:{enabled:false},gameTime:{day}});
  assert.equal(make().started(),false);assert.equal(make({n:4}).started(),false);assert.equal(make({n:5}).started(),true,'5 Houses');
  assert.equal(make({year:2}).started(),true,'second year');assert.equal(make({seasons:false,day:20}).started(),false);assert.equal(make({seasons:false,day:21}).started(),true);
  const r=make({n:5});assert.deepEqual(r.exportState().fireWarned,undefined);r.fireWarned=true;const saved=r.exportState();assert.equal(saved.fireWarned,true);
  const back=make();back.importState(saved);assert.equal(back.fireWarned,true);
});

test('m-pozary: the first resident who answers rolls the fate – 10 % the building is lost despite the buckets; saved fires cannot burn down; Save/Load keeps the fate and the ruins name', () => {
  const {s,n}=world();const place=(type,x,y)=>{const d=s.objectRegistry.require(type);const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles:[]};for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++){b.tiles.push({x:x+dx,y:y+dy});s.map[y+dy][x+dx]=1;}s.buildings.push(b);return b;};
  const feed=[];s.eventFeed={push:(k,text)=>feed.push(text)};
  const house=place('house',60,60);place('well',63,63);const helpers=[0,1].map(i=>s.workerSystem.create({x:64+i,y:64}));
  // The roll is 0.05 < 0.1: lost. The buckets do not help and it burns down.
  n.random=()=>.05;n.ignite(house);for(let i=0;i<4000&&n.burning(house);i++){for(const w of helpers){n.firefight(w,50);w.update(50);}n.updateFires(50);}
  assert.ok(feed.some(t=>/Villagers are putting it out/.test(t)),'the feed says the villagers came');
  assert.equal(s.buildings.includes(house),false,'lost despite the buckets');const ruin=s.buildings.find(b=>b.type==='burnt_ruins');assert.equal(ruin.definition.name,'Burnt House');
  // Saved: with nobody throwing buckets after the roll, the house keeps a little health and does not burn down.
  const other=place('house',70,60);n.random=()=>.5;n.ignite(other);const fire=n.fires.get(other.id);fire.fate='saved';for(let i=0;i<2000;i++)n.updateFires(100);
  assert.equal(n.burning(other),true);assert.ok(s.buildings.includes(other),'a saved fire never burns the building down');
  const state=validateGameState(serializeGameState(s));assert.equal(state.nightThreats.fires.find(f=>f.id===other.id).fate,'saved');assert.equal(state.buildings.find(b=>b.id===ruin.id).burntFrom,'house');
  assert.equal(validNightThreatState({...state.nightThreats,fires:[{id:other.id,intensity:10,health:10,fate:'maybe'}]},new Set([other.id])),false);
});
test('m-ukladani-chyba: a workplace that burns down leaves no workplace record or worker behind, so the game still saves', async () => {
  const { placeBuilding } = await import('../src/game/buildings.js');
  const {s,n}=world();const d=s.objectRegistry.require('hunting_lodge');for(const [id,k]of Object.entries(d.cost))s.inventory.add(id,k);
  const r=placeBuilding({map:s.map,anchor:{x:60,y:60},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);
  const lodge=r.building;s.towerViews.set(lodge.id,s.createBuildingView(d,lodge));s.workplaceSystem.sync?.();
  if(!s.workplaceSystem.records.has(lodge.id))s.workplaceSystem.records.set(lodge.id,{buildingId:lodge.id,capacity:d.workplace.capacity,workerIds:[],delivered:{meat:5}});
  const w=s.workerSystem.create({x:64,y:64});assert.equal(s.workplaceSystem.assign(lodge,w),true);
  n.burnDown(lodge);
  assert.equal(s.workplaceSystem.records.has(lodge.id),false,'the workplace record goes with the building');
  assert.equal(w.assignedWorkplaceId??null,null,'the hunter is out of work');
  validateGameState(serializeGameState(s));
});
test('m-ukladani-chyba: a squad number on someone who is no longer a soldier and a Hunter\'s deferred wolf kill do not block saving', () => {
  const {s}=world();const w=s.workerSystem.create({x:64,y:64});w.squad=2;
  const data=validateGameState(serializeGameState(s));assert.equal(data.workers.find(x=>x.id===w.id).squad,undefined);
});

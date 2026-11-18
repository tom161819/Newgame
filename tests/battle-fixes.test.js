import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { workerScene } = await import('./helpers/workerScene.js');
const { spawnSandboxUnits } = await import('../src/game/sandboxMode.js');
const { placeBuilding } = await import('../src/game/buildings.js');
const { AlarmSystem,ALARM } = await import('../src/systems/AlarmSystem.js');
const { MILITARY_RULES,CATAPULT,WAGON_SUPPLY } = await import('../src/data/military.js');
const { markEnemyBuilding } = await import('../src/systems/SiegeSystem.js');

// Owner 18 Nov 2026: "ok udělej všechny návrhy oprav z testu" (project document claude/test-bitev-0.146.md).
const scene=()=>workerScene(undefined,{foodProduction:true,workplaces:true});
const until=(s,p,max=120000)=>{let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;};
function build(s,type,x,y){const d=s.objectRegistry.require(type);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));result.building.progress=1;result.building.completed=true;s.foodStorage?.register?.(result.building);return result.building;}
const units=(s,id,at,n)=>{const before=new Set([...s.workerSystem.workers.keys(),...s.animalSystem.animals.keys()]);spawnSandboxUnits(s,id,at,n);return [...s.workerSystem.workers.values(),...s.animalSystem.animals.values()].filter(u=>!before.has(u.id));};
const foes=s=>[...s.animalSystem.animals.values()].filter(a=>a.isAlive&&a.definition?.gameplay?.hostile);
const far=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

test('point 1: a wounded soldier falls back to the Castle, not to the edge of the map; the enemy gives up the chase and walks back',()=>{
  const s=scene();s.character.away=true;const castle=build(s,'castle',20,48),[w]=units(s,'swordsman',{x:52,y:50},1),[knight]=units(s,'enemy_knight',{x:58,y:50},1),post={...knight.tile};
  w.currentHP=w.maxHP*.2;until(s,()=>w.retreating,20000);until(s,()=>!w.retreating&&!w.nextTile&&!w.path.length,90000);
  assert.ok(w.isAlive,'he got away');assert.ok(far(w.tile,{x:22,y:50})<=far({x:52,y:50},{x:22,y:50})-12&&w.tile.x>=castle.x&&Math.abs(w.tile.y-50)<=4,`${w.tile.x},${w.tile.y}: he ran towards the Castle and stopped when nobody followed`);
  until(s,()=>!knight.retaliationTarget&&!knight.returning,60000);assert.ok(far(knight.tile,post)<=4,`the enemy is back at his post (${knight.tile.x},${knight.tile.y})`);
});

test('point 1: with no refuge a retreating soldier runs at most retreatMax tiles and then stands and fights',()=>{
  const s=scene(),[w]=units(s,'soldier',{x:40,y:50},1),[knight]=units(s,'enemy_knight',{x:43,y:50},1);w.currentHP=w.maxHP*.2;const start={...w.tile};let most=0;
  for(let t=0;t<60000&&w.isAlive&&knight.isAlive;t+=50){s.tick(50);most=Math.max(most,far(w.tile,start));}
  assert.ok(most<=MILITARY_RULES.retreatMax+3,`ran ${most.toFixed(1)} tiles`);assert.ok(!w.isAlive||!knight.isAlive,'the fight was fought out');
});

test('point 7: the alarm – residents near enemy soldiers run into the Castle and hide; enemies leave people inside alone; they come out when it is quiet',()=>{
  const s=scene();s.character.away=true;s.alarm=new AlarmSystem(s);const castle=build(s,'castle',30,46),people=[];const said=[];s.eventFeed={push:(key,text)=>said.push(text)};
  for(let i=0;i<5;i++){const w=s.workerSystem.create({x:45+i,y:50});w.arriving=false;people.push(w);}
  const enemies=units(s,'enemy_soldier',{x:50,y:43},3);
  until(s,()=>people.every(w=>w.sleepingIn===castle.id),40000);assert.ok(people.every(w=>w.isAlive),'nobody was killed');assert.equal(people[0].workMessage,'Hiding in the Castle');
  assert.equal(said.filter(x=>/shelter/.test(x)).length,1,'one line in the event feed');
  s.simulate(4000);assert.ok(enemies.every(a=>!a.retaliationTarget),'nobody to hunt');
  for(const a of enemies)s.animalSystem.remove(a);s.simulate(ALARM.calm+2000);assert.ok(people.every(w=>w.sleepingIn==null&&!w.alarm),'they come out');
  // A soldier never hides.
  const t=scene();t.alarm=new AlarmSystem(t);build(t,'castle',30,46);const [guard]=units(t,'swordsman',{x:45,y:50},1);units(t,'enemy_soldier',{x:49,y:50},1);t.simulate(3000);assert.equal(guard.alarm,undefined);
});

test('point 4: a Catapult out of Stones tells the player once; an empty Wagon fetches Stones from a store and brings them',()=>{
  const s=workerScene(undefined,{foodProduction:true,workplaces:true,logistics:true});s.workerSystem.unsubscribe?.();s.inventory.add('stone',60);const store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.free(l.id,'stone')>0);assert.ok(store,'Stones lie in a store');
  const d=s.objectRegistry.require('wall'),target={id:900,type:'wall',definition:d,x:70,y:52,tiles:[{x:70,y:52}]};s.buildings.push(target);s.map[52][70]=1;s.towerViews.set(900,s.createBuildingView(d,target));markEnemyBuilding(s,target);
  const [crew]=units(s,'catapult',{x:60,y:52},1),[driver]=units(s,'military_wagon',{x:58,y:54},1),cat=s.military.engines.vehicleOf(crew),wagon=s.military.engines.vehicleOf(driver);
  cat.ammo=0;wagon.supplies={};const said=[];s.eventFeed={push:(key,text)=>said.push(text)};s.military.siege.order([crew,driver],target);
  until(s,()=>said.some(x=>/run out of Stones/.test(x)),20000);
  until(s,()=>(wagon.supplies.stone??0)>0,120000);assert.ok(far(driver.tile,store)<=WAGON_SUPPLY.loadRadius+3,'it loaded at the store');
  until(s,()=>cat.ammo>0,120000);assert.equal(said.filter(x=>/run out of Stones/.test(x)).length,1);assert.equal(CATAPULT.damage,100);
});

test('point 11: on the Test map nobody goes hungry',()=>{
  const s=scene();s.sandbox=true;const [w]=units(s,'soldier',{x:40,y:50},1);for(const id of ['bread','meat','apple','fish'])s.inventory.spend?.(id,s.inventory.count(id));
  assert.equal(s.foodSystem.eat(w),true);s.sandbox=false;
});

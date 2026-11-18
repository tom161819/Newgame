import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { workerScene } = await import('./helpers/workerScene.js');
const { spawnSandboxUnits } = await import('../src/game/sandboxMode.js');
const { placeBuilding } = await import('../src/game/buildings.js');
const { AlarmSystem,ALARM } = await import('../src/systems/AlarmSystem.js');
const { MILITARY_RULES,CATAPULT,WAGON_SUPPLY } = await import('../src/data/military.js');
const { markEnemyBuilding } = await import('../src/systems/SiegeSystem.js');
const { findPathToAny } = await import('../src/game/pathfinding.js');

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

test('point 8: attack-move – soldiers fight the enemies they meet on the way and then walk on to where they were sent; a plain move walks past',()=>{
  const s=scene();s.character.away=true;const us=units(s,'swordsman',{x:30,y:50},5),enemies=units(s,'enemy_soldier',{x:45,y:51},3);
  assert.equal(s.workerSystem.commands.move(us,{x:62,y:50},{attack:true}),5);assert.ok(us.every(w=>w.attackMove));
  until(s,()=>enemies.every(e=>!e.isAlive),90000);assert.ok(us.some(w=>w.isAlive&&w.commandState.state==='MovingToHold'),'still on the way');
  until(s,()=>us.filter(w=>w.isAlive).every(w=>w.commandState.state==='Holding'),90000);for(const w of us.filter(w=>w.isAlive)){assert.ok(far(w.tile,{x:62,y:50})<=4);assert.equal(w.attackMove,undefined);}
  // A new plain order ends it.
  const t=scene();t.character.away=true;const [w]=units(t,'swordsman',{x:30,y:50},1);t.workerSystem.commands.move([w],{x:60,y:50},{attack:true});t.workerSystem.commands.move([w],{x:40,y:50});assert.equal(w.attackMove,undefined);
});

test('point 9: two shifts – at any time of the day at most half of the soldiers have their rest time',async()=>{
  const { isSoldierRestTime,soldierShift } = await import('../src/systems/DailyRest.js');const soldiers=Array.from({length:10},(_,i)=>({id:`worker-${i+1}`}));
  assert.deepEqual([...new Set(soldiers.map(soldierShift))].sort(),[0,1]);
  for(let f=0;f<1;f+=.02){const time={restStartFraction:()=>.75,day:3,elapsed:f*1000,dayDuration:1000},resting=soldiers.filter(w=>isSoldierRestTime(time,w)).length;assert.ok(resting<=5,`${resting} rest at ${f.toFixed(2)}`);if(f>=.68)assert.equal(resting,0,'everybody watches in the evening and at night');}
  assert.equal(isSoldierRestTime({restStartFraction:()=>.75,day:1,elapsed:100,dayDuration:1000},soldiers[1]),false,'not on day 1');
});

test('point 5: an enemy Gate is closed; it opens while a melee defender near it goes for our people (ours may walk in then) and closes after',async()=>{
  const { EnemyGates,ENEMY_GATE } = await import('../src/systems/EnemyGates.js');
  const s=scene();s.character.away=true;s.enemyGates=new EnemyGates(s);
  const put=(type,x,y)=>{const d=s.objectRegistry.require(type),tiles=[];for(let j=0;j<d.height;j++)for(let i=0;i<d.width;i++)tiles.push({x:x+i,y:y+j});const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=d.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(d,b));markEnemyBuilding(s,b);return b;};
  for(let x=50;x<62;x++){if(x!==55&&x!==56){put('wall',x,48);put('wall',x,49);}put('wall',x,40);}for(let y=41;y<48;y++){put('wall',50,y);put('wall',61,y);}
  const gate=put('gate',55,48),closed=()=>gate.tiles.every(t=>s.map[t.y][t.x]===1),open=()=>gate.tiles.every(t=>s.map[t.y][t.x]===0);
  const way=()=>findPathToAny(s.map,{x:58,y:53},[{x:57,y:44}]);
  s.tick(400);assert.ok(closed()&&!s.enemyGates.isOpen(gate)&&!way(),'closed with nobody about: no way in');
  // Enemy archers alone do not open it.
  const archers=units(s,'enemy_archer',{x:53,y:44},2),[bait]=units(s,'swordsman',{x:55,y:53},1);bait.stance='hold';
  for(let i=0;i<60;i++)s.tick(50);assert.ok(closed(),'archers stay behind the closed Gate');for(const a of archers)s.animalSystem.remove(a);
  const guards=units(s,'enemy_soldier',{x:55,y:45},3);
  until(s,()=>open(),15000);assert.ok(s.enemyGates.isOpen(gate));
  until(s,()=>guards.some(g=>g.tile.y>=50),30000);assert.ok(true,'the defenders came out through the Gate');
  // Ours get in while it is open.
  assert.ok(way(),'a route through the open Gate');
  // With the defenders dead it closes, but never on somebody inside it.
  for(const g of guards)s.animalSystem.remove(g);const [stander]=units(s,'swordsman',{x:55,y:52},1);stander.stance='hold';stander.tile={x:55,y:48};stander.position={x:55.5,y:48.5};stander.path=[];stander.nextTile=null;
  for(let i=0;i<(ENEMY_GATE.stayOpen+2000)/50;i++)s.tick(50);assert.ok(open(),'not shut on a man in the Gate');
  stander.tile={x:55,y:52};stander.position={x:55.5,y:52.5};for(let i=0;i<40;i++)s.tick(50);assert.ok(closed()&&!way(),'closed again');
});

test('point 10: in a night battle the selected soldiers and everybody in a fight get a small glow; a light source can be scaled',async()=>{
  const { battleGlow,UNIT_GLOW } = await import('../src/game/battleGlow.js');const { resolveLights,defaultLightSettings } = await import('../src/render/lightLab.js');
  const s=scene();s.character.away=true;const us=units(s,'swordsman',{x:40,y:50},3),[foe]=units(s,'enemy_soldier',{x:70,y:50},1);
  assert.equal(battleGlow(s).length,0);s.unitSelection={ids:new Set([us[0].id])};assert.deepEqual(battleGlow(s),[us[0]]);
  s.combat.attacks.set(us[1],foe);assert.deepEqual(new Set(battleGlow(s)),new Set([us[0],us[1],foe]),'attacker and target, either side');s.combat.attacks.delete(us[1]);
  s.lightFuel={carries:w=>w===us[0]};assert.equal(battleGlow(s).length,0,'a torch bearer has his own light');
  const settings=defaultLightSettings(),at={darkness:1,seconds:0},[full]=resolveLights([{type:'lantern',x:0,y:0,seed:0}],settings,at),[glow]=resolveLights([{type:'lantern',x:0,y:0,seed:0,...UNIT_GLOW}],settings,at);
  assert.ok(glow.rx<full.rx*.7&&glow.strength<full.strength*.7,'smaller and weaker than a lantern');assert.notDeepEqual(glow.color,full.color);
});

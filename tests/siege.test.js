import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { siegeTiles,touchesBuilding,siegeable,canSiege,markEnemyBuilding,ENEMY_TINT } = await import('../src/systems/SiegeSystem.js');
const { buildingHP } = await import('../src/game/buildingHealth.js');
const { spawnSandboxUnits,sandboxBuilt } = await import('../src/game/sandboxMode.js');
const { workerScene } = await import('./helpers/workerScene.js');

const add=(s,type,x,y)=>{const d=s.objectRegistry.require(type),tiles=[];for(let j=0;j<d.height;j++)for(let i=0;i<d.width;i++)tiles.push({x:x+i,y:y+j});const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=d.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(d,b));return b;};

test('owner 18 Nov 2026: the ground around a building is where a melee soldier reaches it',()=>{
  const map=Array.from({length:20},()=>Array(20).fill(0)),wall={x:5,y:5,type:'wall',tiles:[{x:5,y:5}]};map[5][5]=1;map[4][4]=1;
  const tiles=siegeTiles(map,wall).map(t=>`${t.x},${t.y}`);assert.equal(tiles.length,7,'eight neighbours less the blocked corner');assert.ok(!tiles.includes('4,4')&&!tiles.includes('5,5'));
  assert.equal(touchesBuilding({x:6,y:6},wall),true);assert.equal(touchesBuilding({x:7,y:5},wall),false);assert.equal(touchesBuilding({x:5,y:5},wall),false);
});

test('owner 18 Nov 2026: Test map – an enemy wall is steel blue, an enemy Gate is closed, ours are not siege targets',()=>{
  const s=workerScene(undefined,{foodProduction:true}),painted=[];
  const ours=add(s,'wall',50,50),gate=add(s,'gate',54,50);s.towerViews.set(gate.id,{paint:(b,tint)=>painted.push(tint),destroy(){}});
  assert.equal(siegeable(ours),false,'our own wall is never attacked');
  s.sandboxSide='enemy';sandboxBuilt(s,gate);assert.equal(gate.enemy,true);assert.deepEqual(painted,[ENEMY_TINT]);assert.ok(gate.tiles.every(t=>s.map[t.y][t.x]===1),'the enemy Gate is shut');assert.equal(siegeable(gate),true);
  s.sandboxSide='ours';sandboxBuilt(s,ours);assert.equal(!!ours.enemy,false);
});

test('owner 18 Nov 2026: melee soldiers walk to an enemy wall, hit it down and the way opens; archers do not go',()=>{
  const s=workerScene(undefined,{foodProduction:true});
  const walls=[];for(let x=60;x<64;x++){const w=add(s,'wall',x,50);markEnemyBuilding(s,w);walls.push(w);}
  assert.equal(spawnSandboxUnits(s,'swordsman',{x:61,y:56},4),4);assert.equal(spawnSandboxUnits(s,'archer',{x:58,y:56},1),1);
  const soldiers=s.workerSystem.liveWorkers().filter(w=>w.profession==='soldier'),archer=soldiers.find(w=>!canSiege(w)),target=walls[1];
  assert.ok(archer,'the archer is not a melee soldier');
  assert.equal(s.military.siege.order(soldiers,target),4,'only the four swordsmen go');assert.equal(archer.siegeTargetId,undefined);
  let t=0,hit=false;while(t<120000&&s.buildings.includes(target)){s.tick(50);t+=50;if((buildingHP(target)?.hp??0)<200)hit=true;}
  assert.ok(hit,'the wall lost hit points');assert.equal(s.buildings.includes(target),false,'the wall fell');assert.equal(s.map[50][61],0,'its tile is walkable again');
  assert.ok(soldiers.filter(canSiege).every(w=>w.siegeTargetId==null||walls.some(x=>x.id===w.siegeTargetId&&s.buildings.includes(x))),'with the wall down they go on at the enemy walls beside it by themselves');assert.ok(s.buildings.includes(walls[0])&&s.buildings.includes(walls[2]),'the neighbours stand');
});

test('owner 18 Nov 2026: a move order ends the attack on a wall',()=>{
  const s=workerScene(undefined,{foodProduction:true}),wall=add(s,'wall',60,50);markEnemyBuilding(s,wall);
  spawnSandboxUnits(s,'soldier',{x:60,y:56},1);const w=s.workerSystem.liveWorkers().find(w=>w.profession==='soldier');
  s.military.siege.order([w],wall);for(let i=0;i<10;i++)s.tick(50);assert.equal(w.siegeTargetId,wall.id);
  s.workerSystem.commands.move([w],{x:70,y:70});for(let i=0;i<5;i++)s.tick(50);assert.equal(w.siegeTargetId,undefined);
});

// Owner 18 Nov 2026: "s vojáky nejde zaútočit na hradby, katapult … místo toho aby se přiblížil a začal střílet tak začne
// odjíždět". From day 2 soldiers sleep in the first third of the day (after the night watch) and that rest came before
// the order: they walked to the Castle instead.
const { placeBuilding } = await import('../src/game/buildings.js');
const morning=s=>{s.gameTime.restStartFraction=()=>.75;s.gameTime.day=2;s.gameTime.elapsed=s.gameTime.dayDuration*.05;};
const until=(s,p,max=120000)=>{let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;};
function build(s,type,x,y){const d=s.objectRegistry.require(type);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));result.building.progress=1;result.building.completed=true;return result.building;}

test('owner 18 Nov 2026: a soldier resting in the morning obeys an order to attack a wall – he wakes, walks there and breaks it',()=>{
  const s=workerScene(undefined,{foodProduction:true,workplaces:true}),castle=build(s,'castle',30,30),wall=add(s,'wall',60,50);markEnemyBuilding(s,wall);
  const w=s.workerSystem.create({x:38,y:36});w.arriving=false;assert.ok(s.military.enlist(w,'swordsman',{withoutHorse:true}));
  morning(s);until(s,()=>w.sleepingIn===castle.id,60000);assert.equal(s.military.onDuty(w),false,'no order, no enemy: he sleeps after the night watch');
  assert.equal(s.workerSystem.commands.selectable(w),true,'a sleeping soldier can still be chosen and ordered');
  assert.equal(s.military.siege.order([w],wall),1);assert.equal(s.military.onDuty(w),true);
  for(let i=0;i<10;i++)s.tick(50);assert.equal(w.sleepingIn,null,'the order wakes him');assert.equal(w.restPhase,null);assert.equal(w.workMessage,'Attacking the wall');
  until(s,()=>{morning(s);return !s.buildings.includes(wall);});
  // …and with the wall down and nothing else to do he goes to bed again.
  morning(s);until(s,()=>w.restPhase!=null,20000);
});

test('owner 18 Nov 2026: an attack order on an enemy also beats the morning rest, and an enemy near a sleeper wakes him',()=>{
  const s=workerScene(undefined,{foodProduction:true,workplaces:true}),castle=build(s,'castle',30,30);
  const w=s.workerSystem.create({x:38,y:36});w.arriving=false;assert.ok(s.military.enlist(w,'swordsman',{withoutHorse:true}));
  morning(s);until(s,()=>w.sleepingIn===castle.id,60000);
  const raider=s.animalSystem.create(s.objectRegistry.require('raider'),{x:60,y:60});s.military.orderAttack([w],raider);
  morning(s);until(s,()=>!raider.isAlive||!w.isAlive);assert.equal(w.restPhase,null,'he fought instead of sleeping');
  if(w.isAlive){morning(s);until(s,()=>w.sleepingIn===castle.id,60000);const wolf=s.animalSystem.create(s.objectRegistry.require('raider'),{x:w.tile.x+6,y:w.tile.y+6});s.simulate(1500);assert.equal(w.sleepingIn,null,'an enemy in sight near him wakes him');assert.ok(wolf);}
});

test('owner 18 Nov 2026: a Barracks soldier with an order does not walk to his Barracks first; a Catapult crew comes closer and shoots in the morning',()=>{
  const s=workerScene(undefined,{foodProduction:true,workplaces:true});build(s,'castle',20,20);const barracks=build(s,'barracks',30,60),wall=add(s,'wall',70,40);markEnemyBuilding(s,wall);
  const w=s.workerSystem.create({x:60,y:44});w.arriving=false;assert.equal(s.workplaceSystem.assign(barracks,w),true);assert.ok(s.military.enlist(w,'swordsman',{withoutHorse:true}));
  const from=Math.hypot(w.tile.x-wall.x,w.tile.y-wall.y);s.military.siege.order([w],wall);let far=from;
  until(s,()=>{far=Math.max(far,Math.hypot(w.tile.x-wall.x,w.tile.y-wall.y));return (buildingHP(wall)?.hp??200)<200;});assert.ok(far<=from+2,`he went straight at the wall (farthest ${far}, started ${from})`);
  // The Catapult: 30 tiles away in the morning of day 2 – it rolls into range and bombards, it does not drive home.
  const fort=add(s,'wall',70,80);markEnemyBuilding(s,fort);spawnSandboxUnits(s,'catapult',{x:40,y:80},1);const crew=s.workerSystem.liveWorkers().find(x=>s.military.unit(x)?.type==='catapult');crew.sandbox=false;
  morning(s);assert.equal(s.military.siege.order([crew],fort),1);let worst=0;const start=Math.hypot(crew.tile.x-fort.x,crew.tile.y-fort.y);
  until(s,()=>{morning(s);worst=Math.max(worst,Math.hypot(crew.tile.x-fort.x,crew.tile.y-fort.y));return (buildingHP(fort)?.hp??200)<200;},200000);
  assert.ok(worst<=start+2,'the Catapult never drove away from its target');assert.equal(crew.restPhase??null,null);
});

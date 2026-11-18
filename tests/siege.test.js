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
  s.simulate(5000);assert.ok(soldiers.every(w=>w.siegeTargetId==null),'with the wall down they stop: the walls beside it wait for an order (battle test, point 6)');assert.ok(s.buildings.includes(walls[0])&&s.buildings.includes(walls[2]),'the neighbours stand');assert.equal(buildingHP(walls[0]).hp,200);
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

// Owner 18 Nov 2026, the full test of battles and sieges. A closed enemy fort with its defenders inside.
const fort=(s,x0,y0,w,h)=>{const walls=[];for(let x=x0;x<x0+w;x++){walls.push(add(s,'wall',x,y0),add(s,'wall',x,y0+h-1));}for(let y=y0+1;y<y0+h-1;y++){walls.push(add(s,'wall',x0,y),add(s,'wall',x0+w-1,y));}for(const b of walls)markEnemyBuilding(s,b);return walls;};
const units=(s,id,at,n)=>{const before=new Set([...s.workerSystem.workers.keys(),...s.animalSystem.animals.keys()]);spawnSandboxUnits(s,id,at,n);return [...s.workerSystem.workers.values(),...s.animalSystem.animals.values()].filter(u=>!before.has(u.id));};
const foes=s=>[...s.animalSystem.animals.values()].filter(a=>a.isAlive&&a.definition?.gameplay?.hostile);

test('siege test: soldiers sent at a wall hit it although the defenders stand inside out of reach, then go in through the gap',()=>{
  const s=workerScene(undefined,{foodProduction:true}),walls=fort(s,50,40,10,8);units(s,'enemy_soldier',{x:54,y:43},4);
  const us=units(s,'swordsman',{x:54,y:53},6),target=walls.find(w=>w.x===54&&w.y===47);assert.equal(s.military.siege.order(us,target),6);
  until(s,()=>(buildingHP(target)?.hp??200)<200,20000);assert.ok(us.some(w=>w.workMessage==='Attacking the wall'),'they do not wait below the wall for the men inside');
  until(s,()=>!foes(s).length,120000);assert.ok(us.some(w=>w.isAlive));
});

test('siege test: an attack order on an enemy behind closed walls makes the melee soldiers break through; an archer waits',()=>{
  const s=workerScene(undefined,{foodProduction:true}),walls=fort(s,50,40,10,8),inside=units(s,'enemy_soldier',{x:54,y:43},3);
  const us=units(s,'swordsman',{x:54,y:56},5),archer=units(s,'archer',{x:54,y:58},1)[0];s.military.orderAttack([...us,archer],inside[0]);
  until(s,()=>us.some(w=>w.siegeTargetId!=null),20000);assert.ok(us.every(w=>w.huntWolfId!=null||w.attackArea),'the attack order stays');
  until(s,()=>walls.some(w=>!s.buildings.includes(w)),60000);until(s,()=>!foes(s).length,120000);
  assert.equal(archer.siegeTargetId,undefined);
});

test('combat test: soldiers standing after a move order fight the enemies who come near and walk back to their places; Hold position does not move',()=>{
  const s=workerScene(undefined,{foodProduction:true}),us=units(s,'swordsman',{x:40,y:50},6);s.workerSystem.commands.move(us,{x:48,y:50});
  until(s,()=>us.every(w=>w.commandState.state==='Holding'),30000);const places=us.map(w=>({...w.commandState.goal}));
  const enemies=units(s,'enemy_soldier',{x:55,y:50},6);until(s,()=>!foes(s).length,60000);
  assert.ok(us.filter(w=>w.isAlive).length>=5,'six Swordsmen beat six enemy Recruits when all of them fight');assert.ok(enemies.every(e=>!e.isAlive));
  until(s,()=>us.every((w,i)=>!w.isAlive||w.tile.x===places[i].x&&w.tile.y===places[i].y),30000);assert.ok(us.every(w=>!w.isAlive||w.commandState.state==='Holding'),'still on the move order');
  const t=workerScene(undefined,{foodProduction:true}),guard=units(t,'swordsman',{x:40,y:50},1)[0];guard.stance='hold';t.workerSystem.commands.move([guard],{x:44,y:50});until(t,()=>guard.commandState.state==='Holding',20000);
  const at={...guard.tile};units(t,'enemy_archer',{x:49,y:50},1);t.simulate(4000);assert.deepEqual(guard.tile,at,'Hold position: he stays');
});

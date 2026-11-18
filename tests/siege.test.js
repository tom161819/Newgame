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

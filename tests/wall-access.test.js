import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,entryTiles } from '../src/game/buildings.js';
import { totalXPForLevel,getXPRequired } from '../src/data/experience.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { elevatedIndex,planAscent,planDescent,entrances } from '../src/game/wallNetwork.js';
import { upperDoors,doorShape } from '../src/game/TowerDoors.js';
import { t } from '../src/i18n/index.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// Owner 17 Nov 2026: "up onto the walls only from a Gate or a Tower; onto a Tower from a wall, a Tower or the ground at
// its door – the door must face into the castle, from outside the walls you cannot get on; onto a Gate from the
// ground, a wall or a Tower joined to it". These tests build small forts and follow real soldiers.
const scene=()=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter:true});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function soldier(s,barracks,tile){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(barracks,w),true);const c=w.skills.combat;Object.assign(c,{level:3,currentXP:0,totalXP:totalXPForLevel(3),xpToNextLevel:getXPRequired(3)});return w;}
const add=(s,type,x,y,extra={})=>{const d=s.objectRegistry.require(type),tiles=[];for(let j=0;j<d.height;j++)for(let i=0;i<d.width;i++)tiles.push({x:x+i,y:y+j});const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles,...extra};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=d.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(d,b));return b;};
const key=t=>`${t.x},${t.y}`;
// A square of walls x 20..30, y 20..30 with a Tower in the north side (tiles 25–26 × 19–20) facing `facing`; the
// soldiers' Barracks stands inside (24–27 × 24–28).
function fort(s,facing){
  const tower=add(s,'tower',25,19,{facing}),walls=[];
  for(let x=20;x<=30;x++)for(const y of [20,30])if(!(y===20&&(x===25||x===26)))walls.push(add(s,'wall',x,y));
  for(let y=21;y<30;y++)for(const x of [20,30])walls.push(add(s,'wall',x,y));
  s.events?.emit?.('buildings:changed');return {tower,walls};
}
// Runs the game until `done`, recording where every climb started (the ground tile left when he got up).
function follow(s,workers,done,max=120000){
  const grounds=new Map(),climbs=[];
  for(let ms=0;ms<max&&!done();ms+=50){for(const w of workers)if(!w.onWall)grounds.set(w.id,{...w.tile});s.tick(50);for(const w of workers)if(w.onWall&&grounds.has(w.id)){climbs.push({worker:w.id,ground:grounds.get(w.id),on:w.onWall});grounds.delete(w.id);}}
  return climbs;
}

test('a soldier inside the walls climbs only at a Tower door that faces inside; a door outside is no way up from inside',()=>{
  for(const facing of [0,2]){
    const s=scene(),barracks=building(s,'barracks',24,24),{tower,walls}=fort(s,facing),w=soldier(s,barracks,{x:22,y:23});
    const post=walls.find(b=>b.x===21&&b.y===30);assert.equal(s.military.wallPatrol.post([w],post),1);
    const climbs=follow(s,[w],()=>w.wallPatrol?.phase==='post'||w.workMessage===t('army.postNoWay')&&s.gameTime.totalElapsed>6000);
    if(facing===0){
      assert.equal(w.wallPatrol.phase,'post');assert.deepEqual(w.tile,{x:21,y:30});
      assert.equal(climbs.length,1);assert.equal(climbs[0].on,tower,'up through the Tower');assert.ok(entryTiles(tower).some(e=>key(e)===key(climbs[0].ground)),'from a tile at its door');
    }else{
      assert.equal(climbs.length,0,'the door faces out: nobody inside gets up');assert.equal(w.onWall??null,null);assert.equal(w.workMessage,t('army.postNoWay'));
    }
  }
});

test('the way up is the shortest walk to the goal counted over ground and wall together, never a far stair',()=>{
  const s=scene(),barracks=building(s,'barracks',60,60);
  // A long wall y = 40 from x 10 to 49 with a Tower at each end, both doors to the south (y+).
  const west=add(s,'tower',8,39,{facing:0}),east=add(s,'tower',50,39,{facing:0});for(let x=10;x<50;x++)add(s,'wall',x,40);s.events?.emit?.('buildings:changed');
  const index=elevatedIndex(s.buildings);
  // Standing near the west Tower but going to the east end: the east door wins (less wall to walk than ground saved).
  const way=planAscent(s.map,s.buildings,{x:12,y:44},[{x:48,y:40}],index);assert.equal(way.platform,east);
  const near=planAscent(s.map,s.buildings,{x:12,y:44},[{x:14,y:40}],index);assert.equal(near.platform,west);
  for(const e of entrances(s.buildings,s.map))assert.ok(entryTiles(e.platform).some(t=>key(t)===key(e.ground)),'every way up is a door or a gate passage');
  // A real soldier: from the west to the east end – he walks on the ground to the east door, not up the west stair.
  const w=soldier(s,barracks,{x:12,y:44});assert.equal(s.military.wallPatrol.post([w],s.buildings.find(b=>b.x===48&&b.y===40)),1);
  const climbs=follow(s,[w],()=>w.wallPatrol?.phase==='post');assert.equal(climbs[0].on,east);assert.deepEqual(w.tile,{x:48,y:40});
});

test('Towers joined to each other and Gates joined to walls are one network; a Gate is climbed from its passage',()=>{
  const s=scene(),barracks=building(s,'barracks',60,60);
  // Two Towers side by side: the left one's door is open (S), the right one's door (N) is blocked by a rock.
  const left=add(s,'tower',30,30,{facing:0}),right=add(s,'tower',32,30,{facing:2});s.map[29][32]=s.map[29][33]=1;
  const gate=add(s,'gate',40,30);for(let x=34;x<40;x++)add(s,'wall',x,31);s.events?.emit?.('buildings:changed');
  const a=soldier(s,barracks,{x:31,y:36}),b=soldier(s,barracks,{x:44,y:36});
  assert.equal(s.military.wallPatrol.post([a],right),1);assert.equal(s.military.wallPatrol.post([b],left),1);
  const climbs=follow(s,[a,b],()=>a.wallPatrol?.phase==='post'&&b.wallPatrol?.phase==='post');
  assert.equal(a.onWall,right,'on the right Tower');assert.equal(climbs.find(c=>c.worker===a.id).on,left,'up through the left Tower next to it');
  const up=climbs.find(c=>c.worker===b.id);assert.ok([left,gate].includes(up.on));
  if(up.on===gate)assert.ok(gate.tiles.some(t=>key(t)===key(up.ground)),'a Gate from inside its passage');
});

test('a move order brings a soldier down: he walks the wall to the nearest way down and steps off there, then goes on',()=>{
  const s=scene(),barracks=building(s,'barracks',24,24),{tower,walls}=fort(s,0),w=soldier(s,barracks,{x:22,y:23});
  s.military.wallPatrol.post([w],walls.find(b=>b.x===21&&b.y===30));follow(s,[w],()=>w.wallPatrol?.phase==='post');assert.ok(w.onWall);
  const goal={x:22,y:27};assert.equal(s.workerSystem.commands.move([w],goal),1);assert.equal(w.wallPatrol,undefined,'the post ends');
  assert.ok(w.onWall&&w.wallDescent,'still up there, walking to the way down');
  const save=validateGameState(serializeGameState(s)),saved=save.workers.find(x=>x.id===w.id);
  assert.ok(entryTiles(tower).some(e=>key(e)===key(saved.tile)),'a save meanwhile puts him at the foot of his way down');
  let landed=null;for(let ms=0;ms<60000&&!(w.commandState.state==='Holding');ms+=50){const up=!!w.onWall;s.tick(50);if(up&&!w.onWall&&!landed)landed={...w.tile};}
  assert.ok(landed&&entryTiles(tower).some(e=>key(e)===key(landed)),'stepped off at the Tower door');
  assert.deepEqual(w.tile,goal);
});

test('the way down from any wall piece is the nearest door; doors at the wall-walk show where walls meet a Tower face',()=>{
  const s=scene(),{tower,walls}=fort(s,0),index=elevatedIndex(s.buildings);
  const down=planDescent(s.map,s.buildings,{x:21,y:30},index);assert.equal(down.platform,tower);assert.ok(entryTiles(tower).some(e=>key(e)===key(down.ground)));
  assert.ok(down.route.every(t=>index.has(key(t))),'only over walls and the Tower');
  // The fort's Tower: walls touch it on its W and E sides at y = 20 – only the E one is on a face turned to the viewer.
  assert.deepEqual(upperDoors(tower,s.buildings),[{side:'E',column:1}]);
  const shape=doorShape(tower,{side:'E',column:1});assert.ok(shape.top.y<Math.min(shape.bl.y,shape.br.y)-20,'drawn up at the wall-walk height');
});

test('owner 17 Nov 2026: a post has a ring up on the wall or the Tower platform, where the soldier will stand',async()=>{
  const { tileCenter }=await import('../src/game/isometric.js');
  const s=scene(),barracks=building(s,'barracks',24,24),{tower,walls}=fort(s,0),a=soldier(s,barracks,{x:22,y:23}),b=soldier(s,barracks,{x:23,y:23});
  const wall=walls.find(w=>w.x===21&&w.y===30);s.military.wallPatrol.post([a],wall);s.military.wallPatrol.post([b],tower);
  const p=s.military.wallPatrol.postPoint(a),ground=tileCenter({x:21,y:30});assert.ok(Math.abs(p.x-ground.x)<1e-6&&p.y<ground.y-40,'above the wall tile, at the wall-walk height');
  const q=s.military.wallPatrol.postPoint(b);assert.ok(q.y<tileCenter({x:26,y:20}).y-120,'up on the Tower platform');
  follow(s,[a,b],()=>a.wallPatrol?.phase==='post'&&b.wallPatrol?.phase==='post');
  for(const w of [a,b]){const ring=s.military.wallPatrol.postPoint(w);s.military.wallPatrol.place(w);assert.ok(Math.hypot(w.view.x-ring.x,w.view.y-ring.y)<1,'he stands on his ring');}
  assert.equal(s.military.wallPatrol.postPoint(soldier(s,barracks,{x:22,y:25})),null);
});

test('owner 17 Nov 2026: an archer on the wall shoots an enemy outside (range +2, over the walls) and keeps his post; no rest at home',()=>{
  const s=scene(),barracks=building(s,'barracks',24,24),{walls}=fort(s,0),w=soldier(s,barracks,{x:22,y:23});
  assert.equal(s.military.enlist?.(w,'archer')??true,true);
  s.military.wallPatrol.post([w],walls.find(b=>b.x===25&&b.y===30));follow(s,[w],()=>w.wallPatrol?.phase==='post');assert.ok(w.onWall);
  assert.equal(w.attackRange,6);
  const foe=s.animalSystem.create(s.objectRegistry.require('raider'),{x:25,y:37});const hp=foe.currentHP;
  for(let ms=0;ms<20000&&foe.isAlive;ms+=50)s.tick(50);
  assert.ok(foe.currentHP<hp,'shot at 7 tiles from the wall');assert.ok(w.onWall,'still up there');assert.deepEqual(w.tile,{x:25,y:30});
  assert.equal(s.workerSystem.rest?.eligible?.(w)??false,false,'no rest at home while on a wall order');
});

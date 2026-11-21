import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { workerScene } = await import('./helpers/workerScene.js');
const { spawnSandboxUnits } = await import('../src/game/sandboxMode.js');
const { BATTLE_ORDERS,STANCES,TERRAIN_COMBAT,DEFENSE_MOVES } = await import('../src/data/military.js');
const { serializeGameState,validateGameState } = await import('../src/systems/GameStateSerializer.js');

// Owner 20 Nov 2026 (defence list, point 5): battle orders and terrain.
const scene=()=>workerScene(undefined,{foodProduction:true});
const units=(s,id,at,n)=>{const before=new Set([...s.workerSystem.workers.keys(),...s.animalSystem.animals.keys()]);spawnSandboxUnits(s,id,at,n);return [...s.workerSystem.workers.values(),...s.animalSystem.animals.values()].filter(u=>!before.has(u.id));};

test('Shield wall: arrows and blows do less to them, they strike back weaker; both orders stand like Hold',()=>{
  const s=scene(),[w]=units(s,'swordsman',{x:40,y:40},1),archer={attackRange:9,position:{x:45,y:40}},foe={attackRange:1,position:{x:41,y:40}};
  assert.ok(STANCES.shieldwall.hold&&STANCES.hedgehog.hold);
  w.stance='shieldwall';const m=s.military;
  assert.equal(m.orderFactor(archer,w),BATTLE_ORDERS.shieldwall.ranged);assert.ok(Math.abs(m.orderFactor(foe,w)-BATTLE_ORDERS.shieldwall.melee*(1-DEFENSE_MOVES.parry.chance))<1e-9,'the Swordsman also parries');assert.equal(m.orderFactor(w,foe),BATTLE_ORDERS.shieldwall.own);
  const data=validateGameState(serializeGameState(s));assert.equal(data.workers.find(x=>x.id===w.id).stance,'shieldwall','saved');
});

test('Hedgehog: riders do half to them and take double; a charge into it hurts the rider',()=>{
  const s=scene(),[h]=units(s,'halberdier',{x:40,y:40},1),[r]=units(s,'light_cavalry',{x:46,y:40},1);h.stance='hedgehog';const m=s.military;
  assert.equal(m.orderFactor(r,h),BATTLE_ORDERS.hedgehog.vsRider);assert.ok(Math.abs(m.orderFactor(h,r)-BATTLE_ORDERS.hedgehog.riderBonus*(1-DEFENSE_MOVES.dodge.chance))<1e-9,'the rider still dodges a little');
  r.chargeFrom={x:30,y:40};const hp=r.currentHP,hh=h.currentHP;assert.equal(m.charge(r,h),0);assert.ok(r.currentHP<hp,'the rider is hurt');assert.equal(h.currentHP,hh);
});

test('terrain: an archer above his target shoots harder; trees around the target soak up arrows',()=>{
  const s=scene(),m=s.military,W=80,tiles=new Float32Array(W*W);tiles[40*W+40]=3;s.relief={width:W,height:W,tiles};
  const archer={attackRange:9,position:{x:40.5,y:40.5}},target={position:{x:45.5,y:40.5}};
  assert.equal(m.terrainFactor(archer,target),TERRAIN_COMBAT.highDamage);assert.equal(m.terrainFactor({attackRange:1,position:archer.position},target),1,'only shots');
  m.underTrees=()=>true;assert.ok(Math.abs(m.terrainFactor(archer,target)-TERRAIN_COMBAT.highDamage*TERRAIN_COMBAT.forestCover)<1e-9);
});

test('point 7: Knights and Swordsmen parry, light troops dodge part of the melee blows (not arrows)',async()=>{
  const { DEFENSE_MOVES }=await import('../src/data/military.js');
  const s=scene(),[k]=units(s,'knight',{x:40,y:40},1),[a]=units(s,'archer',{x:42,y:40},1),[e]=units(s,'enemy_knight',{x:50,y:40},1),[r]=units(s,'soldier',{x:44,y:40},1);
  const melee={attackRange:1,position:{x:41,y:40}},shot={attackRange:9,position:{x:48,y:40}},m=s.military;
  assert.equal(m.orderFactor(melee,k),1-DEFENSE_MOVES.parry.chance);assert.equal(m.orderFactor(melee,e),1-DEFENSE_MOVES.parry.chance,'the enemy Knight too');
  assert.equal(m.orderFactor(melee,a),1-DEFENSE_MOVES.dodge.chance);assert.equal(m.orderFactor(shot,k),1,'arrows are not parried');assert.equal(m.orderFactor(melee,r),1,'a plain Soldier neither');
});

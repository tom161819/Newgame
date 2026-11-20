import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { workerScene } = await import('./helpers/workerScene.js');
const { spawnSandboxUnits } = await import('../src/game/sandboxMode.js');
const { BATTLE_ORDERS,STANCES,TERRAIN_COMBAT } = await import('../src/data/military.js');
const { serializeGameState,validateGameState } = await import('../src/systems/GameStateSerializer.js');

// Owner 20 Nov 2026 (defence list, point 5): battle orders and terrain.
const scene=()=>workerScene(undefined,{foodProduction:true});
const units=(s,id,at,n)=>{const before=new Set([...s.workerSystem.workers.keys(),...s.animalSystem.animals.keys()]);spawnSandboxUnits(s,id,at,n);return [...s.workerSystem.workers.values(),...s.animalSystem.animals.values()].filter(u=>!before.has(u.id));};

test('Shield wall: arrows and blows do less to them, they strike back weaker; both orders stand like Hold',()=>{
  const s=scene(),[w]=units(s,'swordsman',{x:40,y:40},1),archer={attackRange:9,position:{x:45,y:40}},foe={attackRange:1,position:{x:41,y:40}};
  assert.ok(STANCES.shieldwall.hold&&STANCES.hedgehog.hold);
  w.stance='shieldwall';const m=s.military;
  assert.equal(m.orderFactor(archer,w),BATTLE_ORDERS.shieldwall.ranged);assert.equal(m.orderFactor(foe,w),BATTLE_ORDERS.shieldwall.melee);assert.equal(m.orderFactor(w,foe),BATTLE_ORDERS.shieldwall.own);
  const data=validateGameState(serializeGameState(s));assert.equal(data.workers.find(x=>x.id===w.id).stance,'shieldwall','saved');
});

test('Hedgehog: riders do half to them and take double; a charge into it hurts the rider',()=>{
  const s=scene(),[h]=units(s,'halberdier',{x:40,y:40},1),[r]=units(s,'light_cavalry',{x:46,y:40},1);h.stance='hedgehog';const m=s.military;
  assert.equal(m.orderFactor(r,h),BATTLE_ORDERS.hedgehog.vsRider);assert.equal(m.orderFactor(h,r),BATTLE_ORDERS.hedgehog.riderBonus);
  r.chargeFrom={x:30,y:40};const hp=r.currentHP,hh=h.currentHP;assert.equal(m.charge(r,h),0);assert.ok(r.currentHP<hp,'the rider is hurt');assert.equal(h.currentHP,hh);
});

test('terrain: an archer above his target shoots harder; trees around the target soak up arrows',()=>{
  const s=scene(),m=s.military,W=80,tiles=new Float32Array(W*W);tiles[40*W+40]=3;s.relief={width:W,height:W,tiles};
  const archer={attackRange:9,position:{x:40.5,y:40.5}},target={position:{x:45.5,y:40.5}};
  assert.equal(m.terrainFactor(archer,target),TERRAIN_COMBAT.highDamage);assert.equal(m.terrainFactor({attackRange:1,position:archer.position},target),1,'only shots');
  m.underTrees=()=>true;assert.ok(Math.abs(m.terrainFactor(archer,target)-TERRAIN_COMBAT.highDamage*TERRAIN_COMBAT.forestCover)<1e-9);
});

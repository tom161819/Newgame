import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { workerScene } = await import('./helpers/workerScene.js');
const { FortDefenses } = await import('../src/systems/FortDefenses.js');
const { BOILING_PITCH,BALLISTA } = await import('../src/data/military.js');
const { serializeGameState,validateGameState } = await import('../src/systems/GameStateSerializer.js');

// Owner 20 Nov 2026 (defence list, point 4): boiling pitch and the Tower's ballista.
const setup=()=>{const s=workerScene(undefined,{foodProduction:true});s.fort=new FortDefenses(s);
  const d=s.objectRegistry.require('tower'),tower={id:901,type:'tower',definition:d,x:60,y:50,tiles:[{x:60,y:50},{x:61,y:50},{x:60,y:51},{x:61,y:51}],construction:{state:'complete'}};s.buildings.push(tower);for(const t of tower.tiles)s.map[t.y][t.x]=1;
  const guard=s.workerSystem.create({x:62,y:52});guard.onWall=tower;return {s,tower,guard};};

test('one of ours up on a Tower pours boiling pitch on the enemies at its foot, for one Pitch, then must wait',()=>{
  const {s}=setup(),foe=s.animalSystem.create(s.objectRegistry.require('enemy_knight'),{x:62,y:50}),far=s.animalSystem.create(s.objectRegistry.require('enemy_soldier'),{x:66,y:50});
  s.inventory.add('pitch',2);const hp=foe.currentHP,hp2=far.currentHP;s.fort.update(50);
  assert.equal(hp-foe.currentHP,BOILING_PITCH.damage,'the full pot, armour does not help');assert.equal(far.currentHP,hp2,'only at the foot of the Tower');assert.equal(s.inventory.count('pitch'),1);
  s.fort.update(50);assert.equal(hp-foe.currentHP,BOILING_PITCH.damage,'reloading');
});

test('no pitch, or nobody up on the Tower: no pot',()=>{
  const {s,guard}=setup(),foe=s.animalSystem.create(s.objectRegistry.require('enemy_soldier'),{x:62,y:50}),hp=foe.currentHP;s.fort.update(50);assert.equal(foe.currentHP,hp,'no Pitch');
  s.inventory.add('pitch',1);guard.onWall=null;s.fort.update(50);assert.equal(foe.currentHP,hp,'nobody on the Tower');
});

test('a Tower with a ballista shoots the enemy ram first, up to its range; the ballista is saved',()=>{
  const {s,tower}=setup();assert.ok(s.fort.mount(tower).error,'not without Wood and Iron');
  for(const [id,n] of Object.entries(BALLISTA.cost))s.inventory.add(id,n);assert.ok(s.fort.mount(tower).ok);assert.equal(tower.ballista,true);
  const soldier=s.animalSystem.create(s.objectRegistry.require('enemy_soldier'),{x:64,y:50}),ram=s.animalSystem.create(s.objectRegistry.require('enemy_ram'),{x:70,y:50}),beyond=s.animalSystem.create(s.objectRegistry.require('enemy_ram'),{x:60+BALLISTA.range+3,y:50});
  const r=ram.currentHP;s.fort.update(50);assert.ok(ram.currentHP<r,'the ram first');assert.equal(beyond.currentHP,beyond.maxHP,'out of range');
  assert.equal((serializeGameState(s).world??serializeGameState(s)).buildings.find(b=>b.id===tower.id)?.ballista,true);
});

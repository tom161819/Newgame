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

// Point 6.
test('a Gate with a portcullis takes half the enemy blows; a Crossbowman standing still is behind his pavise',async()=>{
  const { EnemyArmy }=await import('../src/systems/EnemyArmy.js');const { PORTCULLIS,PAVISE }=await import('../src/data/military.js');const { buildingHP }=await import('../src/game/buildingHealth.js');
  const { spawnSandboxUnits }=await import('../src/game/sandboxMode.js');
  const s=workerScene(undefined,{foodProduction:true});s.enemyArmy=new EnemyArmy(s);s.fort=new FortDefenses(s);
  const d=s.objectRegistry.require('gate'),mk=(id,x)=>{const g={id,type:'gate',definition:d,x,y:50,tiles:[{x,y:50},{x:x+1,y:50},{x,y:51},{x:x+1,y:51}],construction:{state:'complete'}};s.buildings.push(g);return g;};
  const plain=mk(910,60),iron=mk(911,70);assert.ok(s.fort.portcullis(iron).error,'not without iron');s.sandbox=true;assert.ok(s.fort.portcullis(iron).ok);
  const foe=s.animalSystem.create(s.objectRegistry.require('enemy_knight'),{x:62,y:50});
  const before=[buildingHP(plain).hp,buildingHP(iron).hp];s.enemyArmy.hit(foe,plain,1000);s.enemyArmy.hit(foe,iron,1000);
  const lost=[before[0]-buildingHP(plain).hp,before[1]-buildingHP(iron).hp];assert.ok(Math.abs(lost[1]/lost[0]-PORTCULLIS.damage)<1e-9);
  spawnSandboxUnits(s,'crossbowman',{x:40,y:40},1);const cb=s.workerSystem.liveWorkers().find(w=>s.military.unit(w)?.type==='crossbowman');cb.path=[];cb.nextTile=null;
  assert.equal(s.military.orderFactor({attackRange:9},cb),PAVISE.ranged);cb.path=[{x:41,y:40}];assert.equal(s.military.orderFactor({attackRange:9},cb),1,'not while walking');
});

test('beside a docked enemy siege tower his soldiers cross our wall at once',async()=>{
  const { EnemyArmy }=await import('../src/systems/EnemyArmy.js');const { SIEGE_TOWER }=await import('../src/data/military.js');
  const s=workerScene(undefined,{foodProduction:true});s.enemyArmy=new EnemyArmy(s);
  const d=s.objectRegistry.require('wall'),w={id:920,type:'wall',definition:d,x:60,y:50,tiles:[{x:60,y:50}],construction:{state:'complete'}};s.buildings.push(w);s.map[50][60]=1;
  const tower=s.animalSystem.create(s.objectRegistry.require('enemy_siege_tower'),{x:61,y:51});s.enemyArmy.hit(tower,w,100);assert.equal(tower.docked,w.id);
  const foe=s.animalSystem.create(s.objectRegistry.require('enemy_soldier'),{x:60,y:51}),guard=s.workerSystem.create({x:61,y:50});guard.onWall=w;guard.position={x:60.5,y:50.5};
  for(let t=0;t<SIEGE_TOWER.climb+100;t+=100)s.enemyArmy.hit(foe,w,100);assert.deepEqual(foe.tile,{x:60,y:49},'over, and nobody threw him down');
});

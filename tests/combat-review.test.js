import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { freeAround,awayFrom,isHostile } = await import('../src/game/combatSpacing.js');
const { STANCES,MILITARY_RULES } = await import('../src/data/military.js');
const { setSquad,squadMembers } = await import('../src/ui/armySquads.js');

const grid=()=>Array.from({length:20},()=>Array(20).fill(0));
test('combat 16 Nov 2026: melee fighters spread around a target',()=>{
  const map=grid(),target={tile:{x:10,y:10},position:{x:10.5,y:10.5}},other={isAlive:true,tile:{x:11,y:10},path:[]};
  const scene={map,workerSystem:{liveWorkers:()=>[other]},animalSystem:{animals:new Map()},character:null};
  const free=freeAround(scene,target,null);assert.ok(free.length>0);assert.ok(!free.some(t=>t.x===11&&t.y===10),'a taken tile is left out');
  const away=awayFrom({map},{x:10,y:10},{x:12,y:10},5);assert.ok(away.length&&away.every(t=>t.x<10),'steps away from the danger');
  assert.ok(isHostile({type:'wolf'})&&isHostile({definition:{gameplay:{hostile:true}}})&&!isHostile({type:'horse',definition:{gameplay:{}}}));
});
test('combat 16 Nov 2026: stances and retreat rules',()=>{
  assert.deepEqual(Object.keys(STANCES),['aggressive','defensive','hold','shieldwall','hedgehog']);
  assert.ok(STANCES.hold.hold&&!STANCES.hold.retreat&&STANCES.defensive.engage<STANCES.aggressive.engage);
  assert.ok(MILITARY_RULES.retreatBelow<MILITARY_RULES.retreatUntil);
});
test('combat 16 Nov 2026: number-key groups (one soldier is enough; others leave the group)',()=>{
  const w=(id,p='soldier')=>({id,isAlive:true,profession:p});const a=w('a'),b=w('b'),c=w('c'),cook=w('d','cook');
  const scene={workerSystem:{liveSubjects:()=>[a,b,c,cook]}};
  assert.equal(setSquad(scene,[a,b],3),2);assert.deepEqual(squadMembers(scene,3).map(x=>x.id),['a','b']);
  assert.equal(setSquad(scene,[c,cook],3),1);assert.deepEqual(squadMembers(scene,3).map(x=>x.id),['c']);assert.equal(a.squad,undefined);
  assert.equal(setSquad(scene,[a],0),0);
});
test('war 16 Nov 2026: an attack order spreads the soldiers over the whole enemy group',async()=>{
  const { MilitarySystem } = await import('../src/systems/MilitarySystem.js');
  const foe=(id,x,y)=>({id,isAlive:true,active:true,type:'raider',definition:{gameplay:{hostile:true}},position:{x,y}});
  const foes=[foe('a',10,10),foe('b',12,10),foe('c',14,10),foe('far',60,60)];
  const scene={animalSystem:{animals:new Map(foes.map(f=>[f.id,f]))},combat:{attacks:new Map()}};
  const m=Object.create(MilitarySystem.prototype);m.scene=scene;
  assert.deepEqual(m.enemyGroup(foes[0]).map(f=>f.id).sort(),['a','b','c'],'linked enemies, not the far one');
  const soldiers=Array.from({length:9},(_,i)=>({id:`s${i}`,attackRange:1,position:{x:5+i,y:14}}));
  assert.equal(m.orderAttack(soldiers,foes[0]),3);
  const per=new Map();for(const w of soldiers)per.set(w.huntWolfId,(per.get(w.huntWolfId)??0)+1);
  assert.equal(per.size,3,'every enemy of the group gets fighters');assert.ok([...per.values()].every(n=>n<=3),'at most three melee fighters each');
  assert.ok(soldiers.every(w=>w.attackArea&&w.attackRadius>=12));
});
test('owner 16 Nov 2026: a unit on an order passes through our walking people; standing ones still block',async()=>{
  const { WorkerSystem } = await import('../src/systems/WorkerSystem.js');
  const map=Array.from({length:6},()=>Array(6).fill(0));
  const unit=(id,tile,extra={})=>({id,isAlive:true,tile,path:[],nextTile:null,reservedTiles(){return [this.tile];},...extra});
  const walker=unit('w',{x:2,y:2},{path:[{x:3,y:2}]}),stander=unit('s',{x:4,y:4}),holder=unit('h',{x:1,y:1},{commandState:{state:'Holding'}}),me=unit('me',{x:0,y:0},{commandState:{state:'MovingToHold'}}),worker=unit('k',{x:5,y:5});
  const ws=Object.create(WorkerSystem.prototype);ws.workers=new Map([walker,stander,holder,me,worker].map(u=>[u.id,u]));
  ws.scene={map,workplaceSystem:{},character:{isAlive:false},animalSystem:{animals:new Map()},stables:null,combat:{attacks:new Map()}};ws.liveWorkers=()=>[...ws.workers.values()];
  const ordered=ws.navigationMap(me);assert.equal(ordered[2][2],0,'walking resident does not block');assert.equal(ordered[1][1],0,'a resident holding a spot does not block');assert.equal(ordered[4][4],1,'a standing resident blocks');
  const plain=ws.navigationMap(worker);assert.equal(plain[2][2],1,'without an order everyone blocks as before');
});
test('owner 16 Nov 2026: a group marches in lanes beside each other, not in one file',async()=>{
  const { UnitCommands } = await import('../src/systems/UnitCommands.js');
  const nav=Array.from({length:30},()=>Array(30).fill(0)),lead=Array.from({length:20},(_,i)=>({x:5+i,y:10}));
  const c=Object.create(UnitCommands.prototype);
  const left=c.laneRoute(nav,{x:4,y:8},lead,{x:0,y:-2},{x:24,y:8}),right=c.laneRoute(nav,{x:4,y:12},lead,{x:0,y:2},{x:24,y:12});
  assert.ok(left&&right);const mean=r=>r.path.reduce((n,p)=>n+p.y,0)/r.path.length;
  assert.ok(mean(right)-mean(left)>=4,'the lanes stay apart');assert.deepEqual(left.path.at(-1),{x:24,y:8});
  const walled=nav.map(r=>[...r]);for(let y=0;y<30;y++)walled[y][15]=1;assert.equal(c.laneRoute(walled,{x:4,y:8},lead,{x:0,y:-2},{x:24,y:8}),null,'no way: the plain route is used');
});

import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { workerScene } = await import('./helpers/workerScene.js');
const { spawnSandboxUnits } = await import('../src/game/sandboxMode.js');
const { CombatSystem } = await import('../src/systems/CombatSystem.js');
const { MoraleSystem,flankFactor } = await import('../src/systems/MoraleSystem.js');
const { FLANK,MORALE } = await import('../src/data/military.js');

// Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok" – flank attacks and morale.
const unit=(id,x,y,o={})=>({id,isAlive:true,currentHP:100,maxHP:100,attackDPS:10,attackRange:1,armor:0,position:{x,y},tile:{x,y},...o});

test('a blow into the side or the back of a fighter lands harder; face to face it does not',()=>{
  const facing={x:1,y:0};
  assert.equal(flankFactor(unit('a',11,10),unit('t',10,10),facing),1,'from the front');
  assert.equal(flankFactor(unit('a',10,11),unit('t',10,10),facing),FLANK.side,'from the side');
  assert.equal(flankFactor(unit('a',9,10),unit('t',10,10),facing),FLANK.rear,'from behind');
  assert.equal(flankFactor(unit('a',9,10),unit('t',10,10),null),1,'standing still he can turn');
  const combat=new CombatSystem(),front=unit('f',11,10),target=unit('t',10,10,{attackDPS:.001}),back=unit('b',9,10);
  combat.startAttack(target,front);combat.startAttack(front,target);combat.startAttack(back,target);
  const taken=new Map();combat.on('damage',(t,amount,a)=>{if(t===target)taken.set(a.id,(taken.get(a.id)??0)+amount);});combat.update(1000);
  assert.ok(Math.abs(taken.get('b')/taken.get('f')-FLANK.rear)<1e-9,'the man behind him does half as much again');
});

const scene=()=>{const s=workerScene(undefined,{foodProduction:true,workplaces:true});s.character.away=true;s.morale=new MoraleSystem(s);const tick=s.tick;s.tick=d=>{tick(d);s.morale.update(d);};return s;};
const units=(s,id,at,n)=>{const before=new Set([...s.workerSystem.workers.keys(),...s.animalSystem.animals.keys()]);spawnSandboxUnits(s,id,at,n);return [...s.workerSystem.workers.values(),...s.animalSystem.animals.values()].filter(u=>!before.has(u.id));};

test('a lone soldier facing many loses heart and falls back; out of the fight he rallies',()=>{
  const s=scene(),[w]=units(s,'knight',{x:40,y:50},1);w.morale=60;units(s,'enemy_soldier',{x:43,y:50},5);
  let routed=false;for(let t=0;t<30000&&w.isAlive&&!routed;t+=50){s.tick(50);routed=!!w.routed;}
  assert.ok(routed,`he fled (morale ${w.morale?.toFixed(1)})`);assert.ok(w.retreating,'he falls back like a wounded man');
  w.morale=MORALE.rally+5;s.morale.update(50);assert.equal(w.routed,false,'he rallies at the rally mark');
});

test('a comrade falling costs morale, halved beside a Knight; a routed enemy runs from us',()=>{
  const s=scene(),[a,b]=units(s,'enemy_soldier',{x:40,y:50},2);s.combat.handleDeath(b,null);
  assert.equal(a.morale,MORALE.max-MORALE.death);
  const [k]=units(s,'enemy_knight',{x:41,y:51},1),[c]=units(s,'enemy_soldier',{x:40,y:52},1);c.morale=MORALE.max;s.combat.handleDeath(k,null);
  const [d]=units(s,'enemy_knight',{x:39,y:52},1);c.morale=MORALE.max;const [e]=units(s,'enemy_soldier',{x:40,y:53},1);s.combat.handleDeath(e,null);
  assert.equal(c.morale,MORALE.max-MORALE.death*MORALE.leaderFactor,'the Knight beside him halves it');
  const [w]=units(s,'swordsman',{x:44,y:50},1),start=Math.hypot(a.position.x-w.position.x,a.position.y-w.position.y);a.morale=MORALE.rout-1;s.morale.lose(a,1);assert.ok(a.routed);
  w.stance='hold';for(let t=0;t<4000;t+=50)s.tick(50);
  assert.ok(Math.hypot(a.position.x-w.position.x,a.position.y-w.position.y)>start+2,'he ran away from our soldier');
});

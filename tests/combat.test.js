import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatSystem,createCombatStats,inAttackRange,clampArmor } from '../src/systems/CombatSystem.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

const unit=(type,x=0,y=0)=>({id:type,type,definition:objectRegistry.require(type),...createCombatStats(objectRegistry.require(type)),
  tile:{x,y},position:{x:x+.5,y:y+.5}});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('all living types have central stats and independent instance HP',()=>{
  for(const [type,hp,dps]of [['king',100,15],['rabbit',15,1],['deer',40,4],['wild_boar',70,12],['horse',90,0]]){
    const a=unit(type),b=unit(type);assert.equal(a.maxHP,hp);assert.equal(a.currentHP,hp);assert.equal(a.attackDPS,dps);
    assert.equal(a.armor,0);assert.equal(a.attackRange,1);assert.equal(a.isAlive,true);
    a.currentHP=1;assert.equal(b.currentHP,hp);assert.equal(objectRegistry.require(type).stats.maxHP,hp);
    assert.throws(()=>{a.baseStats.attackDPS=900;},TypeError);
  }
});

test('kill times and retaliation damage are independent of FPS and of long update intervals',()=>{
  for(const [type,hp,dps]of [['rabbit',15,1],['deer',40,4],['wild_boar',70,12]])for(const fps of [20,30,60,144,0]){
    const king=unit('king'),animal=unit(type,1,0),combat=new CombatSystem();let deaths=0;
    combat.on('death',()=>deaths++);combat.startAttack(king,animal);combat.startAttack(animal,king);
    let elapsed=0;const delta=fps?1000/fps:10000;
    while(animal.isAlive&&elapsed<10000){combat.update(delta);elapsed+=delta;}
    assert.equal(animal.isAlive,false);assert.equal(animal.currentHP,0);assert.equal(deaths,1);
    close(king.currentHP,100-dps*hp/15);
    if(fps){assert.ok(elapsed/1000>=hp/15-1e-8);assert.ok(elapsed/1000<hp/15+1/fps+1e-8);}
    combat.update(10000);close(king.currentHP,100-dps*hp/15);
  }
});

test('armor applies exactly once and clamps runtime values to effective 0–90 percent',()=>{
  for(const [armor,damage]of [[0,12],[30,8.4],[90,1.2],[999,1.2],[-20,12]]){
    const king=unit('king'),boar=unit('wild_boar',1,0),combat=new CombatSystem();king.armor=armor;
    combat.startAttack(boar,king);combat.update(1000);close(king.currentHP,100-damage);
  }
  const king=unit('king'),combat=new CombatSystem();king.armor=30;close(combat.applyDamage(king,50),35);close(king.currentHP,65);
  assert.equal(clampArmor(Infinity),0);
});

test('HP never falls below zero, death emits once and every attack on the dead target stops',()=>{
  const king=unit('king'),rabbit=unit('rabbit',1,0),boar=unit('wild_boar',0,1),combat=new CombatSystem();let deaths=0;
  combat.on('death',()=>deaths++);combat.startAttack(king,rabbit);combat.startAttack(boar,rabbit);
  combat.applyDamage(rabbit,500);combat.applyDamage(rabbit,500);combat.handleDeath(rabbit);combat.update(1000);
  assert.equal(rabbit.currentHP,0);assert.equal(deaths,1);assert.equal(combat.attacks.size,0);assert.equal(king.attackTarget,null);assert.equal(boar.attackTarget,null);
  assert.equal(combat.startAttack(king,rabbit),false);assert.equal(combat.applyDamage(rabbit,-5),0);
});

test('range uses logical positions, includes diagonals and prevents attacks through blocked corners',()=>{
  const map=Array.from({length:5},()=>Array(5).fill(0)),king=unit('king',1,1),rabbit=unit('rabbit',2,2);
  assert.equal(inAttackRange(king,rabbit,map),true);map[1][2]=1;assert.equal(inAttackRange(king,rabbit,map),false);
  const combat=new CombatSystem({map});combat.startAttack(king,rabbit);combat.update(1000);assert.equal(rabbit.currentHP,15);
  map[1][2]=0;rabbit.position={x:4.5,y:4.5};combat.update(1000);assert.equal(rabbit.currentHP,15);
  rabbit.position={x:2.5,y:1.5};combat.update(500);close(rabbit.currentHP,7.5);
});

test('stopping and retargeting preserve a single target and do not deal damage after cancellation',()=>{
  const king=unit('king'),a=unit('deer',1,0),b=unit('wild_boar',0,1),combat=new CombatSystem();
  combat.startAttack(king,a);combat.startAttack(king,b);assert.equal(combat.attacks.size,1);combat.update(1000);
  assert.equal(a.currentHP,40);assert.equal(b.currentHP,55);combat.stopAttack(king);combat.update(1000);assert.equal(b.currentHP,55);
  assert.equal(combat.startAttack(king,king),false);assert.equal(combat.startAttack(unit('horse'),king),false);
});

test('simultaneous lethal attacks kill both units regardless of iteration order',()=>{
  for(const reverse of [false,true]){
    const king=unit('king'),rabbit=unit('rabbit',1,0),combat=new CombatSystem();king.currentHP=1;const deaths=[];
    combat.on('death',u=>deaths.push(u.type));
    if(reverse){combat.startAttack(rabbit,king);combat.startAttack(king,rabbit);}else{combat.startAttack(king,rabbit);combat.startAttack(rabbit,king);}
    combat.update(5000);assert.equal(king.currentHP,0);assert.equal(rabbit.currentHP,0);assert.deepEqual(deaths.sort(),['king','rabbit']);
  }
});

test('availability prevents attacks from a roof or by a mounted hidden horse',()=>{
  const king=unit('king'),rabbit=unit('rabbit',1,0);king.state='onWall';
  const combat=new CombatSystem({canFight:u=>!u.mounted&&(u!==king||u.state==='ground')});
  assert.equal(combat.startAttack(king,rabbit),false);king.state='ground';assert.equal(combat.startAttack(king,rabbit),true);
  king.state='onTower';combat.update(1000);assert.equal(rabbit.currentHP,15);
  king.state='ground';combat.update(500);assert.equal(rabbit.currentHP,7.5);
});

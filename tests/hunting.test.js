import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { Inventory } from '../src/game/inventory.js';
import { FoodSystem } from '../src/systems/FoodSystem.js';
import { DropSystem } from '../src/systems/DropSystem.js';
import { AnimalSystem } from '../src/systems/AnimalSystem.js';
import { HuntingSystem } from '../src/systems/HuntingSystem.js';
import { AnimalController } from '../src/game/AnimalController.js';
import { PlayerController } from '../src/game/PlayerController.js';
import { tileCenter } from '../src/game/map.js';
import { tileKey } from '../src/game/stones.js';
import { canStep } from '../src/game/pathfinding.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';

function view(position={x:0,y:0}){
  return {...position,visible:true,data:new Map(),setData(k,v){this.data.set(k,v);return this;},getData(k){return this.data.get(k);},
    setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(n){this.depth=n;return this;},
    setVisible(v){this.visible=v;return this;},animate(){},destroy(){this.destroyed=true;}};
}
function scene(){
  const s={map:Array.from({length:20},()=>Array(20).fill(0)),objectRegistry,inventory:new Inventory(),resources:new Map(),resourceOccupancy:new Map(),
    marker:{visible:false,setVisible(v){this.visible=v;}},showMarker(){this.marker.visible=true;},setStatus(){},updateInventory(){},updateBuildingUI(){},
    assets:{createView(id,p){return view(p);}},tweens:{add(){}},
  };
  s.character=new PlayerController(s,view(tileCenter({x:1,y:1})),{x:1,y:1});
  s.animalSystem=new AnimalSystem(s,()=>.7);s.dropSystem=new DropSystem(s);s.huntingSystem=new HuntingSystem(s);
  s.combat=new CombatSystem({map:s.map});
  s.combat.on('attack',(attacker,target)=>{if(s.animalSystem.animals.has(target.id))s.animalSystem.onAttacked(target,attacker);});
  s.combat.on('death',unit=>{
    if(unit===s.character){s.character.state='dead';return;}
    const tile={x:Math.floor(unit.position.x),y:Math.floor(unit.position.y)};
    s.animalSystem.remove(unit);s.dropSystem.create('meat',tile,unit.definition.gameplay.meatDrop);
    if(s.huntingSystem.target===unit)s.huntingSystem.cancel();
  });
  return s;
}

test('animal spawn creates three of each hunted species and one horse on free reachable tiles',()=>{
  const s=scene();s.map[5][5]=1;s.resourceOccupancy.set('7,7','7,7');s.animalSystem.spawn({x:1,y:1});
  const animals=[...s.animalSystem.animals.values()];assert.equal(animals.length,10);
  for(const id of ['rabbit','deer','wild_boar'])assert.equal(animals.filter(a=>a.type===id).length,3);
  assert.equal(animals.filter(a=>a.type==='horse').length,1);
  assert.equal(new Set(animals.map(a=>a.id)).size,10);assert.equal(new Set(animals.map(a=>tileKey(a.tile))).size,10);
  for(const animal of animals){assert.equal(s.map[animal.tile.y][animal.tile.x],0);assert.notEqual(tileKey(animal.tile),'1,1');assert.notEqual(tileKey(animal.tile),'7,7');}
});

test('animals use diagonal navigation, normalized speed and stop before a newly blocked route',()=>{
  const s=scene(),definition=objectRegistry.require('deer'),a=new AnimalController(s,definition,'test',{x:4,y:4},view());
  assert.equal(a.moveTo([{x:7,y:7}]),true);a.update(200);
  assert.ok(Math.abs(Math.hypot(a.position.x-4.5,a.position.y-4.5)-a.speed*.2)<1e-9);
  assert.ok(Math.abs(a.position.x-a.position.y)<1e-9);
  s.map[7][7]=1;a.update(5000);assert.deepEqual(a.tile,{x:5,y:5});assert.equal(a.path.length,0);
  a.moveTo([{x:8,y:8}]);let previous=a.tile;
  for(const tile of a.path){assert.ok(canStep(s.map,previous,tile));previous=tile;}
});

test('hunting follows a moving target, kills only in reach and drops the right quantity without auto-pickup',()=>{
  for(const [type,quantity]of [['rabbit',5],['deer',10],['wild_boar',15]]){
    const s=scene(),definition=objectRegistry.require(type),a=new AnimalController(s,definition,'test',{x:8,y:8},view());
    s.animalSystem.animals.set(a.id,a);assert.equal(s.huntingSystem.attack(a),false);
    assert.equal(s.huntingSystem.command(a),true);a.moveTo([{x:12,y:9}]);
    for(let i=0;i<600&&a.active;i++){s.character.update(50);s.animalSystem.update(50);s.huntingSystem.update(50);s.combat.update(50);}
    assert.equal(a.active,false);assert.equal(s.animalSystem.animals.size,0);assert.equal(s.inventory.count('meat'),0);
    const drop=[...s.dropSystem.drops.values()][0];assert.equal(drop.amount,quantity);
    assert.deepEqual(drop.tile,{x:Math.floor(a.position.x),y:Math.floor(a.position.y)});
    assert.equal(s.dropSystem.collect(drop.id,{x:0,y:0}),false);
    s.character.command({kind:'drop',goal:drop.tile,dropId:drop.id});s.character.update(20000);
    assert.equal(s.inventory.count('meat'),quantity);assert.equal(s.dropSystem.drops.size,0);
  }
});

test('cancelling a hunt prevents a kill; unreachable animals never cause teleportation',()=>{
  const s=scene(),a=new AnimalController(s,objectRegistry.require('rabbit'),'test',{x:10,y:10},view());
  s.animalSystem.animals.set(a.id,a);s.huntingSystem.command(a);s.huntingSystem.cancel();s.character.update(20000);s.huntingSystem.update(20000);
  assert.equal(a.active,true);assert.equal(s.dropSystem.drops.size,0);
  for(let y=0;y<20;y++)s.map[y][5]=1;
  const before={...s.character.position};assert.equal(s.huntingSystem.command(a),false);
  assert.deepEqual(s.character.position,before);assert.equal(s.huntingSystem.target,null);
});

test('approach leaves a blocked diagonal corner and reaches an actually attackable neighbor',()=>{
  const s=scene(),a=new AnimalController(s,objectRegistry.require('rabbit'),'corner-target',{x:4,y:4},view());
  s.animalSystem.animals.set(a.id,a);s.map[3][4]=1;
  s.character.tile={x:3,y:3};s.character.position={x:3.5,y:3.5};s.character.nextTile=null;s.character.path=[];
  assert.equal(s.huntingSystem.attack(a),false);assert.equal(s.huntingSystem.command(a),true);
  assert.ok(s.character.path.length>0,'The current diagonal cell cannot be the final attack position.');
  s.character.update(1000);s.huntingSystem.update(1);s.combat.update(1000);
  assert.equal(a.isAlive,false);assert.equal(s.dropSystem.drops.size,1);
  assert.deepEqual(s.character.tile,{x:3,y:4});
});

test('generic drops merge by resource and tile and preserve other resource occupancy',()=>{
  const s=scene(),tile={x:4,y:4},stone=view();stone.setData('tile',tile).setData('object',{tiles:[tile]});
  s.resources.set('4,4',stone);s.resourceOccupancy.set('4,4','4,4');
  const first=s.dropSystem.create('meat',tile,5),second=s.dropSystem.create('meat',tile,15);
  assert.equal(first,second);assert.equal(first.amount,20);assert.equal(s.dropSystem.drops.size,1);
  s.character.state='onTower';assert.equal(s.dropSystem.collect(first.id,tile),false);
  s.character.state='ground';assert.equal(s.dropSystem.collect(first.id,tile),true);
  assert.equal(s.inventory.count('meat'),20);assert.equal(s.resourceOccupancy.get('4,4'),'4,4');
  assert.equal(s.dropSystem.collect(first.id,tile),false);assert.equal(s.inventory.count('meat'),20);
  const wood=s.dropSystem.create('stone',{x:6,y:6},3);assert.equal(wood.amount,3);assert.equal(s.resourceOccupancy.get('6,6'),wood.id);
  s.dropSystem.collect(wood.id,wood.tile);assert.equal(s.inventory.count('stone'),3);assert.equal(s.resourceOccupancy.has('6,6'),false);
});

test('the king eats twice per standard 120-second day, preserves partial meals, never overdraws food and is independent of FPS',()=>{
  const inventory=new Inventory();inventory.add('meat',4);let changes=0;
  const food=new FoodSystem(inventory,objectRegistry.require('meat'),()=>changes++);
  food.update(59999);assert.equal(inventory.count('meat'),4);assert.equal(food.remainingSeconds,1);
  food.update(1);assert.equal(inventory.count('meat'),3);assert.equal(changes,1);assert.equal(food.remainingSeconds,60);
  food.update(125000);assert.equal(inventory.count('meat'),1);assert.equal(food.remainingSeconds,55);
  food.update(600000);assert.equal(inventory.count('meat'),0);
  food.update(60000);assert.equal(inventory.count('meat'),0);
  const counts=[];
  for(const fps of [20,30,60,144]){
    const inv=new Inventory();inv.add('meat',10);const timer=new FoodSystem(inv,objectRegistry.require('meat'));
    // Integer millisecond slices avoid introducing floating-point rounding in the test clock.
    let elapsed=0;while(elapsed<180123){const delta=Math.min(1000/fps,180123-elapsed);timer.update(delta);elapsed+=delta;}
    counts.push(inv.count('meat'));
  }
  assert.deepEqual(counts,[7,7,7,7]);
});

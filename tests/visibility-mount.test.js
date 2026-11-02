import test from 'node:test';
import assert from 'node:assert/strict';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { MountSystem } from '../src/systems/MountSystem.js';
import { readSettings,saveSettings } from '../src/ui/SettingsPanel.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { AnimalController } from '../src/game/AnimalController.js';
import { AnimalSystem } from '../src/systems/AnimalSystem.js';
import { PlayerController } from '../src/game/PlayerController.js';
import { HuntingSystem } from '../src/systems/HuntingSystem.js';
import { tileCenter } from '../src/game/map.js';

const view=()=>({visible:true,data:new Map(),setData(k,v){this.data.set(k,v);return this;},getData(k){return this.data.get(k);},
  setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(d){this.depth=d;return this;},setVisible(v){this.visible=v;return this;},animate(){},setMounted(d){this.mounted=!!d;}});
function world(){
  const s={map:Array.from({length:20},()=>Array(20).fill(0)),objectRegistry,resourceOccupancy:new Map(),
    marker:{visible:false,setVisible(v){this.visible=v;}},showMarker(){this.marker.visible=true;},setStatus(){},updateBuildingUI(){}};
  s.player=view();Object.assign(s.player,tileCenter({x:5,y:5}));s.character=new PlayerController(s,s.player,{x:5,y:5});
  s.animalSystem=new AnimalSystem(s);s.huntingSystem=new HuntingSystem(s);s.mountSystem=new MountSystem(s);s.fog=new FogOfWarSystem(s.character,true);
  const horse=new AnimalController(s,objectRegistry.require('horse'),'horse-1',{x:6,y:5},view());s.animalSystem.animals.set(horse.id,horse);return {s,horse};
}

test('FoW is off by default, uses an exact square in logical coordinates and includes building footprints',()=>{
  const king={definition:objectRegistry.require('king'),position:{x:50.5,y:50.5},state:'ground'};
  const fog=new FogOfWarSystem(king);assert.equal(fog.enabled,false);assert.equal(fog.isVisibleTile({x:99,y:99}),true);
  fog.setEnabled(true);let count=0;
  for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(fog.isVisibleTile({x,y}))count++;
  assert.equal(count,400);assert.equal(fog.size,20);
  assert.equal(fog.isVisibleTile({x:40,y:40}),true);assert.equal(fog.isVisibleTile({x:60,y:50}),false);
  assert.equal(fog.isVisibleObject({x:39,y:50,definition:{width:2,height:2}}),true);
  assert.equal(fog.isVisibleObject({x:38,y:50,definition:{width:2,height:2}}),false);
  const signature=fog.signature;king.position={x:51.5,y:50.5};fog.update();assert.notEqual(fog.signature,signature);
  fog.setEnabled(false);assert.equal(fog.isVisibleObject({position:{x:1000,y:1000}}),true);
});

test('horse and tower vision modifiers are exclusive and require the actual mounted/roof state',()=>{
  const {s,horse}=world();assert.equal(s.fog.size,20);
  assert.equal(s.mountSystem.mount(horse),true);s.fog.update();assert.equal(s.fog.size,30);
  assert.equal(s.mountSystem.dismount(),true);s.fog.update();assert.equal(s.fog.size,20);
  const d=objectRegistry.require('tower');s.character.currentTower={x:10,y:10,definition:d};
  s.character.state='enteringTower';s.fog.update();assert.equal(s.fog.size,20);
  s.character.state='onTower';s.fog.update();assert.equal(s.fog.size,40);
  assert.equal(s.fog.left,Math.ceil(11-20-.5));
  s.character.state='exitingTower';s.fog.update();assert.equal(s.fog.size,20);
});

test('mount and dismount preserve a single horse instance, restore speed and allow repetition',()=>{
  const {s,horse}=world();
  for(let i=0;i<8;i++){
    assert.equal(s.mountSystem.command(horse),true);s.mountSystem.update(16);
    assert.equal(s.character.mountedHorse,horse);assert.equal(horse.mounted,true);assert.equal(horse.view.visible,false);
    assert.equal(s.character.speed,7);assert.equal(s.player.mounted,true);
    assert.equal(s.animalSystem.animals.size,1);
    assert.equal(s.mountSystem.dismount(),true);assert.equal(s.character.mountedHorse,null);
    assert.equal(s.character.speed,3.5);assert.equal(horse.mounted,false);assert.equal(horse.view.visible,true);
    assert.equal(s.player.mounted,false);assert.equal(s.animalSystem.animals.size,1);
    assert.notDeepEqual(horse.tile,s.character.tile);assert.equal(s.map[horse.tile.y][horse.tile.x],0);
  }
});

test('distant mounts, cancelled commands and blocked dismounts never teleport the king',()=>{
  const {s,horse}=world();horse.tile={x:15,y:15};horse.position={x:15.5,y:15.5};
  const before={...s.character.position};assert.equal(s.mountSystem.mount(horse),false);
  assert.equal(s.mountSystem.command(horse),true);s.mountSystem.cancel();s.character.update(10000);s.mountSystem.update(10000);
  assert.deepEqual(s.character.position,before);assert.equal(s.character.mountedHorse,undefined);
  horse.tile={x:6,y:5};horse.position={x:6.5,y:5.5};assert.equal(s.mountSystem.mount(horse),true);
  for(let y=4;y<=6;y++)for(let x=4;x<=6;x++)if(x!==5||y!==5)s.map[y][x]=1;
  assert.equal(s.mountSystem.dismount(),false);assert.equal(s.character.mountedHorse,horse);assert.deepEqual(s.character.position,before);
});

test('mounted movement remains normalized and horses cannot be hunted',()=>{
  const {s,horse}=world();assert.equal(s.huntingSystem.command(horse),false);assert.equal(s.huntingSystem.attack(horse),false);assert.equal(horse.active,true);
  s.mountSystem.mount(horse);s.character.command({kind:'move',goal:{x:8,y:8}});s.character.update(200);s.mountSystem.update(200);
  assert.ok(Math.abs(Math.hypot(s.character.position.x-5.5,s.character.position.y-5.5)-1.4)<1e-9);
  assert.ok(Math.abs(s.character.position.x-s.character.position.y)<1e-9);
  assert.deepEqual(horse.position,s.character.position);
});

test('settings persist the FoW toggle, retain other fields and tolerate unavailable or malformed storage',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  assert.deepEqual(readSettings(storage),{fogOfWar:false});
  storage.setItem('newgame.settings',JSON.stringify({futureSetting:42}));saveSettings(storage,{fogOfWar:true});
  assert.deepEqual(readSettings(storage),{fogOfWar:true});assert.equal(JSON.parse(storage.getItem('newgame.settings')).futureSetting,42);
  saveSettings(storage,{fogOfWar:false});assert.deepEqual(readSettings(storage),{fogOfWar:false});
  storage.setItem('newgame.settings','invalid');assert.deepEqual(readSettings(storage),{fogOfWar:false});
  assert.deepEqual(readSettings(undefined),{fogOfWar:false});assert.doesNotThrow(()=>saveSettings(undefined,{fogOfWar:true}));
});

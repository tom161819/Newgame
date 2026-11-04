import test from 'node:test';
import assert from 'node:assert/strict';
import { sortedPopulation,populationPreferences,readPopulationPreferences,writePopulationPreferences } from '../src/ui/populationData.js';
import { createProgress } from '../src/data/experience.js';
import { WorldCamera } from '../src/game/WorldCamera.js';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { tileCenter,worldToGrid } from '../src/game/isometric.js';

const actor=(id,name,level,xp=0,skillLevel=1,skillXP=0)=>({id,name,isAlive:true,isSubject:true,profession:'miner',experience:{...createProgress(),level,totalXP:xp},skills:{mining:{...createProgress(),level:skillLevel,currentXP:skillXP}}});

test('skill ordering uses actual skill level, its XP, overall level and finally name in both numeric directions',()=>{
  const rows=[actor('1','Zdenek',2,100,4,10),actor('2','Anna',5,700,4,10),actor('3','Bara',5,700,4,10),actor('4','Pavel',1,0,4,20),actor('5','Eva',1,0,6,0)],before=structuredClone(rows);
  assert.deepEqual(sortedPopulation(rows,{sortBy:'skill:mining'}).map(w=>w.name),['Eva','Pavel','Anna','Bara','Zdenek']);
  assert.deepEqual(sortedPopulation(rows,{sortBy:'skill:mining',direction:'asc'}).map(w=>w.name),['Zdenek','Anna','Bara','Pavel','Eva']);
  assert.deepEqual(rows,before);
});
test('search, profession filtering and overall sorting combine without including visitors or dead residents',()=>{
  const rows=[actor('1','Matěj',2,100),actor('2','MATĚJ mladší',5,800),actor('3','Anna',8,1800),actor('4','Matěj návštěvník',9,2000),actor('5','Matěj zemřelý',10,3000)];
  rows[0].profession='builder';rows[3].isSubject=false;rows[4].isAlive=false;
  assert.deepEqual(sortedPopulation(rows,{sortBy:'xp',profession:'miner'},'matej').map(w=>w.id),['2']);
  assert.deepEqual(sortedPopulation(rows,{sortBy:'level'},' MATEJ ').map(w=>w.id),['2','1']);
  assert.deepEqual(sortedPopulation(rows,{sortBy:'name',direction:'asc'}).map(w=>w.id),['3','1','2']);
  assert.deepEqual(sortedPopulation(rows,{sortBy:'level'},'missing name'),[]);
});
test('only valid population interface preferences persist, independently of all game resources or resident data',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  assert.deepEqual(readPopulationPreferences(storage),{sortBy:'level',direction:'desc',profession:'all'});
  writePopulationPreferences(storage,{sortBy:'skill:mining',direction:'asc',profession:'miner',workers:[{id:'fake'}],gold:900});assert.equal(values.size,1);
  assert.deepEqual(readPopulationPreferences(storage),{sortBy:'skill:mining',direction:'asc',profession:'miner'});
  assert.deepEqual(populationPreferences({sortBy:'fake',profession:'constructor',direction:'fake'}),{sortBy:'level',direction:'desc',profession:'all'});
  values.set('newgame.population','broken');assert.deepEqual(readPopulationPreferences(storage),populationPreferences());assert.doesNotThrow(()=>writePopulationPreferences(undefined,{}));
});

globalThis.document={querySelector:()=>({textContent:''})};
function camera(fog){
  const c=Object.create(WorldCamera.prototype);Object.assign(c,{scene:{fog},camera:{scrollX:2500,scrollY:1000,width:1000,height:600,zoom:1,centerOn(x,y){this.scrollX=x-this.width/2;this.scrollY=y-this.height/2;},preRender(){}},target:{x:3200,y:1744},keys:Object.fromEntries(['W','A','S','D','UP','DOWN','LEFT','RIGHT'].map(name=>[name,{isDown:false}])),following:true});return c;
}
test('Locate pans smoothly to an allowed observed point without changing the resident route or exploration',()=>{
  const king={definition:objectRegistry.require('king'),position:{x:50.5,y:50.5},state:'ground'},fog=new FogOfWarSystem(king,true),view=tileCenter({x:55,y:52}),worker={...actor('1','Matěj',1),position:{x:55.5,y:52.5},view,path:[{x:56,y:52}],workTask:{kind:'mine',goal:{x:56,y:52}}},c=camera(fog),before=structuredClone(worker),explored=Array.from(fog.explored);
  assert.equal(c.locate(worker),true);const initial=c.camera.scrollX;c.update(16);assert.notEqual(c.camera.scrollX,initial);assert.notEqual(c.camera.scrollX+c.camera.width/2,view.x);
  for(let i=0;i<100;i++)c.update(16);assert.ok(Math.abs(c.camera.scrollX+c.camera.width/2-view.x)<1);assert.deepEqual(worker,before);assert.deepEqual(Array.from(fog.explored),explored);
});
test('hidden Locate leaves camera and sight unchanged; visible edge targets stay inside the logical map',()=>{
  const king={definition:objectRegistry.require('king'),position:{x:.5,y:.5},state:'ground'},fog=new FogOfWarSystem(king,true),c=camera(fog),hidden={...actor('1','Hidden',1),position:{x:80.5,y:80.5},view:tileCenter({x:80,y:80})},before={x:c.camera.scrollX,y:c.camera.scrollY,following:c.following};
  assert.equal(c.locate(hidden),false);assert.deepEqual({x:c.camera.scrollX,y:c.camera.scrollY,following:c.following},before);
  const visible={...hidden,position:{x:.5,y:.5},view:tileCenter({x:0,y:0})};assert.equal(c.locate(visible),true);for(let i=0;i<100;i++)c.update(16);
  const center=worldToGrid(c.camera.scrollX+c.camera.width/2,c.camera.scrollY+c.camera.height/2);assert.ok(center.x>=0&&center.y>=0&&center.x<=100&&center.y<=100);
});

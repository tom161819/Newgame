import test from 'node:test';
import assert from 'node:assert/strict';
import { groundDepthAbove,buildingDepth,buildingTiles } from '../src/game/buildings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

const def=objectRegistry.require('castle');
const castle={id:1,type:'castle',definition:def,x:10,y:10,tiles:buildingTiles({x:10,y:10},def)};
test('král před přední stěnou hradu se kreslí nad hradem',()=>{
  for(const tile of [{x:10,y:13},{x:11,y:13},{x:13,y:11},{x:13,y:10}]){
    assert.ok(groundDepthAbove([castle],tile,0)>buildingDepth(castle),JSON.stringify(tile));
  }
});
test('král za hradem zůstává zakrytý',()=>{
  for(const tile of [{x:10,y:9},{x:9,y:10},{x:5,y:5},{x:15,y:2}]){
    assert.equal(groundDepthAbove([castle],tile,7),7,JSON.stringify(tile));
  }
});
import { workerScene } from './helpers/workerScene.js';
test('počáteční sklad je před hradem, ne za ním, a hra zůstává průchodná',()=>{
  const s=workerScene(undefined,{logistics:true,gameSettings:{startingCastle:true}});
  const c=s.buildings.find(b=>b.type==='castle'),p=s.buildings.find(b=>b.type==='starter_stockpile');
  assert.ok(c&&p,'castle a sklad existují');
  assert.ok(p.x+p.y>=c.x+c.y+5,`sklad (${p.x},${p.y}) není před hradem (${c.x},${c.y})`);
});

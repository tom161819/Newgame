import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { objectDefinitions } from '../src/data/objects/index.js';
import { APPROVED_BUILDING_ART } from '../src/data/objects/approvedArt.js';
import { WATER_LIFE, fishChance, hasFish, pickFishTiles, tileHash } from '../src/data/waterLife.js';
import { GROUND } from '../src/data/worldTerrain.js';
import { stockState } from '../src/data/fishing.js';
globalThis.document??={querySelector:()=>null};
const { fogEdgeMask } = await import('../src/game/FogEdgeLayer.js');

// m-svet-vzhled-2 (owner requests 30, 47, 35).
const share=(state,ground,n=200)=>{let c=0;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(hasFish(x,y,state,ground))c++;return c/(n*n);};

test('47: fish density follows the fish stock — plentiful most, overfished almost none, none on dry ground', () => {
  assert.equal(stockState(1),'plentiful');assert.equal(stockState(.3),'thinning');assert.equal(stockState(.05),'overfished');
  const p=share('plentiful',GROUND.DEEP),t=share('thinning',GROUND.DEEP),o=share('overfished',GROUND.DEEP);
  assert.ok(Math.abs(p-WATER_LIFE.chance.plentiful)<.01,`plentiful ${p}`);assert.ok(p>t*2&&t>o*5,`${p} > ${t} > ${o}`);assert.ok(o<.01,'overfished: almost none');
  assert.ok(share('plentiful',GROUND.SHALLOW)<p,'shallow water has fewer fish than deep water');
  for(const g of [GROUND.GRASS,GROUND.FORD,GROUND.BEACH])assert.equal(fishChance('plentiful',g),0);
  assert.equal(fishChance('unknown',GROUND.DEEP),0);
  assert.equal(tileHash(12,34),tileHash(12,34),'a tile keeps its fish');assert.notEqual(tileHash(12,34),tileHash(34,12));
});

test('47: the pick is capped on screen and prefers the same tiles every time', () => {
  const candidates=[];for(let y=0;y<60;y++)for(let x=0;x<60;x++)candidates.push({x,y,state:'plentiful',ground:GROUND.DEEP});
  const a=pickFishTiles(candidates),b=pickFishTiles([...candidates].reverse());
  assert.equal(a.length,WATER_LIFE.maxOnScreen);assert.deepEqual(a.map(t=>`${t.x},${t.y}`),b.map(t=>`${t.x},${t.y}`));
  assert.ok(a.every(t=>hasFish(t.x,t.y,t.state,t.ground)));
  assert.equal(pickFishTiles(candidates.map(c=>({...c,state:'overfished'})),1000).length<pickFishTiles(candidates,1000).length/10,true);
  assert.deepEqual(pickFishTiles([]),[]);assert.equal(pickFishTiles(candidates,0).length,0);
});

test('35: approved building art is drawn at Studio scale and anchored at the footprint front corner', () => {
  for(const [id,art]of Object.entries(APPROVED_BUILDING_ART)){
    const d=objectDefinitions.find(o=>o.id===id),meta=JSON.parse(readFileSync(new URL(`../${art.artSource}`,import.meta.url),'utf8'));
    assert.equal(d.visual?.displayWidth,undefined,`${id}: no placeholder display size stretches the PNG`);assert.equal(d.visual?.displayHeight,undefined,id);
    assert.deepEqual(d.origin,meta.baseOrigin,`${id}: origin is the export's base (front corner)`);assert.equal(meta.scale,1,id);
    assert.deepEqual([meta.footprint.width,meta.footprint.height],[d.width,d.height],`${id}: export footprint = game footprint`);
    // The base point is the footprint's front corner: (w−h)·16 px right of and (w+h)·8 px below the footprint centre.
    assert.ok(Math.abs(meta.base.x-meta.anchor.x-(d.width-d.height)*16)<=2,`${id}: base x at the front corner`);
    assert.ok(Math.abs(meta.base.y-meta.anchor.y-(d.width+d.height)*8)<=2,`${id}: base is the front corner, ${(d.width+d.height)*8}px below the centre`);
  }
  const market=objectDefinitions.find(o=>o.id==='marketplace');assert.equal(market.renderMode,'sprite');assert.equal(market.visualHeight,114);
  assert.equal(objectDefinitions.find(o=>o.id==='smelter').visual?.displayHeight,undefined,'the 3×3 Smelter had the same stretch');
});

test('30: the fog edge mask darkens only the visible side, fading within the edge width', () => {
  // A 12×12 region: the left 6 columns visible, the rest remembered (darkness .6), one unknown tile.
  const R=4,visible=(x,y)=>x<6,target=(x,y)=>x===8&&y===8?1:.6,m=fogEdgeMask({left:0,top:0,columns:12,rows:12,resolution:R,visible,target,width:1.5});
  const at=(gx,gy)=>m.alpha[Math.floor(gy*R)*m.width+Math.floor(gx*R)];
  assert.equal(m.empty,false);assert.equal(m.width,48);
  assert.equal(at(1.5,6),0,'deep inside sight: untouched');
  assert.ok(at(5.9,6)>.5&&at(5.9,6)<=.6,'right at the border: about the remembered darkness');
  assert.ok(at(5.1,6)>0&&at(5.1,6)<at(5.9,6),'a gradient across the last tile');
  assert.ok(at(6.05,6)>0,'the border pixel on the unseen side carries the edge (no bright rim)');assert.equal(at(7.5,6),0,'remembered ground is not darkened again');
  assert.ok(at(4.4,6)<at(5.4,6),'monotonic toward the border');
  const all=fogEdgeMask({left:0,top:0,columns:4,rows:4,resolution:2,visible:()=>true,target:()=>1});assert.equal(all.empty,true);
  const none=fogEdgeMask({left:0,top:0,columns:4,rows:4,resolution:2,visible:()=>false,target:()=>1});assert.equal(none.empty,true);
});

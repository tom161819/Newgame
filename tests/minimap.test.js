import test from 'node:test';
import assert from 'node:assert/strict';
import { minimapPixels,minimapPointToGrid,MINIMAP_COLORS,Minimap,MINIMAP_SIZES,MINIMAP_SIZE_DEFAULT,MINIMAP_SIZE_KEY,clampMinimapStep,readMinimapStep,writeMinimapStep } from '../src/ui/Minimap.js';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { MapMemory } from '../src/systems/MapMemory.js';

const registry={require:type=>({oak_tree:{width:1,height:1,tree:true},stone:{width:1,height:1,deposit:true},granary:{width:3,height:3}})[type],get(type){return this.require(type);}};
function world(){
  const fog=new FogOfWarSystem({tile:{x:50,y:50},position:{x:50.5,y:50.5},definition:{gameplay:{baseSight:10}}},true),memory=new MapMemory(fog);
  const grid=Array.from({length:100},()=>Array(100).fill(0));grid[52][50]=1;
  const view=o=>({getData:()=>o});
  const scene={fog,mapMemory:memory,terrainGrid:grid,seasons:{season:'Summer'},objectRegistry:registry,buildings:[{x:47,y:47,type:'granary',definition:{width:3,height:3}}],
    resources:new Map([['t1',view({type:'oak_tree',x:53,y:50})],['hidden',view({type:'stone',x:90,y:90})]]),pathWear:{level:()=>0,isPaved:t=>t.x===51&&t.y===51}};
  return scene;
}
const at=(px,x,y)=>Array.from(px.slice((y*100+x)*4,(y*100+x)*4+3));

test('#104 minimap pixels follow knowledge: grey unexplored, live colours in sight, nothing hidden is revealed',()=>{
  const s=world(),px=minimapPixels(s);
  assert.deepEqual(at(px,90,90),MINIMAP_COLORS.unknown,'a hidden stone deposit is not shown');assert.deepEqual(at(px,10,10),MINIMAP_COLORS.unknown);
  assert.deepEqual(at(px,50,50),MINIMAP_COLORS.ground.Summer);assert.deepEqual(at(px,50,52),MINIMAP_COLORS.rock);assert.deepEqual(at(px,51,51),MINIMAP_COLORS.paved);
  assert.deepEqual(at(px,53,50),MINIMAP_COLORS.tree);assert.deepEqual(at(px,48,48),MINIMAP_COLORS.building);
});

test('#104 remembered ground and objects come from Map Memory, muted; a live change out of sight is not shown',()=>{
  const s=world();s.mapMemory.observeTerrain(s.terrainGrid,s.pathWear,'Summer');s.mapMemory.observeObjects([{key:'resource:t1',kind:'resource',type:'oak_tree',x:53,y:50,width:1,height:1}]);
  s.fog.character.position={x:20.5,y:20.5};s.fog.character.tile={x:20,y:20};s.fog.update();
  s.resources.delete('t1');s.terrainGrid[52][50]=0;const px=minimapPixels(s);
  const muted=c=>c.map(v=>Math.round(v*.5+28));
  assert.deepEqual(at(px,53,50),muted(MINIMAP_COLORS.tree),'the felled tree is still remembered');assert.deepEqual(at(px,50,52),muted(MINIMAP_COLORS.rock),'the remembered rock, not the live change');
  assert.deepEqual(at(px,50,50),muted(MINIMAP_COLORS.ground.Summer));assert.deepEqual(at(px,90,90),MINIMAP_COLORS.unknown);
  s.fog.setEnabled(false);const all=minimapPixels(s);assert.deepEqual(at(all,90,90),MINIMAP_COLORS.deposit,'Fog of War OFF shows the whole map as now');assert.deepEqual(at(all,50,52),MINIMAP_COLORS.ground.Summer);
  assert.equal(s.mapMemory.objects.has('resource:t1'),true,'switching Fog off keeps the stored memory');
});

test('#104 a click point on the diamond maps back to the grid tile (inverse of the CSS turn and squash)',()=>{
  const rect={left:0,top:0,width:212,height:106};
  const p=minimapPointToGrid(rect,{x:106,y:53});assert.ok(Math.abs(p.x-50)<1e-9&&Math.abs(p.y-50)<1e-9,'centre');
  const right=minimapPointToGrid(rect,{x:106+75*Math.SQRT2,y:53});assert.ok(Math.abs(right.x-100)<1e-6&&Math.abs(right.y-0)<1e-6,'right corner is the x end');
  const bottom=minimapPointToGrid(rect,{x:106,y:53+75*Math.SQRT2/2});assert.ok(Math.abs(bottom.x-100)<1e-6&&Math.abs(bottom.y-100)<1e-6,'bottom corner is the far corner');
});

test('#104 the minimap repaints only when knowledge changes, at most every 250 ms, never every frame',()=>{
  const s=world();let now=0;const ctx={putImageData(){},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),clearRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},arc(){},fill(){}};
  const el=()=>({append(){},setAttribute(){},addEventListener(){},remove(){},getContext:()=>ctx,width:0,height:0});
  const doc={createElement:el,querySelector:()=>({append(){}})};s.cameras={main:{worldView:{x:0,y:0,right:100,bottom:100}}};s.character={position:{x:50,y:50}};
  const m=new Minimap(s,{document:doc,now:()=>now});
  for(let i=0;i<60;i++){now+=16;m.update();}assert.equal(m.redraws,1,'one repaint in a second without changes');
  s.fog.character.position={x:60.5,y:50.5};s.fog.character.tile={x:60,y:50};s.fog.update();now+=300;m.update();assert.equal(m.redraws,2,'sight moved');
  m.destroy();
});

test('request 55: minimap size steps clamp, are remembered in localStorage only and survive broken storage',()=>{
  assert.ok(MINIMAP_SIZES.length>=3&&MINIMAP_SIZES.length<=4);assert.equal(MINIMAP_SIZES[MINIMAP_SIZE_DEFAULT],1);
  assert.ok(MINIMAP_SIZES.every((v,i)=>!i||v>MINIMAP_SIZES[i-1]),'steps grow');
  assert.equal(clampMinimapStep(-3),0);assert.equal(clampMinimapStep(99),MINIMAP_SIZES.length-1);assert.equal(clampMinimapStep(NaN),MINIMAP_SIZE_DEFAULT);assert.equal(clampMinimapStep(1.5),MINIMAP_SIZE_DEFAULT);
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  assert.equal(readMinimapStep(storage),MINIMAP_SIZE_DEFAULT,'nothing stored: default');
  writeMinimapStep(2,storage);assert.equal(data.get(MINIMAP_SIZE_KEY),'2');assert.equal(readMinimapStep(storage),2);
  data.set(MINIMAP_SIZE_KEY,'junk');assert.equal(readMinimapStep(storage),MINIMAP_SIZE_DEFAULT);
  const broken={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
  assert.equal(readMinimapStep(broken),MINIMAP_SIZE_DEFAULT);assert.doesNotThrow(()=>writeMinimapStep(1,broken));
  // The + / − buttons move one step, stop at the ends and store the choice.
  const s=world(),ctx={putImageData(){},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},listeners=[];
  const el=()=>{const e={attrs:{},style:{props:{},setProperty(k,v){this.props[k]=v;}},append(){},setAttribute(k,v){this.attrs[k]=v;},addEventListener(type,f){if(type==='click')listeners.push([e,f]);},remove(){},getContext:()=>ctx,width:0,height:0};return e;};
  data.set(MINIMAP_SIZE_KEY,'2');const m=new Minimap(s,{document:{createElement:el,querySelector:()=>({append(){}})},storage});
  assert.equal(m.sizeStep,2,'restored from storage');assert.equal(m.root.style.props['--minimap-scale'],String(MINIMAP_SIZES[2]));
  const click=button=>listeners.find(([e])=>e===button)[1]({stopPropagation(){}});
  for(let i=0;i<5;i++)click(m.biggerButton);assert.equal(m.sizeStep,MINIMAP_SIZES.length-1);assert.equal(m.biggerButton.disabled,true);assert.equal(m.smallerButton.disabled,false);
  for(let i=0;i<9;i++)click(m.smallerButton);assert.equal(m.sizeStep,0);assert.equal(m.smallerButton.disabled,true);assert.equal(data.get(MINIMAP_SIZE_KEY),'0');
  assert.equal(m.root.attrs['data-size'],'0');assert.ok(m.biggerButton.title&&m.biggerButton.title!==m.smallerButton.title,'tooltips');
  m.destroy();
});

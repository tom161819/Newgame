import test from 'node:test';
import assert from 'node:assert/strict';
import { TerrainRenderer } from '../src/game/TerrainRenderer.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { PATH_WEAR } from '../src/data/pathWear.js';

// A renderer with only what the Earth track needs: live wear levels or, with Fog of War, remembered map data.
function renderer({levels={},memory=null}={}){
  const map=Array.from({length:100},()=>Array(100).fill(0)),r=Object.create(TerrainRenderer.prototype);
  Object.assign(r,{registry:objectRegistry,scene:{map,textures:{exists:()=>false}},wear:{level:tile=>levels[`${tile.x},${tile.y}`]??0}});
  if(memory)Object.assign(r,{fog:{enabled:true,width:100},memory:{terrain:new Map(Object.entries(memory).map(([key,value])=>{const [x,y]=key.split(',').map(Number);return [y*100+x,value];}))}});
  return r;
}
function recorder(){
  const strokes=[];let path=[];
  const context={save(){},restore(){},translate(){},scale(){},clip(){},beginPath(){path=[];},moveTo(x,y){path.push(['M',x,y]);},lineTo(x,y){path.push(['L',x,y]);},quadraticCurveTo(cx,cy,x,y){path.push(['Q',x,y]);},
    stroke(){strokes.push({style:this.strokeStyle,alpha:this.globalAlpha,width:this.lineWidth,path:[...path]});},createPattern:()=>null};
  return {context,strokes};
}

test('the Earth track uses the approved tiles and strip colours, narrowest at the lightest wear',()=>{
  const widths=PATH_WEAR.terrainIds.slice(1).map(id=>objectRegistry.require(id));
  assert.deepEqual(widths.map(d=>d.visual.pathWidth),[6,10,14]);
  for(const d of widths){assert.match(d.sprite,/\/path_wear\/earth\/worn-path-earth\.v1\.tile-[123]\.png$/);assert.equal(d.artSource,'art/sprites/worn-path/worn-path-earth.v1.json');}
});

test('an isolated worn tile is a small patch; connected tiles meet halfway with the narrower width',()=>{
  const r=renderer({levels:{'10,10':3,'11,10':1}});
  assert.deepEqual(r.pathSegments({x:12,y:12}),[]);
  const [dot,...links]=r.pathSegments({x:10,y:10});
  assert.equal(dot.end,undefined);assert.ok(dot.width>=15&&dot.width<=18,`${dot.width}`);assert.equal(links.length,1);assert.equal(links[0].width,6);
  // Halfway to the neighbour's centre (world x +32, y +16; the strip space doubles y).
  assert.deepEqual([links[0].end.x-links[0].start.x,links[0].end.y-links[0].start.y],[16,16]);
  const [,back]=r.pathSegments({x:11,y:10});assert.deepEqual([back.end.x,back.end.y],[links[0].end.x,links[0].end.y]);
});

test('every tile draws the strips of its worn neighbours, so the track runs on across tile edges, and plain grass draws nothing',()=>{
  const r=renderer({levels:{'10,10':3,'11,10':3}});
  const near=recorder();r.drawPaths(near.context,10,11,0,0);
  assert.ok(near.strokes.length>0,'the tile beside the track still paints the overlapping part of the strip');
  assert.ok(near.strokes.every(s=>s.path.length),'every stroke has geometry');
  const far=recorder();r.drawPaths(far.context,40,40,0,0);assert.equal(far.strokes.length,0);
  // The soil core is opaque; only the halo and edge are translucent.
  assert.ok(near.strokes.some(s=>s.alpha===1&&s.width===14&&s.style===objectRegistry.require('grass_trampled_3').visual.pathColor));
  assert.ok(near.strokes.filter(s=>s.alpha<1).every(s=>s.width>=15));
});

test('winter tones the track towards snow, light tracks most; other seasons keep the approved colours',()=>{
  const r=renderer({levels:{'10,10':1,'20,20':3}});
  const summer=recorder();r.drawPaths(summer.context,10,10,0,0,0);assert.ok(summer.strokes.some(s=>s.style==='#5b6f3a'));
  const winter=recorder();r.drawPaths(winter.context,10,10,0,0,.45);const light=winter.strokes.find(s=>s.alpha===1).style;
  const heavy=recorder();r.drawPaths(heavy.context,20,20,0,0,.45);const dark=heavy.strokes.find(s=>s.alpha===1).style;
  const brightness=c=>c.match(/\d+/g).map(Number).reduce((a,b)=>a+b,0);
  assert.ok(brightness(light)>brightness(dark),`${light} is lighter than ${dark}`);assert.ok(brightness(light)>600);
});

test('with Fog of War the track reads only remembered levels and links, never live wear of unseen tiles',()=>{
  // Live wear has a track next door, but the map memory has never seen that tile.
  const r=renderer({levels:{'10,10':3,'11,10':3},memory:{'10,10':[0,3,'Summer',0]}});
  const [dot,...links]=r.pathSegments({x:10,y:10});assert.equal(dot.end,undefined);assert.equal(links.length,0);
  assert.deepEqual(r.pathSegments({x:11,y:10}),[]);
  // A remembered link (bit 4 = east) is drawn even though the live map has since changed.
  const remembered=renderer({levels:{},memory:{'10,10':[0,3,'Summer',1<<4],'11,10':[0,2,'Summer',1<<3]}});
  const [,link]=remembered.pathSegments({x:10,y:10});assert.equal(link.width,10);
});

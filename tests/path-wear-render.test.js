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
  const widths=PATH_WEAR.terrainIds.slice(2).map(id=>objectRegistry.require(id));
  assert.deepEqual(widths.map(d=>d.visual.pathWidth),[6,10,14]);
  for(const d of widths){assert.match(d.sprite,/\/path_wear\/earth\/worn-path-earth\.v1\.tile-[123]\.png$/);assert.equal(d.artSource,'art/sprites/worn-path/worn-path-earth.v1.json');}
});

test('an isolated worn tile is a small patch; a link between two tiles is one shared curve with the narrower width',()=>{
  const r=renderer({levels:{'10,10':4,'11,10':2}});
  const far=r.pathElements(40,40);assert.deepEqual([far.nodes.length,far.links.length,far.areas.length],[0,0,0]);
  const here=r.pathElements(10,10),there=r.pathElements(11,10);
  assert.equal(here.links.length,1);assert.equal(here.links[0].width,6);assert.equal(here.areas.length,0);
  assert.deepEqual(here.links[0],there.links[0],'both tiles draw the very same curve, so it continues across their edge');
  assert.notDeepEqual(here.links[0].control,{x:(here.links[0].start.x+here.links[0].end.x)/2,y:(here.links[0].start.y+here.links[0].end.y)/2},'a gentle meander, not a ruler line');
});

test('no stars: corridors link orthogonally, a diagonal only where no corner tile is worn',()=>{
  // An L-turn: (10,10)→(11,10)→(11,11). The diagonal (10,10)→(11,11) has a worn corner, so it is not drawn.
  const turn=renderer({levels:{'10,10':4,'11,10':4,'11,11':4}}).pathElements(11,10);
  assert.equal(turn.links.length,2);assert.equal(turn.areas.length,0,'three tiles in an L are a path, not an area');
  // A pure diagonal step with free corners keeps its link.
  assert.equal(renderer({levels:{'10,10':3,'11,11':3}}).pathElements(10,10).links.length,1);
  // A straight 1×6 corridor is a path all along: links only, no area.
  const levels={};for(let x=10;x<16;x++)levels[`${x},20`]=4;const line=renderer({levels});
  for(let x=10;x<16;x++){const e=line.pathElements(x,20);assert.equal(e.areas.length,0);}
  assert.equal(line.pathElements(12,20).links.length,4,'tiles 11–13 bring the links 10–11, 11–12, 12–13 and 13–14, once each');
});

test('a 3×3 block of worn tiles becomes one trodden area without internal links; a corridor joins it',()=>{
  const levels={};for(let y=10;y<13;y++)for(let x=10;x<13;x++)levels[`${x},${y}`]=4;levels['13,11']=3;levels['14,11']=3;
  const r=renderer({levels}),centre=r.pathElements(11,11);
  assert.equal(centre.areas.length,9,'every tile of the block is part of the area');assert.deepEqual(centre.links.map(l=>l.width),[10],'no star inside the area: only the corridor joining at its edge');
  const edge=r.pathElements(13,11);assert.equal(edge.links.some(l=>l.width===10),true,'the corridor links into the area');
  assert.equal(edge.areas.some(a=>a.level===3),false,'the corridor itself stays a path');
});

test('every tile draws the strips of its worn neighbours, so the track runs on across tile edges, and plain grass draws nothing',()=>{
  const r=renderer({levels:{'10,10':4,'11,10':4}});
  const near=recorder();r.drawPaths(near.context,10,11,0,0);
  assert.ok(near.strokes.length>0,'the tile beside the track still paints the overlapping part of the strip');
  assert.ok(near.strokes.every(s=>s.path.length),'every stroke has geometry');
  const far=recorder();r.drawPaths(far.context,40,40,0,0);assert.equal(far.strokes.length,0);
  // The soil core is opaque; only the halo and edge are translucent.
  assert.ok(near.strokes.some(s=>s.alpha===1&&s.width===14&&s.style===objectRegistry.require('grass_trampled_3').visual.pathColor));
  assert.ok(near.strokes.filter(s=>s.alpha<1).every(s=>s.width>=15));
});

test('winter tones the track towards snow, light tracks most; other seasons keep the approved colours',()=>{
  const r=renderer({levels:{'10,10':2,'20,20':4}});
  const summer=recorder();r.drawPaths(summer.context,10,10,0,0,0);assert.ok(summer.strokes.some(s=>s.style==='#5b6f3a'));
  const winter=recorder();r.drawPaths(winter.context,10,10,0,0,.45);const light=winter.strokes.find(s=>s.alpha===1).style;
  const heavy=recorder();r.drawPaths(heavy.context,20,20,0,0,.45);const dark=heavy.strokes.find(s=>s.alpha===1).style;
  const brightness=c=>c.match(/\d+/g).map(Number).reduce((a,b)=>a+b,0);
  assert.ok(brightness(light)>brightness(dark),`${light} is lighter than ${dark}`);assert.ok(brightness(light)>600);
});

test('with Fog of War the track reads only remembered levels and links, never live wear of unseen tiles',()=>{
  // Live wear has a track next door, but the map memory has never seen that tile.
  const r=renderer({levels:{'10,10':4,'11,10':4},memory:{'10,10':[0,4,'Summer',0]}}),e=r.pathElements(10,10);
  assert.equal(e.nodes.length,1);assert.equal(e.links.length,0);assert.equal(r.pathLevel({x:11,y:10}),0);
  // A remembered link (bit 4 = east) is drawn even though the live map has since changed.
  const remembered=renderer({levels:{},memory:{'10,10':[0,4,'Summer',1<<4],'11,10':[0,3,'Summer',1<<3]}});
  assert.equal(remembered.pathElements(10,10).links[0].width,10);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePng } from '../scripts/png-lite.mjs';
import { damageStage,damagePixels,rubble,DAMAGE_STAGES } from '../src/game/buildingDamage.js';

// Owner 18 Nov 2026: "udělej vizualizaci pro hradby, jak se postupně bourají, když mají míň HP".
const wall=hp=>({type:'wall',x:0,y:0,definition:{id:'wall',category:'building',buildable:true,cost:{stone:2},width:1,height:1},...(hp==null?{}:{hp})});
const solid=(d,w,h)=>{let n=0;for(let i=3;i<w*h*4;i+=4)if(d[i]>40)n++;return n;};
const light=(d,w,h)=>{let n=0,sum=0;for(let i=0;i<w*h*4;i+=4)if(d[i+3]>40){n++;sum+=d[i]+d[i+1]+d[i+2];}return sum/Math.max(1,n);};

test('damage stages follow the share of hit points left: whole, under 75 %, under 50 %, under 25 %',()=>{
  assert.deepEqual(DAMAGE_STAGES,[.75,.5,.25]);
  assert.equal(damageStage(wall()),0);assert.equal(damageStage(wall(200)),0);assert.equal(damageStage(wall(160)),0);assert.equal(damageStage(wall(149)),1);
  assert.equal(damageStage(wall(99)),2);assert.equal(damageStage(wall(49)),3);assert.equal(damageStage(wall(1)),3);
  assert.equal(damageStage({type:'wheat_field',definition:{category:'building',crop:true}}),0,'no hit points, no damage');
});

test('the approved wall block breaks off from the top stage by stage; the same wall always breaks the same way',()=>{
  const png=decodePng(readFileSync(new URL('../public/assets/buildings/wall/kit/wall-kit-block-tripo.v1.png',import.meta.url))),{width:w,height:h}=png,whole=solid(png.data,w,h);
  const at=stage=>damagePixels(new Uint8ClampedArray(png.data),w,h,stage,'wall:1');
  const left=[1,2,3].map(stage=>solid(at(stage),w,h));
  assert.ok(left[0]<whole&&left[0]>whole*.9,`stage 1 chips a little (${left[0]} of ${whole})`);
  assert.ok(left[1]<left[0]&&left[1]>whole*.7,`stage 2 breaks more (${left[1]})`);
  assert.ok(left[2]<left[1]&&left[2]<whole*.8&&left[2]>whole*.4,`stage 3 is a breached stump (${left[2]})`);
  assert.deepEqual(at(2),at(2),'deterministic');assert.notDeepEqual(damagePixels(new Uint8ClampedArray(png.data),w,h,2,'wall:2'),at(2),'another variant breaks differently');
  // Nothing is added outside the picture, and the foot of the wall stays (it still stands on its tile).
  for(const stage of [1,2,3]){const d=at(stage);for(let i=3;i<w*h*4;i+=4)if(png.data[i]===0)assert.equal(d[i],0);let foot=0,was=0;for(let y=h-12;y<h;y++)for(let x=0;x<w;x++){if(png.data[(y*w+x)*4+3]>40)was++;if(d[(y*w+x)*4+3]>40)foot++;}assert.equal(foot,was);}
  assert.equal(damagePixels(new Uint8ClampedArray(png.data),w,h,0,'wall:1').join(),new Uint8ClampedArray(png.data).join(),'stage 0 changes nothing');
});

test('a Tower or a Gate keeps its outline (cracks and fallen bricks only), darker with every stage',()=>{
  const png=decodePng(readFileSync(new URL('../public/assets/buildings/tower/watchtower-tripo.v2.png',import.meta.url))),{width:w,height:h}=png,whole=solid(png.data,w,h),base=light(png.data,w,h);let before=base;
  for(const stage of [1,2,3]){const d=damagePixels(new Uint8ClampedArray(png.data),w,h,stage,'tower:0',{chip:false});assert.equal(solid(d,w,h),whole,'no pixel removed');const l=light(d,w,h);assert.ok(l<before,`stage ${stage} is darker`);before=l;}
});

test('fallen stones lie around the foot of a damaged wall: more with every stage, none on a whole one',()=>{
  const corners=[{x:0,y:-32},{x:32,y:-16},{x:0,y:0},{x:-32,y:-16}];
  assert.deepEqual(rubble(corners,0,5),[]);const counts=[1,2,3].map(stage=>rubble(corners,stage,5).length);assert.deepEqual(counts,[8,14,20]);
  assert.deepEqual(rubble(corners,2,5),rubble(corners,2,5));
  for(const stone of rubble(corners,3,5)){assert.ok(Math.abs(stone.x)<60&&stone.y>-50&&stone.y<25,'near the tile');}
});

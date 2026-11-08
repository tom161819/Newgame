// Plan m-animace-rybar: the Fisher's approved loop follows the fishing state; it never changes how many fish are caught.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { FishingSystem } from '../src/systems/FishingSystem.js';
import { GROUND,WATER_CELL } from '../src/data/worldTerrain.js';
import { emptyGround } from '../src/game/worldGeneration.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { FISHING_ART,FishingAnimator,TWITCH_SECONDS,catchSequence,fishingFrame,fishingInfo,fishingSheet,waterFacing } from '../src/game/fishingAnim.js';
import { FACING_INDEX } from '../src/data/objects/approvedArt.js';

globalThis.document??={querySelector:()=>({textContent:''})};
const art=FISHING_ART.male;
// Clip names over time (consecutive repeats of the same clip instance merged by the sequence counter).
function run(animator,steps){const out=[];for(const [ms,info] of steps){const r=animator.update(ms,info);out.push(r?.clip??null);}return out;}

test('clip selection by state: arrive → cast → sit-idle, a twitch every 4–10 s seeded by the resident, nothing when not fishing',()=>{
  assert.deepEqual(Object.keys(art.clips).sort(),['bite','cast','reel','sit-idle','store','twitch']);assert.equal(art.fps,5);
  const a=new FishingAnimator(art,42);assert.equal(a.update(16,null),null);
  assert.equal(a.update(16,{caught:0}).clip,'cast','arriving casts first');
  let t=16,clip;while((clip=a.update(100,{caught:0}).clip)==='cast')t+=100;
  assert.equal(clip,'sit-idle');assert.ok(Math.abs(t-art.clips.cast.length*200)<=120,'the cast takes its frames at 5 fps');
  const twitches=[];let previous='sit-idle';for(let i=0;i<1200;i++){t+=100;const r=a.update(100,{caught:0});if(r.clip==='twitch'&&previous!=='twitch')twitches.push({at:t});previous=r.clip;}
  assert.ok(twitches.length>=10,`${twitches.length} twitches in 2 minutes`);
  const gaps=twitches.slice(1).map((w,i)=>(w.at-twitches[i].at)/1000);
  for(const g of gaps)assert.ok(g>=TWITCH_SECONDS[0]&&g<=TWITCH_SECONDS[1]+1.5,`gap ${g}s`);
  const b=new FishingAnimator(art,42),c=new FishingAnimator(art,43),steps=Array.from({length:600},()=>[100,{caught:0}]);
  assert.deepEqual(run(b,steps),run(new FishingAnimator(art,42),steps),'same resident, same twitches');assert.notDeepEqual(run(c,steps),run(new FishingAnimator(art,42),steps),'another resident twitches at other times');
  assert.equal(a.update(16,null),null,'leaving the spot resets');assert.equal(a.update(16,{caught:3}).clip,'cast');
});

test('a catch plays bite → reel → store and casts again; frames index rows by facing and columns by clip',()=>{
  const a=new FishingAnimator(art,7);for(let i=0;i<40;i++)a.update(100,{caught:0});
  const seen=[];for(let i=0;i<60;i++){const r=a.update(100,{caught:1});if(seen.at(-1)!==r.clip)seen.push(r.clip);}
  assert.deepEqual(seen.slice(0,5),['bite','reel','store','cast','sit-idle']);
  assert.deepEqual(catchSequence(art),['bite','reel','reel','reel','store','cast'],'reel as often as in the approved loop');
  assert.equal(fishingFrame(art,3,art.clips.reel[1]),3*12+art.clips.reel[1]);
  const ground=emptyGround();ground[10][11]=GROUND.SHALLOW;assert.equal(waterFacing(ground,{x:10,y:10}),FACING_INDEX.E);ground[11][10]=GROUND.SHALLOW;ground[11][11]=GROUND.SHALLOW;assert.equal(waterFacing(ground,{x:10,y:10}),FACING_INDEX.SE);
});

test('without the sheet (not loaded or failed) the Fisher keeps today\'s look',()=>{
  const queued=[];const scene={textures:{exists:()=>false},load:{spritesheet:(k,url,f)=>queued.push([k,f.frameWidth]),image(){},isLoading:()=>false,start(){}}};
  assert.equal(fishingSheet(scene,'male'),null);assert.equal(fishingSheet(scene,'male'),null);assert.deepEqual(queued,[['fishing-anim:male',art.frameWidth]],'queued once like the walk sheets');
  assert.equal(fishingSheet({textures:{exists:()=>true}},'female')?.key,'fishing-anim:female');assert.equal(fishingSheet(scene,'male',{}),null,'no approved art');
});

// A lake east of the start, as in fishing.test.js.
function lakeScene(){
  const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true});s.workerSystem.unsubscribe();
  s.groundGrid=emptyGround();
  for(let y=36;y<=50;y++)for(let x=51;x<=60;x++){s.groundGrid[y][x]=x>52&&x<59&&y>37&&y<49?GROUND.DEEP:GROUND.SHALLOW;s.map[y][x]=WATER_CELL;}
  s.fishing=new FishingSystem(s);s.eventFeed={push(){return true;}};s.foodSystem.eat=()=>true;return s;
}
function fisherAt(s){
  const d=objectRegistry.require('fisherman_hut');ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const r=placeBuilding({map:s.map,anchor:{x:49,y:43},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);
  s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));const w=s.workerSystem.create({x:46,y:46});assert.equal(s.workplaceSystem.assign(r.building,w),true);w.naturalTalent='woodcutting';return {hut:r.building,w};
}

test('in the game: the view gets the fishing state, a catch starts bite → reel → store, and fish per day are unchanged',()=>{
  const plain=lakeScene(),p=fisherAt(plain);for(let i=0;i<3000;i++)plain.tick(50);
  const animated=lakeScene(),q=fisherAt(animated),animator=new FishingAnimator(art,1),clips=[];let infos=0;
  q.w.view.setFishing=(delta,info)=>{const r=animator.update(delta,info);if(info){infos++;assert.notEqual(info.facing,null,'he faces the water');}if(r&&clips.at(-1)!==r.clip)clips.push(r.clip);return !!r;};
  for(let i=0;i<3000;i++)animated.tick(50);
  const caught=s=>{const r=s.fishing.catches.get([...s.fishing.catches.keys()][0]);return (r?.today??0)+(r?.yesterday??0);};
  assert.ok(caught(plain)>=2,`fish caught: ${caught(plain)}`);assert.equal(caught(animated),caught(plain),'the animation never changes the catch');
  assert.ok(infos>0);assert.equal(clips[0],'cast');const bite=clips.indexOf('bite');assert.ok(bite>0,clips.join(' '));assert.deepEqual(clips.slice(bite,bite+3),['bite','reel','store']);
  assert.equal(fishingInfo({workTask:null},animated),null);
});

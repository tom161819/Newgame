import assert from 'node:assert/strict';

// Native wandering beside a real, paid physical blueprint. Also used against
// the previous built source to capture the audit's genuine before image.
export async function wildlifeClearanceSmoke(page,{baseline=false,screenshotPath=null}={}){
 const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
 const result=await page.evaluate(()=>{
  const s=window.__game.registry.get('application').scene;s.pauseManager.set('wildlife-smoke',true);s.fog.setEnabled(false);
  for(const a of s.animalSystem.animals.values())a.wanderWait=1e8;
  for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);
  const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let anchor;
  for(let y=8;y<85&&!anchor;y++)for(let x=8;x<85&&!anchor;x++){
   let free=true;for(let dy=0;dy<9;dy++)for(let dx=0;dx<9;dx++)if(s.map[y+dy]?.[x+dx]!==0||s.resourceOccupancy.has(`${x+dx},${y+dy}`)||occupied.has(`${x+dx},${y+dy}`))free=false;
   if(free)anchor={x:x+4,y:y+4};
  }
  if(!anchor)throw Error('No clear wildlife audit room');
  const d=s.objectRegistry.require('tower');for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);s.updateInventory();
  const point={x:s.map.length*32+(anchor.x-anchor.y)*32,y:128+(anchor.x+anchor.y+1)*16};
  // Use native placement synchronously, with no simulation frame between
  // unpausing input validation and restoring the fixture pause.
  s.gameTime.setPaused(false);s.startBuilding(d);s.handleClick({leftButtonDown:()=>true,rightButtonDown:()=>false,updateWorldPoint(){this.worldX=point.x;this.worldY=point.y;}});s.gameTime.setPaused(true);
  const site=s.buildings.find(b=>b.type==='tower'&&b.x===anchor.x&&b.y===anchor.y);if(!site)throw Error('Native blueprint placement failed');
  const a=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:anchor.x-2,y:anchor.y});a.wanderWait=0;let n=0;const rng=s.animalSystem.random;s.animalSystem.random=()=>[.6,.5,.5][n++%3];
  const explored=s.fog.explored.slice();s.animalSystem.update(1000);s.animalSystem.random=rng;const untouched=explored.every((v,i)=>v===s.fog.explored[i]);
  s.worldCamera.following=false;s.worldCamera.panTarget=null;s.cameras.main.setZoom(2).centerOn(point.x-32,point.y-20);s.cameras.main.preRender();s.refreshVisibility();
  return {anchor,tile:a.tile,position:a.position,id:a.id,clear:s.animalSystem.clearance?.isClear(a.tile)??null,ordinaryGround:s.map[anchor.y][anchor.x-1],untouched};
 });
 assert.equal(result.ordinaryGround,0,'the shared ground map is unchanged');assert.equal(result.untouched,true,'wandering does not reveal fog');
 assert.deepEqual(result.tile,{x:result.anchor.x-(baseline?1:2),y:result.anchor.y});
 if(!baseline)assert.equal(result.clear,true);
 if(screenshotPath)await page.screenshot({path:screenshotPath});
 await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__wildlifeRestored=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__wildlifeRestored=true;app.onGameReady=ready;};await app.load(state);},saved);await page.waitForFunction(()=>window.__wildlifeRestored);
 console.log(`PASS wildlife ${baseline?'audit before: native rabbit reaches the tower margin':'clearance: native rabbit refuses the immediate tower margin'}, ordinary ground remains open and fog unchanged`);
 return result;
}

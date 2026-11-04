import assert from 'node:assert/strict';
// Gradual season change in a real browser: no one-frame flip, uneven tiles and
// trees, stepped repaints, exact Save/Load mid-transition and Seasons OFF.
// The scene's per-frame refresh (terrain, trees, season transition) while the simulation stays paused.
const frames=page=>page.evaluate(()=>new Promise(resolve=>{window.__game.registry.get('application').scene.refreshVisibility();requestAnimationFrame(()=>requestAnimationFrame(resolve));}));
async function loadPaused(page,state){
  await page.evaluate(async state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__restored=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('test',true);window.__restored=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__restored);
}
const sample=page=>page.evaluate(()=>{
  const s=window.__game.registry.get('application').scene,t=s.seasonTransition,state=t.state(),view=s.cameras.main.worldView,amounts=new Map();
  for(let y=0;y<100;y++)for(let x=0;x<100;x++){const p={x:3200+(x-y)*32,y:128+(x+y+1)*16};if(p.x<view.x||p.x>view.right||p.y<view.y||p.y>view.bottom)continue;const a=t.mix(x,y,s.terrain.season)?.amount??1;amounts.set(a,(amounts.get(a)??0)+1);}
  const trees={};for(const o of s.naturalResources.byId.values()){const season=s.naturalResources.view(o)?.season;if(season)trees[season]=(trees[season]??0)+1;}
  return{state,amounts:Object.fromEntries(amounts),trees,painted:s.terrain.paintStats.tiles,season:s.terrain.season};
});
export async function seasonTransitionSmoke(page,{screenshot=process.env.SMOKE_SEASON_SCREENSHOT}={}){
  const original=await page.evaluate(()=>{const a=window.__game.registry.get('application');a.scene.pauseManager.set('test',true);a.scene.cameras.main.setZoom(.5);return a.snapshot();});
  // Autumn starts: day 11 of the cycle, no time elapsed yet.
  // Real clock advances (as in the seasons smoke), so the saved state stays valid.
  const window_=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.workerSystem.unsubscribe();s.seasons.random=()=>0;s.seasons.setEnabled(true);s.gameTime.setPaused(false);s.gameTime.update((11-s.seasons.cycleDay)*s.gameTime.dayDuration-s.seasons.cycleElapsed);s.gameTime.setPaused(true);return 5*s.gameTime.dayDuration*.2;});
  await frames(page);let a=await sample(page);
  assert.equal(a.season,'Autumn');assert.deepEqual([a.state.from,a.state.to,a.state.progress],['Summer','Autumn',0]);
  assert.deepEqual(Object.keys(a.amounts),['0'],'the first frame of autumn still looks like summer everywhere');
  assert.ok(!a.trees.Autumn,'no tree has turned yet');
  const advance=ms=>page.evaluate(ms=>{const s=window.__game.registry.get('application').scene;s.gameTime.setPaused(false);s.gameTime.update(ms);s.gameTime.setPaused(true);},ms);
  await advance(window_*.5);await frames(page);const before=a.painted;a=await sample(page);
  assert.ok(Object.keys(a.amounts).length>=3,`midway tiles show several blend levels: ${JSON.stringify(a.amounts)}`);
  assert.ok(a.trees.Autumn>0&&a.trees.Summer>0,`trees turn gradually: ${JSON.stringify(a.trees)}`);
  assert.ok(a.painted-before<10000,'one step repaints only tiles whose blend changed and are on screen');
  if(screenshot)await page.screenshot({path:screenshot});
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());await loadPaused(page,saved);await frames(page);
  assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),saved);const loaded=await sample(page);
  assert.deepEqual(loaded.state,a.state);assert.deepEqual(loaded.amounts,a.amounts,'Load shows the same point of the transition');
  await advance(window_*.5+1);await frames(page);a=await sample(page);
  assert.equal(a.state,null);assert.deepEqual(Object.keys(a.amounts),['1']);assert.ok(!a.trees.Summer,'every tree shows autumn once the window is over');
  await page.evaluate(()=>window.__game.registry.get('application').scene.seasons.setEnabled(false));await frames(page);a=await sample(page);
  assert.equal(a.state,null);assert.equal(a.season,'Summer');
  await loadPaused(page,original);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),original);await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('test',false));
  console.log('PASS gradual season change: summer look on the first frame of autumn, uneven tiles and trees midway, stepped repaints, exact Load mid-transition, complete after the window, Seasons OFF without animation');
}

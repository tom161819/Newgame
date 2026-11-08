import assert from 'node:assert/strict';

// #116 in its own page: trodden paths near the start are drawn by the V2 renderer (pesinav2): trampled grass (level 1)
// and soil (2–4), tiles cached, chunk repaints measured; N12 stays available as the developer fallback.
// SMOKE_SHOTS=<dir> saves V2 and N12 screenshots of the same paths at zoom 1 and 2.
export async function pathsV2Smoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.terrain?.v2);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const setup=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,w=s.pathWear,c=s.character.tile;s.fog.setEnabled(false);s.refreshVisibility?.();
      // A loop road, a spur of trampled grass and a small trodden square, on open grass only.
      const set=(x,y,score)=>{const t={x,y};if(!w.isGrass(t))return;const i=w.index(t);w.scores[i]=score;w.lastPassDays[i]=s.gameTime.day;w.active.add(i);w.refreshLevel(i);};
      for(let i=-6;i<=6;i++){set(c.x+i,c.y+4,32);set(c.x+i,c.y-6,16);set(c.x-6,c.y+i,6);set(c.x+6,c.y+i,3);}
      for(let i=1;i<8;i++)set(c.x+6+i,c.y+i,3);
      for(let y=c.y+5;y<c.y+8;y++)for(let x=c.x-2;x<c.x+2;x++)set(x,y,32);
      if(s.worldCamera)s.worldCamera.following=false;const p=s.player;s.cameras.main.centerOn(p.x,p.y);
      return {levels:[1,2,3,4].map(l=>w.levels.filter(v=>v===l).length),centre:{...c}};
    });
    assert.ok(setup.levels.every(n=>n>0),`all four wear levels present (${setup.levels})`);
    await page.waitForTimeout(1500);
    const stats=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {...s.terrain.v2.stats,style:s.terrain.pathStyle};});
    assert.equal(stats.style,'v2');assert.ok(stats.builds>=1&&stats.painted>0,`V2 painted tiles (${JSON.stringify(stats)})`);
    const frame=async()=>page.evaluate(()=>new Promise(resolve=>{let n=0,t0=performance.now();const step=()=>{if(++n<120)requestAnimationFrame(step);else resolve((performance.now()-t0)/n);};requestAnimationFrame(step);}));
    const walk=async()=>page.evaluate(()=>new Promise(resolve=>{const s=window.__game.registry.get('application').scene,c=s.character;s.fog.setEnabled(true);s.refreshVisibility?.();if(s.worldCamera)s.worldCamera.following=true;
      const start={...c.tile},goal={x:start.x+12,y:start.y+4};c.command({kind:'move',goal});let n=0,t0=performance.now(),worst=0,last=t0;
      const terrain=s.terrain,original=terrain.chunkTexture,refresh=terrain.v2.refresh;let chunkMs=0,chunks=0,refreshMs=0;terrain.chunkTexture=function(...a){const t=performance.now(),r=original.apply(this,a);chunkMs+=performance.now()-t;chunks++;return r;};terrain.v2.refresh=function(...a){const t=performance.now(),r=refresh.apply(this,a);refreshMs+=performance.now()-t;return r;};
      const step=()=>{const now=performance.now();worst=Math.max(worst,now-last);last=now;if(++n<180)requestAnimationFrame(step);else{c.command({kind:'move',goal:start});delete terrain.chunkTexture;delete terrain.v2.refresh;resolve({avg:(now-t0)/n,worst,chunkMs:chunkMs/n,chunks,refreshMs:refreshMs/n});}};requestAnimationFrame(step);}));
    const v2Frame=await frame();await walk();await page.waitForTimeout(3500);const v2Walk=await walk();await page.waitForTimeout(3500);
    if(process.env.SMOKE_SHOTS){await page.screenshot({path:`${process.env.SMOKE_SHOTS}/paths-v2.png`});await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.setZoom(2));await page.waitForTimeout(800);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/paths-v2-zoom2.png`});await page.evaluate(()=>window.__game.registry.get('application').scene.cameras.main.setZoom(1));}
    // A wear change repaints only the tiles around it (the game is paused so walking residents add no wear meanwhile).
    // 0.62.0 walks 25 % slower: the King may not be back from the walk yet, so look around the painted roads' centre.
    const repaint=await page.evaluate(async c=>{const s=window.__game.registry.get('application').scene;s.playerPaused=true;await new Promise(r=>setTimeout(r,300));const w=s.pathWear,before={...s.terrain.v2.stats};
      let t=null;for(let i=-6;i<=6&&!t;i++){const p={x:c.x+6,y:c.y+i};if(w.level(p)>0&&w.level(p)<4)t=p;}const i=w.index(t);w.scores[i]=40;w.refreshLevel(i);await new Promise(r=>setTimeout(r,1500));const after=s.terrain.v2.stats;s.playerPaused=false;return {painted:after.painted-before.painted,ms:after.paintMs-before.paintMs,builds:after.builds-before.builds,buildMs:after.buildMs};},setup.centre);
    assert.ok(repaint.builds===1&&repaint.painted>0&&repaint.painted<200,`local repaint (${JSON.stringify(repaint)})`);
    assert.equal(await page.evaluate(()=>window.mkDev.setPathRenderer('n12')),true);await page.waitForTimeout(1200);
    const n12Frame=await frame(),n12Walk=await walk();
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/paths-n12.png`});
    await page.evaluate(()=>window.mkDev.setPathRenderer('v2'));
    console.log(`PASS #116 paths V2: four wear levels drawn by V2 (${stats.painted} tiles, ${(stats.paintMs/stats.painted).toFixed(2)} ms per tile, geometry ${stats.buildMs.toFixed(1)} ms); a wear change repainted ${repaint.painted} tiles in ${repaint.ms.toFixed(1)} ms; frame ${v2Frame.toFixed(2)} ms V2 vs ${n12Frame.toFixed(2)} ms N12; walking with Fog of War avg/worst ${v2Walk.avg.toFixed(2)}/${v2Walk.worst.toFixed(1)} ms V2 vs ${n12Walk.avg.toFixed(2)}/${n12Walk.worst.toFixed(1)} ms N12`);console.log('WALK',JSON.stringify({v2Walk,n12Walk}));
  }finally{await page.close();}
}

import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';

// m-vykon-fps (performance-1): FPS and simulation time of a default New Game in the real build, measured by the
// game's own frame profiler (Dev mode, F8) over 10 s per scenario: the start (×1), a 25-resident village (×1, ×3) and
// a night in that village. Writes /tmp/perf.json; fails when a scenario's FPS drops more than 20 % below
// scripts/performance-baseline.json. PERF_WRITE_BASELINE=1 rewrites the baseline from this run.
// The village grows like scripts/balance-sim.mjs: tutorial-order blueprints, the game's own simulation step (50 ms).
const BASELINE=new URL('./performance-baseline.json',import.meta.url),ORDER=['granary','lumberjack_hut','hunting_lodge','fisherman_hut','farmhouse','wheat_field','mill','bakery','house','material_yard','builder_workshop','house','house'];
const MEASURE_MS=Number(process.env.PERF_MEASURE_MS??10000),TOLERANCE=.2;
async function measure(page,name,speed){
  await page.evaluate(speed=>{const s=window.__game.registry.get('application').scene;s.speedControls.setSpeed(speed);s.devBalancePanel.setProfiling(false);s.devBalancePanel.setProfiling(true);},speed);
  await page.waitForTimeout(MEASURE_MS);
  const r=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,r=s.devBalancePanel.profiler.report();r.residents=s.workerSystem.liveSubjects().length;r.night=s.dayNight.isNight();r.text=s.devBalancePanel.profiler.text(r);s.devBalancePanel.setProfiling(false);return r;});
  console.log(`  ${name}: ${r.fps} FPS, frame ${r.frameMs.avg} ms avg / ${r.frameMs.p95} ms p95, step ${r.groups.total.avg} ms, sim ${r.groups.sim.avg} ms (+${r.groups.pathfinding.avg} path), render ${r.groups.render.avg} ms, ${r.residents} residents${r.night?', night':''}`);
  return {name,speed,...r,rows:r.rows.slice(0,25)};
}
export async function performanceSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);let others=[];
  try{
    await page.addInitScript(()=>{try{localStorage.setItem('newgame.terrainLift','on');localStorage.setItem('newgame.tutorial','off');localStorage.setItem('newgame.devBalance',JSON.stringify({mode:true}));localStorage.removeItem('newgame.gameSpeed');}catch{}let state=77123;Math.random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32);});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.devBalancePanel?.profiler);
    // No Escape here: since 0.86 it opens the pause menu on the map, and a paused game neither builds nor advances.
    await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();});
    // F8 toggles the profiler in Dev mode and shows its table.
    await page.keyboard.press('F8');await page.waitForFunction(()=>/Profiler \(F8\) · [\d.]+ FPS/.test(document.querySelector('#dev-profiler')?.textContent??''));
    await page.keyboard.press('F8');assert.equal(await page.locator('#dev-profiler').isHidden(),true);
    // Other pages of this browser (the smoke's main page runs its own game loop) would share the CPU: they sleep while
    // this page is measured and wake afterwards.
    others=context.pages().filter(p=>p!==page);for(const p of others)await p.evaluate(()=>window.__game?.loop?.sleep?.()).catch(()=>{});
    const renderer=await page.evaluate(()=>window.__game.renderer.type===2?'WebGL':'Canvas');
    console.log(`Performance (${renderer}, ${MEASURE_MS/1000} s per scenario):`);
    const results=[await measure(page,'start ×1',1)];
    await page.evaluate(async order=>{const s=window.__game.registry.get('application').scene;s.playerPaused=true;const queue=[...order];
      const place=()=>{const c=s.buildings.find(b=>b.type==='castle')??s.character.tile,keep=s.pointerTile;
        while(queue.length){const id=queue[0],d=s.objectRegistry.require(id),center=id==='wheat_field'?s.buildings.find(b=>b.type==='farmhouse'):c;if(!center||!s.inventory.canAfford(d.cost))return;let done=false;
          for(let r=id==='wheat_field'?2:4;r<30&&!done;r++)for(let y=center.y-r;y<=center.y+r&&!done;y++)for(let x=center.x-r;x<=center.x+r&&!done;x++){if(Math.max(Math.abs(x-center.x),Math.abs(y-center.y))!==r)continue;
            s.selectedBuilding=d;s.buildMode=true;s.previewAnchor={x,y};s.previewKey=null;s.updateBuildingPreview();if(!String(s.previewKey).endsWith(':false:null:null'))continue;
            const before=s.buildings.length;s.pointerTile=()=>({x,y});try{s.handleClick({rightButtonDown:()=>false,leftButtonDown:()=>true,updateWorldPoint(){}});}finally{s.pointerTile=keep;}if(s.buildings.length>before)done=true;}
          s.cancelBuilding?.();if(!done)return;queue.shift();}};
      place();for(const job of ['builder','hauler']){const w=s.workerSystem.liveSubjects().find(x=>x.profession==='idle');if(w)s.populationSidebar.chooseJob(w.id,job);}
      // Grow for up to 20 game days (about 24 residents), top up to 25 by immigrants at the Castle, stop at daytime.
      for(let t=0;s.workerSystem.liveSubjects().length<25&&s.gameTime.day<21;t++){s.simulationStep(50);if(t%200===0)place();if(t%2000===0)await new Promise(r=>setTimeout(r,0));}
      const c=s.buildings.find(b=>b.type==='castle')??s.character.tile,taken=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));
      for(let r=3;r<12&&s.workerSystem.liveSubjects().length<25;r++)for(let y=c.y-r;y<=c.y+r&&s.workerSystem.liveSubjects().length<25;y++)for(let x=c.x-r;x<=c.x+r&&s.workerSystem.liveSubjects().length<25;x++){const k=`${x},${y}`;if(s.map[y]?.[x]===0&&!taken.has(k)&&!s.resourceOccupancy.has(k)){s.workerSystem.create({x,y});taken.add(k);}}
      s.workerSystem.updateUI();
      for(let t=0;s.dayNight.isNight()||s.dayNight.fraction()>.45;t++){s.simulationStep(50);if(t%2000===0)await new Promise(r=>setTimeout(r,0));}
      s.refreshVisibility();s.playerPaused=false;},ORDER);
    const residents=await page.evaluate(()=>window.__game.registry.get('application').scene.workerSystem.liveSubjects().length);assert.ok(residents>=25,`the village grew to 25 residents (${residents})`);
    if(process.env.PERF_SAVE_VILLAGE)await writeFile(process.env.PERF_SAVE_VILLAGE,JSON.stringify(await page.evaluate(()=>window.__game.registry.get('application').snapshot())));
    results.push(await measure(page,'village ×1',1),await measure(page,'village ×3',3));
    await page.evaluate(async()=>{const s=window.__game.registry.get('application').scene;s.playerPaused=true;for(let t=0;!s.dayNight.isNight();t++){s.simulationStep(50);if(t%2000===0)await new Promise(r=>setTimeout(r,0));}for(let t=0;t<200;t++)s.simulationStep(50);s.refreshVisibility();s.playerPaused=false;});
    results.push(await measure(page,'night ×1',1));
    const report={renderer,measureMs:MEASURE_MS,viewport:page.viewportSize(),results};await writeFile('/tmp/perf.json',JSON.stringify(report,null,2)+'\n');
    if(process.env.PERF_WRITE_BASELINE){await writeFile(BASELINE,JSON.stringify({note:'performance-1 after-measurement (headless Chrome, software rendering). FPS may drop at most 20 % below these.',renderer,scenarios:Object.fromEntries(results.map(r=>[r.name,{fps:r.fps,frameMsAvg:r.frameMs.avg,simMsAvg:r.groups.sim.avg}]))},null,2)+'\n');console.log('  baseline written');}
    const baseline=JSON.parse(await readFile(BASELINE,'utf8'));
    for(const r of results){const b=baseline.scenarios[r.name];if(b)assert.ok(r.fps>=b.fps*(1-TOLERANCE),`${r.name}: ${r.fps} FPS is more than 20 % below the baseline ${b.fps} FPS`);}
    console.log('PASS performance: start, 25-resident village ×1/×3 and night within 20 % of the FPS baseline (/tmp/perf.json)');
    return report;
  }finally{await page.close();for(const p of others)await p.evaluate(()=>window.__game?.loop?.wake?.()).catch(()=>{});}
}

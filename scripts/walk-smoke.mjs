import assert from 'node:assert/strict';

// V03 in a real page: villagers with an approved look step through their walk sheet while they walk (several
// frames, no bob) and show the idle column when they stand.
export async function walkSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.workerSystem);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;return [...s.workerSystem.workers.values()].some(w=>w.view?.artFrame);},null,{timeout:20000});
    const seen=await page.evaluate(async()=>{const s=window.__game.registry.get('application').scene,out={walking:{},standing:[],bob:0};
      for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,50));
        for(const w of s.workerSystem.workers.values()){const v=w.view;if(!v?.artFrame||!v.art.visible)continue;const frame=Number(v.art.frame.name);
          if(v.isWalking){(out.walking[w.id]??=new Set()).add(frame);if(v.art.y!==0)out.bob++;}else if(!(w.profession==='farmer'&&w.workState==='Working'))out.standing.push(frame);}}
      return {walking:Object.fromEntries(Object.entries(out.walking).map(([k,v])=>[k,[...v]])),standing:[...new Set(out.standing)],bob:out.bob};});
    const walkers=Object.values(seen.walking);
    assert.ok(walkers.some(f=>f.length>=2),`a walking villager changes frames (${JSON.stringify(seen.walking)})`);
    assert.equal(seen.bob,0,'no bob on top of the walk cycle');
    assert.ok(seen.standing.every(f=>f%3===0),`standing villagers show the idle column (${seen.standing})`);
    if(process.env.SMOKE_SHOTS){await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,w=[...s.workerSystem.workers.values()].find(w=>w.view?.isWalking)??[...s.workerSystem.workers.values()][0];
        if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(3);s.cameras.main.centerOn(w.view.x,w.view.y-20);});
      for(let i=0;i<4;i++){await page.waitForTimeout(170);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/walk-cycle-${i}.png`,clip:{x:440,y:200,width:400,height:320}});}}
    console.log(`PASS Walk cycle: ${walkers.filter(f=>f.length>=2).length} walking villager(s) stepped through walk-sheet frames, standing ones show idle`);
  }finally{await page.close();}
}

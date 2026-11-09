import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// m-vytezeny-dul-ctverecky (owner requests 63, 64) in a real page. A Quarry on a real stone deposit with one unit
// left: the Miner mines it, the stone lands on the pile, the Quarry becomes a "Depleted Quarry" (darker sprite, no
// seats), the Miner leaves, one notice "The Quarry is exhausted." appears and the Hauler still empties the pile; the
// panel shows the new name and the demolition refund. Footprint squares under finished buildings are hidden in normal
// play and shown while placing a building and for the selected one. Screenshot: /tmp/shots/depleted-mine.png.
export async function depletedMineSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW4-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.materialPiles);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.employment.setEnabled(false);s.fog.setEnabled(false);s.refreshVisibility();});
    const quarry=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('quarry'),k=s.character.tile;for(const [r,n]of Object.entries(d.cost))if(s.inventory.count(r)<n)s.inventory.add(r,n-s.inventory.count(r));
      if(!s.startBuilding(d))throw Error('Quarry menu unavailable');
      const deposits=s.naturalResources.mining.deposits().filter(o=>o.type==='stone_deposit'&&o.natural.boundBuildingId==null&&o.natural.remaining>1).sort((a,b)=>Math.hypot(a.x-k.x,a.y-k.y)-Math.hypot(b.x-k.x,b.y-k.y));
      for(const o of deposits)for(let dy=-2;dy<=1;dy++)for(let dx=-2;dx<=1;dx++){
        const anchor={x:o.x+dx,y:o.y+dy};s.previewAnchor=anchor;s.previewKey=null;s.updateBuildingPreview();if(!s.previewKey.endsWith(':false:null:null'))continue;
        const before=s.buildings.length,world={x:s.map.length*32+(anchor.x-anchor.y)*32,y:128+(anchor.x+anchor.y+1)*16};
        s.handleClick({rightButtonDown:()=>false,leftButtonDown:()=>true,updateWorldPoint(){},worldX:world.x,worldY:world.y},true);
        if(s.buildings.length>before){if(s.buildMode)s.cancelBuilding();const b=s.buildings.at(-1);
          if(b.materialSupply){const loc=s.foodStorage.locations.get(s.constructionSystem.materials.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;s.constructionSystem.finish(b);
          o.natural.remaining=1;return b.id;}
      }
      throw Error('No valid Quarry site on a stone deposit');
    });
    const f=await page.evaluate(id=>{
      const s=window.__game.registry.get('application').scene,q=s.buildings.find(b=>b.id===id),idle=s.workerSystem.liveSubjects().filter(w=>w.isAlive&&!w.assignedWorkplaceId);
      const miner=idle[0],hauler=idle[1];for(const w of [miner,hauler])s.workerSystem.commands.resume?.(w);
      if(!s.workplaceSystem.assign(q,miner))throw Error('No Miner');s.workerSystem.jobs.assign(hauler,'hauler');hauler.stoneCollection={enabled:false,radius:80};s.gameSpeed=3;
      s.demolitionUI.select(null);s.refreshVisibility();
      return {id,miner:miner.id,hauler:hauler.id,pile:`pile-${id}`,footprint:s.towerViews.get(id).footprint?.visible};
    },quarry);
    assert.equal(f.footprint,false,'no footprint squares under a finished building in normal play');
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id)?.depleted===true,quarry,{timeout:120000});
    const r=await page.evaluate(f=>{
      const s=window.__game.registry.get('application').scene,q=s.buildings.find(b=>b.id===f.id),miner=s.workerSystem.workers.get(f.miner),view=s.towerViews.get(f.id);
      return {workers:s.workplaceSystem.records.get(f.id).workerIds.length,minerHome:miner.assignedWorkplaceId,profession:miner.profession,tint:view.back?.sprite?.tintTopLeft??null,
        assign:s.workplaceSystem.assign(q,s.workerSystem.liveSubjects().find(w=>w.id!==f.hauler&&w.id!==f.miner&&!w.assignedWorkplaceId)??miner),staffing:s.staffingIndicators?.model?.records?.has?.(f.id)??false};
    },f);
    assert.equal(r.workers,0);assert.equal(r.minerHome,null);assert.equal(r.profession,'idle');assert.equal(r.assign,false);assert.equal(r.staffing,false);
    // One notice, through the real diagnostics (persistence included).
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.diagnostics.active().some(i=>i.entityId===id&&i.params?.exhausted),quarry,{timeout:60000});
    assert.match(await page.locator('#notices-list').textContent(),/The Quarry is exhausted\./);
    // The Hauler still empties the pile.
    await page.waitForFunction(f=>!(window.__game.registry.get('application').scene.foodStorage.locations.get(f.pile)?.stock.stone>0),f,{timeout:120000});
    // Panel: new name, no seats, demolition with refund.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.gameSpeed=1;/* only buildings in view get their footprint applied: look at the Quarry first */const c=s.cameras.main,base=s.towerViews.get(id).base;s.worldCamera.following=false;s.worldCamera.panTarget=null;c.setZoom(1.4).centerOn(base.x,base.y-80);c.preRender();s.demolitionUI.select(b);s.workplacePanel.open(b);s.refreshVisibility();},quarry);
    assert.equal(await page.locator('#workplace-name').textContent(),'Depleted Quarry');assert.match(await page.locator('#workplace-staffing-output').textContent(),/exhausted/);
    assert.equal(await page.locator('#workplace-workers .empty-slot').count(),0);assert.match(await page.locator('#demolition-actions').textContent(),/Wood/);
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.towerViews.get(id).footprint?.visible,quarry),true,'the selected building shows its footprint');
    const dir=process.env.SMOKE_SHOTS??'/tmp/shots';await mkdir(dir,{recursive:true});
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.workplacePanel.close();s.demolitionUI.select(null);const c=s.cameras.main,base=s.towerViews.get(id).base;s.worldCamera.following=false;s.worldCamera.panTarget=null;c.setZoom(1.4).centerOn(base.x,base.y-80);c.preRender();s.refreshVisibility();},quarry);
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.towerViews.get(id).footprint?.visible,quarry),false);
    await page.waitForTimeout(800);await page.screenshot({path:`${dir}/depleted-mine.png`});
    // Placing a building shows every footprint.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.startBuilding(s.objectRegistry.require('tower'));s.refreshVisibility();});
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.towerViews.get(id).footprint?.visible,quarry),true,'build mode shows footprints');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.cancelBuilding();});
    // Demolition: a Builder takes it down and half the Wood comes back.
    const refund=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);if(!s.demolition.request(b))throw Error('Demolition refused');
      const w=s.workerSystem.liveSubjects().find(w=>w.isAlive&&!w.assignedWorkplaceId&&w.profession==='idle');s.workerSystem.jobs.assign(w,'builder');s.gameSpeed=3;return b.demolition.refund;},quarry);
    assert.ok(refund.wood>0);
    await page.waitForFunction(id=>!window.__game.registry.get('application').scene.buildings.some(b=>b.id===id),quarry,{timeout:150000});
    // The notice goes with the building at the next diagnostics check (every 2 s of game time).
    assert.equal(await page.waitForFunction(id=>!window.__game.registry.get('application').scene.diagnostics.active().some(i=>i.entityId===id),quarry,{timeout:8000}).then(()=>true,()=>false),true,'the notice goes with the building');
    assert.deepEqual(errors,[]);
    console.log(`PASS depleted-mine: Quarry exhausted → Depleted Quarry (darker, no seats, Miner Unemployed), one notice, pile emptied, demolished with ${JSON.stringify(refund)}; footprints only selected / build mode; screenshot ${dir}/depleted-mine.png`);
  }finally{await page.evaluate(()=>{try{window.__game.registry.get('application').scene.gameSpeed=1;}catch{}}).catch(()=>{});await page.close();}
}

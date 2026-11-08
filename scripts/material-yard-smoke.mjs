import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { placeBlueprint } from './building-menu-smoke.mjs';

// m-sklady-materialu-koncept (owner requests 21, 49) in a real page: a Material Yard from the building menu and a Quarry
// on a real stone deposit (fog off, so the nearest deposit is in sight); the Miner drops stone on the Quarry's pile, a Hauler carries it to the yard and the yard's
// stone pile grows. Screenshot: /tmp/shots/material-yard.png (SMOKE_SHOTS overrides the folder).
const finish=(page,ids)=>page.evaluate(ids=>ids.map(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);}),ids);
export async function materialYardSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.setViewportSize({width:1280,height:800});
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW3-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.materialPiles);
    if(await page.locator('#help-dialog[open]').waitFor({timeout:10000}).then(()=>true,()=>false))await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.employment.setEnabled(false);s.fog.setEnabled(false);s.refreshVisibility();});
    // The yard comes from the real building menu (Logistics & Trade), the Quarry through the real placement click.
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.objectRegistry.require('material_yard').name),'Material Yard');
    const yard=await placeBlueprint(page,'material_yard');
    const quarry=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('quarry'),k=s.character.tile;for(const [r,n]of Object.entries(d.cost))if(s.inventory.count(r)<n)s.inventory.add(r,n-s.inventory.count(r));
      if(!s.startBuilding(d))throw Error('Quarry menu unavailable');
      const deposits=s.naturalResources.mining.deposits().filter(o=>o.type==='stone_deposit'&&o.natural.boundBuildingId==null&&o.natural.remaining>5).sort((a,b)=>Math.hypot(a.x-k.x,a.y-k.y)-Math.hypot(b.x-k.x,b.y-k.y));
      const keys=[];for(const o of deposits)for(let dy=-2;dy<=1;dy++)for(let dx=-2;dx<=1;dx++){
        const anchor={x:o.x+dx,y:o.y+dy};s.previewAnchor=anchor;s.previewKey=null;s.updateBuildingPreview();keys.push(s.previewKey);if(!s.previewKey.endsWith(':false:null:null'))continue;
        const before=s.buildings.length,world={x:s.map.length*32+(anchor.x-anchor.y)*32,y:128+(anchor.x+anchor.y+1)*16};
        s.handleClick({rightButtonDown:()=>false,leftButtonDown:()=>true,updateWorldPoint(){},worldX:world.x,worldY:world.y},true);
        if(s.buildings.length>before){if(s.buildMode)s.cancelBuilding();const b=s.buildings.at(-1);return {id:b.id,deposit:o.natural.id};}
      }
      throw Error(`No valid Quarry site on a stone deposit (${deposits.length}): ${keys.slice(0,4).join(' | ')}`);
    });
    assert.deepEqual(await finish(page,[yard.id,quarry.id]),[true,true]);
    const f=await page.evaluate(({yard,quarry})=>{
      const s=window.__game.registry.get('application').scene,st=s.foodStorage,y=`yard-${yard}`,pile=`pile-${quarry}`;
      // Some stock first so all four fields show a pile; the stone field then grows from real hauled stone.
      st.deposit(y,'wood',90);st.deposit(y,'iron_ore',40);st.deposit(y,'iron',12);
      const q=s.buildings.find(b=>b.id===quarry),idle=s.workerSystem.liveSubjects().filter(w=>w.isAlive&&!w.assignedWorkplaceId);
      const miner=idle[0],hauler=idle[1];for(const w of [miner,hauler])s.workerSystem.commands.resume?.(w);
      if(!s.workplaceSystem.assign(q,miner))throw Error('No Miner');s.workerSystem.jobs.assign(hauler,'hauler');hauler.stoneCollection={enabled:false,radius:80};
      s.gameSpeed=3;s.refreshVisibility();
      return {yard:y,pile,miner:miner.id,hauler:hauler.id,quarry,yardBuilding:yard,stages:{...s.towerViews.get(yard).stages},deposit:q.depositId};
    },{yard:yard.id,quarry:quarry.id});
    assert.ok(f.deposit,'the Quarry is bound to a finite deposit');assert.deepEqual(f.stages,{wood:4,stone:0,iron_ore:2,iron:1});
    // The Miner never walks to a store: the first mined stone lands on the Quarry pile.
    await page.waitForFunction(f=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(f.miner);return w.workTask?.kind==='mineDeposit'&&w.workTask.destinationId===f.pile;},f,{timeout:30000});
    await page.waitForFunction(f=>{const s=window.__game.registry.get('application').scene;return (s.foodStorage.locations.get(f.yard).stock.stone??0)>=3;},f,{timeout:150000});
    const r=await page.evaluate(f=>{const s=window.__game.registry.get('application').scene,view=s.towerViews.get(f.yardBuilding),image=s.materialPiles.images.get(f.pile);
      const tasks=s.workerSystem.workers.get(f.hauler).skills.logistics.totalXP;
      return {stone:s.foodStorage.locations.get(f.yard).stock.stone,stages:{...view.stages},texture:view.piles[1].texture?.key,pileImage:!!image,hauler:tasks};},f);
    assert.ok(r.stone>=3);assert.ok(r.stages.stone>=1,'the yard stone pile grows');assert.equal(r.texture,`material-pile:stone:${r.stages.stone}`);assert.ok(r.pileImage,'the Quarry pile is drawn');assert.ok(r.hauler>0,'the Hauler carried it');
    // Without the Hauler the Quarry pile grows by the building (and shows a bigger size).
    await page.evaluate(f=>{const s=window.__game.registry.get('application').scene;s.workerSystem.jobs.assign(s.workerSystem.workers.get(f.hauler),'idle');},f);
    await page.waitForFunction(f=>{const s=window.__game.registry.get('application').scene;return (s.foodStorage.locations.get(f.pile).stock.stone??0)>=6;},f,{timeout:120000});
    assert.equal(await page.evaluate(f=>{const s=window.__game.registry.get('application').scene;s.gameSpeed=1;s.refreshVisibility();return s.materialPiles.images.get(f.pile).texture.key;},f),'material-pile:stone:2');
    // Look at the yard and the Quarry together for the screenshot.
    await page.evaluate(f=>{const s=window.__game.registry.get('application').scene,a=s.towerViews.get(f.yardBuilding).base,b=s.materialPiles.images.get(f.pile);
      const c=s.cameras.main,zoom=Math.max(.6,Math.min(1.6,(c.height-260)/(Math.abs(a.y-b.y)+200),(c.width-300)/(Math.abs(a.x-b.x)+260)));
      // The HUD covers the top of the map: aim a little above the middle of the two.
      s.worldCamera.following=false;s.worldCamera.panTarget=null;c.setZoom(zoom).centerOn((a.x+b.x)/2,(a.y+b.y)/2-30-60/zoom);c.preRender();},f);
    await page.waitForTimeout(1500);const dir=process.env.SMOKE_SHOTS??'/tmp/shots';await mkdir(dir,{recursive:true});await page.screenshot({path:`${dir}/material-yard.png`});
    assert.deepEqual(errors,[]);
    console.log(`PASS Material Yard: menu blueprint, real Quarry on a deposit, Miner fills the Quarry pile, Hauler carries ${r.stone} stone to the yard, yard piles ${JSON.stringify(r.stages)}; screenshot ${dir}/material-yard.png`);
  }finally{await page.close();}
}

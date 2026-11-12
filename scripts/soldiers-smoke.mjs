import assert from 'node:assert/strict';
import { placeBlueprint,supplyAndBuild,clickBuilding } from './building-menu-smoke.mjs';

// m-vojaci-chyba (owner point 87) in its own page: a default New Game shows the starting garrison awake by the Castle and
// in the Population "Soldiers" group (a click finds him); a Barracks names what is missing (Armory, Sword) instead of an
// idle Train button; with an Armory and a Sword a new Soldier trains and is found through Population too.
export async function soldiersSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.military);
    await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.waitForTimeout(1500);
    // Day 1 dawn: the garrison stands watch instead of going to sleep in the Castle at once.
    const garrison=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return [...s.military.units.keys()].map(id=>{const w=s.workerSystem.workers.get(id);return {id,asleep:w.sleepingIn!=null,going:w.workState==='Going Home'};});});
    assert.equal(garrison.length,4);assert.ok(garrison.every(g=>!g.asleep&&!g.going),JSON.stringify(garrison));
    await page.locator('#population-tab').click();await page.locator('#population-soldiers:not([hidden])').waitFor();
    assert.equal(await page.locator('#population-soldiers .population-soldier').count(),4);assert.match(await page.locator('#population-soldiers summary').textContent(),/Soldiers · 4/);
    const first=page.locator('#population-soldiers .population-soldier').first(),id=await first.getAttribute('data-soldier-id');await first.click();
    await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return s.populationSidebar.selectedId===id&&s.worldCamera.panTarget;},id);
    assert.match(await page.locator('#camera-mode').textContent(),/./);await page.locator('#close-population').click();
    // A Barracks with a recruit: the lock names the Armory, then the Sword and who makes it.
    const barracks=await placeBlueprint(page,'barracks');await supplyAndBuild(page,barracks);
    // The Armory is only a blueprint yet: it does not count until finished.
    const armory=await placeBlueprint(page,'armory');
    const recruit=await page.evaluate(b=>{const s=window.__game.registry.get('application').scene,all=s.workerSystem.liveSubjects();s.employment?.setEnabled(false);
      // Auto-employment may already have staffed the new Barracks; otherwise one resident is assigned.
      let w=all.find(w=>w.assignedWorkplaceId===b&&!s.military.unit(w));if(!w){w=all.filter(w=>!w.arriving&&w.profession!=='soldier').sort((p,q)=>(p.profession==='idle'?0:1)-(q.profession==='idle'?0:1))[0];s.workplaceSystem.assign(s.buildings.find(x=>x.id===b),w);}return w.id;},barracks.id);
    await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    const row=page.locator(`.military-soldier[data-soldier="${recruit}"]`);
    assert.equal(await row.locator('[data-train="soldier"]').isDisabled(),true);assert.match(await row.locator('.military-reason').textContent(),/Armory/);
    assert.match(await page.locator('[data-unit-type="soldier"] .unit-type-blocked').textContent(),/Armory/);await page.locator('#close-workplace').click();
    // The Armory is built by the King through the same command as "Build with King" (its blueprint may be hidden behind
    // the Barracks roof, so it is not clicked).
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.constructionSystem.commandKing(s.buildings.find(b=>b.id===id),{fetch:true});},armory.id);
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id)?.construction?.state==='complete',armory.id,{timeout:180000});
    await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    assert.match(await row.locator('.military-reason').textContent(),/1 Sword.*Swordsmith.*Iron/);
    await page.evaluate(a=>{const s=window.__game.registry.get('application').scene;s.foodStorage.deposit(`armory-${a}`,'sword',1);const h=s.workerSystem.liveSubjects().find(w=>!w.arriving&&!['soldier','hauler'].includes(w.profession));if(h&&!s.workerSystem.liveSubjects().some(w=>w.profession==='hauler')){s.workerSystem.jobs.assign(h,'hauler');h.stoneCollection={enabled:false,radius:80};}s.updateInventory();},armory.id);
    await page.locator('#close-workplace').click();await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    assert.equal(await row.locator('[data-train="soldier"]').isDisabled(),false);assert.equal(await row.locator('.military-reason').count(),0);
    await row.locator('[data-train="soldier"]').click();await page.locator('#close-workplace').click();
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.military.units.get(id)?.type==='soldier',recruit,{timeout:120000});
    // The new Soldier is in the Population Soldiers group and a click finds him.
    await page.locator('#population-tab').click();const mine=page.locator(`#population-soldiers [data-soldier-id="${recruit}"]`);await mine.waitFor();
    assert.ok(await page.locator('#population-soldiers .population-soldier').count()>=5,'garrison + the new Soldier (auto-employment may staff more recruits)');await mine.click();
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.populationSidebar.selectedId===id,recruit);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/soldiers.png`});
    console.log('PASS m-vojaci-chyba: garrison awake on day 1 and listed under Population › Soldiers (click finds him); Barracks lock names Armory, then 1 Sword (Swordsmith, Iron); a new Soldier trains and is found via Population');
  }finally{await page.close();}
}

// kasarna-branci (owner 9 Nov 2026): a default New Game with a finished Barracks; residents hired there (automatic
// employment, topped up to three) are Recruits at once (no weapon, Recruit stats), are listed as Recruits in Population and in the Barracks window (12 places), patrol;
// with a Bow in an Armory the window's Train Archer button turns one Recruit into an Archer who keeps his place.
export async function recruitsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const shots=process.env.SMOKE_SHOTS;
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.military);
    await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.waitForTimeout(1000);
    const barracks=await placeBlueprint(page,'barracks');await supplyAndBuild(page,barracks);
    // Auto-employment staffs the new Barracks by itself; it is switched off then, and residents are added up to three.
    const recruits=await page.evaluate(b=>{const s=window.__game.registry.get('application').scene;s.employment?.setEnabled(false);const home=s.buildings.find(x=>x.id===b);
      for(const w of s.workerSystem.liveSubjects().filter(w=>!w.arriving&&w.profession!=='soldier')){if(s.workplaceSystem.employees(home).length>=3)break;s.workplaceSystem.assign(home,w);}
      s.updateInventory?.();return s.workplaceSystem.employees(home).map(w=>w.id);},barracks.id);
    assert.ok(recruits.length>=3,`hired ${JSON.stringify(recruits)}`);const n=recruits.length;
    await page.waitForTimeout(500);
    const state=await page.evaluate(ids=>{const s=window.__game.registry.get('application').scene;return ids.map(id=>{const w=s.workerSystem.workers.get(id);return {recruit:s.military.isRecruit(w),unit:!!s.military.unit(w),hp:w.maxHP,dps:w.attackDPS,wage:s.wageSystem.dailyWage(w)};});},recruits);
    assert.ok(state.every(r=>r.recruit&&!r.unit&&r.hp===70&&r.dps===6&&r.wage===1),JSON.stringify(state));
    // Patrolling near the Barracks.
    await page.waitForFunction(ids=>{const s=window.__game.registry.get('application').scene;return ids.some(id=>s.workerSystem.workers.get(id).workState==='Patrolling');},recruits,{timeout:120000});
    // Population: the Soldiers group lists the Recruits as Recruits.
    await page.locator('#population-tab').click();await page.locator('#population-soldiers:not([hidden])').waitFor();
    assert.match(await page.locator('#population-soldiers summary').textContent(),new RegExp(`Soldiers · ${4+n} · ${n} Recruits`));
    if(!await page.locator('#population-soldiers[open]').count())await page.locator('#population-soldiers summary').click();
    assert.match(await page.locator(`#population-soldiers [data-soldier-id="${recruits[0]}"]`).textContent(),/Recruit ·/);
    if(shots)await page.screenshot({path:`${shots}/recruits-population.png`});
    await page.locator('#close-population').click();
    // The Barracks window: 3/12 places, three Recruits, no trained unit yet; Train Archer names the missing Armory.
    await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    assert.match(await page.locator('.military-places').textContent(),new RegExp(`${n}/12 places`));
    const heads=await page.locator('#military-details h4').allTextContents();assert.deepEqual(heads,[`Recruits · ${n}`,'Trained units · 0']);
    const row=page.locator(`.military-soldier[data-soldier="${recruits[0]}"]`);assert.equal(await row.locator('[data-train="archer"]').isDisabled(),true);
    assert.match(await row.locator('[data-train="archer"]').getAttribute('title'),/Armory/);
    if(shots){await page.locator("#military-details").scrollIntoViewIfNeeded();await page.locator("#military-details").screenshot({path:`${shots}/recruits-barracks.png`});}
    await page.locator('#close-workplace').click();
    // An Armory with a Bow (dev resources) and a Hauler: Train Archer.
    const armory=await placeBlueprint(page,'armory');
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.constructionSystem.commandKing(s.buildings.find(b=>b.id===id),{fetch:true});},armory.id);
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id)?.construction?.state==='complete',armory.id,{timeout:180000});
    await page.evaluate(a=>{const s=window.__game.registry.get('application').scene;s.foodStorage.deposit(`armory-${a}`,'bow',1);s.inventory.add('gold',20);
      if(!s.workerSystem.liveSubjects().some(w=>w.profession==='hauler')){const h=s.workerSystem.liveSubjects().find(w=>!w.arriving&&!['soldier'].includes(w.profession));if(h){s.workerSystem.jobs.assign(h,'hauler');h.stoneCollection={enabled:false,radius:80};}}s.updateInventory?.();},armory.id);
    await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    assert.equal(await row.locator('[data-train="archer"]').isDisabled(),false,`Archer free: ${await row.locator('[data-train="archer"]').getAttribute('title')}`);assert.equal(await row.locator('[data-train="soldier"]').isDisabled(),true,'no Sword: Soldier stays locked');
    await row.locator('[data-train="archer"]').click();await page.locator('#close-workplace').click();
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.military.units.get(id)?.type==='archer',recruits[0],{timeout:180000});
    const archer=await page.evaluate(({id,b})=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return {range:w.attackRange,home:w.assignedWorkplaceId===b,recruit:s.military.isRecruit(w)};},{id:recruits[0],b:barracks.id});
    assert.deepEqual(archer,{range:6,home:true,recruit:false});
    await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    assert.deepEqual(await page.locator('#military-details h4').allTextContents(),[`Recruits · ${n-1}`,'Trained units · 1']);
    assert.match(await page.locator(`.military-units .military-soldier[data-soldier="${recruits[0]}"]`).textContent(),/Archer/);
    if(shots){await page.locator("#military-details").scrollIntoViewIfNeeded();await page.locator("#military-details").screenshot({path:`${shots}/recruits-archer.png`});}
    await page.locator('#close-workplace').click();
    console.log(`PASS kasarna-branci: ${n} residents hired into a Barracks are Recruits at once (no weapon, 70 HP, 6 DPS, wage 1), patrol, show as Recruits in Population and the Barracks window (${n}/12 places); with a Bow in an Armory Train Archer makes an Archer who keeps his place`);
  }finally{await page.close();}
}

import assert from 'node:assert/strict';

// m-hlasky-udalosti in a real page: a feed line with a place moves the camera there; a resident killed by a wolf gets a
// red danger mark, a feed line with the cause and a line in the Deceased list (kept by Save/Load).
export async function eventsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.dangerMarks);await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog?.setEnabled?.(false);s.eventFeed.push('smoke:place','Something happened far away',{important:true,target:{x:62,y:38}});});
    // The click is near the screen edge; the pointer then moves to the middle so edge-scrolling does not move the camera.
    await page.locator('#event-feed .is-locatable').first().click();await page.mouse.move(720,450);await page.waitForTimeout(700);
    const cam=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.cameras.main,w={x:s.map.length*32+(62-38)*32,y:128+(62+38)*16};return Math.hypot(c.midPoint.x-w.x,c.midPoint.y-w.y);});
    assert.ok(cam<40,`camera moved to the event (${Math.round(cam)} px)`);
    const death=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.liveSubjects()[0];s.cameras.main.centerOn(...(()=>{const p={x:s.map.length*32+(w.position.x-w.position.y)*32,y:128+(w.position.x+w.position.y)*16};return [p.x,p.y];})());
      s.combat.handleDeath(w,{definition:{id:'wolf'}});s.eventFeed.onPopulation();return {name:w.name,marks:s.dangerMarks.marks.filter(m=>!m.ping).length,deceased:s.workerSystem.deceased.length};});
    assert.equal(death.marks,1,'a red danger mark');assert.equal(death.deceased,1);
    assert.match(await page.locator('#event-feed').textContent(),new RegExp(`${death.name} died – killed by a Wolf`));
    await page.locator('#population-tab').click();await page.waitForFunction(()=>/Deceased \(1\)/.test(document.querySelector('#population-deceased summary')?.textContent??''),null,{timeout:5000}).catch(()=>{});assert.match(await page.locator('#population-deceased').textContent(),/Deceased \(1\)/);
    await page.locator('#population-deceased summary').click();assert.match(await page.locator('#population-deceased-list').textContent(),/killed by a Wolf · day \d+/);
    const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot().population.deceased);assert.equal(saved.length,1);assert.equal(saved[0].cause,'killed:wolf');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/events.png`});
    console.log('PASS Events: a feed line moves the camera to its place, a death by a wolf leaves a red mark, a feed line with the cause and a saved Deceased entry');
  }finally{await page.close();}
}

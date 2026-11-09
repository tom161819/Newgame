import assert from 'node:assert/strict';

// Domestic animals Z2 in a real page: a stray dog near the castle, a click opens its panel, "Try to tame" with a
// Hunter (dice fixed for the smoke), the dog joins the Hunter and the hunting bonus applies.
export async function dogSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.domestic);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const setup=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.domestic,w=s.workerSystem.liveWorkers()[0];w.profession='hunter';
      d.random=()=>.01;d.nextDogAt=0;d.update(16);const dog=[...d.dogs.values()].find(g=>g.state==='stray');dog.x=s.character.tile.x+2.5;dog.y=s.character.tile.y+2.5;dog.home={x:dog.x,y:dog.y};dog.target=null;dog.wait=99;
      s.fog?.setEnabled?.(false);if(s.worldCamera)s.worldCamera.following=false;s.domesticViews.update(16);s.cameras.main.centerOn(dog.view.x,dog.view.y);return {dog:dog.id,hunter:w.id};});
    await page.waitForTimeout(400);
    const point=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,g=s.domestic.dogs.get(id),cam=s.cameras.main,r=s.game.canvas.getBoundingClientRect();s.domesticViews.update(16);
      return {x:r.left+(g.view.x-cam.worldView.x)*cam.zoom*(r.width/s.game.canvas.width),y:r.top+(g.view.y-8-cam.worldView.y)*cam.zoom*(r.height/s.game.canvas.height)};},setup.dog);
    await page.mouse.click(point.x,point.y);await page.locator('#cat-dialog[open]').waitFor({timeout:5000});
    assert.match(await page.locator('#cat-details').textContent(),/stray dog/i);await page.waitForFunction(id=>/28 %/.test(document.querySelector(`[data-dog-hunter="${id}"]`)?.textContent??''),setup.hunter,{timeout:5000});
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/stray-dog.png`});
    await page.locator(`[data-dog-hunter="${setup.hunter}"]`).click();
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.domestic.dogs.get(id)?.state==='owned',setup.dog,{timeout:60000});
    const owned=await page.evaluate(({dog,hunter})=>{const s=window.__game.registry.get('application').scene,d=s.domestic,w=s.workerSystem.workers.get(hunter),g=d.dogs.get(dog);
      for(let i=0;i<50;i++)d.update(100);return {hunter:g.hunterId,speed:w.speedFactor,damage:w.damageFactor,near:Math.hypot(g.x-w.position.x,g.y-w.position.y)};},setup);
    assert.equal(owned.hunter,setup.hunter);assert.ok(owned.near<=3,`the dog stays with its Hunter (${owned.near})`);assert.equal(owned.speed,1.3);assert.equal(owned.damage,1.5);
    console.log('PASS Domestic animals Z2: a stray dog clicked, tamed by a Hunter (28 % shown, dice fixed), it follows him and the hunting bonus applies');
  }finally{await page.close();}
}

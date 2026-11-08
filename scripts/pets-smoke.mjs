import assert from 'node:assert/strict';

// Domestic animals Z1 in a real page: rats breed in the Starter Stockpile's food, a stray cat comes, a click on it
// opens its panel, "Take in" sends it to the stockpile and the rats go down.
export async function petsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW3-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.domestic);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    // Fill the stockpile with grain and leave it without a cat for sixteen days (one long update: rat growth is linear).
    const store=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.domestic,l=d.foodLocations()[0];
      s.foodStorage.deposit(l.id,'wheat',s.foodStorage.room(l.id,'wheat'));d.nextStrayAt=Infinity;d.update(16*s.gameTime.dayDuration);return {id:l.id,building:l.buildingId,rats:d.ratsAt(l.id)};});
    assert.ok(store.rats>=34,`Many rats after sixteen days (${store.rats})`);
    // A stray arrives next to the castle (moved into view for the click).
    const target=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.domestic;d.nextStrayAt=0;d.update(16);const cat=[...d.cats.values()].find(c=>c.state==='stray');
      cat.x=s.character.tile.x+2.5;cat.y=s.character.tile.y+2.5;cat.home={x:cat.x,y:cat.y};cat.target=null;cat.wait=99;s.fog?.setEnabled?.(false);if(s.worldCamera)s.worldCamera.following=false;s.domesticViews.update(16);s.cameras.main.centerOn(cat.view.x,cat.view.y);return cat.id;});
    await page.waitForTimeout(400);
    const point=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,c=s.domestic.cats.get(id),cam=s.cameras.main,r=s.game.canvas.getBoundingClientRect();s.domesticViews.update(16);
      return {x:r.left+(c.view.x-cam.worldView.x)*cam.zoom*(r.width/s.game.canvas.width),y:r.top+(c.view.y-6-cam.worldView.y)*cam.zoom*(r.height/s.game.canvas.height)};},target);
    await page.mouse.click(point.x,point.y);await page.locator('#cat-dialog[open]').waitFor({timeout:5000});
    assert.match(await page.locator('#cat-details').textContent(),/stray cat/i);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/stray-cat.png`});
    await page.locator(`[data-cat-home="${store.building}"]`).click();assert.equal(await page.locator('#cat-dialog[open]').count(),0);
    const after=await page.evaluate(({id,store})=>{const s=window.__game.registry.get('application').scene,d=s.domestic,c=d.cats.get(id);for(let i=0;i<400&&c.walking!==false;i++)d.update(200);c.walking=false;
      const before=d.ratsAt(store);d.update(s.gameTime.dayDuration);return {state:c.state,building:c.buildingId,before,after:d.ratsAt(store)};},{id:target,store:store.id});
    assert.equal(after.state,'home');assert.equal(after.building,store.building);assert.ok(after.after<=after.before-20,`rats go down with a cat (${after.before} → ${after.after})`);
    // The storage panel shows the rats line.
    await page.evaluate(b=>{const s=window.__game.registry.get('application').scene;s.storagePanel.open(s.buildings.find(x=>x.id===b));},store.building);
    assert.match(await page.locator('[data-rats]').first().textContent(),/Rats: .* · cats 1 \//);
    console.log(`PASS Domestic animals Z1: ${Math.round(store.rats)} rats after sixteen days without a cat, a stray cat clicked and taken in, rats ${Math.round(after.before)} → ${Math.round(after.after)} in a day, storage panel line`);
  }finally{await page.close();}
}

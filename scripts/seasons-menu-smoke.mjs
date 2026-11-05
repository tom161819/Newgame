import assert from 'node:assert/strict';
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function pixelHash(page){await frame(page);return page.evaluate(()=>{const s=window.__game.registry.get('application').scene,chunk=s.terrain.chunks.get('5,5');if(!chunk?.visible)throw Error('Expected a visible terrain chunk.');const canvas=chunk.texture.getSourceImage(),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261;for(let i=0;i<pixels.length;i+=64)hash=Math.imul(hash^pixels[i],16777619);return hash>>>0;});}
async function loadPaused(page,state){
  await page.evaluate(async state=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__restored=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('test',true);window.__restored=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__restored);
}
export async function seasonsMenuSmoke(page){
  if(!await page.locator('#seasons-toggle').count())return;
  const original=await page.evaluate(()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('test',true);return app.snapshot();});
  assert.equal(original.gameSettings.seasonsEnabled,false);assert.equal(original.seasons.enabled,false);assert.equal(original.seasons.season,'Summer');assert.match(await page.locator('#season-weather').textContent(),/Summer \(Seasons OFF\)/);
  await page.locator('#settings-button').click();assert.equal(await page.locator('#seasons-toggle').isChecked(),false);assert.match(await page.locator('label[for="seasons-toggle"]').getAttribute('title'),/Disable seasonal changes/);await page.locator('#seasons-toggle').check();
  const winter=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.workerSystem.unsubscribe();s.seasons.random=()=>0;s.gameTime.setPaused(false);s.gameTime.update(15*s.gameTime.dayDuration+23456);s.gameTime.setPaused(true);return {day:s.seasons.cycleDay,elapsed:s.seasons.cycleElapsed,weather:s.seasons.weather};});
  assert.equal(winter.day,16);assert.equal(winter.elapsed,23456);assert.match(await page.locator('#season-weather').textContent(),/Winter/);const winterPixels=await pixelHash(page);
  await page.locator('#seasons-toggle').uncheck();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.terrain.season),'Summer');assert.notEqual(await pixelHash(page),winterPixels,'Terrain pixels change immediately while Settings keeps simulation paused.');
  const record=await page.evaluate(async()=>{const app=window.__game.registry.get('application'),s=app.scene;s.gameTime.setPaused(false);s.gameTime.update(10*s.gameTime.dayDuration+9876);s.gameTime.setPaused(true);return app.saves.save({name:'Season cycle browser smoke',state:app.snapshot()});});
  assert.equal(record.state.seasons.cycleDay,16);assert.equal(record.state.seasons.cycleElapsed,23456);assert.equal(record.state.seasons.season,'Summer');assert.equal(record.state.seasons.rememberedSeason,'Winter');
  await page.locator('#close-settings').click();await loadPaused(page,record.state);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),record.state);await page.evaluate(id=>window.__game.registry.get('application').saves.delete(id),record.id);
  await page.locator('#settings-button').click();assert.equal(await page.locator('#seasons-toggle').isChecked(),false);await page.locator('#seasons-toggle').check();
  const resumed=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {day:s.seasons.cycleDay,elapsed:s.seasons.cycleElapsed,season:s.seasons.season,terrain:s.terrain.season};});assert.deepEqual(resumed,{day:16,elapsed:23456,season:'Winter',terrain:'Winter'});assert.equal(await pixelHash(page),winterPixels);
  await page.locator('#close-settings').click();await loadPaused(page,original);assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),original);await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('test',false));
  console.log('PASS New Game Seasons OFF, live winter/summer pixels while paused, ten ordinary days with frozen cycle, exact IndexedDB Load and winter resumption');
}

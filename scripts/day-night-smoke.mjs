import assert from 'node:assert/strict';

// Day and night N1 in a real page: day → dusk → night → dawn. The HUD shows the part of the day, the light map
// darkens the world at night (lights cut holes), sight shrinks to a third outside light, Skip to dawn runs the night
// fast and stops at dawn, and the frame rate at night. Screenshots: SMOKE_SHOTS/night-*.png.
export async function dayNightSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.dayNight);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const state=()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene,radii=Object.fromEntries([...s.fog.painted].map(([id,v])=>[id,Number(v.key.split(',')[2])]));return {radii,part:s.dayNight.part(),hud:document.querySelector('#day-part').dataset.part,overlay:s.nightOverlay.dark.visible,
      king:radii.character,skip:!document.querySelector('#skip-to-dawn').hidden,elapsed:s.gameTime.elapsed/s.gameTime.dayDuration,day:s.gameTime.day};});
    await page.evaluate(()=>window.__game.registry.get('application').scene.fog?.setEnabled?.(true));
    assert.equal((await state()).part,'dawn');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration*.3-g.elapsed);});await page.waitForTimeout(400);
    const day=await state();assert.equal(day.part,'day');assert.equal(day.hud,'day');assert.equal(day.overlay,false,'no light map by day');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration*(s.dayNight.nightStart()-.04)-g.elapsed);});await page.waitForTimeout(500);
    const dusk=await state();assert.equal(dusk.part,'dusk');assert.equal(dusk.overlay,true);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/night-dusk.png`});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration*(s.dayNight.nightStart()+.02)-g.elapsed);});await page.waitForTimeout(800);
    const night=await state();assert.equal(night.part,'night');assert.equal(night.hud,'night');assert.equal(night.skip,true,'Skip to dawn at night');
    // Sight sources: those outside light shrink to a third; the King by the castle gate stands in its torch light.
    const shrunk=Object.keys(night.radii).filter(id=>day.radii[id]&&night.radii[id]<=day.radii[id]/3+.01),kept=Object.keys(night.radii).filter(id=>night.radii[id]===day.radii[id]);
    const far=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.character.position,scale=s.fog.sightScale();return {far:scale({x:c.x+25,y:c.y+25}),gate:scale(c)};});
    assert.ok(Math.abs(far.far-1/3)<1e-9,`a third of the sight away from any light at night (${far.far})`);
    // Residents sleep by the castle, inside its torch light, and keep their sight there.
    assert.ok(kept.length+shrunk.length===Object.keys(night.radii).length);
    const kingInLight=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return s.dayNight.inLight(s.character.position);});
    assert.equal(night.king===day.king,kingInLight,'the King keeps his sight only in light');
    const fps=await page.evaluate(()=>new Promise(resolve=>{let frames=0;const start=performance.now();const tick=()=>{frames++;if(performance.now()-start<2500)requestAnimationFrame(tick);else resolve(frames/((performance.now()-start)/1000));};requestAnimationFrame(tick);}));
    if(process.env.SMOKE_SHOTS){await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.buildings.find(b=>b.type==='castle');if(s.worldCamera)s.worldCamera.following=false;const v=s.towerViews.get(c.id);s.cameras.main.centerOn(v.back?.x??v.base?.x??0,(v.back?.y??v.base?.y??0)-80);});
      await page.waitForTimeout(600);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/night-night.png`});}
    // Skip to dawn: the night runs fast and stops at dawn by itself.
    const before=await state();await page.locator('#skip-to-dawn').click();
    await page.waitForFunction(day=>{const s=window.__game.registry.get('application').scene;return s.gameTime.day>day&&s.dayNight.part()!=='night';},before.day,{timeout:120000});
    const dawn=await state();assert.notEqual(dawn.part,'night');assert.equal(dawn.skip,false);
    const after=await page.evaluate(()=>window.__game.registry.get('application').scene.dayNight.skipping);assert.equal(after,false,'skip stops at dawn');
    console.log(`PASS Day and night N1: dawn → day → dusk → night (light map, sight a third away from light, ${kept.length} source(s) in the castle light keep it, Skip to dawn shown) → Skip to dawn ends at dawn of day ${dawn.day}; ${fps.toFixed(0)} FPS at night`);
  }finally{await page.close();}
}

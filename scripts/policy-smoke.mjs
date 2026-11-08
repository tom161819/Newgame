import assert from 'node:assert/strict';

// #103 in its own page: the Castle panel has Kingdom policy; choosing a tax rate and rations changes the game and the
// shown effects, and the economy line includes the taxes. Since 0.36.0 both are sliders with an icon per level; the
// Granary has the same rations slider. `slide` moves a slider the way the arrow keys do (one level at a time).
const LEVELS={'#policy-tax':['none','low','normal','high','very_high'],'#policy-rations':['small','normal','generous'],'#granary-rations':['small','normal','generous']};
const level=(page,sel)=>page.locator(sel).getAttribute('data-level');
async function slide(page,sel,target){await page.locator(sel).focus();for(let i=0;i<6&&await level(page,sel)!==target;i++){const now=LEVELS[sel].indexOf(await level(page,sel));await page.keyboard.press(LEVELS[sel].indexOf(target)>now?'ArrowRight':'ArrowLeft');}assert.equal(await level(page,sel),target);}
export async function policySmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>window.__game.registry.get('application').scene.employmentPanel.open());
    await page.locator('#policy-tax').waitFor({state:'visible'});
    assert.equal(await level(page,'#policy-tax'),'normal');assert.equal(await level(page,'#policy-rations'),'normal');
    await slide(page,'#policy-tax','high');await slide(page,'#policy-rations','generous');
    assert.equal(await page.locator('#employment-panel .policy-slider-tax .policy-icon').getAttribute('data-icon'),'tax:high','a heap of gold');
    // Policy v2 P1: the choice waits for the morning; the panel says so and offers Cancel.
    await page.locator('#policy-pending:not([hidden])').waitFor();assert.match(await page.locator('#policy-pending-text').textContent(),/From tomorrow: High taxes, Generous .* rations\./);
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.policy.tax),'normal');assert.equal(await level(page,'#policy-tax'),'high','the slider shows the pending level');
    assert.match(await page.locator('#policy-gold').textContent(),/Gold per day: Castle .* = .*From tomorrow: /);assert.match(await page.locator('#policy-food').textContent(),/Food per day: /);
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.gameTime.update(s.gameTime.dayDuration-s.gameTime.elapsed+1);});
    const state=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {tax:s.policy.tax,rations:s.policy.rations,pending:s.policy.pending,taxes:s.policy.dailyTaxes(),residents:s.policy.residents().length,income:s.wageSystem.overview().income,castle:s.production.dailyIncome().gold??0,effect:s.policy.happiness(),target:s.policy.target()};});
    assert.deepEqual([state.tax,state.rations,state.pending],['high','generous',null]);assert.equal(state.taxes,state.residents*1);assert.equal(state.income,state.castle+state.taxes);
    // #68: rations no longer change Happiness (they set the Food need), so the target is the tax effect alone.
    assert.ok(state.effect>-1&&state.effect<=0&&state.target===-10,'the Happiness effect moves gradually');
    await page.waitForTimeout(1200);
    assert.match(await page.locator('#policy-tax-effect').textContent(),/1\.00 Gold per resident.*Happiness −10/);assert.match(await page.locator('#policy-rations-effect').textContent(),/1\.5 portions a day; the Food need is 80 %/);
    assert.equal(await page.locator('#policy-pending').isHidden(),true);assert.match(await page.locator('#policy-happiness').textContent(),/Happiness \d+/);
    await slide(page,'#policy-tax','none');await page.locator('#policy-cancel').click();assert.equal(await page.locator('#policy-pending').isHidden(),true);
    // Very high taxes show the big chest of gold; then back.
    await slide(page,'#policy-tax','very_high');assert.equal(await page.locator('#employment-panel .policy-slider-tax .policy-icon').getAttribute('data-icon'),'tax:very_high');await page.locator('#policy-cancel').click();
    // Policy v2 P2 / #68: Small rations (set in the Granary window) set the Food need base to 30 the next morning; the Castle slider follows.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,st=s.foodStorage,g=s.objectRegistry.require('granary');let spot=null;const c=s.character.tile;
      for(let r=4;r<25&&!spot;r++)for(let y=c.y-r;y<=c.y+r&&!spot;y++)for(let x=c.x-r;x<=c.x+r&&!spot;x++){const tiles=[];for(let dy=0;dy<g.height;dy++)for(let dx=0;dx<g.width;dx++)tiles.push({x:x+dx,y:y+dy});if(tiles.every(t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.reservedTiles().some(p=>p.x===t.x&&p.y===t.y)))spot={x,y,tiles};}
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'granary',definition:g,x:spot.x,y:spot.y,tiles:spot.tiles};s.buildings.push(b);for(const t of spot.tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(g,b));st.register(b);s.events.emit('buildings:changed');s.employmentPanel.close?.();s.storagePanel.open(b);});
    await page.locator('#granary-rations').waitFor({state:'visible'});await slide(page,'#granary-rations','small');assert.equal(await page.locator('#storage-dialog .policy-slider-rations .policy-icon').getAttribute('data-icon'),'rations:small');
    await page.keyboard.press('Escape');await page.evaluate(()=>window.__game.registry.get('application').scene.employmentPanel.open());assert.equal(await level(page,'#policy-rations'),'small','the same policy in the Castle panel');
    const cap=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.gameTime.update(s.gameTime.dayDuration-s.gameTime.elapsed+1);const w=s.policy.residents()[0];return s.needs.status(w).foodBase;});
    assert.equal(cap,30);assert.match(await page.locator('#policy-rations-effect').textContent(),/Food need is 30 %/);
    // Policy v2 P3: the Feast button spends food and Gold and starts +15 Happiness for 2 days.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('gold',20);s.inventory.add('bread',20);s.policyPanel.render();});
    const before=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {bread:s.inventory.count('bread'),gold:s.inventory.count('gold'),n:s.policy.residents().length};});
    assert.equal(await page.locator('#policy-feast').isEnabled(),true);await page.locator('#policy-feast').click();
    const after=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {food:s.foodSystem.availablePortions,bread:s.inventory.count('bread'),gold:s.inventory.count('gold'),bonus:s.policy.feastBonus()};});
    assert.equal(after.bonus,15);assert.equal(before.gold-after.gold,before.n);assert.match(await page.locator('#policy-feast-status').textContent(),/Feast: 2\.0 day/);assert.equal(await page.locator('#policy-feast').isDisabled(),true);
    if(process.env.SMOKE_SHOTS){await slide(page,'#policy-tax','low');await page.waitForTimeout(300);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/policy-v2.png`});}
    console.log('PASS Kingdom policy (sliders with level icons; the Granary rations slider is the same policy): a new tax rate and rations take effect the next morning (pending line, Cancel), then change taxes and income; the Happiness effect moves gradually; overview of gold, food and Happiness; Small rations set the Food need base to 30; a Feast costs food and Gold and gives +15');
  }finally{await page.close();}
}

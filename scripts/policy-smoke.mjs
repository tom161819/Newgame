import assert from 'node:assert/strict';

// #103 in its own page: the Castle panel has Kingdom policy; choosing a tax rate and rations changes the game and the
// shown effects, and the economy line includes the taxes. Since 0.36.0 both are sliders with an icon per level; the
// Granary has the same rations slider. `slide` moves a slider the way the arrow keys do (one level at a time).
const LEVELS={'#policy-tax':['none','low','normal','high','very_high']};
const level=(page,sel)=>page.locator(sel).getAttribute('data-level');
// Owner 19 Nov 2026: the tax slider is analog (0–1.5 Gold in steps of 0.05); for it `slide` jumps to the level's rate.
const TAX_RATE={none:0,low:.25,normal:.5,high:1,very_high:1.5},RATION_RATE={small:.4,normal:.8,generous:1.2};
async function slide(page,sel,target){{const rate=sel==='#policy-tax'?TAX_RATE[target]:RATION_RATE[target];await page.locator(sel).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},rate);assert.equal(await level(page,sel),target);return;}await page.locator(sel).focus();for(let i=0;i<6&&await level(page,sel)!==target;i++){const now=LEVELS[sel].indexOf(await level(page,sel));await page.keyboard.press(LEVELS[sel].indexOf(target)>now?'ArrowRight':'ArrowLeft');}assert.equal(await level(page,sel),target);}
export async function policySmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.evaluate(()=>window.__game.registry.get('application').scene.employmentPanel.open());
    await page.locator('#policy-tax').waitFor({state:'visible'});
    assert.equal(await level(page,'#policy-tax'),'normal');assert.equal(await level(page,'#policy-rations'),'normal');
    await slide(page,'#policy-tax','high');await slide(page,'#policy-rations','generous');
    assert.equal(await page.locator('#employment-panel .policy-slider-tax .policy-icon').getAttribute('data-icon'),'tax:high','a heap of gold');
    // Owner 20 Nov 2026 (87): a choice holds at once – no "from tomorrow" line, no Cancel; under the slider only its day.
    const state=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {tax:s.policy.tax,rations:s.policy.rations,taxes:s.policy.dailyTaxes(),residents:s.policy.residents().length,target:s.policy.target()};});
    assert.deepEqual([state.tax,state.rations,state.target],[1,1.2,-10]);assert.equal(state.taxes,state.residents*1);assert.equal(await page.locator('#policy-pending').count(),0);
    await page.waitForTimeout(1200);
    assert.match(await page.locator('#policy-tax-effect').textContent(),/^Collected a day: \d+\.\d\d Gold · Happiness −10$/);assert.match(await page.locator('#policy-rations-effect').textContent(),/^Eaten a day: [\d.]+ portions · Happiness \+7$/);
    assert.match(await page.locator('#employment-panel .policy-slider-tax .policy-level').getAttribute('title'),/1\.00 Gold paid by each resident a day/);
    // The overview: three folding blocks with the total first.
    assert.match(await page.locator('#policy-gold strong').textContent(),/^[+−]?\d+\.\d\d$/);assert.ok(await page.locator('#policy-gold li').count()>=4);assert.ok(await page.locator('#policy-happiness li').count()>=3);
    await page.locator('#policy-gold summary').click();assert.equal(await page.locator('#policy-gold').getAttribute('open'),null,'folded');await page.locator('#policy-gold summary').click();
    // Analog: the arrow key moves the tax by 0.05 and the line follows.
    await page.locator('#policy-tax').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.policy.tax),.9);
    await slide(page,'#policy-tax','very_high');assert.equal(await page.locator('#employment-panel .policy-slider-tax .policy-icon').getAttribute('data-icon'),'tax:very_high');
    // Policy v2 P2 / #68: Small rations (set in the Granary window) set the Food need base to 30 the next morning; the Castle slider follows.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,st=s.foodStorage,g=s.objectRegistry.require('granary');let spot=null;const c=s.character.tile;
      for(let r=4;r<25&&!spot;r++)for(let y=c.y-r;y<=c.y+r&&!spot;y++)for(let x=c.x-r;x<=c.x+r&&!spot;x++){const tiles=[];for(let dy=0;dy<g.height;dy++)for(let dx=0;dx<g.width;dx++)tiles.push({x:x+dx,y:y+dy});if(tiles.every(t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!s.reservedTiles().some(p=>p.x===t.x&&p.y===t.y)))spot={x,y,tiles};}
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'granary',definition:g,x:spot.x,y:spot.y,tiles:spot.tiles};s.buildings.push(b);for(const t of spot.tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(g,b));st.register(b);s.events.emit('buildings:changed');s.employmentPanel.close?.();s.storagePanel.open(b);});
    await page.locator('#granary-rations').waitFor({state:'visible'});await slide(page,'#granary-rations','small');assert.equal(await page.locator('#storage-dialog .policy-slider-rations .policy-icon').getAttribute('data-icon'),'rations:small');
    await page.keyboard.press('Escape');await page.evaluate(()=>window.__game.registry.get('application').scene.employmentPanel.open());assert.equal(await level(page,'#policy-rations'),'small','the same policy in the Castle panel');
    const cap=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;const w=s.policy.residents()[0];return s.needs.status(w).foodBase;});
    assert.equal(cap,30,'at once');assert.match(await page.locator('#policy-rations-effect').textContent(),/Happiness −10/);
    // Policy v2 P3: the Feast button spends food and Gold and starts +15 Happiness for 2 days.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('gold',20);s.inventory.add('bread',20);s.policyPanel.render();});
    const before=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {bread:s.inventory.count('bread'),gold:s.inventory.count('gold'),n:s.policy.residents().length};});
    assert.equal(await page.locator('#policy-feast').isEnabled(),true);await page.locator('#policy-feast').click();
    const after=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {food:s.foodSystem.availablePortions,bread:s.inventory.count('bread'),gold:s.inventory.count('gold'),bonus:s.policy.feastBonus()};});
    assert.equal(after.bonus,15);assert.equal(before.gold-after.gold,before.n);assert.match(await page.locator('#policy-feast-status').textContent(),/Feast: 2\.0 day/);assert.equal(await page.locator('#policy-feast').isDisabled(),true);
    if(process.env.SMOKE_SHOTS){await slide(page,'#policy-tax','low');await page.waitForTimeout(300);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/policy-v2.png`});}
    console.log('PASS Kingdom policy (sliders with level icons; the Granary rations slider is the same policy): a new tax rate and rations hold at once (analog sliders, the day line and Happiness under each, a tooltip on the value); the Happiness effect moves gradually; overview of gold, food and Happiness in folding blocks; Small rations set the Food need base to 30; a Feast costs food and Gold and gives +15');
  }finally{await page.close();}
}

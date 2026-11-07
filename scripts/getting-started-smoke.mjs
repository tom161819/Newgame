import assert from 'node:assert/strict';

// Getting started (owner request 7 Nov 2026), in its own page so the main scenario keeps its world:
// a New Game from the setup opens the panel once; Esc, the close button and the "?" button work; a step opens the
// Buildings menu on its building; a completed Warehouse ticks step 1 and moves the highlight to step 2.
export async function gettingStartedSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.gettingStarted);
    const dialog=page.locator('#help-dialog');await page.locator('#help-dialog[open]').waitFor({timeout:10000});
    assert.equal(await page.locator('#help-steps .help-step').count(),7);
    assert.equal(await page.locator('#help-steps .help-step.current').getAttribute('data-help-step'),'warehouse');
    assert.equal(await page.locator('#help-steps .help-step.done').count(),0);
    assert.equal(await page.locator('#help-toggle').evaluate(b=>b.classList.contains('has-alert')),true,'the ? button is marked until every step is done');
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.input.enabled),false,'the map waits while the panel is open');
    await page.keyboard.press('Escape');assert.equal(await dialog.evaluate(d=>d.open),false);
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.input.enabled),true,'closing gives the map back');
    await page.locator('#help-toggle').click();assert.equal(await dialog.evaluate(d=>d.open),true,'? opens it again');
    await page.locator('#close-help').click();assert.equal(await dialog.evaluate(d=>d.open),false);
    // The HUD button stays inside the HUD row and does not cover its neighbours.
    const boxes=await page.evaluate(()=>['#help-toggle','#hud-details-toggle','#king-profile'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {s,l:r.left,r:r.right,t:r.top,b:r.bottom};}));
    const [help,...others]=boxes;for(const o of others)assert.ok(help.r<=o.l||help.l>=o.r||help.b<=o.t||help.t>=o.b,`? overlaps ${o.s}`);
    // A step opens the Buildings menu on its building.
    await page.locator('#help-toggle').click();await page.locator('[data-help-building="granary"]').click();
    assert.equal(await dialog.evaluate(d=>d.open),false);assert.equal(await page.locator('#buildings-panel').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'granary-choice');
    assert.equal(await page.locator('[data-building-category="food"]').getAttribute('aria-pressed'),'true');
    await page.locator('#buildings-tab').click();
    // A completed Warehouse ticks step 1; a construction site alone does not.
    const site=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('warehouse'),c=s.character.tile,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let tiles,anchor;
      for(let y=c.y-12;y<c.y+12&&!anchor;y++)for(let x=c.x-12;x<c.x+12&&!anchor;x++){
        const candidate=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)candidate.push({x:x+dx,y:y+dy});
        if(candidate.every(t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`))){anchor={x,y};tiles=candidate;}
      }
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'warehouse',definition:d,...anchor,tiles};s.buildings.push(b);s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');return b.id;
    });
    await page.locator('#help-toggle').click();
    assert.equal(await page.locator('[data-help-step="warehouse"]').evaluate(e=>e.classList.contains('done')),false,'a construction site is not enough');await page.keyboard.press('Escape');
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);b.construction.workDone=b.construction.requiredWork;b.construction.progress=100;s.constructionSystem.finish(b);},site);
    await page.locator('#help-toggle').click();
    assert.equal(await page.locator('[data-help-step="warehouse"]').evaluate(e=>e.classList.contains('done')),true);
    assert.equal(await page.locator('#help-steps .help-step.current').getAttribute('data-help-step'),'granary');
    assert.match(await page.locator('#help-summary').textContent(),/^1 of 7 done/);
    await page.keyboard.press('Escape');
    console.log('PASS Getting started: opens once on New Game, Esc / close / ? work, a step opens the Buildings menu, a completed Warehouse (not its site) ticks step 1');
  }finally{await page.close();}
}

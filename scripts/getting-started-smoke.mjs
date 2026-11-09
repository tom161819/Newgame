import assert from 'node:assert/strict';

// Getting started (owner request 7 Nov 2026), in its own page so the main scenario keeps its world:
// a docked window under the top bar at the right that folds to a strip (remembered); a step opens the
// Buildings menu on its building; a completed Warehouse ticks step 1 and moves the highlight to step 2.
export async function gettingStartedSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.gettingStarted.collapsed'));await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.gettingStarted);
    const dialog=page.locator('#help-dialog');await page.locator('#help-dialog[open]').waitFor({timeout:10000});
    assert.equal(await page.locator('#help-steps .help-step').count(),8,'eight steps since the Builder\'s Workshop (0.14.1)');
    assert.equal(await page.locator('#help-steps .help-step.current').getAttribute('data-help-step'),'granary');
    assert.equal(await page.locator('#help-steps .help-step.done').count(),0);
    // Owner 9 Nov 2026: a docked window under the top bar at the right, not a modal; the map keeps working.
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.input.enabled),true,'the map stays usable');
    assert.equal(await page.locator('#help-count').textContent(),'0 / 8');
    const box=await page.evaluate(()=>{const w=document.querySelector('#help-dialog').getBoundingClientRect(),bar=document.querySelector('.inventory').getBoundingClientRect();return {top:w.top,barBottom:bar.bottom,right:w.right,vw:innerWidth};});
    assert.ok(box.top>=box.barBottom&&box.top<=box.barBottom+16,`under the top bar: ${JSON.stringify(box)}`);assert.ok(box.right>box.vw-80,'at the right');
    // The heading folds it to a strip and back; the browser remembers the choice.
    await page.locator('.help-window-summary').click();assert.equal(await dialog.evaluate(d=>d.open),false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('newgame.gettingStarted.collapsed')),'1');
    await page.locator('.help-window-summary').click();assert.equal(await dialog.evaluate(d=>d.open),true);
    // A step opens the Buildings menu on its building; the window stays.
    await page.locator('[data-help-building="granary"]').click();
    assert.equal(await dialog.evaluate(d=>d.open),true);assert.equal(await page.locator('#buildings-panel').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'granary-choice');
    assert.equal(await page.locator('[data-building-category="food"]').getAttribute('aria-pressed'),'true');
    await page.locator('#buildings-tab').click();
    // A completed Warehouse ticks step 1; a construction site alone does not.
    const site=await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('granary'),c=s.character.tile,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let tiles,anchor;
      for(let y=c.y-12;y<c.y+12&&!anchor;y++)for(let x=c.x-12;x<c.x+12&&!anchor;x++){
        const candidate=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)candidate.push({x:x+dx,y:y+dy});
        if(candidate.every(t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`))){anchor={x,y};tiles=candidate;}
      }
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'granary',definition:d,...anchor,tiles};s.buildings.push(b);s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');return b.id;
    });
    assert.equal(await page.locator('[data-help-step="granary"]').evaluate(e=>e.classList.contains('done')),false,'a construction site is not enough');
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);b.construction.workDone=b.construction.requiredWork;b.construction.progress=100;s.constructionSystem.finish(b);},site);
    assert.equal(await page.locator('[data-help-step="granary"]').evaluate(e=>e.classList.contains('done')),true);
    assert.equal(await page.locator('#help-steps .help-step.current').getAttribute('data-help-step'),'farmhouse');
    assert.match(await page.locator('#help-summary').textContent(),/^1 of 8 done/);
    assert.equal(await page.locator('#help-count').textContent(),'1 / 8');
    console.log('PASS Getting started: docked window under the top bar, folds and remembers it, a step opens the Buildings menu, a completed Granary (not its site) ticks step 1 (E3 order)');
  }finally{await page.close();}
}

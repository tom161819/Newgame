import assert from 'node:assert/strict';

// m-zamestnani-2 in the real page: (19) a pick in the resident's job list sticks although the panel keeps refreshing,
// (35) "Remove worker" works while the worker is busy and the panel redraws, (50, 58) staffing signs: nobody = yellow,
// some missing = grey, employment off = dark red stop sign.
export async function employment2Smoke(page){
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const f=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene;s.pauseManager.set('employment-2',true);s.fog.setEnabled(false);s.employment.setEnabled(false);
    const d=s.objectRegistry.require('quarry'),occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),k=s.character.tile;let anchor,tiles;
    for(let r=4;r<25&&!anchor;r++)for(let y=k.y-r;y<=k.y+r&&!anchor;y++)for(let x=k.x-r;x<=k.x+r&&!anchor;x++){const ts=[];for(let dy=-1;dy<=d.height;dy++)for(let dx=-1;dx<=d.width;dx++)ts.push({x:x+dx,y:y+dy});if(ts.every(t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(`${t.x},${t.y}`)&&!occupied.has(`${t.x},${t.y}`))){anchor={x,y};tiles=ts.filter(t=>t.x>=x&&t.x<x+d.width&&t.y>=y&&t.y<y+d.height);}}
    const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'quarry',definition:d,...anchor,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');
    const w=s.workerSystem.create({x:b.x-1,y:b.y});s.workerSystem.commands.hold(w);
    if(s.worldCamera)s.worldCamera.following=false;const p={x:s.map.length*32+(b.x-b.y)*32,y:128+(b.x+b.y+3)*16};s.cameras.main.centerOn(p.x,p.y);
    return {b:b.id,w:w.id};
  });
  const tone=()=>page.waitForFunction(id=>document.querySelector(`[data-staffing-building="${id}"]`)?.dataset.staffingTone,f.b).then(h=>h.jsonValue());
  await page.waitForTimeout(300);assert.equal(await tone(),'empty');
  const colour=async()=>{await page.waitForTimeout(450);return page.evaluate(id=>getComputedStyle(document.querySelector(`[data-staffing-building="${id}"]`)).backgroundColor,f.b);};
  assert.equal(await colour(),'rgb(210, 166, 25)','nobody: yellow warning');
  // The worker joins and is busy: his status text changes all the time, so the rows redraw.
  await page.evaluate(f=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===f.b),w=s.workerSystem.workers.get(f.w);s.workplaceSystem.assign(b,w);s.workplacePanel.open(b);
    let n=0;window.__busy=setInterval(()=>{if(w.assignedWorkplaceId===b.id){w.workState='Working';w.workMessage=`Breaking stone ${n++ % 100} %`;}},40);},f);
  await page.waitForFunction(id=>document.querySelector(`[data-staffing-building="${id}"]`)?.dataset.staffingTone==='partial',f.b);
  assert.equal(await colour(),'rgb(109, 111, 102)','some missing: grey');
  const remove=page.locator(`[data-remove-worker="${f.w}"]`);await remove.waitFor();const box=await remove.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(350);await page.mouse.up();
  await page.waitForFunction(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).assignedWorkplaceId==null,f.w,{timeout:3000});
  await page.evaluate(()=>clearInterval(window.__busy));
  // Employment switched off: the dark red stop sign with its own tooltip.
  await page.locator('[data-employment-exclusion="local"]').check();
  await page.waitForFunction(id=>document.querySelector(`[data-staffing-building="${id}"]`)?.dataset.staffingTone==='disabled',f.b);
  assert.equal(await colour(),'rgb(110, 28, 24)');assert.match(await page.locator(`[data-staffing-building="${f.b}"]`).getAttribute('aria-label'),/Employment disabled/);
  if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/employment-2.png`});
  await page.locator('[data-employment-exclusion="local"]').uncheck();await page.locator('#close-workplace').click();
  // (19) The job list in the resident panel keeps the pick while the panel refreshes.
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.pauseManager.set('employment-2',false);s.unitPanel.open(s.workerSystem.workers.get(id));},f.w);
  await page.locator('#unit-dialog[open]').waitFor();const select=page.locator('#assign-job');
  await select.focus();await select.evaluate(e=>{e.value='builder';});await page.waitForTimeout(500);
  assert.equal(await select.inputValue(),'builder','the refresh leaves an open list alone');
  await select.evaluate(e=>e.dispatchEvent(new Event('change',{bubbles:true})));
  assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).profession,f.w),'builder');
  await page.locator('#close-unit').click();
  await page.evaluate(async save=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__e2Ready=false;app.onGameReady=s=>{ready(s);window.__e2Ready=true;app.onGameReady=ready;};await app.load(save);},saved);
  await page.waitForFunction(()=>window.__e2Ready);
  console.log('PASS Employment 2: job pick sticks during refresh, Remove worker works while the panel redraws, signs yellow (nobody) / grey (some) / dark red stop (employment off)');
}

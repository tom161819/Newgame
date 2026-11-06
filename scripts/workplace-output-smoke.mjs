import assert from 'node:assert/strict';
export async function workplaceOutputSmoke(page){
  const original=await page.evaluate(()=>{const app=window.__game.registry.get('application');return {save:app.snapshot(),overrides:structuredClone(app.scene.objectRegistry.workplaceOverrides),stored:localStorage.getItem('newgame.workplace-authoring.v1')};});
  const fixture=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene;s.pauseManager.set('workplace-output-smoke',true);s.fog.setEnabled(false);s.employment.setEnabled(false);s.workerSystem.unsubscribe();for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);
    const d=s.objectRegistry.require('mill'),occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`)),c=s.character.tile;let anchor,tiles;
    for(let y=c.y-10;y<c.y+10&&!anchor;y++)for(let x=c.x-10;x<c.x+10&&!anchor;x++){let free=true;for(let dy=-1;dy<=d.height;dy++)for(let dx=-1;dx<=d.width;dx++)if(s.map[y+dy]?.[x+dx]!==0||s.resourceOccupancy.has(`${x+dx},${y+dy}`)||occupied.has(`${x+dx},${y+dy}`))free=false;if(free){anchor={x,y};tiles=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)tiles.push({x:x+dx,y:y+dy});}}
    if(!anchor)throw Error('No staffing fixture room');const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'mill',definition:d,...anchor,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');s.workplaceSystem.register(b);
    const workers=[];for(const tile of [{x:b.x,y:b.y-1},{x:b.x+1,y:b.y-1}]){const w=s.workerSystem.create(tile);if(!s.workplaceSystem.assign(b,w))throw Error('Staffing assignment failed');w.workplaceReached=true;workers.push(w.id);}s.refreshVisibility();return {id:b.id,workers};
  });
  await page.click('#asset-library-button');await page.locator('[data-object-id="mill"]').click();
  const editor=page.locator('[data-workplace-editor="mill"]');await editor.locator('summary').click();await editor.locator('[data-staffing-curve]').fill('0, 25, 100');
  assert.match(await editor.locator('[data-staffing-preview]').textContent(),/2 → 100 % \/ 1 → 25 %/);
  await editor.locator('[data-staffing-apply]').click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.workplace-authoring.v1')).workplaces.mill),{capacity:2,staffingOutput:[0,.25,1]});
  await page.click('#close-asset-gallery');
  const one=await page.evaluate(f=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===f.id),w=s.workerSystem.workers.get(f.workers[1]);w.path=[{x:w.tile.x+1,y:w.tile.y}];const summary=s.workplaceSystem.staffing(b);s.workplacePanel.open(b);return summary;},fixture);
  assert.equal(one.present,1);assert.equal(one.output,.25);assert.match(await page.locator('#workplace-staffing-output').textContent(),/25%.*1 worker missing/);
  await page.click('#close-workplace');await page.evaluate(f=>{window.__game.registry.get('application').scene.workerSystem.workers.get(f.workers[1]).path=[];},fixture);
  await page.click('#asset-library-button');await page.locator('[data-object-id="mill"]').click();await editor.locator('summary').click();await editor.locator('[data-staffing-capacity]').fill('1');await editor.locator('[data-staffing-curve]').fill('0, 100');await editor.locator('[data-staffing-apply]').click();await page.click('#close-asset-gallery');
  const reduced=await page.evaluate(f=>{const app=window.__game.registry.get('application'),s=app.scene,b=s.buildings.find(b=>b.id===f.id);return {workers:s.workplaceSystem.employees(b).map(w=>w.id),removed:s.workerSystem.workers.get(f.workers[1]).profession,held:s.employment.held.has(f.workers[1]),save:app.snapshot()};},fixture);
  assert.deepEqual(reduced.workers,[fixture.workers[0]]);assert.equal(reduced.removed,'idle');assert.equal(reduced.held,true);
  const load=async save=>{await page.evaluate(save=>{const app=window.__game.registry.get('application'),ready=app.onGameReady.bind(app);window.__staffingOutputReady=false;app.onGameReady=s=>{ready(s);s.pauseManager.set('workplace-output-smoke',true);window.__staffingOutputReady=true;app.onGameReady=ready;};app.load(save);},save);await page.waitForFunction(()=>window.__staffingOutputReady);};
  await load(reduced.save);assert.equal(await page.evaluate(f=>{const s=window.__game.registry.get('application').scene;return s.workplaceSystem.summary(s.buildings.find(b=>b.id===f.id)).capacity;},fixture),1);
  await page.evaluate(original=>{const s=window.__game.registry.get('application').scene;s.objectRegistry.configureWorkplaces({version:1,workplaces:original.overrides});if(original.stored===null)localStorage.removeItem('newgame.workplace-authoring.v1');else localStorage.setItem('newgame.workplace-authoring.v1',original.stored);},original);
  await load(original.save);await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('workplace-output-smoke',false));
  console.log('PASS workplace output: live authoring/preview, physical presence, safe excess release and current authored Save/Load');
}

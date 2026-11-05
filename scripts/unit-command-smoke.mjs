import assert from 'node:assert/strict';

export async function unitCommandSmoke(page){
 const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
 const fixture=await page.evaluate(()=>{
  const s=window.__game.registry.get('application').scene;s.workerSystem.unsubscribe();s.employment.setEnabled(false);s.fog.setEnabled(false);
  for(const w of s.workerSystem.liveSubjects())s.workerSystem.commands.hold(w);
  const occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let room;
  for(let y=8;y<85&&!room;y++)for(let x=8;x<85&&!room;x++){
   let clear=true;for(let dy=0;dy<9;dy++)for(let dx=0;dx<9;dx++)if(s.map[y+dy]?.[x+dx]!==0||s.resourceOccupancy.has(`${x+dx},${y+dy}`)||occupied.has(`${x+dx},${y+dy}`))clear=false;
   if(clear)room={x,y};
  }
  if(!room)throw Error('No clear command smoke room');
  const ws=[0,2,4].map(dy=>s.workerSystem.create({x:room.x+1,y:room.y+1+dy}));for(const w of ws)s.workerSystem.commands.hold(w);
  const visitor=s.workerSystem.create({x:room.x+1,y:room.y+7},{isSubject:false});visitor.aiCooldown=1e8;
  s.worldCamera.following=false;s.worldCamera.panTarget=null;const c=s.cameras.main;c.setZoom(1.3).centerOn(ws[1].view.x+35,ws[1].view.y);c.preRender();s.refreshVisibility();
  return {ids:ws.map(w=>w.id),visitor:visitor.id,target:{x:room.x+6,y:room.y+4}};
 });
 const screen=async(id,feet=false)=>page.evaluate(({id,feet})=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id),c=s.cameras.main,r=s.game.canvas.getBoundingClientRect(),p={x:w.view.x,y:w.view.y-(feet?0:12)};return{x:r.x+((p.x-c.scrollX-c.width/2)*c.zoom+c.width/2)*r.width/c.width,y:r.y+((p.y-c.scrollY-c.height/2)*c.zoom+c.height/2)*r.height/c.height};},{id,feet});
 let p=await screen(fixture.ids[0]);await page.mouse.click(p.x,p.y);await page.locator('#unit-command-bar:not([hidden])').waitFor();assert.deepEqual(await page.evaluate(()=>[...window.__game.registry.get('application').scene.unitSelection.ids]),[fixture.ids[0]]);
 await page.locator('#unit-command-bar [data-unit-command="inspect"]').click();await page.locator('#unit-dialog[open]').waitFor();await page.locator('#unit-dialog [data-unit-command="hold"]').click();await page.locator('#close-unit').click();
 for(const zoom of [.65,1.3]){
  await page.evaluate(zoom=>{const s=window.__game.registry.get('application').scene;s.unitSelection.clear();s.cameras.main.setZoom(zoom);s.cameras.main.preRender();},zoom);
  const points=await Promise.all(fixture.ids.map(id=>screen(id,true))),a={x:Math.min(...points.map(p=>p.x))-24*zoom,y:Math.min(...points.map(p=>p.y))-32*zoom},b={x:Math.max(...points.map(p=>p.x))+24*zoom,y:Math.max(...points.map(p=>p.y))+8*zoom};
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();assert.deepEqual((await page.evaluate(()=>[...window.__game.registry.get('application').scene.unitSelection.ids])).sort(),[...fixture.ids].sort());
 }
 const kingBefore=await page.evaluate(()=>window.__game.registry.get('application').scene.character.tile);
 await page.evaluate(id=>{window.__commandFirst=id;},fixture.ids[0]);
 const destination=await page.evaluate(tile=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(window.__commandFirst),c=s.cameras.main,r=s.game.canvas.getBoundingClientRect(),dx=tile.x+.5-w.position.x,dy=tile.y+.5-w.position.y,p={x:w.view.x+(dx-dy)*32,y:w.view.y+(dx+dy)*16};return{x:r.x+((p.x-c.scrollX-c.width/2)*c.zoom+c.width/2)*r.width/c.width,y:r.y+((p.y-c.scrollY-c.height/2)*c.zoom+c.height/2)*r.height/c.height};},fixture.target);
 await page.mouse.click(destination.x,destination.y,{button:'right'});
 await page.waitForFunction(ids=>{const s=window.__game.registry.get('application').scene;return ids.every(id=>s.workerSystem.workers.get(id).commandState.state==='Holding');},fixture.ids,{timeout:25000});
 const held=await page.evaluate(ids=>{const s=window.__game.registry.get('application').scene;return ids.map(id=>{const w=s.workerSystem.workers.get(id);return {tile:w.tile,goal:w.commandState.goal};});},fixture.ids);assert.ok(held.every(w=>JSON.stringify(w.tile)===JSON.stringify(w.goal)));assert.equal(new Set(held.map(w=>JSON.stringify(w.tile))).size,3);
 assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').scene.character.tile),kingBefore);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#unit-command-bar').isHidden(),true);await page.waitForTimeout(1200);assert.deepEqual(await page.evaluate(ids=>ids.map(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).tile),fixture.ids),held.map(w=>w.tile));
 await page.evaluate(ids=>{const s=window.__game.registry.get('application').scene;s.unitSelection.set(ids.map(id=>s.workerSystem.workers.get(id)));},fixture.ids);await page.locator('#unit-command-bar [data-unit-command="resume"]').click();assert.ok(await page.evaluate(ids=>ids.every(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).commandState.state==='Working'),fixture.ids));
 await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__commandReady=false;const original=app.onGameReady.bind(app);app.onGameReady=s=>{original(s);window.__commandReady=true;app.onGameReady=original;};await app.load(state);},saved);await page.waitForFunction(()=>window.__commandReady);
 console.log('PASS C05: real mouse selection and drag at two zooms, distinct group targets, right-click Move/Hold, Escape deselect, details controls and Resume; king unchanged');
}
